/**
 * Modo Legendario — a one-time gate on the Legendary heat tier itself
 * (Home.tsx's HEAT_LEVELS; the actual t/s threshold — 30 by default — comes
 * from this node's own child, Umbral/legendaryThreshold.js). Until this is
 * bought, hitting that threshold caps out at the Imparable tier instead —
 * no combo meter, no per-tier multiplier. A single flat purchase, not a
 * level ladder like every other node here: there's nothing to scale, it's
 * just on or off.
 */
export const LEGENDARY_UNLOCK_NODE_ID = 'legendary_unlock'
export const LEGENDARY_UNLOCK_MAX_LEVEL = 1
export const LEGENDARY_UNLOCK_COST = 100_000

export function legendaryUnlockCost(level) {
  if (level >= LEGENDARY_UNLOCK_MAX_LEVEL) return null
  return LEGENDARY_UNLOCK_COST
}
