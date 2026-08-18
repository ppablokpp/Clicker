import type { ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { SignInScreen } from './SignInScreen'
import { LoadingScreen } from './LoadingScreen'
import { useSyncUser } from '../hooks/useSyncUser'

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (!isSignedIn) {
    return <SignInScreen />
  }

  return <SignedInApp>{children}</SignedInApp>
}

function SignedInApp({ children }: { children: ReactNode }) {
  useSyncUser()
  return <>{children}</>
}
