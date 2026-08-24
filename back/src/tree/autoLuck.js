/**
 * Suerte's other child (branch A forks: a2 became Probabilidad, a1b
 * becomes this — Fortuna). Same underlying idea as Suerte itself — a
 * chance for production to count for a multiplier instead of ×1 — but
 * applied to Autoclick's continuous cps instead of discrete clicks, and
 * priced steeper since it boosts a passive income stream rather than a
 * one-off tap.
 *
 * Autoclick has no discrete "roll" per tick (it's credited from elapsed
 * wall-clock time, not per-click events), so the chance is folded in as a
 * continuous expected-value multiplier on cps instead of an actual random
 * roll — mathematically the same average payout a real per-tick roll would
 * give, without the display jittering around for no gameplay reason.
 */
export const AUTO_LUCK_NODE_ID = 'auto_luck'
export const AUTO_LUCK_MAX_LEVEL = 15

export const AUTO_LUCK_BASE_COST = 2_000
export const AUTO_LUCK_COST_RATIO = 1.16

export function autoLuckCost(level) {
  if (level >= AUTO_LUCK_MAX_LEVEL) return null
  return Math.ceil(AUTO_LUCK_BASE_COST * AUTO_LUCK_COST_RATIO ** level)
}

export function autoLuckMultiplier(level) {
  return level + 1
}

// baseCps already includes auto-click's own level; chance is the resolved
// value from autoLuckChance.js (0 when Fortuna isn't owned).
export function effectiveAutoClickCps(baseCps, autoLuckLevel, autoLuckChance) {
  if (autoLuckLevel === 0) return baseCps
  const multiplier = autoLuckMultiplier(autoLuckLevel)
  return baseCps * (1 + autoLuckChance * (multiplier - 1))
}
