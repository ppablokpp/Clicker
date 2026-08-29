/**
 * Anomalías — a one-time gate on the "Anomalía" mini-event itself
 * (Home.tsx's meteor spawn timer / EventChallenge). Until this is bought,
 * no meteor ever spawns at all — same shape as Modo Legendario gating the
 * Legendary heat tier (see legendaryUnlock.js): a single flat purchase,
 * nothing to scale.
 */
export const ANOMALY_UNLOCK_NODE_ID = 'anomaly_unlock'
export const ANOMALY_UNLOCK_MAX_LEVEL = 1
export const ANOMALY_UNLOCK_COST = 2_000

export function anomalyUnlockCost(level) {
  if (level >= ANOMALY_UNLOCK_MAX_LEVEL) return null
  return ANOMALY_UNLOCK_COST
}
