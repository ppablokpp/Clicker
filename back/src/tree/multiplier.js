/**
 * The base click value — unlike Suerte (a probabilistic 1% roll), this
 * guarantees more value on every single click, so it's priced steeper than
 * Suerte's curve even though it's the same shape: linear value growth
 * (+0.5/level, same step as autoClickCps) against exponential cost growth.
 * Infinite, no cap.
 */
export const MULTIPLIER_NODE_ID = 'click_multiplier'
export const MULTIPLIER_STEP = 0.5
export const MULTIPLIER_BASE_COST = 1_500
export const MULTIPLIER_COST_RATIO = 1.45

export function multiplierCost(level) {
  return Math.ceil(MULTIPLIER_BASE_COST * MULTIPLIER_COST_RATIO ** level)
}

export function multiplierValue(level) {
  return 1 + MULTIPLIER_STEP * level
}
