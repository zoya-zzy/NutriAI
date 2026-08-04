import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen pb-20">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-screen"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
