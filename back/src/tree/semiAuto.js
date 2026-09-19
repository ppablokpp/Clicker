/**
 * Cañón semiautomático — Multidisparo's first child, a one-time gate (same
 * shape as Modo Legendario): once bought, one held finger keeps firing on
 * its own for as long as its charge lasts (see semiAutoHold.js for how
 * long), then the cannon takes a fixed five seconds to recharge fully
 * before it can be held again. Only one finger at a time gets this; the
 * others fire per tap as before. Priced for the late game: 5M on the
 * first asteroid, and scaleCost multiplies that by the tier's 5x steps so
 * it is never a giveaway on a later one.
 */
export const SEMI_AUTO_NODE_ID = 'semi_auto'
export const SEMI_AUTO_MAX_LEVEL = 1
export const SEMI_AUTO_COST = 5_000_000

/** Seconds the cannon takes to recharge from empty to full, always. */
export const SEMI_AUTO_RECHARGE_SECONDS = 5

export function semiAutoCost(level) {
  if (level >= SEMI_AUTO_MAX_LEVEL) return null
  return SEMI_AUTO_COST
}
