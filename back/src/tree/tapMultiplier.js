/**
 * Amplificador — Productividad's third direct child, a genuine ×multiplier
 * stacked on top of Potencia's own base.
 *
 * Seven levels, +1 each: ×2 at level 1 through ×8 at level 7, with the price
 * doubling between them. It briefly ran as three straight doublings (×2, ×4,
 * ×8 at ratio 6) and landed on the same ×8 at the top, but got there in three
 * lurches — each purchase was a huge jump and there was almost nothing to buy.
 * Seven gentler steps give the node a real ladder to climb while ending in
 * exactly the same place, so nothing downstream of the maxed value changes.
 */
export const TAP_MULTIPLIER_NODE_ID = 'tap_multiplier'
export const TAP_MULTIPLIER_MAX_LEVEL = 7
export const TAP_MULTIPLIER_STEP = 1
export const TAP_MULTIPLIER_BASE_COST = 25_000
export const TAP_MULTIPLIER_COST_RATIO = 2

export function tapMultiplierCost(level) {
  if (level >= TAP_MULTIPLIER_MAX_LEVEL) return null
  return Math.ceil(TAP_MULTIPLIER_BASE_COST * TAP_MULTIPLIER_COST_RATIO ** level)
}

export function tapMultiplierValue(level) {
  return 1 + TAP_MULTIPLIER_STEP * level
}
