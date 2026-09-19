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
 * Google SDK on iOS) and gets an ID token for the user.
 *
 * That token can't go to Clerk straight from here: Clerk's browser-facing
 * API only takes Google tokens minted for the Web client itself, and a
 * token minted for an Android app names the Android client as its
 * authorized party — Clerk answers 403 from any origin. So the token goes
 * to our back (routes/nativeAuth.js), which verifies it with Google and
 * mints a Clerk sign-in token for that user; we redeem that with Clerk's
 * `ticket` strategy, which is open to every origin, and end up with an
 * ordinary Clerk session.
 *
 * Needs: the Google Web client (its ID here as VITE_GOOGLE_WEB_CLIENT_ID,
 * the same on the back) plus one Android client per signing key in Google
 * Cloud, and the app's origin in Clerk's allowed origins.
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
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

export async function signInWithGoogleNative(clerk: ClerkInstance): Promise<void> {
  await ensureInitialized()

  let idToken: string | null | undefined
  try {
    // No scopes: without them the plugin does a plain ID-token sign-in (all we
    // need for Clerk); asking for scopes turns it into an authorization flow
    // that needs the main activity wired up for it.
    const res = await SocialLogin.login({ provider: 'google', options: {} })
    idToken = (res.result as { idToken?: string | null }).idToken
  } catch (err) {
    if (isCancellation(err)) throw new NativeSignInCancelled()
    throw err
  }
  if (!idToken) throw new Error('Google no ha devuelto un token de identidad')

  const client = clerk.client
  if (!client) throw new Error('Clerk no está listo')

  // the back turns Google's word into Clerk's
  const res = await fetch(`${API_URL}/api/native-auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const data = (await res.json().catch(() => ({}))) as { ticket?: string; error?: string }
  if (!res.ok || !data.ticket) throw new Error(data.error ?? 'No se ha podido validar la cuenta de Google')

  const signIn = await client.signIn.create({ strategy: 'ticket', ticket: data.ticket })
  if (signIn.status !== 'complete' || !signIn.createdSessionId) {
    throw new Error(`Clerk no ha completado el inicio de sesión (${signIn.status})`)
  }
  await clerk.setActive({ session: signIn.createdSessionId })
}
