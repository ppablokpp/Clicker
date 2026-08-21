/**
 * Fortuna's own child (Azar) — raises the chance itself, mirroring how
 * Probabilidad does for Suerte. Priced steeper for the same reason Fortuna
 * is steeper than Suerte: it amplifies a passive income stream.
 */
export const AUTO_LUCK_CHANCE_NODE_ID = 'auto_luck_chance'

export const AUTO_LUCK_CHANCE_BASE = 0.005
export const AUTO_LUCK_CHANCE_STEP = 0.005

export const AUTO_LUCK_CHANCE_BASE_COST = 2_800
export const AUTO_LUCK_CHANCE_COST_RATIO = 1.75

export function autoLuckChanceCost(level) {
  return Math.ceil(AUTO_LUCK_CHANCE_BASE_COST * AUTO_LUCK_CHANCE_COST_RATIO ** level)
}

export function autoLuckChanceValue(level) {
  return AUTO_LUCK_CHANCE_BASE + AUTO_LUCK_CHANCE_STEP * level
}
