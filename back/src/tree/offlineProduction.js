/**
 * Autonomía — Sobrecarga's own child (Drones buscadores branch). Raises how
 * much of the fleet's real, online production rate still applies to the
 * time you're actually away (not just idling with the tab open — see
 * treeRepository's ACTIVE_WINDOW_SECONDS, which is what tells those two
 * apart). Level 0 (not owned) is a 1% floor, not 0% — the fleet always
 * limps along a little unsupervised. Each level after that adds a flat 1%,
 * so the ladder reads as a clean 1/2/3/.../10% climb, capping at a tenth of
 * your real rate while away.
 */
export const OFFLINE_PRODUCTION_NODE_ID = 'offline_production'
export const OFFLINE_PRODUCTION_MAX_LEVEL = 9

export const OFFLINE_PRODUCTION_BASE_PCT = 0.01
export const OFFLINE_PRODUCTION_STEP = 0.01
export const OFFLINE_PRODUCTION_BASE_COST = 5_000
export const OFFLINE_PRODUCTION_COST_RATIO = 1.5

// Cost to go from `level` owned to `level + 1`.
export function offlineProductionCost(level) {
  if (level >= OFFLINE_PRODUCTION_MAX_LEVEL) return null
  return Math.ceil(OFFLINE_PRODUCTION_BASE_COST * OFFLINE_PRODUCTION_COST_RATIO ** level)
}

export function offlineProductionValue(level) {
  return OFFLINE_PRODUCTION_BASE_PCT + OFFLINE_PRODUCTION_STEP * level
}
