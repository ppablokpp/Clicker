import type { ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { LoadingScreen } from './LoadingScreen'
import { useSyncUser } from '../hooks/useSyncUser'
import { useAssignUsername } from '../hooks/useAssignUsername'

// The app itself is browsable signed out — this only blocks rendering while
// Clerk is still figuring out the session, and syncs the Clerk profile into
// our DB once it turns out there is one.
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  return isSignedIn ? <SignedInApp>{children}</SignedInApp> : <>{children}</>
}

function SignedInApp({ children }: { children: ReactNode }) {
  useSyncUser()
  useAssignUsername()
  return <>{children}</>
}
