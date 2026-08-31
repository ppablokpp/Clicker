import './global.css'

import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { NavigationContainer } from '@react-navigation/native'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter'
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk'
import { setAudioModeAsync } from 'expo-audio'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect } from 'react'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { GemUpgradesProvider } from './context/GemUpgradesContext'
import { GemsProvider } from './context/GemsContext'
import { LanguageProvider } from './context/LanguageContext'
import { TasksProvider } from './context/TasksContext'
import { TreeProvider } from './context/TreeContext'
import { RootNavigator } from './navigation/RootNavigator'

SplashScreen.preventAutoHideAsync()

// Confirmed benign: this comes from React Native's own `ResponderEventPlugin`
// (Libraries/Renderer/implementations/ReactFabric-dev.js), a single global
// touch counter that predates react-native-gesture-handler entirely and
// keeps running alongside it — it's part of the legacy Responder System
// (Pressable's own foundation), not anything Home's tap-to-shoot gesture
// owns or can desync on its own. Heavy simultaneous multi-touch through
// gesture-handler (Multidisparo, holding several fingers down and lifting
// them fast) reliably drifts this *separate* counter negative — verified by
// reading the warning's own source, not by guessing — with no observed
// effect on gesture-handler's own touch delivery (shots still fire
// correctly, at any tap rate, in every version tested). Silenced here so it
// doesn't bury real warnings while effects get reintroduced one at a time.
LogBox.ignoreLogs(['Ended a touch event which was not counted in `trackedTouchCount`'])

// Clerk requires this to be passed explicitly (not read from inside
// node_modules) since EXPO_PUBLIC_* env vars are only inlined into the
// bundle at the app's own build step, not Clerk's.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile/.env')
}

export default function App() {
  // Same two Google Fonts the web version pulls (Inter for body copy,
  // Space Grotesk for headline-style numbers/titles) — see AppText.tsx for
  // why every Text element has to request its weight explicitly instead of
  // relying on a global default.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  })

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync()
  }, [fontsLoaded])

  // Tap sounds (see lib/sounds.ts) should play through the speaker even
  // with the phone's silent switch on, same as the web version always
  // having sound available regardless of any OS-level "silent mode".
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true })
  }, [])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <LanguageProvider>
            <ClickCounterProvider>
              <GemsProvider>
                <GemUpgradesProvider>
                  <TreeProvider>
                    <TasksProvider>
                      <NavigationContainer>
                        <RootNavigator />
                      </NavigationContainer>
                    </TasksProvider>
                  </TreeProvider>
                </GemUpgradesProvider>
              </GemsProvider>
            </ClickCounterProvider>
          </LanguageProvider>
        </ClerkProvider>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
