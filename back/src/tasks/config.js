/**
 * Onboarding tasks — one-time goals that pay out a flat platino reward the
 * first time each is reached. Completion is checked against a tree node's
 * own level (user_permanent_upgrades), not a separate counter, so there's
 * nothing new to keep in sync as the player buys upgrades normally.
 */
import { AUTOCLICK_NODE_ID } from '../tree/autoClick.js'
import { MULTI_SHOT_NODE_ID } from '../tree/multiShot.js'
import { SCOUT_DRONE_NODE_ID } from '../tree/scoutDrone.js'

export const TASKS = [
  // First drone — level 1 of the root autoclick node.
  { id: 'first_drone', nodeId: AUTOCLICK_NODE_ID, requiredLevel: 1, reward: 1000 },
  // Multidisparo level 0 already gives 1 finger — level 1 is the second one.
  { id: 'second_cannon', nodeId: MULTI_SHOT_NODE_ID, requiredLevel: 1, reward: 2000 },
  { id: 'first_scout_drone', nodeId: SCOUT_DRONE_NODE_ID, requiredLevel: 1, reward: 5000 },
]
