import { useUser } from '@clerk/clerk-react'

/** Display name for the signed-in Clerk user. Renaming happens via Clerk's own account UI (UserButton). */
export function usePlayer() {
  const { user } = useUser()

  const name =
    user?.username ??
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress.split('@')[0] ??
    'Jugador'

  return { name }
}
