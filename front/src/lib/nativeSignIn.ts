import { SocialLogin } from '@capgo/capacitor-social-login'
import type { useClerk } from '@clerk/clerk-react'
import { nativePlatform } from './native'

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
// iOS signs in through Google's own SDK, which wants the app's own OAuth
// client (an iOS one, bound to the bundle id) and not the Web one. The Web
// client still travels as the server client id: that is the audience Clerk
// and our back check the resulting token against.
const IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined

let initialized: Promise<void> | null = null
function ensureInitialized() {
  if (!WEB_CLIENT_ID) throw new Error('Falta VITE_GOOGLE_WEB_CLIENT_ID para el inicio de sesión nativo con Google')
  initialized ??= SocialLogin.initialize({
    google: {
      webClientId: WEB_CLIENT_ID,
      iOSClientId: IOS_CLIENT_ID,
      iOSServerClientId: WEB_CLIENT_ID,
      mode: 'online',
    },
    // Apple, and only on the iPhone, where it signs through the system and
    // needs nothing configured beyond the app's own entitlement. Passing
    // the key at all on Android makes the plugin demand a Services ID and
    // a redirect URL for its browser flow, and it refuses to initialise
    // without them — taking Google's button down with it, since this one
    // call sets up both.
    ...(nativePlatform() === 'ios' ? { apple: {} } : {}),
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

/**
 * Sign in with Apple inside the native shell — iOS only.
 *
 * On an iPhone the button opens Apple's own sheet (Face ID, no browser)
 * and hands back an identity token. It takes the same road as Google's:
 * Clerk's browser-facing API will not accept a token minted for the app
 * itself, so the back verifies it against Apple's published keys
 * (routes/nativeAuth.js) and mints a Clerk sign-in token we redeem here.
 *
 * Apple only reveals the name on the very first authorization, so it
 * travels beside the token — the back has no second chance to ask.
 */
export async function signInWithAppleNative(clerk: ClerkInstance): Promise<void> {
  await ensureInitialized()

  let idToken: string | null | undefined
  let givenName: string | null | undefined
  let familyName: string | null | undefined
  try {
    const res = await SocialLogin.login({ provider: 'apple', options: { scopes: ['name', 'email'] } })
    const result = res.result as {
      idToken?: string | null
      profile?: { givenName?: string | null; familyName?: string | null }
    }
    idToken = result.idToken
    givenName = result.profile?.givenName
    familyName = result.profile?.familyName
  } catch (err) {
    if (isCancellation(err)) throw new NativeSignInCancelled()
    throw err
  }
  if (!idToken) throw new Error('Apple no ha devuelto un token de identidad')

  const client = clerk.client
  if (!client) throw new Error('Clerk no está listo')

  const res = await fetch(`${API_URL}/api/native-auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, givenName, familyName }),
  })
  const data = (await res.json().catch(() => ({}))) as { ticket?: string; error?: string }
  if (!res.ok || !data.ticket) throw new Error(data.error ?? 'No se ha podido validar la cuenta de Apple')

  const signIn = await client.signIn.create({ strategy: 'ticket', ticket: data.ticket })
  if (signIn.status !== 'complete' || !signIn.createdSessionId) {
    throw new Error(`Clerk no ha completado el inicio de sesión (${signIn.status})`)
  }
  await clerk.setActive({ session: signIn.createdSessionId })
}
