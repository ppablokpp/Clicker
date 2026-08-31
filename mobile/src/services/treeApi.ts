const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

// Mirrors front/src/context/TreeContext.tsx's own TreeState — same
// GET /api/tree/me endpoint, same field names, so the two clients can't
// silently drift apart. Only the read side is ported here (see
// TreeContext.tsx's own comment for why): the 19 POST .../buy endpoints
// back the full Tree canvas, which is its own, much larger, deliberately
// last phase of the mobile port.
export interface TreeStateResponse {
  autoClickLevel: number
  autoClickCps: number
  luckChance: number
  luckMultiplier: number
  scoutDroneLevel: number
  scoutDroneRate: number
  scoutDroneCps: number
  multiplierValue: number
  autoMultiplierValue: number
  tapMultiplierValue: number
  multiShotValue: number
  offlineProductionValue: number
  totalClicks?: number
  objectsBroken?: number
  objectProgress?: number
  creditedThisCall?: number
}

export async function fetchTreeState(token: string | null): Promise<TreeStateResponse | null> {
  const res = await fetch(`${API_URL}/api/tree/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}
