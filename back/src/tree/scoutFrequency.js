/**
 * Frecuencia — the scout drones' own rate node, the exact counterpart of
 * Sobrecarga for regular drones (see autoMultiplier.js). The returned value
 * IS the full per-scout rate, so the fleet total is
 * `scoutDroneLevel * scoutFrequencyValue(level)`.
 *
 * Multiplicative since Economía Cero, same reasoning and same ×1.15 as
 * Sobrecarga — see that file for why a flat step could not hold up.
 */
import { SCOUT_DRONE_CPS_PER_LEVEL } from './scoutDrone.js'

export const SCOUT_FREQUENCY_NODE_ID = 'auto_luck_chance'
export const SCOUT_FREQUENCY_MAX_LEVEL = 40
export const SCOUT_FREQUENCY_GROWTH = 1.15
export const SCOUT_FREQUENCY_BASE_COST = 2_500
export const SCOUT_FREQUENCY_COST_RATIO = 1.311

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — see scaleCost/tieredMaxLevel in treeRepository.js.
export function scoutFrequencyCost(level, maxLevel = SCOUT_FREQUENCY_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(SCOUT_FREQUENCY_BASE_COST * SCOUT_FREQUENCY_COST_RATIO ** level)
}

export function scoutFrequencyValue(level) {
  return SCOUT_DRONE_CPS_PER_LEVEL * SCOUT_FREQUENCY_GROWTH ** level
}
