/**
 * FoodDiary - 饮食记录数据管理模块
 *
 * 负责今日饮食数据的持久化存储（localStorage）和营养计算。
 * 数据结构：
 * {
 *   date: "2026-08-04",
 *   meals: [
 *     { id, foodName, calories, protein, carbs, fat, image, mealType, time, emoji }
 *   ]
 * }
 */

import { calculateNutritionGoals } from './userProfile.js'

const STORAGE_KEY = 'nutriai_food_diary'

// 生成唯一 ID
function generateId() {
  return `food_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// 获取今日日期字符串
function getTodayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 获取当前时间字符串
function getCurrentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 根据当前时间自动判断餐段
function autoDetectMealType() {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
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

function saveToStorage(diary) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diary))
  } catch {
    // localStorage 满或不可用时静默失败
  }
}

// ============ 公开 API ============

/**
 * 获取今日饮食记录
 * 如果 localStorage 中没有今日数据，返回空的日记结构。
 * @returns {{ date: string, meals: Array }}
 */
export function getTodayDiary() {
  const today = getTodayDate()
  const stored = loadFromStorage()

  if (stored && stored.date === today) {
    return stored
  }

  // 新的一天，返回空日记
  const emptyDiary = { date: today, meals: [] }
  saveToStorage(emptyDiary)
  return emptyDiary
}

/**
 * 添加食物到今日饮食记录
 * @param {Object} food - 食物识别结果
 * @param {string} food.foodName
 * @param {number} food.calories
 * @param {number} food.protein
 * @param {number} food.carbs
 * @param {number} food.fat
 * @param {string} [food.emoji]
 * @param {string} [food.image] - 图片 data URL（可选）
 * @param {string} [mealType] - 餐段：breakfast/lunch/dinner/snack，不传则自动判断
 * @returns {Object} 添加后的食物记录（含 id 和 time）
 */
export function addFood(food, mealType) {
  const diary = getTodayDiary()
  const type = mealType || autoDetectMealType()

  const foodRecord = {
    id: generateId(),
    foodName: food.foodName || 'Unknown Food',
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fat: Number(food.fat) || 0,
    image: food.image || '',
    mealType: type,
    time: getCurrentTime(),
    emoji: food.emoji || '🍽️',
  }

  diary.meals.push(foodRecord)
  saveToStorage(diary)

  return foodRecord
}

/**
 * 从今日饮食记录中删除指定食物
 * @param {string} foodId - 食物记录 ID
 * @returns {Object} 更新后的日记
 */
export function removeFood(foodId) {
  const diary = getTodayDiary()
  diary.meals = diary.meals.filter(m => m.id !== foodId)
  saveToStorage(diary)
  return diary
}

/**
 * 根据餐段获取食物列表
 * @param {string} mealType - breakfast/lunch/dinner/snack
 * @returns {Array} 该餐段的食物列表
 */
export function getMealsByType(mealType) {
  const diary = getTodayDiary()
  return diary.meals.filter(m => m.mealType === mealType)
}

/**
 * 计算今日营养统计
 * @param {Object} [diary] - 可选，传入日记数据；不传则从存储读取
 * @returns {Object} 营养统计 { calories, protein, carbs, fat, 各含 current/target/breakdown }
 */
export function calculateNutrition(diary) {
  const d = diary || getTodayDiary()
  const meals = d.meals || []

  // 从 userProfile 动态获取营养目标
  const goals = calculateNutritionGoals()

  const sum = (key) => meals.reduce((sum, m) => sum + (Number(m[key]) || 0), 0)
  const sumByType = (key) => {
    const breakdown = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    meals.forEach(m => {
      const type = m.mealType || 'snack'
      breakdown[type] = (breakdown[type] || 0) + (Number(m[key]) || 0)
    })
    return breakdown
  }

  return {
    calories: {
      current: sum('calories'),
      target: goals.calories,
      unit: 'kcal',
      breakdown: sumByType('calories'),
    },
    protein: {
      current: sum('protein'),
      target: goals.protein,
      unit: 'g',
      breakdown: sumByType('protein'),
    },
    carbs: {
      current: sum('carbs'),
      target: goals.carbs,
      unit: 'g',
      breakdown: sumByType('carbs'),
    },
    fat: {
      current: sum('fat'),
      target: goals.fat,
      unit: 'g',
      breakdown: sumByType('fat'),
    },
  }
}

/**
 * 将扁平 meals 数组转换为 Dashboard 使用的分组结构
 * { breakfast: obj|null, lunch: obj|null, dinner: obj|null, snacks: [] }
 * 注意：每餐段只保留最新一条（覆盖），snacks 保留全部。
 * @returns {Object} 分组后的 meals
 */
export function getGroupedMeals() {
  const diary = getTodayDiary()
  const grouped = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: [],
  }

  // 按 time 倒序遍历，后添加的覆盖先添加的
  const sorted = [...diary.meals].sort((a, b) => b.time.localeCompare(a.time))

  for (const meal of sorted) {
    const type = meal.mealType || 'snack'
    if (type === 'snack') {
      grouped.snacks.unshift(meal) // snacks 保持正序
    } else if (type === 'breakfast') {
      if (!grouped.breakfast) grouped.breakfast = meal
    } else if (type === 'lunch') {
      if (!grouped.lunch) grouped.lunch = meal
    } else if (type === 'dinner') {
      if (!grouped.dinner) grouped.dinner = meal
    }
  }

  return grouped
}
