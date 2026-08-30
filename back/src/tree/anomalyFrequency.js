/**
 * Detección — Anomalías' other child. Shrinks the *average* wait between
 * Anomalía spawns (Home.tsx's own spawn timer reads this and randomizes
 * around it — see the spawn effect there). Level 0 (not owned) is the
 * 2-minute average cadence everyone gets just from having Anomalías
 * unlocked — same "level 0 is a real floor, not zero" shape as
 * luckChance.js/anomalyReward.js. Each level shaves off another 10 seconds,
 * down to a 30-second floor.
 */
export const ANOMALY_FREQUENCY_NODE_ID = 'anomaly_frequency'
export const ANOMALY_FREQUENCY_MAX_LEVEL = 9

export const ANOMALY_FREQUENCY_BASE_SECONDS = 120
export const ANOMALY_FREQUENCY_STEP_SECONDS = 10
export const ANOMALY_FREQUENCY_FLOOR_SECONDS = 30

export const ANOMALY_FREQUENCY_BASE_COST = 20_000
export const ANOMALY_FREQUENCY_COST_RATIO = 1.5

// Cost to go from `level` owned to `level + 1`.
export function anomalyFrequencyCost(level) {
  if (level >= ANOMALY_FREQUENCY_MAX_LEVEL) return null
  return Math.ceil(ANOMALY_FREQUENCY_BASE_COST * ANOMALY_FREQUENCY_COST_RATIO ** level)
}

export function anomalyFrequencySeconds(level) {
  return Math.max(ANOMALY_FREQUENCY_FLOOR_SECONDS, ANOMALY_FREQUENCY_BASE_SECONDS - ANOMALY_FREQUENCY_STEP_SECONDS * level)
}
