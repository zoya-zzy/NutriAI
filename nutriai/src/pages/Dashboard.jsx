import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, Trash2, Target } from 'lucide-react'
import ProgressBar from '../components/ProgressBar.jsx'
import { useNutri } from '../store/NutriContext.jsx'
import { getProfile, calculateNutritionGoals } from '../store/userProfile.js'
import { getRandomEncouragement } from '../mock/user.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { meals, nutrition, removeFood } = useNutri()

  const user = getProfile()
  const goals = calculateNutritionGoals(user)
  const encouragement = getRandomEncouragement()

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })

  const handleDeleteMeal = (mealId) => {
    removeFood(mealId)
  }

  return (
    <div className="px-5 pt-6 pb-24 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{dateStr}</p>
            <h1 className="text-2xl font-bold text-gray-800">
              Hi, {user.name || 'Friend'} <span className="inline-block animate-bounce">👋</span>
            </h1>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-warm-100 to-warm-200 rounded-full flex items-center justify-center text-lg">
            {user.gender === 'male' ? '👨' : '👩'}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-primary-50 to-warm-50 rounded-2xl p-4 border border-primary-100/50"
        >
          <p className="text-sm text-gray-600 italic leading-relaxed">
            "{encouragement}"
          </p>
        </motion.div>
      </motion.div>

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-journal p-4 shadow-card flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-warm-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Target size={24} className="text-warm-500" />
        </div>
        <div className="flex-1 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400">Calories</p>
            <p className="text-base font-bold text-gray-800">{goals.calories}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Protein</p>
            <p className="text-base font-bold text-primary-500">{goals.protein}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Carbs</p>
            <p className="text-base font-bold text-blue-500">{goals.carbs}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fat</p>
            <p className="text-base font-bold text-purple-500">{goals.fat}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
        </div>
      </motion.div>

      {/* Today's Diary */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">今日饮食手账</h2>
          <span className="text-xs text-gray-400">Today's Diary</span>
        </div>

        <div className="space-y-3">
          {/* Breakfast */}
          {meals.breakfast ? (
            <FoodCardWithDelete
              meal={meals.breakfast}
              mealType="breakfast"
              bgColor="bg-warm-50"
              delay={0.3}
              onDelete={() => handleDeleteMeal(meals.breakfast.id)}
            />
          ) : (
            <EmptyMealSlot type="Breakfast" icon="🥐" onClick={() => navigate('/camera')} delay={0.3} />
          )}

          {/* Lunch */}
          {meals.lunch ? (
            <FoodCardWithDelete
              meal={meals.lunch}
              mealType="lunch"
              bgColor="bg-primary-50/50"
              delay={0.4}
              onDelete={() => handleDeleteMeal(meals.lunch.id)}
            />
          ) : (
            <EmptyMealSlot type="Lunch" icon="🍱" onClick={() => navigate('/camera')} delay={0.4} />
          )}

          {/* Dinner */}
          {meals.dinner ? (
            <FoodCardWithDelete
              meal={meals.dinner}
              mealType="dinner"
              bgColor="bg-coral-400/5"
              delay={0.5}
              onDelete={() => handleDeleteMeal(meals.dinner.id)}
            />
          ) : (
            <EmptyMealSlot type="Dinner" icon="🍽️" onClick={() => navigate('/camera')} delay={0.5} />
          )}

          {/* Snacks */}
          {meals.snacks && meals.snacks.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-2 px-1">🍎 Snacks</p>
              {meals.snacks.map((snack, idx) => (
                <FoodCardWithDelete
                  key={snack.id}
                  meal={snack}
                  mealType="snack"
                  bgColor="bg-purple-50/50"
                  delay={0.6 + idx * 0.1}
                  onDelete={() => handleDeleteMeal(snack.id)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Nutrition Summary */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-journal p-5 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">营养统计</h2>
          <span className="text-xs text-gray-400">Nutrition</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <ProgressBar
            label="Calories"
            value={nutrition.calories.current}
            max={nutrition.calories.target}
            color="bg-warm-400"
            unit=" kcal"
            delay={0.7}
          />
          <ProgressBar
            label="Protein"
            value={nutrition.protein.current}
            max={nutrition.protein.target}
            color="bg-primary-500"
            unit=" g"
            delay={0.75}
          />
          <ProgressBar
            label="Carbs"
            value={nutrition.carbs.current}
            max={nutrition.carbs.target}
            color="bg-blue-400"
            unit=" g"
            delay={0.8}
          />
          <ProgressBar
            label="Fat"
            value={nutrition.fat.current}
            max={nutrition.fat.target}
            color="bg-purple-400"
            unit=" g"
            delay={0.85}
          />
        </div>
      </motion.section>

      {/* Add Food Button */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-24 left-0 right-0 px-5 max-w-[480px] mx-auto"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/camera')}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-400 text-white py-4 rounded-journal font-semibold text-lg shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2"
        >
          <Camera size={22} />
          <span>Add Food</span>
        </motion.button>
      </motion.div>
    </div>
  )
}

// 带删除功能的食物卡片
function FoodCardWithDelete({ meal, mealType, bgColor, delay, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`journal-card ${bgColor} border border-gray-50 group relative`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
          {meal.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {meal.mealType}
            </span>
            {meal.time && (
              <span className="text-xs text-gray-300">· {meal.time}</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 truncate">{meal.foodName}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warm-400"></span>
              {meal.calories} kcal
            </span>
            {meal.protein !== undefined && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                P {meal.protein}g
              </span>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="p-2 text-gray-300 hover:text-coral-500 hover:bg-coral-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}

function EmptyMealSlot({ type, icon, onClick, delay = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      onClick={onClick}
      className="w-full border-2 border-dashed border-gray-200 rounded-journal p-4 flex items-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
    >
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-primary-100 transition-colors">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{type}</p>
        <p className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">+ 添加记录</p>
      </div>
      <Plus size={20} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
    </motion.button>
  )
}
