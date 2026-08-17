import { Route, Routes } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Store } from './pages/Store'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clasificacion" element={<Leaderboard />} />
        <Route path="/tienda" element={<Store />} />
      </Routes>
      <TabBar />
    </>
  )
}

export default App
