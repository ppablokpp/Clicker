/**
 * Multiplicador's second child (Impulso) — raises how much each filled bar
 * adds to the Legendary combo bonus. Also finite (capped at level 10), same
 * reasoning as Reflejos: an ever-growing per-tier step would eventually
 * dwarf every other multiplier in the game.
 */
export const LEGENDARY_GROWTH_NODE_ID = 'legendary_growth'
export const LEGENDARY_GROWTH_MAX_LEVEL = 10

export const LEGENDARY_GROWTH_BASE_STEP = 0.5
export const LEGENDARY_GROWTH_STEP_INCREMENT = 0.1

export const LEGENDARY_GROWTH_BASE_COST = 2_500
export const LEGENDARY_GROWTH_COST_RATIO = 1.18

export function legendaryGrowthCost(level) {
  if (level >= LEGENDARY_GROWTH_MAX_LEVEL) return null
  return Math.ceil(LEGENDARY_GROWTH_BASE_COST * LEGENDARY_GROWTH_COST_RATIO ** level)
}

// How much each filled bar adds to the Legendary bonus.
export function legendaryGrowthBonusStep(level) {
  return LEGENDARY_GROWTH_BASE_STEP + LEGENDARY_GROWTH_STEP_INCREMENT * level
}
