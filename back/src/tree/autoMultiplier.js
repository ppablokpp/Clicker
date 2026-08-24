/**
 * Sobrecarga — Multiplicador's other child. Used to be a guaranteed
 * ×multiplier on Autoclick's total production; now a flat +0.5 pt/s bonus
 * added directly to each drone's own output instead — the returned value
 * IS the full per-drone rate (AUTOCLICK_CPS_PER_LEVEL plus this node's own
 * levels), so callers compute the fleet's total as
 * `autoClickLevel * autoMultiplierValue(level)` instead of
 * `autoClickCps(autoClickLevel) * autoMultiplierValue(level)`.
 * Finite — 19 levels takes the per-drone rate from the base 0.5 pt/s up to
 * an even 10 pt/s.
 */
import { AUTOCLICK_CPS_PER_LEVEL } from './autoClick.js'

export const AUTO_MULTIPLIER_NODE_ID = 'auto_multiplier'
export const AUTO_MULTIPLIER_MAX_LEVEL = 19
export const AUTO_MULTIPLIER_STEP = 0.5
export const AUTO_MULTIPLIER_BASE_COST = 2_000
export const AUTO_MULTIPLIER_COST_RATIO = 1.26

export function autoMultiplierCost(level) {
  if (level >= AUTO_MULTIPLIER_MAX_LEVEL) return null
  return Math.ceil(AUTO_MULTIPLIER_BASE_COST * AUTO_MULTIPLIER_COST_RATIO ** level)
}

// The full per-drone cps rate — level 0 (not owned) is just the base rate
// every drone already has on its own.
export function autoMultiplierValue(level) {
  return AUTOCLICK_CPS_PER_LEVEL + AUTO_MULTIPLIER_STEP * level
}
