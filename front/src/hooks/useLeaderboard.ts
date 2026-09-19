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
 * The last ranking read, per tab, kept for the session. Coming back from a
 * player's profile mounts the screen again, and without this it mounted
 * empty behind a loader until the fetch landed: the scroll offset the
 * ScrollManager tries to restore had no document to land on, and the
 * podium re-ran its entrance under a page that was still finding its
 * height. With it, the screen comes back already full and the fetch only
 * freshens it.
 */
const lastRead = new Map<LeaderboardSort, LeaderboardEntry[]>()

/** Whether the ranking for this tab is already in hand, before any fetch. */
export function hasCachedLeaderboard(sortBy: LeaderboardSort): boolean {
  return lastRead.has(sortBy)
}

/**
 * @param live Keep re-reading the ranking while it's on screen. Off by
 *   default, and on only for the ranking screen itself: the neighbourhood card
 *   on the profile reads the same endpoint, and it's a static summary nobody
 *   sits and watches, so polling for it would be traffic buying nothing.
 */
export function useLeaderboard(sortBy: LeaderboardSort = 'clicks', live = false) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => lastRead.get(sortBy) ?? [])
  const [isLoading, setIsLoading] = useState(!lastRead.has(sortBy))

  useEffect(() => {
    let cancelled = false
    const cached = lastRead.get(sortBy)
    if (cached) setLeaderboard(cached)
    setIsLoading(!cached)

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard?sortBy=${sortBy}`)
        if (!cancelled && res.ok) {
          const data: LeaderboardEntry[] = await res.json()
          // lifetime_platino can carry a fractional remainder server-side
          // (see click-value multipliers) — never shown as a decimal here.
          const entries = data.map((entry) => ({ ...entry, lifetimePlatino: Math.floor(entry.lifetimePlatino) }))
          lastRead.set(sortBy, entries)
          setLeaderboard(entries)
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
    // `pageshow` alongside it for the same reason useClickCounter pairs
    // pagehide with visibilitychange: a back/forward-cache restore (swiping
    // back into the app on iOS) can hand the page back without firing
    // visibilitychange. Guarded on `persisted` so a normal load doesn't
    // double up on the initial load() above.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh()
    }
    const timer = window.setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [sortBy, live])

  return { leaderboard, isLoading }
}
