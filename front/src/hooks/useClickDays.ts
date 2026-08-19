import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Every day the user has ever clicked at least once, as 'YYYY-MM-DD'
// strings — powers the stats-page calendar strip.
export function useClickDays() {
  const { userId, getToken } = useAuth()
  const [clickDays, setClickDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me/click-days`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (Array.isArray(data.clickDays)) setClickDays(new Set(data.clickDays))
        }
      } catch (err) {
        console.error('No se pudieron cargar los días de actividad', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  return { clickDays }
}
