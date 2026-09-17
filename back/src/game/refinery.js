import { TRAJECTORY_TIER_THRESHOLDS, TRAJECTORY_TIER_COUNT } from './trajectory.js'

/**
 * The Refinería: each material's core in the ship's reactor is CORES_PER_TIER
 * capsules, loaded one at a time. Each one costs mineral and takes time, and
 * both climb with every capsule done — the first is a taste, the tenth is a
 * job.
 *
 * The whole core is priced against the tier's goal, so it weighs the same
 * on every asteroid: the ten capsules together cost CORE_GOAL_FRACTION of
 * the goal, and take CORE_BASE_MINUTES plus CORE_MINUTES_PER_TIER a tier.
 * Within a core the costs and the times climb geometrically, and the sums
 * are normalised so the totals come out exact whatever the ratios.
 *
 * Mirrored in front/src/lib/refinery.ts so the screen can print the cost and
 * the countdown; the server is the one that spends and keeps the clock.
 */
export const CORES_PER_TIER = 10
/** The ten capsules together cost this much of the tier's goal. */
export const CORE_GOAL_FRACTION = 0.1
/** …and take this long together: 20 min on Amatista, 10 more each tier. */
export const CORE_BASE_MINUTES = 20
export const CORE_MINUTES_PER_TIER = 10
/** Each capsule costs this much more than the last, and takes this much longer. */
export const CORE_COST_RATIO = 1.8
export const CORE_SECONDS_RATIO = 1.35

/**
 * The tier's goal — what the whole core is priced against. The last tier's
 * own threshold is a horizon on purpose (see trajectory.js), so its core is
 * priced against the last goal that is meant to be reached, like the
 * mineral packs are.
 */
function coreGoal(tier) {
  const t = Math.min(Math.max(Number(tier) || 0, 0), TRAJECTORY_TIER_COUNT - 1)
  return t === TRAJECTORY_TIER_COUNT - 1 ? TRAJECTORY_TIER_THRESHOLDS[t] : TRAJECTORY_TIER_THRESHOLDS[t + 1]
}

/** The (index)th share of a geometric split of `total` into CORES_PER_TIER
 *  parts growing by `ratio`: shares sum to `total` exactly. */
function geometricShare(total, ratio, index) {
  return (total * (ratio - 1) * ratio ** index) / (ratio ** CORES_PER_TIER - 1)
}

/** What the (index)th capsule of a tier's core costs, 0-based. */
export function coreCost(index, tier) {
  return Math.round(geometricShare(coreGoal(tier) * CORE_GOAL_FRACTION, CORE_COST_RATIO, index))
}

/** How long the (index)th capsule of a tier's core takes, in seconds, 0-based. */
export function coreSeconds(index, tier) {
  const totalSeconds = (CORE_BASE_MINUTES + CORE_MINUTES_PER_TIER * (Number(tier) || 0)) * 60
  return Math.round(geometricShare(totalSeconds, CORE_SECONDS_RATIO, index))
}

/** Skipping the rest of a smelt costs gems by the time left: one gem per
 *  minute or part of it — up to 60 s is one gem, 61 s is two. */
export const FINISH_GEMS_PER_SECONDS = 60
export function finishGemCost(secondsLeft) {
  return Math.max(1, Math.ceil(secondsLeft / FINISH_GEMS_PER_SECONDS))
}
