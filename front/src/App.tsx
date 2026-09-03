import { Route, Routes } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import { BottomNavPill } from './components/BottomNavPill'
import { SignInModal } from './components/SignInModal'
import { FleetAwayModal } from './components/FleetAwayModal'
import { SignInPromptProvider } from './context/SignInPromptContext'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { GemsProvider } from './context/GemsContext'
import { KeysProvider } from './context/KeysContext'
import { DailyKeyProvider } from './context/DailyKeyContext'
import { ClickPacksProvider } from './context/ClickPacksContext'
import { KeyPacksProvider } from './context/KeyPacksContext'
import { GemPacksProvider } from './context/GemPacksContext'
import { InventoryProvider } from './context/InventoryContext'
import { PowerupProvider } from './context/PowerupContext'
import { TimedLuckPowerupProvider } from './context/TimedLuckPowerupContext'
import { MagnetProvider } from './context/MagnetContext'
import { MilestonesProvider } from './context/MilestonesContext'
import { TasksProvider } from './context/TasksContext'
import { GemUpgradesProvider } from './context/GemUpgradesContext'
import { DailyCaseProvider } from './context/DailyCaseContext'
import { GemCaseProvider } from './context/GemCaseContext'
import { GemChestProvider } from './context/GemChestContext'
import { TreeProvider } from './context/TreeContext'
import { PrestigeProvider } from './context/PrestigeContext'
import { BattlesProvider } from './context/BattlesContext'
import { TutorialProvider } from './context/TutorialContext'
import { TutorialOverlay } from './components/TutorialOverlay'
import { Home } from './pages/Home'
import { Leaderboard } from './pages/Leaderboard'
import { PublicProfile } from './pages/PublicProfile'
import { CustomizeAstronaut } from './pages/CustomizeAstronaut'
import { Store } from './pages/Store'
import { Stats } from './pages/Stats'
import { Tree } from './pages/Tree'
import { Battle } from './pages/Battle'

function ClickerApp() {
  return (
    <SignInPromptProvider>
      <TutorialProvider>
      <ClickCounterProvider>
        <TreeProvider>
          <PrestigeProvider>
            <BattlesProvider>
              <GemsProvider>
                <KeysProvider>
                  <DailyKeyProvider>
                    <ClickPacksProvider>
                      <KeyPacksProvider>
                        <GemPacksProvider>
                          <InventoryProvider>
                            <PowerupProvider>
                              <TimedLuckPowerupProvider>
                                <MagnetProvider>
                                  <MilestonesProvider>
                                    <TasksProvider>
                                      <GemUpgradesProvider>
                                        <DailyCaseProvider>
                                          <GemCaseProvider>
                                            <GemChestProvider>
                                              <Routes>
                                                <Route path="/" element={<Home />} />
                                                <Route path="/clasificacion" element={<Leaderboard />} />
                                                <Route path="/perfil/:userId" element={<PublicProfile />} />
                                                <Route path="/personalizar" element={<CustomizeAstronaut />} />
                                                <Route path="/estadisticas" element={<Stats />} />
                                                <Route path="/tienda" element={<Store />} />
                                                <Route path="/arbol" element={<Tree />} />
                                                <Route path="/batalla/:battleId" element={<Battle />} />
                                              </Routes>
                                              <BottomNavPill />
                                              <SignInModal />
                                              <FleetAwayModal />
                                              <TutorialOverlay />
                                            </GemChestProvider>
                                          </GemCaseProvider>
                                        </DailyCaseProvider>
                                      </GemUpgradesProvider>
                                    </TasksProvider>
                                  </MilestonesProvider>
                                </MagnetProvider>
                              </TimedLuckPowerupProvider>
                            </PowerupProvider>
                          </InventoryProvider>
                        </GemPacksProvider>
                      </KeyPacksProvider>
                    </ClickPacksProvider>
                  </DailyKeyProvider>
                </KeysProvider>
              </GemsProvider>
            </BattlesProvider>
          </PrestigeProvider>
        </TreeProvider>
      </ClickCounterProvider>
      </TutorialProvider>
    </SignInPromptProvider>
  )
}

function App() {
  return (
    <Routes>
      {/* Without these, a brand-new sign-up (as opposed to signing back in)
          falls back to Clerk's own default redirect target — the bare
          origin root, with no /Clicker/ prefix — which doesn't exist as a
          GitHub Pages site and 404s. Both paths need to land back on
          BASE_URL, same as SignInModal's own redirectUrlComplete. */}
      <Route
        path="/sso-callback"
        element={
          <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl={import.meta.env.BASE_URL}
            signUpFallbackRedirectUrl={import.meta.env.BASE_URL}
          />
        }
      />
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
