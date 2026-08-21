/**
 * The tree's first real node: a repeatable auto-clicker. Every level adds a
 * flat amount of clicks-per-second that accrue on their own (see
 * treeRepository.accrue) — classic idle-game shape: the per-level output
 * stays constant, only the price climbs, so the curve is cheap and fast at
 * first and increasingly punishing later. Kept as plain exported numbers
 * (not a catalog array, unlike the powerup/magnet modules) since it's the
 * only real production node for now — expect this file to grow into a
 * proper per-node config once more tree nodes stop being placeholders.
 */
export const AUTOCLICK_NODE_ID = 'auto_click'

export const AUTOCLICK_BASE_COST = 300
export const AUTOCLICK_COST_RATIO = 1.15
export const AUTOCLICK_CPS_PER_LEVEL = 0.5

// Cost to go from `level` owned to `level + 1`.
export function autoClickCost(level) {
  return Math.ceil(AUTOCLICK_BASE_COST * AUTOCLICK_COST_RATIO ** level)
}

export function autoClickCps(level) {
  return level * AUTOCLICK_CPS_PER_LEVEL
}
