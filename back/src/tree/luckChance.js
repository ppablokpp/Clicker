/**
 * Branch A's second node — Suerte (luck.js) raises the payout when the
 * roll hits; this raises the roll itself. Same infinite shape as every
 * other tree node: linear value growth, exponential cost growth. Priced a
 * bit above Suerte since it's now a required half of the same roll rather
 * than an independent upgrade.
 *
 * Level 0 (not owned) is the floor everyone gets just from owning any
 * Suerte level at all — 1%, not 0%, so Suerte alone still does something
 * before this node is ever touched. Each level after that adds another
 * flat 1%, so the displayed chance reads as a clean level-1/level-2/level-3
 * = 1%/2%/3% ladder.
 */
export const LUCK_CHANCE_NODE_ID = 'luck_chance'
export const LUCK_CHANCE_MAX_LEVEL = 20

export const LUCK_BASE_CHANCE = 0.01
export const LUCK_CHANCE_STEP = 0.01
export const LUCK_CHANCE_BASE_COST = 1_400
export const LUCK_CHANCE_COST_RATIO = 1.35

// Cost to go from `level` owned to `level + 1`.
export function luckChanceCost(level) {
  if (level >= LUCK_CHANCE_MAX_LEVEL) return null
  return Math.ceil(LUCK_CHANCE_BASE_COST * LUCK_CHANCE_COST_RATIO ** level)
}

export function luckChanceValue(level) {
  return LUCK_BASE_CHANCE + LUCK_CHANCE_STEP * level
}
