/**
 * Multidisparo — root's own child (same tier as Suerte/Productividad),
 * raises how many fingers can be firing at once instead of any currency
 * math. Level 0 = 1 finger (the game's own default cap, enforced on the
 * frontend regardless of whether this node has even been bought yet).
 * Finite like the Legendary pair — letting it grow forever would eventually
 * make "how many fingers do you actually have" the only ceiling, which
 * isn't an interesting one.
 */
export const MULTI_SHOT_NODE_ID = 'multi_shot'
export const MULTI_SHOT_MAX_LEVEL = 9

export const MULTI_SHOT_BASE_COST = 1_200
export const MULTI_SHOT_COST_RATIO = 1.65

export function multiShotCost(level) {
  if (level >= MULTI_SHOT_MAX_LEVEL) return null
  return Math.ceil(MULTI_SHOT_BASE_COST * MULTI_SHOT_COST_RATIO ** level)
}

// Level 0 -> 1 finger, each level adds exactly one more.
export function multiShotValue(level) {
  return 1 + level
}
