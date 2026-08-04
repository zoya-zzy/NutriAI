// Mock API service layer - 后续替换为 FastAPI 真实接口

// 获取今日饮食记录
export const getTodayMeals = async () => {
  // TODO: 替换为真实 API - GET /api/v1/meals/today
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        breakfast: {
          id: 1,
          emoji: '🥞',
          name: '燕麦煎饼配水果',
          calories: 350,
          protein: 12,
          carbs: 45,
          fat: 12,
          mealType: 'Breakfast'
        },
        lunch: {
          id: 2,
          emoji: '🍱',
          name: '鸡胸肉藜麦沙拉',
          calories: 450,
          protein: 35,
          carbs: 40,
          fat: 15,
          mealType: 'Lunch'
        },
        dinner: null // 还未记录晚餐
      })
    }, 300)
  })
}

// 获取今日营养统计
export const getTodayNutrition = async () => {
  // TODO: 替换为真实 API - GET /api/v1/nutrition/today
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        calories: { current: 800, target: 1600 },
        protein: { current: 47, target: 90 },
        carbs: { current: 85, target: 180 },
        fat: { current: 27, target: 50 }
      })
    }, 300)
  })
}

// 拍照识别食物
export const recognizeFood = async (imageData) => {
  // TODO: 替换为真实 API - POST /api/v1/ai/recognize
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        food: {
          name: 'Chicken Breast',
          emoji: '🍗',
          calories: 220,
          protein: 40,
          carbs: 0,
          fat: 5,
          confidence: 0.95
        }
      })
    }, 1500)
  })
}

// 添加食物到日记
export const addFoodToDiary = async (foodData) => {
  // TODO: 替换为真实 API - POST /api/v1/meals
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        id: Date.now(),
        ...foodData
      })
    }, 500)
  })
}

// 获取用户资料
export const getUserProfile = async () => {
  // TODO: 替换为真实 API - GET /api/v1/user/profile
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'Zoya',
        gender: 'female',
        age: 25,
        height: 165,
        weight: 58,
        goal: 'weight_loss',
        dailyCalories: 1600,
        recommendedProtein: 90,
        recommendedCarbs: 180,
        recommendedFat: 50
      })
    }, 300)
  })
}

// 更新用户资料
export const updateUserProfile = async (profileData) => {
  // TODO: 替换为真实 API - PUT /api/v1/user/profile
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        ...profileData
      })
    }, 500)
  })
}

// 发送 AI 聊天消息
export const sendChatMessage = async (message, history = []) => {
  // TODO: 替换为真实 API - POST /api/v1/ai/chat
  return new Promise((resolve) => {
    setTimeout(() => {
      // 简单的基于关键词的 mock 响应
      const responses = {
        '炸鸡': '今天脂肪摄入偏高，晚餐建议选择低脂高蛋白食物，例如鸡胸肉、虾仁、西兰花。',
        '奶茶': '奶茶含糖量较高，建议选择无糖或三分糖版本。可以搭配一些坚果来增加饱腹感。',
        '推荐': '根据您的目标，我建议您的饮食结构为：碳水化合物 45%，蛋白质 30%，脂肪 25%。',
        '早餐': '早餐建议包含：1份优质蛋白（鸡蛋/酸奶）+ 1份全谷物（燕麦/全麦面包）+ 1份水果。',
        '晚餐': '晚餐宜清淡，建议在睡前3小时完成。可以选择蒸鱼、蔬菜汤或轻量沙拉。'
      }
      
      let reply = '感谢您的分享！我会根据您的饮食情况给出建议。记得多喝温水，保持规律作息哦 💚'
      
      for (const [keyword, response] of Object.entries(responses)) {
        if (message.includes(keyword)) {
          reply = response
          break
        }
      }
      
      resolve({
        success: true,
        message: reply,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    }, 800)
  })
}

// 获取 AI 每日鼓励语
export const getDailyEncouragement = async () => {
  // TODO: 替换为真实 API - GET /api/v1/ai/encouragement
  const encouragements = [
    '每一小步都值得庆祝，今天也要好好吃饭哦 🌱',
    '健康的身体源于每一次用心的选择 💚',
    '你正在变得更好，一步一步，稳稳地 ✨',
    '今天的坚持，是明天最好的礼物 🎁',
    '聆听身体的声音，它会感谢你的 🌸'
  ]
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: encouragements[Math.floor(Math.random() * encouragements.length)]
      })
    }, 200)
  })
}
