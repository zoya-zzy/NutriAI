// 食物 Mock 数据 - 今日饮食记录
export const mockMeals = {
  breakfast: {
    id: 'meal_breakfast_001',
    type: 'breakfast',
    mealType: 'Breakfast',
    name: '燕麦煎饼配水果',
    emoji: '🥞',
    imagePlaceholder: null,
    calories: 350,
    protein: 12,
    carbs: 45,
    fat: 12,
    time: '08:30',
    foods: [
      { name: '燕麦煎饼', amount: '1个', calories: 200 },
      { name: '蓝莓', amount: '50g', calories: 40 },
      { name: '希腊酸奶', amount: '100g', calories: 110 }
    ]
  },
  
  lunch: {
    id: 'meal_lunch_001',
    type: 'lunch',
    mealType: 'Lunch',
    name: '鸡胸肉藜麦沙拉',
    emoji: '🍱',
    imagePlaceholder: null,
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 15,
    time: '12:30',
    foods: [
      { name: '鸡胸肉', amount: '150g', calories: 247 },
      { name: '藜麦', amount: '80g', calories: 300 },
      { name: '混合蔬菜', amount: '100g', calories: 20 },
      { name: '橄榄油', amount: '10g', calories: 90 }
    ]
  },
  
  dinner: null, // 还未记录晚餐
  
  snacks: [
    {
      id: 'snack_001',
      type: 'snack',
      name: '杏仁',
      emoji: '🌰',
      calories: 80,
      protein: 3,
      carbs: 3,
      fat: 7,
      time: '15:30'
    }
  ]
}

// 获取今日饮食
export const getTodayMealsData = () => mockMeals

// 获取单餐详情
export const getMealByType = (type) => {
  const mealMap = {
    breakfast: mockMeals.breakfast,
    lunch: mockMeals.lunch,
    dinner: mockMeals.dinner
  }
  return mealMap[type] || null
}

// 预设食物库（供拍照识别使用）
export const foodDatabase = [
  {
    name: 'Chicken Breast',
    emoji: '🍗',
    calories: 220,
    protein: 40,
    carbs: 0,
    fat: 5,
    confidence: 0.95
  },
  {
    name: 'Salmon Fillet',
    emoji: '🐟',
    calories: 280,
    protein: 38,
    carbs: 0,
    fat: 15,
    confidence: 0.92
  },
  {
    name: 'Brown Rice',
    emoji: '🍚',
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    confidence: 0.88
  },
  {
    name: 'Avocado Toast',
    emoji: '🥑',
    calories: 320,
    protein: 8,
    carbs: 35,
    fat: 18,
    confidence: 0.85
  },
  {
    name: 'Greek Salad',
    emoji: '🥗',
    calories: 180,
    protein: 6,
    carbs: 12,
    fat: 12,
    confidence: 0.90
  },
  {
    name: 'Pasta Carbonara',
    emoji: '🍝',
    calories: 450,
    protein: 15,
    carbs: 58,
    fat: 18,
    confidence: 0.87
  }
]

// 获取随机识别结果
export const getRandomRecognitionResult = () => {
  return foodDatabase[Math.floor(Math.random() * foodDatabase.length)]
}
