import type { ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { SignInScreen } from './SignInScreen'
import { useSyncUser } from '../hooks/useSyncUser'

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <div className="h-[100dvh] w-full bg-[#08080c]" />
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
