import { Route, Routes } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import { Header } from './components/Header'
import { BottomNavPill } from './components/BottomNavPill'
import { SignInModal } from './components/SignInModal'
import { SignInPromptProvider } from './context/SignInPromptContext'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { PowerupProvider } from './context/PowerupContext'
import { TimedLuckPowerupProvider } from './context/TimedLuckPowerupContext'
import { UpgradesProvider } from './context/UpgradesContext'
import { MilestonesProvider } from './context/MilestonesContext'
import { MoneyUpgradesProvider } from './context/MoneyUpgradesContext'
import { DailyCaseProvider } from './context/DailyCaseContext'
import { MoneyCaseProvider } from './context/MoneyCaseContext'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Store } from './pages/Store'
import { Stats } from './pages/Stats'

function ClickerApp() {
  return (
    <SignInPromptProvider>
      <ClickCounterProvider>
        <PowerupProvider>
          <TimedLuckPowerupProvider>
            <MilestonesProvider>
              <UpgradesProvider>
                <MoneyUpgradesProvider>
                  <DailyCaseProvider>
                    <MoneyCaseProvider>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/clasificacion" element={<Leaderboard />} />
                        <Route path="/estadisticas" element={<Stats />} />
                        <Route path="/tienda" element={<Store />} />
                      </Routes>
                      <Header />
                      <BottomNavPill />
                      <SignInModal />
                    </MoneyCaseProvider>
                  </DailyCaseProvider>
                </MoneyUpgradesProvider>
              </UpgradesProvider>
            </MilestonesProvider>
          </TimedLuckPowerupProvider>
        </PowerupProvider>
      </ClickCounterProvider>
    </SignInPromptProvider>
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
