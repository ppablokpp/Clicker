/**
 * Núcleo de flota — the fleet's counterpart to Núcleo de gemas
 * (moneyUpgrades.js). Identical ladder, identical prices; the only
 * difference is what it multiplies.
 *
 * Where the gem core multiplies every click, this multiplies the whole
 * fleet's output — regular drones, scouts and gunners alike. It is folded
 * into each unit's per-second rate (see treeRepository's accrueProduction),
 * the same place prestigeFleetMultiplier already lives, so the per-unit
 * figures the UI shows include it rather than hiding it in a total.
 *
 * Sequential and non-cumulative like its sibling: only the highest tier
 * owned applies, and each tier requires the one below it. Stored in the same
 * user_permanent_upgrades table under its own ids.
 */
export const FLEET_UPGRADE_CATALOG = [
  { id: 'x2_fleet', multiplier: 2, cost: 1 },
  { id: 'x3_fleet', multiplier: 3, cost: 7 },
  { id: 'x4_fleet', multiplier: 4, cost: 10 },
  { id: 'x5_fleet', multiplier: 5, cost: 15 },
  { id: 'x6_fleet', multiplier: 6, cost: 20 },
  { id: 'x7_fleet', multiplier: 7, cost: 25 },
  { id: 'x8_fleet', multiplier: 8, cost: 30 },
  { id: 'x9_fleet', multiplier: 9, cost: 40 },
  { id: 'x10_fleet', multiplier: 10, cost: 50 },
]

export function getFleetUpgrade(id) {
  return FLEET_UPGRADE_CATALOG.find((u) => u.id === id)
}

/** The multiplier a set of owned upgrade ids earns. 1 when none are owned. */
export function fleetUpgradeMultiplier(ownedIds) {
  let best = 1
  for (const u of FLEET_UPGRADE_CATALOG) {
    if (ownedIds.includes(u.id) && u.multiplier > best) best = u.multiplier
  }
  return best
}
