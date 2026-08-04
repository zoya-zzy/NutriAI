import { Routes, Route, Navigate } from 'react-router-dom'
import { NutriProvider } from './store/NutriContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Camera from './pages/Camera.jsx'
import Profile from './pages/Profile.jsx'
import AICoach from './pages/AICoach.jsx'

function App() {
  return (
    <NutriProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="home" element={<Dashboard />} />
          <Route path="diary" element={<Dashboard />} />
          <Route path="camera" element={<Camera />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ai-coach" element={<AICoach />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NutriProvider>
  )
}

export default App
