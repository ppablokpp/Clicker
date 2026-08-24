/**
 * Drones buscadores — used to be Fortuna (a chance-based bonus on Autoclick's
 * cps); now a second, stronger production unit standing on its own root
 * branch, same plain level-counter shape as Autoclick (level IS the count
 * owned) but priced for a much higher per-unit output — the first one
 * already costs roughly what the ~17th-18th regular drone does. Frecuencia
 * (scoutFrequency.js) raises the per-unit rate the same way Sobrecarga does
 * for regular drones.
 */
export const SCOUT_DRONE_NODE_ID = 'auto_luck'
export const SCOUT_DRONE_MAX_LEVEL = 20

export const SCOUT_DRONE_BASE_COST = 3_200
export const SCOUT_DRONE_COST_RATIO = 1.16
export const SCOUT_DRONE_CPS_PER_LEVEL = 2

export function scoutDroneCost(level) {
  if (level >= SCOUT_DRONE_MAX_LEVEL) return null
  return Math.ceil(SCOUT_DRONE_BASE_COST * SCOUT_DRONE_COST_RATIO ** level)
}
