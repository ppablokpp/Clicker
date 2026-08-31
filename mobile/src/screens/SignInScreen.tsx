import { AntDesign } from '@expo/vector-icons'
import { useSSO } from '@clerk/expo/experimental'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLanguage } from '../context/LanguageContext'

// Both providers go through the same browser-based SSO flow for now — the
// native Google/Apple sheets need a dev-client build (@clerk/expo-google-signin,
// expo-apple-authentication + the Sign in with Apple capability), which
// needs a live Apple Developer account. This flow works in Expo Go today and
// gets swapped to native later without changing anything above this screen.
type Provider = 'oauth_google' | 'oauth_apple'

export function SignInScreen() {
  const { strings } = useLanguage()
  const { startSSOFlow } = useSSO()
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = useCallback(
    async (strategy: Provider) => {
      setError(null)
      setPendingProvider(strategy)
      try {
        await startSSOFlow({ strategy })
        // A null createdSessionId here just means the user cancelled the
        // browser flow — not an error, nothing to show for it.
      } catch (err) {
        console.error('No se pudo iniciar sesión', err)
        setError(strings.signIn.genericError)
      } finally {
        setPendingProvider(null)
      }
    },
    [startSSOFlow, strings],
  )

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]">
      <View className="flex-1 items-center justify-center gap-8 px-6">
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-white">ClankUp</Text>
          <Text className="text-center text-sm text-neutral-400">{strings.signIn.tagline}</Text>
        </View>

        <View className="w-full max-w-xs gap-3">
          <Pressable
            onPress={() => handleSignIn('oauth_google')}
            disabled={pendingProvider !== null}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 active:bg-white/[0.1]"
          >
            {pendingProvider === 'oauth_google' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AntDesign name="google" size={16} color="#fff" />
                <Text className="text-sm font-semibold text-white">{strings.signIn.continueWithGoogle}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleSignIn('oauth_apple')}
            disabled={pendingProvider !== null}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 active:bg-neutral-200"
          >
            {pendingProvider === 'oauth_apple' ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <AntDesign name="apple" size={16} color="#000" />
                <Text className="text-sm font-semibold text-black">{strings.signIn.continueWithApple}</Text>
              </>
            )}
          </Pressable>
        </View>

        {error && <Text className="text-xs text-red-400">{error}</Text>}
      </View>
    </SafeAreaView>
  )
}
