import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AquariumPage from './pages/AquariumPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/aquarium" element={<AquariumPage />} />
      </Routes>
    </BrowserRouter>
  )
}
