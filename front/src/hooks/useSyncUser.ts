import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/** Mirrors the signed-in Clerk user into our own `users` table, once per session. */
export function useSyncUser() {
  const { isSignedIn, userId, getToken } = useAuth()
  const syncedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId || syncedFor.current === userId) return

    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) syncedFor.current = userId
      } catch (err) {
        console.error('No se pudo sincronizar el usuario', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isSignedIn, userId, getToken])
}
