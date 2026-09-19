/**
 * Carga — Cañón semiautomático's own child: how many seconds a held
 * finger keeps firing before the cannon runs dry. Starts at 5s with the
 * cannon itself and climbs a fixed ladder to 20s over ten levels —
 * one second a step at first, then bigger steps so the last few levels are
 * the ones worth saving for. Finite by design: a cannon that never runs
 * dry would make holding the only way to play.
 */
export const SEMI_AUTO_HOLD_NODE_ID = 'semi_auto_hold'

/** Hold seconds by level; level 0 is what the cannon comes with. */
export const SEMI_AUTO_HOLD_SECONDS = [5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20]
export const SEMI_AUTO_HOLD_MAX_LEVEL = SEMI_AUTO_HOLD_SECONDS.length - 1

export const SEMI_AUTO_HOLD_BASE_COST = 100_000
export const SEMI_AUTO_HOLD_COST_RATIO = 1.6

export function semiAutoHoldCost(level) {
  if (level >= SEMI_AUTO_HOLD_MAX_LEVEL) return null
  return Math.ceil(SEMI_AUTO_HOLD_BASE_COST * SEMI_AUTO_HOLD_COST_RATIO ** level)
}

export function semiAutoHoldSeconds(level) {
  return SEMI_AUTO_HOLD_SECONDS[Math.min(level, SEMI_AUTO_HOLD_MAX_LEVEL)]
}
