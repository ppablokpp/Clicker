import { TRAJECTORY_TIER_THRESHOLDS } from './trajectory.js'

export const BATTLE_DURATION_SECONDS = 30

/**
 * The wagers a duel can be played for, ascending.
 *
 * A fixed list rather than a free-text amount: every rung is a round number
 * you can read at a glance, the whole range fits in a stepper you can hold
 * down, and it means the server validates against a list instead of a range
 * (no 9,999,999 duels, no fractional wagers, nothing to sanitize).
 *
 * Mostly a 1/5 ladder, with 500, 25K and 250K filled in — the bottom of the
 * range is where a tier-0 account lives its whole run, so it gets finer steps
 * than the far end nobody reaches for months.
 *
 * Runs 500 → 1T. Add rungs to the end when the economy outgrows it; the
 * client reads this list rather than hardcoding its own.
 */
export const BATTLE_WAGERS = [
  500,
  1_000,
  5_000,
  10_000,
  25_000,
  50_000,
  100_000,
  250_000,
  500_000,
  1_000_000,
  5_000_000,
  10_000_000,
  50_000_000,
  100_000_000,
  500_000_000,
  1_000_000_000,
  5_000_000_000,
  10_000_000_000,
  50_000_000_000,
  100_000_000_000,
  500_000_000_000,
  1_000_000_000_000,
]

/** Where the picker opens, and what a client that sends no wager gets. */
export const BATTLE_WAGER = 10_000

/**
 * How much of a tier's own goal you're allowed to put on one duel: 1%.
 *
 * The ladder runs to 1T for everyone, but what you can actually stake is
 * pegged to where you are in the game — a duel should be a meaningful bet,
 * not a way to hand someone a run's worth of progress in thirty seconds.
 * At tier 0 the goal is 10M, so the cap is 100K, and it climbs ×100 with
 * each prestige exactly as the goals do (10M, 1B, 100B…), which lands every
 * cap precisely on a rung of the ladder.
 */
const WAGER_GOAL_FRACTION = 0.01

/** Everyone can always reach this rung, whatever their tier. */
export const BATTLE_MIN_MAX_WAGER = 100_000

export function maxWagerForTier(tier) {
  // A tier's goal is the next tier's floor. The last tier still has a
  // ceiling entry (see TRAJECTORY_TIER_THRESHOLDS), so this is never undefined
  // for a real tier — the fallback is for a corrupt/out-of-range value.
  const goal = TRAJECTORY_TIER_THRESHOLDS[Number(tier) + 1]
  const capped = Number.isFinite(goal) ? goal * WAGER_GOAL_FRACTION : 0
  return Math.max(BATTLE_MIN_MAX_WAGER, capped)
}

/** The rungs a given tier may actually play for. */
export function wagersForTier(tier) {
  const max = maxWagerForTier(tier)
  return BATTLE_WAGERS.filter((w) => w <= max)
}

/** Is this one of the rungs at all — regardless of who's asking. */
export function isWagerRung(wager) {
  return BATTLE_WAGERS.includes(wager)
}
