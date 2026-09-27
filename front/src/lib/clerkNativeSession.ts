/**
 * Makes a Clerk session survive the app being closed.
 *
 * On the website Clerk keeps the session in a cookie on its own domain. In
 * the app it cannot: the page is served from `capacitor://localhost` (iOS
 * reserves http and https for itself, so the origin cannot be changed),
 * which makes every cookie for clerk.clankup.app a third-party one, and
 * WKWebView blocks those. And clerk.browser.js keeps nothing on disk of its
 * own — its only localStorage keys are telemetry — so a cold start had
 * nothing to restore and came up signed out.
 *
 * This is the same answer Clerk's own native SDK gives, done by hand
 * because there is no Clerk SDK for Capacitor. `@clerk/clerk-expo` doesn't
 * use cookies either: it adds `_is_native=1` to every call to Clerk's API,
 * which makes Clerk return the client token in an `authorization` response
 * header instead of setting a cookie, and it keeps that token in the
 * phone's own storage, sending it back as a bearer token on the next call.
 *
 * The two hooks it does that through are `window.__unstable__onBeforeRequest`
 * and `window.__unstable__onAfterResponse`, and they are read by the plain
 * browser build too (they are picked up in its FAPI client, beside the
 * per-instance listeners). So the whole thing is those two functions and a
 * string in localStorage — no session of our own, no credential we invent,
 * nothing new on the server. The token is Clerk's, and Clerk still decides
 * what it is worth.
 *
 * Must run before Clerk loads: the hooks are read off `window` at request
 * time, but the very first request is the one that fetches the client.
 */
import { isNativeApp } from './native'

const TOKEN_KEY = 'clankup_clerk_client_jwt'

function read(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function write(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage blocked: the session then lasts as long as the app is open,
    // which is where this started.
  }
}

/** What the hooks are handed: Clerk's own request config, mid-build. */
interface ClerkRequestInit {
  url?: URL
  headers?: Headers
  credentials?: RequestCredentials
}

declare global {
  interface Window {
    __unstable__onBeforeRequest?: (req: ClerkRequestInit) => void
    __unstable__onAfterResponse?: (req: ClerkRequestInit, res: Response) => void
  }
}

export function installNativeClerkSession(): void {
  if (!isNativeApp()) return

  window.__unstable__onBeforeRequest = (req) => {
    // No cookies either way, so don't ask for them: asking turns every call
    // into a credentialed cross-origin one for nothing.
    req.credentials = 'omit'
    req.url?.searchParams.append('_is_native', '1')
    req.headers?.set('authorization', read() ?? '')
  }

  window.__unstable__onAfterResponse = (_req, res) => {
    // Clerk returns the current client token on every response in native
    // mode, rotating it as it goes; the last one seen is the one to keep.
    const token = res?.headers?.get('authorization')
    if (token) write(token)
  }
}

/** Clears it on an explicit sign-out, so the next launch really is signed out. */
export function clearNativeClerkSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing stored, nothing to clear.
  }
}
