import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardSort } from '../services/leaderboardApi'

export type { LeaderboardSort, LeaderboardEntry }

const REFRESH_INTERVAL_MS = 5000

// Ported from front/src/hooks/useLeaderboard.ts exactly — same 5s poll.
export function useLeaderboard(sortBy: LeaderboardSort = 'clicks') {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const load = async () => {
      try {
        const data = await fetchLeaderboard(sortBy)
        if (!cancelled && data) setLeaderboard(data)
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
