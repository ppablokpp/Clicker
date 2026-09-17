// Mirror of back/src/game/refinery.js. The server is the one that spends
// mineral and keeps the clock; these are only here so a screen can print a
// cost or a duration without a round trip.
import { TRAJECTORY_TIER_THRESHOLDS, TRAJECTORY_TIER_COUNT } from './trajectory'

export const CORES_PER_TIER = 10
/** The ten capsules together cost this much of the tier's goal. */
export const CORE_GOAL_FRACTION = 0.1
/** …and take this long together: 20 min on Amatista, 10 more each tier. */
export const CORE_BASE_MINUTES = 20
export const CORE_MINUTES_PER_TIER = 10
/** Each capsule costs this much more than the last, and takes this much longer. */
export const CORE_COST_RATIO = 1.8
export const CORE_SECONDS_RATIO = 1.35

function coreGoal(tier: number): number {
  const t = Math.min(Math.max(tier, 0), TRAJECTORY_TIER_COUNT - 1)
  return t === TRAJECTORY_TIER_COUNT - 1 ? TRAJECTORY_TIER_THRESHOLDS[t] : TRAJECTORY_TIER_THRESHOLDS[t + 1]
}

function geometricShare(total: number, ratio: number, index: number): number {
  return (total * (ratio - 1) * ratio ** index) / (ratio ** CORES_PER_TIER - 1)
}

export const coreCost = (index: number, tier: number) =>
  Math.round(geometricShare(coreGoal(tier) * CORE_GOAL_FRACTION, CORE_COST_RATIO, index))

export const coreSeconds = (index: number, tier: number) =>
  Math.round(geometricShare((CORE_BASE_MINUTES + CORE_MINUTES_PER_TIER * tier) * 60, CORE_SECONDS_RATIO, index))

/** Skipping the rest of a smelt costs gems by the time left: one gem per
 *  minute or part of it — up to 60 s is one gem, 61 s is two. */
export const FINISH_GEMS_PER_SECONDS = 60
export const finishGemCost = (secondsLeft: number) => Math.max(1, Math.ceil(secondsLeft / FINISH_GEMS_PER_SECONDS))
