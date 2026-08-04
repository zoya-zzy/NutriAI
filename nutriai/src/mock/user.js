// 用户信息 Mock 数据
export const mockUser = {
  id: 'user_001',
  name: 'Zoya',
  avatar: '🌸',
  gender: 'female',
  age: 25,
  height: 165,
  weight: 58,
  goal: 'weight_loss',
  goalLabel: '减重',
  
  // AI 计算的营养目标
  nutritionGoals: {
    dailyCalories: 1600,
    recommendedProtein: 90,
    recommendedCarbs: 180,
    recommendedFat: 50
  },
  
  // AI 每日鼓励语
  encouragements: [
    '每一小步都值得庆祝，今天也要好好吃饭哦 🌱',
    '健康的身体源于每一次用心的选择 💚',
    '你正在变得更好，一步一步，稳稳地 ✨',
    '今天的坚持，是明天最好的礼物 🎁',
    '聆听身体的声音，它会感谢你的 🌸'
  ]
}

// 获取随机鼓励语
export const getRandomEncouragement = () => {
  const { encouragements } = mockUser
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

// 获取用户资料
export const getUserData = () => mockUser

// 目标选项
export const goalOptions = [
  { value: 'weight_loss', label: '减重', icon: '🏃‍♀️' },
  { value: 'maintenance', label: '维持', icon: '🧘‍♀️' },
  { value: 'muscle_gain', label: '增肌', icon: '💪' },
  { value: 'healthy', label: '健康', icon: '🌸' }
]
