/**
 * NutriAI 食物识别 API 客户端
 * 
 * 对接 FastAPI 后端: POST /api/recognize-food
 * 上传图片文件，获取 AI 识别的结构化营养数据。
 */

// 开发环境用 Vite 代理（空字符串），生产环境用 VITE_API_BASE 环境变量
import { apiRequest } from './client.js'

/**
 * 识别食物 - 调用后端 API
 * 
 * @param {File|Blob|string} image - 图片文件对象 或 base64 数据 URL
 * @returns {Promise<Object>} 识别结果
 */
export const recognizeFood = async (image) => {
  let fileToUpload

  if (image instanceof File || image instanceof Blob) {
    fileToUpload = image
  } else if (typeof image === 'string' && image.startsWith('data:')) {
    // base64 data URL → Blob
    const response = await fetch(image)
    fileToUpload = await response.blob()
    // 尝试推断文件名
    const fileName = image.split(';')[0].split(':')[1] || 'image/jpeg'
    const ext = fileName.split('/')[1] || 'jpeg'
    fileToUpload = new File([fileToUpload], `food.${ext}`, { type: fileName })
  } else {
    throw new Error('不支持的图片格式')
  }

  const formData = new FormData()
  formData.append('image', fileToUpload, fileToUpload.name || 'food.jpg')

  const data = await apiRequest('/api/recognize-food', {
    method: 'POST',
    body: formData,
  })

  if (!data.success) {
    throw new Error(data.message || data.error || 'AI 识别失败')
  }

  return {
    success: true,
    foodName: data.foodName,
    emoji: data.emoji || '🍽️',
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    confidence: data.confidence,
    recognizedAt: data.recognizedAt,
  }
}

/**
 * 健康检查
 */
export const checkHealth = async () => {
  return apiRequest('/api/health', {}, { timeoutMs: 15000 })
}

/**
 * 模拟添加食物到日记 (纯前端逻辑)
 */
export const addFoodToDiary = (foodData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hour = new Date().getHours()
      let mealType = 'snack'
      let mealLabel = 'Snack'

      if (hour < 10) {
        mealType = 'breakfast'
        mealLabel = 'Breakfast'
      } else if (hour < 14) {
        mealType = 'lunch'
        mealLabel = 'Lunch'
      } else if (hour < 20) {
        mealType = 'dinner'
        mealLabel = 'Dinner'
      }

      resolve({
        success: true,
        id: `meal_${mealType}_${Date.now()}`,
        type: mealType,
        mealType: mealLabel,
        name: foodData.foodName || foodData.name,
        emoji: foodData.emoji || '🍽️',
        calories: foodData.calories,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fat,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    }, 300)
  })
}

/**
 * 模拟删除食物记录
 */
export const deleteMeal = (mealId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, deletedId: mealId })
    }, 200)
  })
}
