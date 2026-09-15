import { TRAJECTORY_TIER_THRESHOLDS, TRAJECTORY_TIER_COUNT } from '../game/trajectory.js'

/**
 * Click packs — bought with gems, not real money. Straightforward currency
 * exchange (no RevenueCat, no idempotency table needed): gems in, clicks
 * out, atomic in the same transaction.
 *
 * A pack is a slice of the tier's own goal, not a fixed number of clicks. The
 * one-gem pack is 0.1% of the goal wherever you are, and the other three are
 * x3.5, x10 and x25 of it — 10K / 35K / 100K / 250K on Amatista, and the same
 * proportions on every asteroid after it. It used to scale x5 a tier while
 * the goals climbed x20 to x100, so by Diamante one gem bought a rounding
 * error of the goal and the shop was decoration.
 */
export const CLICK_PACKS = [
  { id: 'clicks_10k', gemCost: 1, goalFraction: 0.001 },
  { id: 'clicks_35k', gemCost: 3, goalFraction: 0.0035 },
  { id: 'clicks_100k', gemCost: 7, goalFraction: 0.01 }, // exactly 30% cheaper per click than the base tier
  { id: 'clicks_250k', gemCost: 15, goalFraction: 0.025 },
]

export function getClickPack(id) {
  return CLICK_PACKS.find((p) => p.id === id)
}

/**
 * What a pack pays out on a given tier.
 *
 * Pegged to the tier's goal for every tier but the last. Diamante's goal is a
 * horizon on purpose (see trajectory.js) — a thousandth of it would be a
 * hundred times what the accounts at the top of the leaderboard hold, for
 * one gem. So the last tier slices its floor instead: Oro's goal, the last
 * number on the ladder that is meant to be reached. On every other tier the
 * two readings agree that a pack is a small nudge towards where you are
 * going; on Diamante only the floor still means that.
 */
export function clickPackAmount(pack, prestigeTier) {
  const tier = Math.min(Math.max(Number(prestigeTier) || 0, 0), TRAJECTORY_TIER_COUNT - 1)
  const base =
    tier === TRAJECTORY_TIER_COUNT - 1 ? TRAJECTORY_TIER_THRESHOLDS[tier] : TRAJECTORY_TIER_THRESHOLDS[tier + 1]
  return Math.round(base * pack.goalFraction)
}
