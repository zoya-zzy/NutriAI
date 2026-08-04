import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

export default function ChatBubble({ 
  type = 'ai', 
  content, 
  timestamp,
  delay = 0 
}) {
  const isUser = type === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-primary-500 text-white' 
          : 'bg-gradient-to-br from-primary-100 to-warm-100 text-primary-600'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {timestamp && (
          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  )
}
