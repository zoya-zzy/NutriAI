import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Target, Sparkles, Save, Activity } from 'lucide-react'
import { useNutri } from '../store/NutriContext.jsx'
import {
  getProfile,
  saveProfile,
  calculateBMR,
  calculateNutritionGoals,
  ACTIVITY_LEVELS,
  GOAL_OPTIONS,
} from '../store/userProfile.js'

export default function Profile() {
  const { refresh } = useNutri()

  // 从 userProfile 加载初始值
  const [profile, setProfile] = useState(getProfile())
  const [saved, setSaved] = useState(false)

  // 实时计算营养目标
  const goals = calculateNutritionGoals(profile)
  const bmr = Math.round(calculateBMR(profile))

  const handleSave = () => {
    saveProfile(profile)
    refresh() // 刷新 NutriContext，让 Dashboard 目标更新
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="px-5 pt-6 pb-24 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-warm-100 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={36} className="text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">个人资料</h1>
        <p className="text-sm text-gray-500 mt-1">告诉我们你的目标</p>
      </motion.div>

      {/* Form Fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Name */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="text-sm font-medium text-gray-600 mb-2 block">昵称</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            placeholder="输入你的昵称"
          />
        </div>

        {/* Gender */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="text-sm font-medium text-gray-600 mb-3 block">性别</label>
          <div className="grid grid-cols-2 gap-3">
            {['female', 'male'].map((g) => (
              <motion.button
                key={g}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfile({ ...profile, gender: g })}
                className={`py-3 rounded-xl font-medium transition-all ${
                  profile.gender === g
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {g === 'female' ? '👩 女生' : '👨 男生'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Age, Height, Weight */}
        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="年龄"
            icon="🎂"
            value={profile.age}
            onChange={(v) => setProfile({ ...profile, age: v })}
            delay={0.2}
          />
          <InputField
            label="身高(cm)"
            icon="📏"
            value={profile.height}
            onChange={(v) => setProfile({ ...profile, height: v })}
            delay={0.25}
          />
          <InputField
            label="体重(kg)"
            icon="⚖️"
            value={profile.weight}
            onChange={(v) => setProfile({ ...profile, weight: v })}
            delay={0.3}
          />
        </div>

        {/* Goal */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="text-sm font-medium text-gray-600 mb-3 block flex items-center gap-2">
            <Target size={16} />
            目标
          </label>
          <div className="grid grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((g) => (
              <motion.button
                key={g.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfile({ ...profile, goal: g.value })}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  profile.goal === g.value
                    ? 'bg-warm-100 border-2 border-warm-400'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{g.icon}</span>
                <span className={`font-medium ${
                  profile.goal === g.value ? 'text-warm-600' : 'text-gray-600'
                }`}>
                  {g.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <label className="text-sm font-medium text-gray-600 mb-3 block flex items-center gap-2">
            <Activity size={16} />
            活动水平
          </label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((a) => (
              <motion.button
                key={a.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfile({ ...profile, activityLevel: a.value })}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                  profile.activityLevel === a.value
                    ? 'bg-primary-50 border-2 border-primary-300'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div>
                  <span className={`font-medium text-sm ${
                    profile.activityLevel === a.value ? 'text-primary-600' : 'text-gray-700'
                  }`}>
                    {a.label}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">×{a.factor}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* AI Suggestions - 实时计算 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary-50 to-warm-50 rounded-2xl p-5 border border-primary-100/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-warm-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">AI 为你推荐</h3>
            <p className="text-xs text-gray-500">基于你的数据实时计算</p>
          </div>
        </div>

        {/* BMR */}
        <div className="mb-3 bg-white/60 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">基础代谢率 BMR</span>
          <span className="text-sm font-bold text-gray-700">{bmr} kcal/day</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">每日热量</p>
            <p className="text-2xl font-bold text-gray-800">{goals.calories}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">推荐蛋白质</p>
            <p className="text-2xl font-bold text-primary-600">{goals.protein}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">推荐碳水</p>
            <p className="text-2xl font-bold text-blue-600">{goals.carbs}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">推荐脂肪</p>
            <p className="text-2xl font-bold text-purple-600">{goals.fat}</p>
            <p className="text-xs text-gray-400">g</p>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
          saved
            ? 'bg-primary-100 text-primary-600'
            : 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-primary-500/25'
        }`}
      >
        {saved ? (
          <>✓ Profile saved ✅</>
        ) : (
          <>
            <Save size={20} />
            Save Profile
          </>
        )}
      </motion.button>
    </div>
  )
}

function InputField({ label, icon, value, onChange, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white rounded-2xl p-3 shadow-card"
    >
      <label className="text-xs text-gray-500 mb-1 block">{icon} {label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none"
      />
    </motion.div>
  )
}
