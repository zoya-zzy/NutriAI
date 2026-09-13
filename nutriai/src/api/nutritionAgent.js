/**
 * Nutrition Agent API
 *
 * 调用后端接口，获取 AI 营养师建议 + 自然语言聊天。
 */

// 开发环境用 Vite 代理（空字符串），生产环境用 VITE_API_BASE 环境变量
import { apiRequest } from './client.js'

/**
 * 获取 AI 营养建议
 * @param {Object} data - { userProfile, diary, nutrition }
 * @returns {Promise<Object>} { success, data: { summary, analysis, warning, recommendation }, source }
 */
export async function getNutritionAdvice(data) {
  try {
    const json = await apiRequest('/api/nutrition-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!json.success) {
      throw new Error(json.message || json.error || 'AI service unavailable')
    }

    return {
      success: true,
      data: json.data,
      source: json.source,
    }
  } catch (err) {
    console.error('[nutritionAgent] API error:', err)
    return {
      success: false,
      message: err.message || 'AI服务暂时不可用',
    }
  }
}

/**
 * 与 AI 营养师聊天（自然语言对话）
 *
 * 后端自动识别意图：
 * - add_food: 返回 foodData，前端自动添加到 diary
 * - remove_food: 返回删除目标
 * - query_nutrition: 返回营养状态
 * - nutrition_advice: 返回结构化建议
 * - chat: 普通回复
 *
 * @param {string} message - 用户消息
 * @param {Object} context - { userProfile, diary, nutrition }
 * @returns {Promise<Object>} { success, action, reply, foodData, advice, nutrition, source }
 */
export async function chatWithNutritionAgent(message, context = {}) {
  try {
    const json = await apiRequest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userProfile: context.userProfile || {},
        diary: context.diary || { meals: [] },
        nutrition: context.nutrition || {},
      }),
    })

    if (!json.success) {
      throw new Error(json.message || json.error || 'AI service unavailable')
    }

    return {
      success: true,
      action: json.action,
      reply: json.reply,
      foodData: json.foodData,
      advice: json.advice,
      nutrition: json.nutrition,
      source: json.source,
    }
  } catch (err) {
    console.error('[nutritionAgent] chat API error:', err)
    return {
      success: false,
      message: err.message || 'AI服务暂时不可用',
    }
  }
}
