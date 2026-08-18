import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface UserStats {
  totalClicks: number
  bestCps: number
  currentStreak: number
  longestStreak: number
}

const EMPTY_STATS: UserStats = { totalClicks: 0, bestCps: 0, currentStreak: 0, longestStreak: 0 }

export function useUserStats() {
  const { userId, getToken } = useAuth()
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setStats({
            totalClicks: data.totalClicks,
            bestCps: data.bestCps,
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
          })
        }
      } catch (err) {
        console.error('No se pudieron cargar tus estadísticas', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  return { stats, isLoading }
}
