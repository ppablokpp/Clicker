/**
 * Multiplicador's first child (Reflejos) — lowers how many real taps it
 * takes to level up the Home page's Legendary combo meter. Unlike every
 * other tree node so far, this one is finite (capped at level 10): letting
 * it run infinite would eventually make the combo trivial to max out,
 * defeating the "sustain your speed" point of the whole mechanic.
 */
export const LEGENDARY_EASE_NODE_ID = 'legendary_ease'
export const LEGENDARY_EASE_MAX_LEVEL = 10

export const LEGENDARY_EASE_BASE_STREAK = 200
export const LEGENDARY_EASE_STEP = 5

export const LEGENDARY_EASE_BASE_COST = 2_000
export const LEGENDARY_EASE_COST_RATIO = 1.7

export function legendaryEaseCost(level) {
  if (level >= LEGENDARY_EASE_MAX_LEVEL) return null
  return Math.ceil(LEGENDARY_EASE_BASE_COST * LEGENDARY_EASE_COST_RATIO ** level)
}

// The click threshold for the *first* legendary tier — Home.tsx still
// applies its own per-tier exponential ratio on top of this.
export function legendaryEaseStreakBase(level) {
  return LEGENDARY_EASE_BASE_STREAK - LEGENDARY_EASE_STEP * level
}
