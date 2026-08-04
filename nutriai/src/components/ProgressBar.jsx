import { motion } from 'framer-motion'

export default function ProgressBar({ 
  value, 
  max, 
  color = 'bg-primary-500',
  label, 
  delay = 0,
  unit = ''
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const isOver = value > max
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-semibold ${isOver ? 'text-coral-500' : 'text-gray-800'}`}>
          <span className={isOver ? 'text-coral-500' : 'text-primary-600'}>{value}</span>
          <span className="text-gray-400"> / {max}{unit}</span>
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${isOver ? 'bg-gradient-to-r from-coral-400 to-coral-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'}`}
        />
      </div>
    </motion.div>
  )
}
