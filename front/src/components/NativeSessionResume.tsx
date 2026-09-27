import { useEffect, useRef } from 'react'
import { useAuth, useClerk } from '@clerk/clerk-react'
import { isNativeApp } from '../lib/native'
import { lastNativeProvider, signInWithGoogleNative } from '../lib/nativeSignIn'

/**
 * Signs back in, silently, when the app is opened again.
 *
 * Inside the app a Clerk session does not survive being closed, and there
 * is nowhere for it to survive: the page is served from
 * `capacitor://localhost` (iOS reserves http and https for itself, so the
 * origin cannot be changed), which makes every cookie for
 * clerk.clankup.app a third-party one, and WKWebView blocks those.
 * `standardBrowser: false` stops Clerk looking for a cookie that will
 * never be there — which is what fixed the session dropping mid-game —
 * but clerk.browser.js keeps nothing on disk either: its only localStorage
 * keys are telemetry. Cold start, and the session is simply gone.
 *
 * So it is taken again rather than restored. Google's iOS SDK keeps its
 * own sign-in, and the plugin's `login` tries `restorePreviousSignIn`
 * before it shows anything (GoogleProvider.swift), so asking for a token
 * again on launch costs no interaction at all — the sheet never appears.
 * From there it is the ordinary road: our back verifies the token and
 * mints a Clerk ticket (see lib/nativeSignIn).
 *
 * Apple has no equivalent — `refresh` is a no-op in the plugin because
 * Apple provides no way to re-issue an identity token without the user, so
 * someone who signed in with Apple has to tap the button again. The sheet
 * recognises them and it is one Face ID, but it is a tap.
 */
export function NativeSessionResume() {
  const { isLoaded, isSignedIn } = useAuth()
  const clerk = useClerk()
  const tried = useRef(false)

  useEffect(() => {
    if (!isNativeApp() || !isLoaded || isSignedIn || tried.current) return
    if (lastNativeProvider() !== 'google') return
    tried.current = true
    void (async () => {
      try {
        await signInWithGoogleNative(clerk)
      } catch (err) {
        // Nothing to show and nothing to do: the player is simply a guest
        // until they press the button. Signing out of Google on the phone,
        // or being offline at launch, both land here.
        console.warn('No se pudo retomar la sesión al abrir la app', err)
      }
    })()
  }, [isLoaded, isSignedIn, clerk])

  return null
}
