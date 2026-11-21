import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import About from './pages/About'
import AlgorithmVisualizer from './pages/AlgorithmVisualizer'
import Dashboard from './pages/Dashboard'
import Favorites from './pages/Favorites'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="visualizer" element={<AlgorithmVisualizer />} />
          <Route path="history" element={<History />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
