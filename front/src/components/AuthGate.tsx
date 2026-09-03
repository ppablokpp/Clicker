import type { ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { LoadingScreen } from './LoadingScreen'
import { useAssignUsername } from '../hooks/useAssignUsername'
import { useLinkAccount } from '../hooks/useLinkAccount'
import { useAnonInit } from '../hooks/useAnonInit'

// The app is fully playable signed out — real, server-persisted progress,
// not just browsing (see useAppAuth.ts) — so this gate exists only to hold
// rendering across the brief windows where the app genuinely doesn't yet
// know *whose* progress to load: Clerk still resolving the session, a
// guest's row not created yet, or a just-signed-in account whose guest
// progress hasn't been resolved into it.
//
// Each branch has to finish before the children mount, because every
// context fetches on mount keyed by whatever identity it sees then, and
// those fetches don't re-run on their own afterwards.
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  return isSignedIn ? <SignedInApp>{children}</SignedInApp> : <SignedOutApp>{children}</SignedOutApp>
}

function SignedInApp({ children }: { children: ReactNode }) {
  useAssignUsername()
  // Owns the post-sign-in /sync as well as the guest-progress claim (see
  // useLinkAccount) — there's deliberately no separate useSyncUser call
  // here any more, which would only have fired a second, redundant /sync
  // racing this one.
  const linked = useLinkAccount()
  if (!linked) return <LoadingScreen />
  return <>{children}</>
}

function SignedOutApp({ children }: { children: ReactNode }) {
  const ready = useAnonInit()
  if (!ready) return <LoadingScreen />
  return <>{children}</>
}
