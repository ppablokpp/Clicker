import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REFRESH_INTERVAL_MS = 5000

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatarUrl: string | null
  totalClicks: number
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard`)
        if (!cancelled && res.ok) {
          setLeaderboard(await res.json())
        }
      } catch (err) {
        console.error('No se pudo cargar la clasificación', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { leaderboard, isLoading }
}
