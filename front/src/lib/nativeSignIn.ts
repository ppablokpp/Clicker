import { SocialLogin } from '@capgo/capacitor-social-login'
import type { useClerk } from '@clerk/clerk-react'

/** The Clerk instance, as the hook hands it out. */
type ClerkInstance = ReturnType<typeof useClerk>

/**
 * Sign in with Google inside the native shell.
 *
 * A web view can't run Google's OAuth page (Google refuses embedded
 * browsers), so in the app the Google button doesn't redirect: it opens
 * the system's own account sheet (Credential Manager on Android, the
 * Google SDK on iOS), gets an ID token for the user, and hands that token
 * to Clerk — the same exchange Clerk's own Expo SDK does, under the
 * `google_one_tap` strategy, which takes a Google ID token whose audience
 * is our Web OAuth client. Clerk then either signs the user in or, for a
 * first visit, creates the account (a "transfer" to sign-up).
 *
 * Needs, on Clerk's side: Google as a social connection with *custom
 * credentials* (our Web client ID + secret) and the app's origin in the
 * instance's allowed origins. On Google's side: that Web client, plus one
 * Android client per signing key (package name + SHA-1). The Web client
 * ID is the only one this code sees, via VITE_GOOGLE_WEB_CLIENT_ID.
 */
const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined

let initialized: Promise<void> | null = null
function ensureInitialized() {
  if (!WEB_CLIENT_ID) throw new Error('Falta VITE_GOOGLE_WEB_CLIENT_ID para el inicio de sesión nativo con Google')
  initialized ??= SocialLogin.initialize({
    google: { webClientId: WEB_CLIENT_ID, iOSServerClientId: WEB_CLIENT_ID, mode: 'online' },
  })
  return initialized
}

/** Thrown when the user backs out of the account sheet; not an error to show. */
export class NativeSignInCancelled extends Error {}

function isCancellation(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err).toLowerCase()
  return msg.includes('cancel') || msg.includes('canceled') || msg.includes('user closed')
}

interface ClerkApiError {
  errors?: { code?: string }[]
}
const hasErrorCode = (err: unknown, code: string) =>
  Boolean((err as ClerkApiError)?.errors?.some((e) => e.code === code))

export async function signInWithGoogleNative(clerk: ClerkInstance): Promise<void> {
  await ensureInitialized()

  let idToken: string | null | undefined
  try {
    const res = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } })
    idToken = (res.result as { idToken?: string | null }).idToken
  } catch (err) {
    if (isCancellation(err)) throw new NativeSignInCancelled()
    throw err
  }
  if (!idToken) throw new Error('Google no ha devuelto un token de identidad')

  const client = clerk.client
  if (!client) throw new Error('Clerk no está listo')
  const { signIn, signUp } = client

  let sessionId: string | null = null
  try {
    await signIn.create({ strategy: 'google_one_tap', token: idToken })
    if (signIn.firstFactorVerification.status === 'transferable') {
      // Google knows them, Clerk doesn't yet: carry the verification over
      // into a fresh account
      await signUp.create({ transfer: true })
      sessionId = signUp.createdSessionId
    } else {
      sessionId = signIn.createdSessionId
    }
  } catch (err) {
    if (!hasErrorCode(err, 'external_account_not_found')) throw err
    await signUp.create({ strategy: 'google_one_tap', token: idToken })
    sessionId = signUp.createdSessionId
  }

  if (!sessionId) throw new Error('Clerk no ha creado la sesión')
  await clerk.setActive({ session: sessionId })
}
