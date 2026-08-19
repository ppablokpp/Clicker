import { Route, Routes } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import { Header } from './components/Header'
import { BottomNavPill } from './components/BottomNavPill'
import { SignInModal } from './components/SignInModal'
import { SignInPromptProvider } from './context/SignInPromptContext'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { GemsProvider } from './context/GemsContext'
import { KeysProvider } from './context/KeysContext'
import { DailyKeyProvider } from './context/DailyKeyContext'
import { ClickPacksProvider } from './context/ClickPacksContext'
import { KeyPacksProvider } from './context/KeyPacksContext'
import { GemPacksProvider } from './context/GemPacksContext'
import { PowerupProvider } from './context/PowerupContext'
import { TimedLuckPowerupProvider } from './context/TimedLuckPowerupContext'
import { UpgradesProvider } from './context/UpgradesContext'
import { MilestonesProvider } from './context/MilestonesContext'
import { GemUpgradesProvider } from './context/GemUpgradesContext'
import { DailyCaseProvider } from './context/DailyCaseContext'
import { GemCaseProvider } from './context/GemCaseContext'
import { GemChestProvider } from './context/GemChestContext'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { Store } from './pages/Store'
import { Stats } from './pages/Stats'

function ClickerApp() {
  return (
    <SignInPromptProvider>
      <ClickCounterProvider>
        <GemsProvider>
          <KeysProvider>
            <DailyKeyProvider>
              <ClickPacksProvider>
                <KeyPacksProvider>
                  <GemPacksProvider>
                    <PowerupProvider>
                      <TimedLuckPowerupProvider>
                        <MilestonesProvider>
                          <UpgradesProvider>
                            <GemUpgradesProvider>
                              <DailyCaseProvider>
                                <GemCaseProvider>
                                  <GemChestProvider>
                                    <Routes>
                                      <Route path="/" element={<Home />} />
                                      <Route path="/clasificacion" element={<Leaderboard />} />
                                      <Route path="/estadisticas" element={<Stats />} />
                                      <Route path="/tienda" element={<Store />} />
                                    </Routes>
                                    <Header />
                                    <BottomNavPill />
                                    <SignInModal />
                                  </GemChestProvider>
                                </GemCaseProvider>
                              </DailyCaseProvider>
                            </GemUpgradesProvider>
                          </UpgradesProvider>
                        </MilestonesProvider>
                      </TimedLuckPowerupProvider>
                    </PowerupProvider>
                  </GemPacksProvider>
                </KeyPacksProvider>
              </ClickPacksProvider>
            </DailyKeyProvider>
          </KeysProvider>
        </GemsProvider>
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
