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

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — this node's cost no longer scales with prestige tier
// (see scaleCost/tieredMaxLevel in treeRepository.js), each tier just
// unlocks more levels of the same curve.
export function multiplierCost(level, maxLevel = MULTIPLIER_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(MULTIPLIER_BASE_COST * MULTIPLIER_COST_RATIO ** level)
}

export function multiplierValue(level) {
  return 1 + MULTIPLIER_STEP * level
}
