import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import {
  getGroupedMeals,
  calculateNutrition,
  addFood as diaryAddFood,
  removeFood as diaryRemoveFood,
} from './foodDiary.js'

const NutriContext = createContext(null)

// Action types
const REFRESH = 'REFRESH'

// Reducer — 从 foodDiary 同步状态
function nutriReducer(state, action) {
  if (action.type === REFRESH) {
    return {
      meals: getGroupedMeals(),
      nutrition: calculateNutrition(),
    }
  }
  return state
}

// Provider
export function NutriProvider({ children }) {
  const [state, dispatch] = useReducer(nutriReducer, {
    meals: getGroupedMeals(),
    nutrition: calculateNutrition(),
  })

  // 添加食物到饮食记录
  const addFood = useCallback((food, mealType) => {
    diaryAddFood(food, mealType)
    dispatch({ type: REFRESH })
  }, [])

  // 删除食物
  const removeFood = useCallback((foodId) => {
    diaryRemoveFood(foodId)
    dispatch({ type: REFRESH })
  }, [])

  // 手动刷新（用户资料变更后调用）
  const refresh = useCallback(() => {
    dispatch({ type: REFRESH })
  }, [])

  const value = useMemo(() => ({
    meals: state.meals,
    nutrition: state.nutrition,
    addFood,
    removeFood,
    refresh,
  }), [state, addFood, removeFood, refresh])

  return (
    <NutriContext.Provider value={value}>
      {children}
    </NutriContext.Provider>
  )
}

// Hook
export function useNutri() {
  const context = useContext(NutriContext)
  if (!context) {
    throw new Error('useNutri must be used within a NutriProvider')
  }
  return context
}
