import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TakeNumber from './pages/TakeNumber'
import ClaimSample from './pages/ClaimSample'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/take-number" element={<TakeNumber />} />
      <Route path="/sample" element={<ClaimSample />} />
    </Routes>
  )
}

export default App
