/**
 * UserProfile - 用户健康画像数据管理模块
 *
 * 管理用户身体信息，计算 BMR / 每日热量目标 / 蛋白质目标。
 * 数据持久化到 localStorage，为后续 AI Nutrition Agent 提供用户上下文。
 *
 * 数据结构：
 * {
 *   name: "",
 *   gender: "female" | "male",
 *   age: 25,
 *   height: 165,    // cm
 *   weight: 58,     // kg
 *   goal: "weight_loss" | "maintenance" | "muscle_gain" | "healthy",
 *   activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active"
 * }
 */

const STORAGE_KEY = 'nutriai_user_profile'

// ============ 活动水平系数 ============
export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: '久坐不动', desc: '办公室工作，很少运动', factor: 1.2 },
  { value: 'light', label: '轻度活动', desc: '每周 1-3 次运动', factor: 1.375 },
  { value: 'moderate', label: '中度活动', desc: '每周 3-5 次运动', factor: 1.55 },
  { value: 'active', label: '高度活动', desc: '每周 6-7 次运动', factor: 1.725 },
  { value: 'very_active', label: '非常活跃', desc: '体力工作 + 每日运动', factor: 1.9 },
]

// ============ 目标选项 ============
export const GOAL_OPTIONS = [
  { value: 'weight_loss', label: '减重', icon: '🏃‍♀️', calorieAdjust: -500, proteinPerKg: 1.6 },
  { value: 'maintenance', label: '维持', icon: '🧘‍♀️', calorieAdjust: 0, proteinPerKg: 1.2 },
  { value: 'muscle_gain', label: '增肌', icon: '💪', calorieAdjust: 300, proteinPerKg: 2.0 },
  { value: 'healthy', label: '健康', icon: '🌸', calorieAdjust: 0, proteinPerKg: 1.5 },
]

// ============ 默认值 ============
const DEFAULT_PROFILE = {
  name: '',
  gender: 'female',
  age: 25,
  height: 165,
  weight: 58,
  goal: 'healthy',
  activityLevel: 'light',
}

// ============ localStorage 存取 ============

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // 静默失败
  }
}

// ============ 公开 API ============

/**
 * 获取用户资料
 * 优先从 localStorage 读取，否则返回默认值。
 */
export function getProfile() {
  const stored = loadFromStorage()
  if (stored) {
    return { ...DEFAULT_PROFILE, ...stored }
  }
  return { ...DEFAULT_PROFILE }
}

/**
 * 保存用户资料
 * @param {Object} profile - 用户资料
 * @returns {Object} 保存后的完整资料
 */
export function saveProfile(profile) {
  const full = { ...DEFAULT_PROFILE, ...profile }
  saveToStorage(full)
  return full
}

/**
 * 计算基础代谢率 BMR (Mifflin-St Jeor 公式)
 * 男性: BMR = 10 * weight + 6.25 * height - 5 * age + 5
 * 女性: BMR = 10 * weight + 6.25 * height - 5 * age - 161
 * @param {Object} profile - 用户资料
 * @returns {number} BMR (kcal/day)
 */
export function calculateBMR(profile) {
  const { gender, age, height, weight } = profile
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

/**
 * 计算每日目标热量 (TDEE + 目标调整)
 * TDEE = BMR × 活动系数
 * 目标热量 = TDEE + 目标调整值（减重 -500，增肌 +300，维持/健康 0）
 * @param {Object} profile - 用户资料
 * @returns {number} 每日目标热量 (kcal)
 */
export function calculateDailyCalories(profile) {
  const bmr = calculateBMR(profile)
  const activity = ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel) || ACTIVITY_LEVELS[1]
  const goal = GOAL_OPTIONS.find(g => g.value === profile.goal) || GOAL_OPTIONS[3]

  const tdee = bmr * activity.factor
  const target = tdee + goal.calorieAdjust

  // 确保不低于最低安全值
  return Math.max(Math.round(target), 1200)
}

/**
 * 计算每日蛋白质目标
 * protein = weight × proteinPerKg (根据目标调整)
 * @param {Object} profile - 用户资料
 * @returns {number} 每日蛋白质目标 (g)
 */
export function calculateProteinGoal(profile) {
  const goal = GOAL_OPTIONS.find(g => g.value === profile.goal) || GOAL_OPTIONS[3]
  return Math.round(profile.weight * goal.proteinPerKg)
}

/**
 * 计算完整营养目标
 * 返回 calories / protein / carbs / fat 的目标值
 * - 蛋白质: 基于体重和目标
 * - 脂肪: 总热量的 25%
 * - 碳水: 剩余热量
 * @param {Object} [profile] - 可选，不传则从存储读取
 * @returns {{ calories: number, protein: number, carbs: number, fat: number }}
 */
export function calculateNutritionGoals(profile) {
  const p = profile || getProfile()

  const calories = calculateDailyCalories(p)
  const protein = calculateProteinGoal(p)
  const fat = Math.round((calories * 0.25) / 9) // 25% 热量来自脂肪
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0)

  return { calories, protein, carbs, fat }
}
