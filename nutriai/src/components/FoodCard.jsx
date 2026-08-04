import { motion } from 'framer-motion'

export default function FoodCard({ 
  emoji, 
  name, 
  calories, 
  protein, 
  carbs, 
  fat, 
  mealType,
  bgColor = 'bg-warm-50',
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`journal-card ${bgColor} border border-gray-50`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {mealType}
            </span>
          </div>
          <h3 className="font-semibold text-gray-800 truncate">{name}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warm-400"></span>
              {calories} kcal
            </span>
            {protein && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                P {protein}g
              </span>
            )}
          </div>
          {(carbs || fat) && (
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
              {carbs && <span>C {carbs}g</span>}
              {fat && <span>F {fat}g</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
