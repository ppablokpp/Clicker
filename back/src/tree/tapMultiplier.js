/**
 * Multiplicador — Productividad's third direct child, a genuine ×multiplier
 * stacked on top of Productividad's additive base click value (see
 * multiplier.js) instead of another flat add. Same shape the original
 * "Multiplicador" node always had: linear value growth (+0.5/level)
 * against exponential cost growth. Infinite, no cap.
 */
export const TAP_MULTIPLIER_NODE_ID = 'tap_multiplier'
export const TAP_MULTIPLIER_STEP = 0.5
export const TAP_MULTIPLIER_BASE_COST = 1_500
export const TAP_MULTIPLIER_COST_RATIO = 1.6

export function tapMultiplierCost(level) {
  return Math.ceil(TAP_MULTIPLIER_BASE_COST * TAP_MULTIPLIER_COST_RATIO ** level)
}

export function tapMultiplierValue(level) {
  return 1 + TAP_MULTIPLIER_STEP * level
}
