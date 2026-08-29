/**
 * The base click value (Potencia) — unlike Suerte (a probabilistic 1%
 * roll), this guarantees more value on every single click, so it's priced
 * steeper. Finite: 9 levels, +1/level starting from 1, capping out at an
 * even ×10 base power per click.
 */
export const MULTIPLIER_NODE_ID = 'click_multiplier'
export const MULTIPLIER_MAX_LEVEL = 9
export const MULTIPLIER_STEP = 1
export const MULTIPLIER_BASE_COST = 1_500
export const MULTIPLIER_COST_RATIO = 2

export function multiplierCost(level) {
  if (level >= MULTIPLIER_MAX_LEVEL) return null
  return Math.ceil(MULTIPLIER_BASE_COST * MULTIPLIER_COST_RATIO ** level)
}

export function multiplierValue(level) {
  return 1 + MULTIPLIER_STEP * level
}
