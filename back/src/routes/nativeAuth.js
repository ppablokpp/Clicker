import { Router } from 'express'
import { clerkClient } from '@clerk/express'

// Sign-in for the native app (mobile-capacitor/).
//
// Inside the app the Google button gets a Google ID token from the system
// (Credential Manager on Android), not from a browser OAuth dance. Clerk's
// Frontend API won't take that token from a web client: its `google_one_tap`
// strategy only accepts tokens whose authorized party (`azp`) is the Web
// client itself, and a token minted for an Android app carries the Android
// client there — so it answers 403 whatever the origin. The strategy the
// native SDKs use for exactly this (`oauth_token_google`) is closed to
// browser clients.
//
// So the exchange happens here, server-side, where nothing is closed: the
// app hands us the ID token, we verify it with Google ourselves (signature,
// audience, party, verified email), find or create the Clerk user for that
// email, and mint a Clerk *sign-in token* for them. The app redeems that
// with Clerk's `ticket` strategy, which works from any origin, and ends up
// with an ordinary Clerk session — the same one the web gives.
//
// A user created here has no Google "external account" in Clerk; when they
// later sign in with Google on the web, Clerk links that Google account to
// this user by the verified email, as it does for any existing user.

const WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID
// Every OAuth client of ours a token may be minted for: the Web client
// (`aud`) and the native ones that show up as the authorized party.
const KNOWN_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Google's own check of an ID token: signature, expiry, and the claims.
 * We add the audience/party checks ourselves — tokeninfo verifies the
 * token is Google's, not that it is *ours*.
 */
async function verifyGoogleIdToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  // Each refusal says why, with the client ids involved (never the email):
  // a token from a build signed with a key we have not registered shows up
  // here as an unknown azp, and that is the thing to go and register.
  const refuse = (why, extra = '') => {
    console.warn(`Native Google sign-in refused: ${why}${extra ? ' ' + extra : ''}`)
    return null
  }
  if (!res.ok) return refuse(`tokeninfo ${res.status}`)
  const claims = await res.json()
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') return refuse('issuer', claims.iss)
  if (!WEB_CLIENT_ID || claims.aud !== WEB_CLIENT_ID) return refuse('audience', claims.aud)
  if (claims.azp && claims.azp !== WEB_CLIENT_ID && !KNOWN_CLIENT_IDS.includes(claims.azp)) return refuse('unknown azp', claims.azp)
  if (claims.email_verified !== 'true' && claims.email_verified !== true) return refuse('email not verified')
  if (!claims.email) return refuse('no email')
  return claims
}

async function findOrCreateUser(claims) {
  const email = String(claims.email).toLowerCase()
  const { data } = await clerkClient.users.getUserList({ emailAddress: [email], limit: 5 })
  const existing = data.find((u) => u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email))
  if (existing) return existing
  return clerkClient.users.createUser({
    emailAddress: [email],
    firstName: claims.given_name || undefined,
    lastName: claims.family_name || undefined,
    skipPasswordRequirement: true,
  })
}

export const nativeAuthRouter = Router()

// POST /api/native-auth/google  { idToken } → { ticket }
nativeAuthRouter.post('/google', async (req, res) => {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : null
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' })
  if (!WEB_CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_WEB_CLIENT_ID is not set' })
  try {
    const claims = await verifyGoogleIdToken(idToken)
    if (!claims) return res.status(401).json({ error: 'Invalid Google token' })
    const user = await findOrCreateUser(claims)
    // Short-lived: it is redeemed within seconds, by the app that asked.
    const token = await clerkClient.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 120 })
    res.json({ ticket: token.token })
  } catch (err) {
    console.error('Native Google sign-in failed', err)
    res.status(500).json({ error: 'Native sign-in failed' })
  }
})
