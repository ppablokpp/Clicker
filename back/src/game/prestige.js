/**
 * Reactor — the first (and so far only) prestige upgrade: a permanent
 * ×multiplier on top of everything else, applied to both manual click
 * value and auto-click's production, that survives every future reset.
 * Bought with prestige points, not platino, and never appears in
 * user_permanent_upgrades (see migration 026 for why).
 */
export const PRESTIGE_REACTOR_NODE_ID = 'prestige_reactor'
export const PRESTIGE_REACTOR_STEP = 0.05
export const PRESTIGE_REACTOR_BASE_COST = 5
export const PRESTIGE_REACTOR_COST_RATIO = 1.6

export function prestigeReactorCost(level) {
  return Math.ceil(PRESTIGE_REACTOR_BASE_COST * PRESTIGE_REACTOR_COST_RATIO ** level)
}

export function prestigeReactorValue(level) {
  return 1 + PRESTIGE_REACTOR_STEP * level
}
