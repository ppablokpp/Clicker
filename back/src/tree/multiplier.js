/**
 * The base click value (Potencia) — unlike Suerte (a probabilistic roll),
 * this guarantees more value on every single click, so it's the backbone of
 * the manual side.
 *
 * Multiplicative since Economía Cero: ×1.15 per level over 43 levels
 * (plus 15 more per prestige), against a ×1.311 cost. The old +1/level
 * could not keep the hand relevant — the click multiplier grew linearly
 * while the goal grew ×100 a tier, so manual play collapsed to a rounding
 * error by Esmeralda.
 */
export const MULTIPLIER_NODE_ID = 'click_multiplier'
export const MULTIPLIER_MAX_LEVEL = 43
/**
 * The value of a click before any node is bought.
 *
 * Tuned between two bad ends. At 5 the optimal play in Amatista is
 * essentially pure tapping — the fleet stays under 1% of production and the
 * tier falls in about an hour, too fast for the one that teaches the game.
 * At 1 that same tier runs closer to four hours, which is long for a first
 * impression. 3 sits between them, and is also the number that keeps the
 * hand and the fleet near an even split through the opening tier.
 */
export const MULTIPLIER_BASE_VALUE = 3
export const MULTIPLIER_GROWTH = 1.15
export const MULTIPLIER_BASE_COST = 1_000
export const MULTIPLIER_COST_RATIO = 1.311

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — see scaleCost/tieredMaxLevel in treeRepository.js.
export function multiplierCost(level, maxLevel = MULTIPLIER_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(MULTIPLIER_BASE_COST * MULTIPLIER_COST_RATIO ** level)
}

export function multiplierValue(level) {
  return MULTIPLIER_BASE_VALUE * MULTIPLIER_GROWTH ** level
}
