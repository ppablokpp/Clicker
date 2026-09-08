/**
 * Sobrecarga — Multiplicador's other child. The returned value IS the full
 * per-drone rate (the base every drone has plus this node's own levels), so
 * callers compute the fleet's total as
 * `autoClickLevel * autoMultiplierValue(level)`.
 *
 * Multiplicative since Economía Cero: each level is +15% on the level before
 * it, not a flat +0.5. That single change is what stops the node's value
 * from falling behind its own cost — with a flat step, the cost ratio
 * compounds while the value grows linearly, so every level bought is worse
 * than the last and by the fourth prestige the node is pointless. At ×1.15
 * against a ×1.311 cost the wear per level is a constant 1.14, flat forever.
 */
import { AUTOCLICK_CPS_PER_LEVEL } from './autoClick.js'

export const AUTO_MULTIPLIER_NODE_ID = 'auto_multiplier'
export const AUTO_MULTIPLIER_MAX_LEVEL = 47
export const AUTO_MULTIPLIER_GROWTH = 1.15
export const AUTO_MULTIPLIER_BASE_COST = 400
export const AUTO_MULTIPLIER_COST_RATIO = 1.311

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — this node's cost no longer scales with prestige tier
// (see scaleCost/tieredMaxLevel in treeRepository.js), each tier just
// unlocks more levels of the same curve.
export function autoMultiplierCost(level, maxLevel = AUTO_MULTIPLIER_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(AUTO_MULTIPLIER_BASE_COST * AUTO_MULTIPLIER_COST_RATIO ** level)
}

// The full per-drone cps rate — level 0 (not owned) is just the base rate
// every drone already has on its own.
export function autoMultiplierValue(level) {
  return AUTOCLICK_CPS_PER_LEVEL * AUTO_MULTIPLIER_GROWTH ** level
}
