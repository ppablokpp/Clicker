import { Route, Routes } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import { TabBar } from './components/TabBar'
import { AccountButton } from './components/AccountButton'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Store } from './pages/Store'
import { Achievements } from './pages/Achievements'

function ClickerApp() {
  return (
    <ClickCounterProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clasificacion" element={<Leaderboard />} />
        <Route path="/logros" element={<Achievements />} />
        <Route path="/tienda" element={<Store />} />
      </Routes>
      <TabBar />
      <AccountButton />
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
