/**
 * Cadencia — Cañón semiautomático's other child: how many shots a second
 * a held finger fires. Same ladder and same prices as Carga (see
 * semiAutoHold.js) but a shorter ladder: starts at 5 t/s with the cannon
 * itself and climbs to 20 t/s over ten levels — past that a held finger
 * would out-shoot any tapping. A faster cannon empties the same charge in
 * the same seconds, so the two nodes pull on different things — Carga on
 * how long, Cadencia on how hard.
 */
export const SEMI_AUTO_RATE_NODE_ID = 'semi_auto_rate'

/** Shots per second by level; level 0 is what the cannon comes with. */
export const SEMI_AUTO_RATE_TPS = [5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20]
export const SEMI_AUTO_RATE_MAX_LEVEL = SEMI_AUTO_RATE_TPS.length - 1

export const SEMI_AUTO_RATE_BASE_COST = 100_000
export const SEMI_AUTO_RATE_COST_RATIO = 1.6

export function semiAutoRateCost(level) {
  if (level >= SEMI_AUTO_RATE_MAX_LEVEL) return null
  return Math.ceil(SEMI_AUTO_RATE_BASE_COST * SEMI_AUTO_RATE_COST_RATIO ** level)
}

export function semiAutoRateTps(level) {
  return SEMI_AUTO_RATE_TPS[Math.min(level, SEMI_AUTO_RATE_MAX_LEVEL)]
}
