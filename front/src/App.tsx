import { Route, Routes } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import { Header } from './components/Header'
import { BottomNavPill } from './components/BottomNavPill'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { PowerupProvider } from './context/PowerupContext'
import { UpgradesProvider } from './context/UpgradesContext'
import { MilestonesProvider } from './context/MilestonesContext'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Store } from './pages/Store'
import { Stats } from './pages/Stats'

function ClickerApp() {
  return (
    <ClickCounterProvider>
      <PowerupProvider>
        <MilestonesProvider>
          <UpgradesProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clasificacion" element={<Leaderboard />} />
              <Route path="/estadisticas" element={<Stats />} />
              <Route path="/tienda" element={<Store />} />
            </Routes>
            <Header />
            <BottomNavPill />
          </UpgradesProvider>
        </MilestonesProvider>
      </PowerupProvider>
    </ClickCounterProvider>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <ClickerApp />
          </AuthGate>
        }
      />
    </Routes>
  )
}

export default App
