const STORAGE_KEY = 'clankup_anon_id'

// Same shape the backend's ANON_ID_RE expects (back/src/auth/getAuth.js) —
// kept in sync by hand since it's a plain regex literal on both sides, not
// a shared package.
const ANON_ID_RE = /^anon_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Reads the guest id already in this browser, if any — never creates one.
// The sign-in flow needs exactly this distinction (see useLinkAccount.ts):
// it must know whether *this* browser actually played as a guest before,
// not accidentally manufacture a fresh id right at the moment it's about
// to become irrelevant.
export function peekAnonId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && ANON_ID_RE.test(stored) ? stored : null
  } catch {
    // Private browsing / storage disabled — guest play still has to work,
    // it just won't persist across a reload.
    return null
  }
}

// The stable "this browser" identity for playing without an account —
// created once and reused for as long as it stays signed out. Not a
// security credential (see the backend comment on ANON_ID_RE): nothing
// sensitive is gated behind it, it's just what a guest's progress is
// stored under until they actually sign in.
export function getOrCreateAnonId(): string {
  const existing = peekAnonId()
  if (existing) return existing
  const created = `anon_${crypto.randomUUID()}`
  try {
    localStorage.setItem(STORAGE_KEY, created)
  } catch {
    // Can't persist — still usable for the rest of this page load, a fresh
    // one will just get minted again on the next.
  }
  return created
}

// Called only once a guest's progress has actually been adopted into a
// real account (see useLinkAccount.ts), at which point the guest row is
// deleted server-side and this id refers to nothing.
//
// Deliberately NOT called when a claim is declined because the account
// already had its own progress: that guest save is still intact and still
// this browser's, so the id has to survive for signing out to resume it.
export function clearAnonId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do — worst case a future session creates a fresh id
    // instead of reusing a stale one, which is harmless either way.
  }
}
