import type { ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useReportReady } from './LoadingGate'
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
// those fetches don't re-run on their own afterwards. That's why this one
// still withholds children rather than merely reporting: unlike the game
// state, an identity that isn't settled yet would send the wrong requests.
//
// It no longer draws its own loading screen. LoadingGateProvider owns the
// single one for the whole startup; each branch below just reports whether
// it's still holding things up, under the shared "identity" key so that
// whichever branch is mounted speaks for the same prerequisite.
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth()
  if (!isLoaded) return <ResolvingSession />
  return <ResolvedSession>{children}</ResolvedSession>
}

/** Clerk hasn't answered yet, so there is no branch to be in. Its own
 *  component purely so the report is an unconditional hook. */
function ResolvingSession() {
  useReportReady('identity', false)
  return null
}

function ResolvedSession({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth()
  return isSignedIn ? <SignedInApp>{children}</SignedInApp> : <SignedOutApp>{children}</SignedOutApp>
}

function SignedInApp({ children }: { children: ReactNode }) {
  useAssignUsername()
  // Owns the post-sign-in /sync as well as the guest-progress claim (see
  // useLinkAccount) — there's deliberately no separate useSyncUser call
  // here any more, which would only have fired a second, redundant /sync
  // racing this one.
  const linked = useLinkAccount()
  useReportReady('identity', linked)
  if (!linked) return null
  return <>{children}</>
}

function SignedOutApp({ children }: { children: ReactNode }) {
  const ready = useAnonInit()
  useReportReady('identity', ready)
  if (!ready) return null
  return <>{children}</>
}
