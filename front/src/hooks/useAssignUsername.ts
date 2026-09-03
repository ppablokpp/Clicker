import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
// Clerk's own instance settings (Configure → Email, Phone, Username):
// minimum 4 characters, no extended/accented characters, no purely numeric
// usernames. Its own maximum is 64 — capped tighter here at 20 (mirrored in
// back/src/routes/users.js) since a name that long doesn't fit anywhere
// it's actually shown.
const MIN_USERNAME_LENGTH = 4
const MAX_USERNAME_LENGTH = 20
const MAX_ATTEMPTS = 5

// Gmail ignores dots in the local part and treats "+tag" as an alias
// suffix, so "john.doe+test@gmail.com" and "johndoe@gmail.com" are the same
// inbox — stripping both means they don't produce two different-looking
// usernames. Clerk's own username charset (with "extended characters" off)
// is alphanumeric + underscore only, so anything else (accents, other
// symbols some providers allow through) is dropped rather than sent and
// rejected. A purely-numeric result gets a letter prefix — Clerk rejects
// numeric-only usernames outright, and since the suffix appended below is
// itself digits, a numeric base would still be numeric-only even after that.
function sanitize(localPart: string): string {
  const cleaned = localPart
    .split('+')[0]
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
  return /^\d+$/.test(cleaned) ? `u${cleaned}` : cleaned
}

// 3-4 digits, per spec — this only disambiguates a display name, nothing
// security-sensitive, so Math.random() is fine.
function randomSuffix(): string {
  const digits = Math.random() < 0.5 ? 3 : 4
  const max = 10 ** digits
  return String(Math.floor(Math.random() * max)).padStart(digits, '0')
}

// Fits `base` + `suffix` inside MAX_USERNAME_LENGTH by trimming the base
// first — the suffix is what makes a retry actually different, so it's the
// part that must never get cut.
function buildCandidate(base: string, suffix: string): string {
  if (!suffix) return base.slice(0, MAX_USERNAME_LENGTH)
  return `${base.slice(0, MAX_USERNAME_LENGTH - suffix.length)}${suffix}`
}

/**
 * Google sign-in never sets a Clerk username on its own — Clerk only fills
 * in email/name/avatar from the Google profile, and Google is the only
 * sign-in strategy this app offers (see SignInModal.tsx). So "no username
 * yet" here always means either a brand-new sign-up or a pre-existing
 * account from before this hook existed; both get the same one-time fix.
 *
 * Runs once per session (guarded by attemptedFor, same pattern useSyncUser
 * uses): picks the Gmail local-part as the base username, retries with a
 * random digit suffix on a genuine "taken" conflict, and gives up silently
 * on anything else (Profile.tsx's own save flow has the same fallback
 * reasoning for the same class of failure).
 *
 * Goes through our own backend (PATCH /api/users/me/username) rather than
 * the client-side `user.update({ username })` — Clerk gates that call
 * behind "reverification" (a fresh proof of identity beyond just holding a
 * session) once a session isn't brand-new, which for a Google-only account
 * means an emailed code with no way to supply it from an unattended
 * background effect. The backend route makes the same change through
 * Clerk's admin API, which reverification never applies to, and already
 * mirrors it into our own `users` table in the same request — no separate
 * /sync call needed afterward.
 */
export function useAssignUsername() {
  const { userId, getToken } = useAuth()
  const { user, isLoaded } = useUser()
  const attemptedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user || !userId) return
    if (user.username) return
    if (attemptedFor.current === userId) return
    const email = user.primaryEmailAddress?.emailAddress
    if (!email) return
    attemptedFor.current = userId

    const base = sanitize(email.split('@')[0])
    if (!base) return // nothing usable survived sanitization — bail rather than submit an empty username

    let cancelled = false
    ;(async () => {
      // Below Clerk's minimum, always suffix rather than trying the bare
      // (too-short) base first and burning an attempt on a guaranteed error.
      let candidate = base.length >= MIN_USERNAME_LENGTH ? buildCandidate(base, '') : buildCandidate(base, randomSuffix())
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (cancelled) return
        try {
          const token = await getToken()
          const res = await fetch(`${API_URL}/api/users/me/username`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ username: candidate }),
          })
          if (res.ok) {
            // Refreshes the browser's own cached Clerk user so `user.username`
            // reflects the new value immediately wherever it's displayed,
            // instead of waiting for Clerk's own next background refetch.
            if (!cancelled) await user.reload()
            return
          }
          if (res.status !== 409) {
            // Some other failure (bad format despite sanitization, or a
            // genuine server error) — not retried forever over something a
            // new suffix can't fix.
            console.error('No se pudo asignar username automático', res.status)
            return
          }
        } catch (err) {
          console.error('No se pudo asignar username automático', err)
          return
        }
        candidate = buildCandidate(base, randomSuffix())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoaded, user, userId, getToken])
}
