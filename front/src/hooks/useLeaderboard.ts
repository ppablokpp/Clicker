import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export type LeaderboardSort = 'clicks' | 'cps'

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatarUrl: string | null
  lifetimePlatino: number
  bestCps: number
  /** Their equipped cosmetics; null for anyone who never customized. */
  astronautStyle: unknown
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

    // Fetched once per mount/sort change — no background polling. The
    // ranking doesn't need to update itself while sitting open; switching
    // to the "clicks"/"cps" tab (a genuine re-render of this screen) is
    // already what refreshes it in practice.
    load()
    return () => {
      cancelled = true
    }
  }, [sortBy])

  return { leaderboard, isLoading }
}
