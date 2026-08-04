// 营养统计 Mock 数据
export const mockNutrition = {
  today: {
    calories: {
      current: 800,
      target: 1600,
      unit: 'kcal',
      breakdown: {
        breakfast: 350,
        lunch: 450,
        dinner: 0,
        snacks: 80
      }
    },
    protein: {
      current: 47,
      target: 90,
      unit: 'g',
      breakdown: {
        breakfast: 12,
        lunch: 35,
        dinner: 0,
        snacks: 3
      }
    },
    carbs: {
      current: 88,
      target: 180,
      unit: 'g',
      breakdown: {
        breakfast: 45,
        lunch: 40,
        dinner: 0,
        snacks: 3
      }
    },
    fat: {
      current: 34,
      target: 50,
      unit: 'g',
      breakdown: {
        breakfast: 12,
        lunch: 15,
        dinner: 0,
        snacks: 7
      }
    }
  },
  
  // 本周统计
  week: {
    averageCalories: 1450,
    averageProtein: 82,
    averageCarbs: 165,
    averageFat: 48,
    daysTracked: 5,
    streakDays: 3
  },
  
  // 营养分布
  distribution: {
    protein: 0.29,  // 29%
    carbs: 0.51,    // 51%
    fat: 0.20       // 20%
  },
  
  // 水分摄入
  water: {
    current: 1200,
    target: 2000,
    unit: 'ml'
  }
}

// 获取今日营养统计
export const getTodayNutritionData = () => mockNutrition.today

// 获取本周统计
export const getWeekNutritionData = () => mockNutrition.week

// 获取营养分布
export const getNutritionDistribution = () => mockNutrition.distribution

// 获取水分数据
export const getWaterIntakeData = () => mockNutrition.water
