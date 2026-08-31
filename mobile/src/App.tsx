import './global.css'

import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ClickCounterProvider } from './context/ClickCounterContext'
import { LanguageProvider } from './context/LanguageContext'
import { RootNavigator } from './navigation/RootNavigator'

// Clerk requires this to be passed explicitly (not read from inside
// node_modules) since EXPO_PUBLIC_* env vars are only inlined into the
// bundle at the app's own build step, not Clerk's.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile/.env')
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <LanguageProvider>
            <ClickCounterProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ClickCounterProvider>
          </LanguageProvider>
        </ClerkProvider>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
