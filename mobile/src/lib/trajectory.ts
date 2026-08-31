// Mirrors front/src/pages/Home.tsx's TRAJECTORY_TIER_THRESHOLDS exactly —
// lifetime-platino threshold each material tier unlocks at. Must match
// back/src/game/trajectory.js's own copy (kept in sync by hand).
export const TRAJECTORY_TIER_THRESHOLDS = [
  0, 10_000_000, 1_000_000_000, 100_000_000_000, 10_000_000_000_000, 1_000_000_000_000_000,
]

export interface PrestigeProgress {
  isMaxed: boolean
  readyToPrestige: boolean
  pct: number
}

export function computePrestigeProgress(currentTierIndex: number, lifetimePlatino: number): PrestigeProgress {
  const hasNextTier = currentTierIndex < TRAJECTORY_TIER_THRESHOLDS.length - 1
  const tierFrom = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex]
  const tierTo = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex + 1]
  return {
    isMaxed: !hasNextTier,
    readyToPrestige: hasNextTier && lifetimePlatino >= tierTo,
    pct: tierTo ? Math.min(1, (lifetimePlatino - tierFrom) / (tierTo - tierFrom)) : 1,
  }
}
