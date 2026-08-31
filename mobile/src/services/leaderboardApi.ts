const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export type LeaderboardSort = 'clicks' | 'cps'

export interface LeaderboardEntry {
  id: string
  username: string | null
  avatarUrl: string | null
  lifetimePlatino: number
  bestCps: number
}

// Ported from front/src/hooks/useLeaderboard.ts — same public (no auth)
// GET /api/leaderboard?sortBy= endpoint.
export async function fetchLeaderboard(sortBy: LeaderboardSort): Promise<LeaderboardEntry[] | null> {
  const res = await fetch(`${API_URL}/api/leaderboard?sortBy=${sortBy}`)
  if (!res.ok) return null
  const data: LeaderboardEntry[] = await res.json()
  // lifetime_platino can carry a fractional remainder server-side (see
  // click-value multipliers) — never shown as a decimal here.
  return data.map((entry) => ({ ...entry, lifetimePlatino: Math.floor(entry.lifetimePlatino) }))
}
