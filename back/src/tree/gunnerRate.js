/**
 * Calibre — the gunners' own rate node, completing the pattern the other two
 * fleet units already had (Sobrecarga for drones, Frecuencia for scouts).
 * Gunners used to be the odd one out with a flat 10/s and no way to improve
 * it, so the only lever was owning more of them — which stopped working the
 * moment the count was capped at four to six.
 *
 * The returned value IS the full per-gunner rate, so the total is
 * `gunnerLevel * gunnerRateValue(level)`, same shape as the other two.
 */
export const GUNNER_RATE_NODE_ID = 'gunner_rate'
export const GUNNER_RATE_MAX_LEVEL = 33
export const GUNNER_RATE_GROWTH = 1.15

/**
 * Material per second, per gunner, at level 0 and prestige 0.
 *
 * 100 against a drone's 0.5 and a scout's 2.5. That gap is the whole point
 * of the unit: you will only ever own a handful, so each has to carry the
 * weight of dozens.
 */
export const GUNNER_RATE_BASE = 100

export const GUNNER_RATE_BASE_COST = 15_000
export const GUNNER_RATE_COST_RATIO = 1.311

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — see scaleCost/tieredMaxLevel in treeRepository.js.
export function gunnerRateCost(level, maxLevel = GUNNER_RATE_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(GUNNER_RATE_BASE_COST * GUNNER_RATE_COST_RATIO ** level)
}

export function gunnerRateValue(level) {
  return GUNNER_RATE_BASE * GUNNER_RATE_GROWTH ** level
}
