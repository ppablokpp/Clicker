/**
 * Sobrecarga — Multiplicador's other child, applying its guaranteed-
 * multiplier idea to Autoclick's production instead of the manual tap —
 * priced much harder since it directly multiplies a passive income
 * stream. A pure formula like every other node: order doesn't matter,
 * buying Autoclick and Sobrecarga in either order lands at the same total.
 * Infinite, no cap.
 */
export const AUTO_MULTIPLIER_NODE_ID = 'auto_multiplier'
export const AUTO_MULTIPLIER_STEP = 0.5
export const AUTO_MULTIPLIER_BASE_COST = 2_000
export const AUTO_MULTIPLIER_COST_RATIO = 1.5

export function autoMultiplierCost(level) {
  return Math.ceil(AUTO_MULTIPLIER_BASE_COST * AUTO_MULTIPLIER_COST_RATIO ** level)
}

export function autoMultiplierValue(level) {
  return 1 + AUTO_MULTIPLIER_STEP * level
}
