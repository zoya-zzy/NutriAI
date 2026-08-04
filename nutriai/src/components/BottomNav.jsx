import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, BookOpen, Bot, User } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/diary', icon: BookOpen, label: 'Diary' },
  { path: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50' : ''}`}>
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={`transition-all duration-200 ${isActive ? 'text-primary-500 scale-110' : 'text-gray-400'}`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"
                    />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
