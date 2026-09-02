/**
 * Frecuencia — Drones buscadores' own child. Mirrors Sobrecarga exactly but
 * for scout drones: a flat per-unit cps bonus stacked on top of the base
 * SCOUT_DRONE_CPS_PER_LEVEL, priced steeper since scout drones are already
 * the stronger unit.
 */
import { SCOUT_DRONE_CPS_PER_LEVEL } from './scoutDrone.js'

export const SCOUT_FREQUENCY_NODE_ID = 'auto_luck_chance'
export const SCOUT_FREQUENCY_MAX_LEVEL = 20
export const SCOUT_FREQUENCY_STEP = 1

export const SCOUT_FREQUENCY_BASE_COST = 5_000
export const SCOUT_FREQUENCY_COST_RATIO = 1.35

// `maxLevel` defaults to the prestige-0 cap but callers pass a
// tier-adjusted one — this node's cost no longer scales with prestige tier
// (see scaleCost/tieredMaxLevel in treeRepository.js), each tier just
// unlocks more levels of the same curve. Same treatment as Sobrecarga,
// which this node mirrors exactly.
export function scoutFrequencyCost(level, maxLevel = SCOUT_FREQUENCY_MAX_LEVEL) {
  if (level >= maxLevel) return null
  return Math.ceil(SCOUT_FREQUENCY_BASE_COST * SCOUT_FREQUENCY_COST_RATIO ** level)
}

// The full per-scout-drone cps rate — level 0 (not owned) is just the base
// rate every scout drone already has on its own.
export function scoutFrequencyValue(level) {
  return SCOUT_DRONE_CPS_PER_LEVEL + SCOUT_FREQUENCY_STEP * level
}
