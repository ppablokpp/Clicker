import { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardSort } from '../services/leaderboardApi'

export type { LeaderboardSort, LeaderboardEntry }

// Ported from front/src/hooks/useLeaderboard.ts — fetched once per
// mount/sort change, no background polling. The ranking doesn't need to
// update itself while the screen sits open; navigating to this tab (or
// switching the sort toggle) is already what refreshes it in practice.
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
    return () => {
      cancelled = true
    }
  }, [sortBy])

  return { leaderboard, isLoading }
}
