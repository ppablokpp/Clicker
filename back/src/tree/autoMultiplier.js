/**
 * Sobrecarga — Multiplicador's other child. Unlike every other node, this
 * one isn't a formula: buying a level multiplies auto-click's *current*
 * production by AUTO_MULTIPLIER_FACTOR right then, and that boost is
 * permanently baked into the running total (see treeRepository's
 * `production` column on the auto_click node). Later auto-click levels
 * only ever add their flat per-level amount on top — they don't get
 * multiplied again by a Sobrecarga bought earlier. That makes production
 * order-dependent, which is why it's stored as running state instead of
 * being derived from levels the way every other node's stats are.
 *
 * Finite (capped at level 10): each level compounds on top of the last
 * (×1.5 on whatever ×1.5s already landed), so by the final purchasable
 * level the cumulative effect is already ×1.5^9 ≈ ×38.4 — a real cap is
 * what keeps that from running away entirely.
 */
export const AUTO_MULTIPLIER_NODE_ID = 'auto_multiplier'
export const AUTO_MULTIPLIER_MAX_LEVEL = 10
export const AUTO_MULTIPLIER_FACTOR = 1.5
export const AUTO_MULTIPLIER_BASE_COST = 4_000
export const AUTO_MULTIPLIER_COST_RATIO = 2

export function autoMultiplierCost(level) {
  if (level >= AUTO_MULTIPLIER_MAX_LEVEL) return null
  return Math.ceil(AUTO_MULTIPLIER_BASE_COST * AUTO_MULTIPLIER_COST_RATIO ** level)
}
