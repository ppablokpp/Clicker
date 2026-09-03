import { useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getOrCreateAnonId } from '../lib/anonId'

export interface AppAuth {
  userId: string | null
  getToken: () => Promise<string | null>
}

/**
 * Drop-in replacement for Clerk's own `useAuth()`, narrowed to the two
 * things every game-progress caller actually uses (`userId`, `getToken`).
 * With a real Clerk session both come straight from Clerk; without one,
 * `userId` becomes this browser's guest id (see lib/anonId.ts) and
 * `getToken` resolves to that same id, sent as a plain bearer token the
 * backend's wrapped getAuth (back/src/auth/getAuth.js) recognizes as a
 * guest rather than a real Clerk JWT.
 *
 * That's what makes tapping/buying/upgrading work before ever signing in:
 * every context that reads `userId` to decide whether an action is allowed
 * (`if (!userId) { promptSignIn(); return }`) now always has one, real or
 * guest, so those guards simply stop firing for a guest instead of each
 * needing to be rewritten.
 *
 * **The memoization is load-bearing, not a micro-optimization.** Around 30
 * effects and callbacks across the contexts list `getToken` in their
 * dependency arrays. Returning a fresh object (and a fresh `getToken`
 * closure) on every render would therefore invalidate all of them on every
 * render, re-firing every fetch in the app continuously — a request storm
 * against the backend for as long as a guest had the page open. Clerk's own
 * `getToken` is already render-stable, which is why this pattern worked
 * before guests existed; the anon branch has to hold itself to that same
 * bar.
 *
 * Deliberately NOT used everywhere. Anything identity-specific (Profile's
 * edit flow, useLinkAccount, useAssignUsername), gated behind a real
 * account on purpose (Battles, the leaderboard), or that spends real money
 * (the four RevenueCat contexts) keeps importing Clerk's `useAuth`
 * directly — a guest id was never issued by Clerk, has no account behind
 * it, and must never be what a purchase gets attached to.
 */
export function useAppAuth(): AppAuth {
  const { userId: clerkUserId, getToken: clerkGetToken, isLoaded } = useAuth()

  const anonGetToken = useCallback(async () => getOrCreateAnonId(), [])

  return useMemo<AppAuth>(() => {
    if (clerkUserId) return { userId: clerkUserId, getToken: clerkGetToken }
    // Only reachable defensively — AuthGate already blocks rendering until
    // Clerk has resolved, so nothing under it ever sees `!isLoaded`. Worth
    // keeping anyway: minting a guest id during that window would hand one
    // out to someone who turns out to be signed in a moment later.
    if (!isLoaded) return { userId: null, getToken: anonGetToken }
    return { userId: getOrCreateAnonId(), getToken: anonGetToken }
  }, [clerkUserId, clerkGetToken, isLoaded, anonGetToken])
}
