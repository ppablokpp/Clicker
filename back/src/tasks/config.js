/**
 * Onboarding tasks — one-time goals that pay out a flat platino reward the
 * first time each is reached. Grouped into missions (missionId) of 3
 * escalating tiers each; the frontend shows one card per mission and just
 * advances it to the next tier as each one gets claimed, instead of a
 * separate card per tier.
 *
 * Two task shapes:
 *  - 'node-level': completion reads straight off a tree node's own live
 *    level (user_permanent_upgrades) — nothing new to keep in sync as the
 *    player buys upgrades normally.
 *  - 'counter': completion reads off a running counter column on `users`
 *    (currently just anomalies_neutralized) for goals that aren't tied to
 *    any one tree node.
 *
 * Existing ids (first_drone, second_cannon, first_scout_drone) are kept
 * exactly as they were — they're each tier 1 of their mission, and players
 * who already claimed them under these ids must stay claimed.
 */
import { AUTOCLICK_NODE_ID } from '../tree/autoClick.js'
import { MULTI_SHOT_NODE_ID } from '../tree/multiShot.js'
import { SCOUT_DRONE_NODE_ID } from '../tree/scoutDrone.js'

export const TASKS = [
  // Mission: Drones — root autoclick node level IS the drone count.
  { id: 'first_drone', missionId: 'drones', tier: 1, type: 'node-level', nodeId: AUTOCLICK_NODE_ID, requiredLevel: 1, reward: 1_000 },
  { id: 'drone_squadron', missionId: 'drones', tier: 2, type: 'node-level', nodeId: AUTOCLICK_NODE_ID, requiredLevel: 10, reward: 2_000 },
  { id: 'drone_swarm', missionId: 'drones', tier: 3, type: 'node-level', nodeId: AUTOCLICK_NODE_ID, requiredLevel: 30, reward: 50_000 },

  // Mission: Multidisparo — level 0 already gives 1 finger, so level N is
  // N+1 cannons; max level is 9 (10 cannons).
  { id: 'second_cannon', missionId: 'multishot', tier: 1, type: 'node-level', nodeId: MULTI_SHOT_NODE_ID, requiredLevel: 1, reward: 2_000 },
  { id: 'full_battery', missionId: 'multishot', tier: 2, type: 'node-level', nodeId: MULTI_SHOT_NODE_ID, requiredLevel: 4, reward: 10_000 },
  { id: 'total_arsenal', missionId: 'multishot', tier: 3, type: 'node-level', nodeId: MULTI_SHOT_NODE_ID, requiredLevel: 9, reward: 100_000 },

  // Mission: Dron buscador — max level 20.
  { id: 'first_scout_drone', missionId: 'scout', tier: 1, type: 'node-level', nodeId: SCOUT_DRONE_NODE_ID, requiredLevel: 1, reward: 5_000 },
  { id: 'scout_squad', missionId: 'scout', tier: 2, type: 'node-level', nodeId: SCOUT_DRONE_NODE_ID, requiredLevel: 10, reward: 10_000 },
  { id: 'scout_fleet', missionId: 'scout', tier: 3, type: 'node-level', nodeId: SCOUT_DRONE_NODE_ID, requiredLevel: 20, reward: 100_000 },

  // Mission: Neutraliza anomalías — counts real wins in Home's "Anomalía"
  // mini-event (see eventsRepository.claimReward's anomalies_neutralized).
  { id: 'first_anomaly', missionId: 'anomaly', tier: 1, type: 'counter', counterField: 'anomalies_neutralized', requiredCount: 1, reward: 5_000 },
  { id: 'anomaly_hunter', missionId: 'anomaly', tier: 2, type: 'counter', counterField: 'anomalies_neutralized', requiredCount: 5, reward: 10_000 },
  { id: 'sector_guardian', missionId: 'anomaly', tier: 3, type: 'counter', counterField: 'anomalies_neutralized', requiredCount: 15, reward: 20_000 },
]
