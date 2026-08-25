import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REFRESH_INTERVAL_MS = 5000

export type LeaderboardSort = 'clicks' | 'cps'

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatarUrl: string | null
  lifetimePlatino: number
  bestCps: number
}

export function useLeaderboard(sortBy: LeaderboardSort = 'clicks') {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?sortBy=${sortBy}`)
        if (!cancelled && res.ok) {
          const data: LeaderboardEntry[] = await res.json()
          // lifetime_platino can carry a fractional remainder server-side
          // (see click-value multipliers) — never shown as a decimal here.
          setLeaderboard(data.map((entry) => ({ ...entry, lifetimePlatino: Math.floor(entry.lifetimePlatino) })))
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
  }, [sortBy])

  return { leaderboard, isLoading }
}
