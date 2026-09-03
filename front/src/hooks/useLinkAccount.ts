import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { peekAnonId, clearAnonId } from '../lib/anonId'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Runs once per real sign-in, before the rest of the app is allowed to
 * render (see AuthGate.tsx) — folds whatever this browser did as a guest
 * into the account that just signed in, per
 * usersRepository.claimAnonymousProgress's policy: adopt only if the
 * account is genuinely fresh, never touch one that already has progress
 * of its own. Blocking render on this, the same way AuthGate already
 * blocks on Clerk's own `isLoaded`, is what stops every context from
 * fetching the account's *pre-claim* state and flashing "0 progress" for
 * a moment before the merge lands and everything refetches.
 *
 * A declined claim is not a discard: the guest save stays exactly as it
 * was and stays reachable from this browser, so signing out resumes it
 * (see the `data.claimed` check below).
 *
 * Always calls /sync first — the claim endpoint needs the Clerk row to
 * already exist to compare against, and /sync is also what mirrors the
 * fresh Clerk profile (name, email, avatar) into our own table. This hook
 * is the single owner of that post-sign-in sync now; the separate
 * useSyncUser hook that used to fire its own was removed rather than left
 * to race this one.
 *
 * Returns whether the account currently signed in has been resolved.
 * Tracking that as "which user id is done" rather than a plain boolean is
 * what makes switching accounts correct — the gate closes again for the
 * new id instead of staying open on the previous one's result.
 *
 * The in-flight work is cached in a ref and every run of the effect
 * subscribes to it (see useAnonInit for the same pattern and the
 * StrictMode double-invoke it exists to survive).
 *
 * Fails open: any error along the way still marks the id resolved, so a
 * network hiccup can never strand the player on a loading screen — worst
 * case a guest session's progress just didn't get linked.
 */
export function useLinkAccount(): boolean {
  const { userId, getToken } = useAuth()
  const [linkedFor, setLinkedFor] = useState<string | null>(null)
  const requestRef = useRef<{ userId: string; promise: Promise<void> } | null>(null)

  useEffect(() => {
    if (!userId) return

    if (requestRef.current?.userId !== userId) {
      requestRef.current = {
        userId,
        promise: (async () => {
          const token = await getToken()
          await fetch(`${API_URL}/api/users/sync`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })

          const anonId = peekAnonId()
          if (!anonId) return
          const res = await fetch(`${API_URL}/api/users/claim-anonymous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ anonId }),
          })
          if (!res.ok) return
          const data: { claimed?: boolean } = await res.json().catch(() => ({}))
          // Drop the guest id ONLY once its progress has actually moved
          // into this account — at which point the guest row is gone and
          // the id refers to nothing.
          //
          // When the claim is declined (the account already had progress
          // of its own, so the backend deliberately leaves both sides
          // alone), the guest save is still fully intact and still belongs
          // to this browser. Keeping the id is what lets signing out
          // resume it exactly where it was. Clearing it here — which is
          // what this used to do — silently stranded that save behind a
          // freshly minted id nobody could ever reach again.
          if (data.claimed) clearAnonId()
        })().catch((err) => {
          console.error('No se pudo vincular el progreso de invitado', err)
        }),
      }
    }

    let cancelled = false
    void requestRef.current.promise.then(() => {
      if (!cancelled) setLinkedFor(userId)
    })
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  return linkedFor !== null && linkedFor === userId
}
