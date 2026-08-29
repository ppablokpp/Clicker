/**
 * Amplificador — Productividad's third direct child, a genuine ×multiplier
 * stacked on top of Potencia's own additive base (see multiplier.js)
 * instead of another flat add — since it multiplies the *result* of that
 * other node, it's deliberately priced far above it: level 1 alone already
 * costs roughly what Potencia's last couple levels do. Finite and steep —
 * only 5 levels (×2 through ×6), ratio 2.0 between them.
 */
export const TAP_MULTIPLIER_NODE_ID = 'tap_multiplier'
export const TAP_MULTIPLIER_MAX_LEVEL = 5
export const TAP_MULTIPLIER_STEP = 1
export const TAP_MULTIPLIER_BASE_COST = 50_000
export const TAP_MULTIPLIER_COST_RATIO = 2.0

export function tapMultiplierCost(level) {
  if (level >= TAP_MULTIPLIER_MAX_LEVEL) return null
  return Math.ceil(TAP_MULTIPLIER_BASE_COST * TAP_MULTIPLIER_COST_RATIO ** level)
}

export function tapMultiplierValue(level) {
  return 1 + TAP_MULTIPLIER_STEP * level
}
