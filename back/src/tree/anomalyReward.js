/**
 * Extracción — Anomalías' first child. Raises the cut of current material
 * an Anomalía pays out when neutralized. Level 0 (not owned) is the 5%
 * floor everyone gets just from having Anomalías unlocked at all — same
 * "level 0 is a real floor, not zero" shape as luckChance.js. Each level
 * adds another flat 0.5%, capped at 10%.
 */
export const ANOMALY_REWARD_NODE_ID = 'anomaly_reward'
export const ANOMALY_REWARD_MAX_LEVEL = 10

export const ANOMALY_REWARD_BASE_PCT = 0.05
export const ANOMALY_REWARD_STEP = 0.005
export const ANOMALY_REWARD_BASE_COST = 20_000
export const ANOMALY_REWARD_COST_RATIO = 1.5

// Cost to go from `level` owned to `level + 1`.
export function anomalyRewardCost(level) {
  if (level >= ANOMALY_REWARD_MAX_LEVEL) return null
  return Math.ceil(ANOMALY_REWARD_BASE_COST * ANOMALY_REWARD_COST_RATIO ** level)
}

export function anomalyRewardValue(level) {
  return ANOMALY_REWARD_BASE_PCT + ANOMALY_REWARD_STEP * level
}
