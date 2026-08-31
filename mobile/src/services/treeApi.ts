const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

// Mirrors front/src/context/TreeContext.tsx's own TreeState exactly — same
// GET /api/tree/me endpoint, same field names, same 19 POST .../buy
// endpoints, so the two clients can't silently drift apart.
export interface TreeStateResponse {
  autoClickLevel: number
  autoClickCps: number
  autoClickNextCost: number | null
  autoClickNextCps: number
  luckLevel: number
  luckChance: number
  luckMultiplier: number
  luckNextCost: number | null
  luckChanceLevel: number
  luckChanceNextCost: number | null
  scoutDroneLevel: number
  scoutDroneNextCost: number | null
  scoutDroneRate: number
  scoutDroneCps: number
  scoutFrequencyLevel: number
  scoutFrequencyNextCost: number | null
  multiplierLevel: number
  multiplierValue: number
  multiplierNextValue: number
  multiplierNextCost: number | null
  legendaryUnlockLevel: number
  legendaryUnlockNextCost: number | null
  legendaryEaseLevel: number
  legendaryStreakBase: number
  legendaryEaseNextCost: number | null
  legendaryGrowthLevel: number
  legendaryBonusStep: number
  legendaryGrowthNextCost: number | null
  legendaryThresholdLevel: number
  legendaryThresholdTps: number
  legendaryThresholdNextCost: number | null
  autoMultiplierLevel: number
  autoMultiplierValue: number
  autoMultiplierNextValue: number
  autoMultiplierNextCost: number | null
  tapMultiplierLevel: number
  tapMultiplierValue: number
  tapMultiplierNextCost: number | null
  multiShotLevel: number
  multiShotValue: number
  multiShotNextCost: number | null
  anomalyUnlockLevel: number
  anomalyUnlockNextCost: number | null
  anomalyRewardLevel: number
  anomalyRewardValue: number
  anomalyRewardNextCost: number | null
  anomalyFrequencyLevel: number
  anomalyFrequencySeconds: number
  anomalyFrequencyNextCost: number | null
  offlineProductionLevel: number
  offlineProductionValue: number
  offlineProductionNextCost: number | null
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

export interface BuyResult {
  ok: boolean
  error?: string
  data: Partial<TreeStateResponse>
}

// Every one of the 19 nodes' buy endpoints shares this exact shape — plain
// POST, bearer token, no body — so one generic function drives all of them
// instead of 19 near-identical copies.
async function postTreeAction(token: string | null, path: string): Promise<BuyResult> {
  const res = await fetch(`${API_URL}/api/tree/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error, data: {} }
  return { ok: true, data }
}

export const TREE_BUY_ENDPOINTS = {
  autoClick: 'auto-click/buy',
  autoClickTutorialGrant: 'auto-click/tutorial-grant',
  luck: 'luck/buy',
  luckChance: 'luck-chance/buy',
  multiplier: 'multiplier/buy',
  legendaryUnlock: 'legendary-unlock/buy',
  legendaryEase: 'legendary-ease/buy',
  legendaryGrowth: 'legendary-growth/buy',
  legendaryThreshold: 'legendary-threshold/buy',
  scoutDrone: 'scout-drone/buy',
  scoutFrequency: 'scout-frequency/buy',
  autoMultiplier: 'auto-multiplier/buy',
  tapMultiplier: 'tap-multiplier/buy',
  multiShot: 'multi-shot/buy',
  anomalyUnlock: 'anomaly-unlock/buy',
  anomalyReward: 'anomaly-reward/buy',
  anomalyFrequency: 'anomaly-frequency/buy',
  offlineProduction: 'offline-production/buy',
} as const

export type TreeBuyKey = keyof typeof TREE_BUY_ENDPOINTS

export function buyTreeNode(token: string | null, key: TreeBuyKey): Promise<BuyResult> {
  return postTreeAction(token, TREE_BUY_ENDPOINTS[key])
}
