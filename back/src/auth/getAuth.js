import { getAuth as clerkGetAuth } from '@clerk/express'

// Guests get a `anon_<uuid>` id generated and persisted client-side (see
// front/src/lib/anonId.ts), sent as a plain bearer token instead of a real
// Clerk session JWT — there's no password/email behind it, so it isn't a
// security credential, just a stable "this browser" handle. Anchored with
// ^/$ and matched against the *whole* token (not just a prefix) so nothing
// else can accidentally collide with or spoof this shape.
export const ANON_ID_RE = /^anon_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isAnonId(id) {
  return typeof id === 'string' && ANON_ID_RE.test(id)
}

// Drop-in replacement for @clerk/express's getAuth with the exact same
// `{ userId }` shape every route already destructures — swapping a route
// from `import { getAuth } from '@clerk/express'` to importing this instead
// is the entire change needed to make it guest-capable; nothing below a
// route's own `const { userId } = getAuth(req)` line has to change.
//
// A real Clerk session always wins when present, so a browser tab that's
// actually signed in can never accidentally read/write as its own
// leftover guest id. Only routes that are inherently guest-safe (game
// progress) should import this — identity-only routes (profile sync,
// username, battles/leaderboard) deliberately keep importing Clerk's own
// getAuth directly, since a `anon_...` id was never issued by Clerk and
// has no Clerk profile behind it.
export function getAuth(req) {
  const clerkAuth = clerkGetAuth(req)
  if (clerkAuth.userId) return clerkAuth
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (isAnonId(token)) return { userId: token }
  return clerkAuth
}
