import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export type LeaderboardSort = 'clicks' | 'cps'

/** How often the open ranking re-reads itself. Long enough not to be chatty,
 *  short enough that overtaking someone is something you can sit and watch. */
const REFRESH_MS = 15_000

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatarUrl: string | null
  lifetimePlatino: number
  bestCps: number
  /** Their equipped cosmetics; null for anyone who never customized. */
  astronautStyle: unknown
}

/**
 * @param live Keep re-reading the ranking while it's on screen. Off by
 *   default, and on only for the ranking screen itself: the neighbourhood card
 *   on the profile reads the same endpoint, and it's a static summary nobody
 *   sits and watches, so polling for it would be traffic buying nothing.
 */
export function useLeaderboard(sortBy: LeaderboardSort = 'clicks', live = false) {
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

    if (!live) {
      return () => {
        cancelled = true
      }
    }

    // Then kept fresh in the background, which is what makes the reorder
    // animation in Leaderboard.tsx a real thing rather than a tab-switch
    // effect: without this the order literally cannot change while you're
    // looking at it, so nothing would ever have anywhere to slide to.
    //
    // Deliberately cheap about it. The refetch is skipped entirely while the
    // tab is in the background — nobody is watching a hidden ranking shuffle,
    // and a phone left on this screen overnight would otherwise fire a
    // request every 15s until the battery died. Coming back to the tab
    // refreshes immediately, since whatever interval fired while hidden was
    // skipped and the data on screen is by then as old as the trip away.
    const refresh = () => {
      if (document.visibilityState === 'visible') void load()
    }
    const timer = window.setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [sortBy, live])

  return { leaderboard, isLoading }
}
