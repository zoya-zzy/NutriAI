import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, Loader2, Menu, AlertCircle, CheckCircle } from 'lucide-react'
import ChatBubble from '../components/ChatBubble.jsx'
import { chatWithNutritionAgent } from '../api/nutritionAgent.js'
import { getProfile } from '../store/userProfile.js'
import { getTodayDiary, calculateNutrition, addFood } from '../store/foodDiary.js'
import { useNutri } from '../store/NutriContext.jsx'

const INITIAL_MESSAGE = {
  id: 'msg_init',
  type: 'ai',
  content: '你好！我是 NutriAI 营养师 🥗\n\n你可以：\n• 直接告诉我吃了什么，我帮你记录\n• 问我饮食建议\n• 查询今天营养达标情况\n\n例如：「刚喝了一杯奶茶」',
  timestamp: '',
}

const QUICK_ACTIONS = [
  { emoji: '🧋', text: '刚刚喝了一杯奶茶' },
  { emoji: '📊', text: '帮我分析一下今天的饮食' },
  { emoji: '⚖️', text: '今天营养达标了吗？' },
  { emoji: '🍽️', text: '下一餐吃什么好？' },
]

function getCurrentTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function AICoach() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { refresh } = useNutri()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // 收集用户上下文
  const gatherContext = () => {
    return {
      userProfile: getProfile(),
      diary: getTodayDiary(),
      nutrition: calculateNutrition(),
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    // 1. 添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: getCurrentTime(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // 2. 调用 AI 聊天接口
    const context = gatherContext()
    const result = await chatWithNutritionAgent(text, context)

    if (!result.success) {
      setLoading(false)
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: result.message || 'AI服务暂时不可用',
        timestamp: getCurrentTime(),
      }])
      return
    }

    // 3. 根据意图处理
    const { action, reply, foodData, advice, source } = result

    if (action === 'add_food' && foodData) {
      // 自动添加到 foodDiary
      const addedFood = addFood({
        foodName: foodData.foodName,
        calories: foodData.calories,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fat,
        emoji: foodData.emoji,
      })

      // 刷新全局状态 → Dashboard 同步更新
      refresh()

      // 添加 AI 回复消息 + 食物卡片
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'food_added',
        content: reply,
        foodData: { ...foodData, id: addedFood.id, time: addedFood.time },
        source,
        timestamp: getCurrentTime(),
      }])
    } else if (action === 'nutrition_advice' && advice) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'advice',
        content: advice,
        source,
        timestamp: getCurrentTime(),
      }])
    } else if (action === 'query_nutrition' && result.nutrition) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'nutrition_report',
        content: reply,
        nutrition: result.nutrition,
        timestamp: getCurrentTime(),
      }])
    } else {
      // 普通聊天 / remove_food / 其他
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: reply,
        timestamp: getCurrentTime(),
      }])
    }

    setLoading(false)
  }

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input)
    }
  }

  const handleQuickAction = (text) => {
    sendMessage(text)
  }

  return (
    <div className="flex flex-col h-screen bg-cream-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu size={22} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-warm-100 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-primary-600" />
            </div>
            <div className="text-center">
              <h1 className="font-semibold text-gray-800">NutriAI Coach</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-xs text-gray-400">在线</span>
              </div>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => {
            // 食物已添加卡片
            if (msg.type === 'food_added') {
              return <FoodAddedCard key={msg.id} reply={msg.content} foodData={msg.foodData} source={msg.source} timestamp={msg.timestamp} delay={index * 0.05} />
            }
            // 结构化建议卡片
            if (msg.type === 'advice') {
              return <AdviceCard key={msg.id} data={msg.content} source={msg.source} timestamp={msg.timestamp} delay={index * 0.05} />
            }
            // 营养报告
            if (msg.type === 'nutrition_report') {
              return <NutritionReportCard key={msg.id} reply={msg.content} nutrition={msg.nutrition} timestamp={msg.timestamp} delay={index * 0.05} />
            }
            // 错误消息
            if (msg.type === 'error') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle size={16} className="text-red-400" />
                  </div>
                  <div className="chat-bubble-ai bg-red-50 border border-red-100">
                    <p className="text-sm text-red-500">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">请检查后端服务是否启动</p>
                  </div>
                </motion.div>
              )
            }
            // 普通聊天消息
            return (
              <ChatBubble
                key={msg.id}
                type={msg.type}
                content={msg.content}
                timestamp={msg.timestamp}
                delay={index * 0.05}
              />
            )
          })}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-warm-100 flex items-center justify-center">
              <Bot size={16} className="text-primary-600" />
            </div>
            <div className="chat-bubble-ai flex items-center gap-2 py-4">
              <Loader2 size={16} className="animate-spin text-primary-500" />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-sm text-gray-500"
              >
                AI正在分析...
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {messages.length <= 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <p className="text-xs text-gray-400 mb-3 text-center">试试这些 👇</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center gap-2 p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all text-left"
                >
                  <span className="text-lg">{action.emoji}</span>
                  <span className="text-xs text-gray-600 line-clamp-2">{action.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="告诉 AI 你吃了什么..."
              disabled={loading}
              className="w-full px-4 py-3 pr-10 rounded-2xl bg-gray-50 border border-gray-100 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
            />
            <Sparkles size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400" />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              loading || !input.trim()
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gradient-to-br from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-500/25'
            }`}
          >
            <Send size={20} />
          </motion.button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          AI 建议仅供参考，不能替代专业医疗诊断
        </p>
      </motion.div>
    </div>
  )
}

// ============================================================
// 食物已添加卡片
// ============================================================

function FoodAddedCard({ reply, foodData, source, timestamp, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="flex gap-2"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-warm-100 flex items-center justify-center">
        <Bot size={16} className="text-primary-600" />
      </div>
      <div className="flex-1 space-y-2">
        {/* 来源标签 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-500">
            <CheckCircle size={10} className="inline mr-0.5" />
            已添加到日记
          </span>
          {timestamp && <span className="text-[10px] text-gray-400">{timestamp}</span>}
        </div>

        {/* AI 回复 */}
        <div className="chat-bubble-ai">
          <p className="text-sm text-gray-700 whitespace-pre-line">{reply}</p>
        </div>

        {/* 食物营养卡片 */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{foodData.emoji || '🍽️'}</span>
            <div>
              <p className="font-semibold text-gray-800">{foodData.foodName}</p>
              <p className="text-xs text-gray-400">{foodData.time || getCurrentTime()}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-orange-50 rounded-lg py-2">
              <p className="text-[10px] text-gray-400">热量</p>
              <p className="text-sm font-bold text-orange-500">{foodData.calories}</p>
              <p className="text-[9px] text-gray-400">kcal</p>
            </div>
            <div className="bg-blue-50 rounded-lg py-2">
              <p className="text-[10px] text-gray-400">蛋白质</p>
              <p className="text-sm font-bold text-blue-500">{foodData.protein}</p>
              <p className="text-[9px] text-gray-400">g</p>
            </div>
            <div className="bg-green-50 rounded-lg py-2">
              <p className="text-[10px] text-gray-400">碳水</p>
              <p className="text-sm font-bold text-green-500">{foodData.carbs}</p>
              <p className="text-[9px] text-gray-400">g</p>
            </div>
            <div className="bg-yellow-50 rounded-lg py-2">
              <p className="text-[10px] text-gray-400">脂肪</p>
              <p className="text-sm font-bold text-yellow-500">{foodData.fat}</p>
              <p className="text-[9px] text-gray-400">g</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// 结构化建议卡片
// ============================================================

function AdviceCard({ data, source, timestamp, delay = 0 }) {
  const sections = [
    { icon: '📋', label: '今日总结', content: data.summary, color: 'text-gray-700' },
    { icon: '📊', label: '营养分析', content: data.analysis, color: 'text-blue-600' },
    { icon: '⚠️', label: '注意事项', content: data.warning, color: 'text-orange-500' },
    { icon: '🍽️', label: '下一餐建议', content: data.recommendation, color: 'text-primary-600' },
  ].filter(s => s.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="flex gap-2"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-warm-100 flex items-center justify-center">
        <Bot size={16} className="text-primary-600" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            source === 'qwen-plus'
              ? 'bg-primary-50 text-primary-500'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {source === 'qwen-plus' ? '✨ AI 生成' : '📋 Mock'}
          </span>
          {timestamp && <span className="text-[10px] text-gray-400">{timestamp}</span>}
        </div>
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {sections.map((section, i) => (
            <div key={i} className={`p-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{section.icon}</span>
                <span className="text-xs font-semibold text-gray-500">{section.label}</span>
              </div>
              <p className={`text-sm leading-relaxed ${section.color}`}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// 营养报告卡片
// ============================================================

function NutritionReportCard({ reply, nutrition, timestamp, delay = 0 }) {
  const items = [
    { key: 'calories', label: '热量', unit: 'kcal', color: 'text-orange-500', bg: 'bg-orange-50' },
    { key: 'protein', label: '蛋白质', unit: 'g', color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'carbs', label: '碳水', unit: 'g', color: 'text-green-500', bg: 'bg-green-50' },
    { key: 'fat', label: '脂肪', unit: 'g', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="flex gap-2"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-warm-100 flex items-center justify-center">
        <Bot size={16} className="text-primary-600" />
      </div>
      <div className="flex-1 space-y-2">
        {timestamp && <span className="text-[10px] text-gray-400">{timestamp}</span>}
        <div className="chat-bubble-ai">
          <p className="text-sm text-gray-700 whitespace-pre-line">{reply}</p>
        </div>
        {nutrition && (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => {
              const n = nutrition[item.key] || {}
              const current = n.current || 0
              const target = n.target || 0
              const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
              return (
                <div key={item.key} className={`rounded-xl p-3 ${item.bg}`}>
                  <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>
                    {current} / {target} {item.unit}
                  </p>
                  <div className="w-full h-1.5 bg-white/50 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: delay + 0.1 }}
                      className={`h-full rounded-full ${
                        item.key === 'calories' ? 'bg-orange-400' :
                        item.key === 'protein' ? 'bg-blue-400' :
                        item.key === 'carbs' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
