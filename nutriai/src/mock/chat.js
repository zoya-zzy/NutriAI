// AI 聊天 Mock 数据
export const mockChatData = {
  // 初始消息
  initialMessages: [
    {
      id: 'msg_init_1',
      type: 'ai',
      content: '你好！我是 NutriAI 营养师 🥗\n\n我可以帮你：\n• 分析你的饮食结构\n• 给出健康饮食建议\n• 回答营养相关问题\n\n今天想聊点什么？',
      timestamp: '10:30'
    }
  ],
  
  // 快捷操作
  quickActions: [
    { emoji: '🍗', text: '今天吃了炸鸡和奶茶' },
    { emoji: '💡', text: '给我一些早餐建议' },
    { emoji: '🥗', text: '晚餐吃什么比较好？' },
    { emoji: '📊', text: '分析我的营养摄入' },
    { emoji: '💧', text: '一天应该喝多少水？' },
    { emoji: '🍎', text: '推荐一些健康零食' }
  ],
  
  // AI 预设回复模板
  responseTemplates: {
    '炸鸡': {
      category: '高脂',
      responses: [
        '今天脂肪摄入偏高，晚餐建议选择低脂高蛋白食物，例如鸡胸肉、虾仁、西兰花。',
        '炸鸡的热量较高，建议今天剩余时间选择清淡饮食。可以搭配一些高纤维蔬菜来帮助消化。',
        '偶尔解馋没问题！建议搭配无糖饮品，并在晚餐时选择蒸鱼或水煮蔬菜来平衡热量。'
      ]
    },
    '奶茶': {
      category: '高糖',
      responses: [
        '奶茶含糖量较高，建议选择无糖或三分糖版本。可以搭配一些坚果来增加饱腹感。',
        '一杯奶茶的热量可能相当于3碗米饭！推荐选择低卡替代品，比如气泡水或无糖茶。',
        '如果想喝奶茶，建议选择无糖版本，并在其他餐次减少碳水摄入来平衡。'
      ]
    },
    '早餐': {
      category: '建议',
      responses: [
        '早餐建议包含：1份优质蛋白（鸡蛋/酸奶）+ 1份全谷物（燕麦/全麦面包）+ 1份水果。',
        '健康早餐公式：碳水化合物 + 蛋白质 + 健康脂肪。例如：燕麦粥配鸡蛋和蓝莓。',
        '不吃早餐会导致代谢率下降，建议摄入300-500千卡的均衡早餐。'
      ]
    },
    '晚餐': {
      category: '建议',
      responses: [
        '晚餐宜清淡，建议在睡前3小时完成。可以选择蒸鱼、蔬菜汤或轻量沙拉。',
        '晚餐建议热量占全天的25-30%，约400-500千卡。避免高糖高油食物。',
        '晚上碳水摄入可以适当减少，多选择蛋白质和蔬菜。'
      ]
    },
    '推荐': {
      category: '个性化',
      responses: [
        '根据您的目标，我建议您的饮食结构为：碳水化合物 45%，蛋白质 30%，脂肪 25%。',
        '建议每日摄入：蛋白质 90g，碳水 180g，脂肪 50g。三餐比例为 3:4:3。',
        '每周建议摄入：鱼类2-3次，豆制品3-4次，蔬菜水果每日500g以上。'
      ]
    },
    '水': {
      category: ' hydration',
      responses: [
        '成人每日建议饮水量为1500-2000ml，可以根据体重和活动量调整。',
        '简单计算方式：体重(kg)×30ml = 每日基础饮水量。运动后需额外补充。',
        '建议少量多次饮水，每次100-200ml，不要等到口渴才喝。'
      ]
    },
    '零食': {
      category: '建议',
      responses: [
        '健康零食推荐：坚果（每日一小把）、希腊酸奶、新鲜水果、胡萝卜条配鹰嘴豆泥。',
        '选择低加工、高营养密度的零食。避免薯片、饼干等高脂高糖食品。',
        '零食热量建议控制在100-200千卡，选择蛋白质和纤维含量高的食物。'
      ]
    }
  },
  
  // 默认回复
  defaultResponses: [
    '感谢您的分享！我会根据您的饮食情况给出建议。记得多喝温水，保持规律作息哦 💚',
    '这是一个很好的问题！健康饮食的关键是均衡和持续。我建议您关注食物的多样性和营养密度。',
    '每个人的身体需求不同，建议根据您的具体目标和身体状况来制定饮食计划。有什么具体问题吗？',
    '健康饮食不是一蹴而就的，而是长期的习惯。小改变，大不同 💪'
  ]
}

// 根据关键词获取 AI 回复
export const getAIResponse = (message) => {
  const { responseTemplates, defaultResponses } = mockChatData
  
  for (const [keyword, template] of Object.entries(responseTemplates)) {
    if (message.includes(keyword)) {
      const responses = template.responses
      return responses[Math.floor(Math.random() * responses.length)]
    }
  }
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

// 获取初始消息
export const getInitialMessages = () => mockChatData.initialMessages

// 获取快捷操作
export const getQuickActions = () => mockChatData.quickActions
