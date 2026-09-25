import { Router } from 'express'
import { createPublicKey, verify as verifySignature } from 'node:crypto'
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

// ── Apple ────────────────────────────────────────────────────────────────
//
// Same exchange, different issuer. Apple's identity token is a plain JWT
// signed with one of the keys it publishes, so there is no tokeninfo
// endpoint to ask: we verify the signature ourselves against those keys
// (Node's own crypto reads a JWK directly, so this needs no library) and
// then check the claims.
//
// The audience differs by platform, which is why it is a list: a token from
// the iPhone's own Sign in with Apple names the app's bundle id, while one
// from the web flow names the Services ID. Both are ours.
//
// Two things Apple does that Google does not: it gives the name only on the
// very first authorization (never again), and it lets the user hide their
// address behind a `@privaterelay.appleid.com` relay. Both are fine here —
// we only need a verified email to key the Clerk user on.

const APPLE_CLIENT_IDS = (process.env.APPLE_CLIENT_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'
let appleKeys = { at: 0, byKid: new Map() }

/** Apple's signing keys, kept for an hour — they rotate, but rarely. */
async function appleSigningKey(kid) {
  if (Date.now() - appleKeys.at > 3_600_000 || !appleKeys.byKid.has(kid)) {
    const res = await fetch(APPLE_KEYS_URL)
    if (!res.ok) throw new Error(`Apple keys ${res.status}`)
    const { keys } = await res.json()
    appleKeys = { at: Date.now(), byKid: new Map(keys.map((k) => [k.kid, k])) }
  }
  return appleKeys.byKid.get(kid) ?? null
}

const b64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

/**
 * Apple's identity token, checked the way Apple documents it: our key, our
 * audience, their issuer, not expired, and an email they vouch for.
 */
async function verifyAppleIdToken(idToken) {
  const refuse = (why, extra = '') => {
    console.warn(`Native Apple sign-in refused: ${why}${extra ? ' ' + extra : ''}`)
    return null
  }
  const [headerB64, payloadB64, signatureB64] = String(idToken).split('.')
  if (!headerB64 || !payloadB64 || !signatureB64) return refuse('malformed token')
  const header = JSON.parse(b64url(headerB64).toString('utf8'))
  if (header.alg !== 'RS256') return refuse('alg', header.alg)
  const jwk = await appleSigningKey(header.kid)
  if (!jwk) return refuse('unknown kid', header.kid)

  const key = createPublicKey({ key: jwk, format: 'jwk' })
  const ok = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${headerB64}.${payloadB64}`),
    key,
    b64url(signatureB64),
  )
  if (!ok) return refuse('bad signature')

  const claims = JSON.parse(b64url(payloadB64).toString('utf8'))
  if (claims.iss !== 'https://appleid.apple.com') return refuse('issuer', claims.iss)
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audiences.some((a) => APPLE_CLIENT_IDS.includes(a))) return refuse('audience', audiences.join('|'))
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) return refuse('expired')
  if (claims.email_verified !== true && claims.email_verified !== 'true') return refuse('email not verified')
  if (!claims.email) return refuse('no email')
  return claims
}

// POST /api/native-auth/apple  { idToken, givenName?, familyName? } → { ticket }
nativeAuthRouter.post('/apple', async (req, res) => {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : null
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' })
  if (APPLE_CLIENT_IDS.length === 0) return res.status(500).json({ error: 'APPLE_CLIENT_IDS is not set' })
  try {
    const claims = await verifyAppleIdToken(idToken)
    if (!claims) return res.status(401).json({ error: 'Invalid Apple token' })
    // The name comes beside the token, not inside it, and only the first
    // time they ever authorize — so take it when it is offered.
    const user = await findOrCreateUser({
      email: claims.email,
      given_name: typeof req.body?.givenName === 'string' ? req.body.givenName : undefined,
      family_name: typeof req.body?.familyName === 'string' ? req.body.familyName : undefined,
    })
    const token = await clerkClient.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 120 })
    res.json({ ticket: token.token })
  } catch (err) {
    console.error('Native Apple sign-in failed', err)
    res.status(500).json({ error: 'Native sign-in failed' })
  }
})
