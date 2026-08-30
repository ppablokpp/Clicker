/**
 * Modo Legendario's third child (Umbral) — lowers the click speed (t/s)
 * needed to actually trigger Legendary heat once Modo Legendario itself is
 * bought (see legendaryUnlock.js and Home.tsx's HEAT_LEVELS, whose
 * 'legendary' entry reads this instead of a fixed 30). Finite like its two
 * siblings: only 10 levels, 30 down to a 20 t/s floor.
 */
export const LEGENDARY_THRESHOLD_NODE_ID = 'legendary_threshold'
export const LEGENDARY_THRESHOLD_MAX_LEVEL = 10

export const LEGENDARY_THRESHOLD_BASE_TPS = 30
export const LEGENDARY_THRESHOLD_STEP_TPS = 1
export const LEGENDARY_THRESHOLD_FLOOR_TPS = 20

export const LEGENDARY_THRESHOLD_BASE_COST = 50_000
export const LEGENDARY_THRESHOLD_COST_RATIO = 1.7

export function legendaryThresholdCost(level) {
  if (level >= LEGENDARY_THRESHOLD_MAX_LEVEL) return null
  return Math.ceil(LEGENDARY_THRESHOLD_BASE_COST * LEGENDARY_THRESHOLD_COST_RATIO ** level)
}

export function legendaryThresholdTps(level) {
  return Math.max(LEGENDARY_THRESHOLD_FLOOR_TPS, LEGENDARY_THRESHOLD_BASE_TPS - LEGENDARY_THRESHOLD_STEP_TPS * level)
}
