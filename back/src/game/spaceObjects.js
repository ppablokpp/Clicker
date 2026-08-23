/**
 * The Home page's centerpiece: a space object you break with clicks
 * (auto and manual alike) instead of a bare click counter. Each object
 * costs more than the last (growing curve, same shape idle-game cost
 * curves always use here), and `objects_broken` — not total clicks — is
 * what now drives prestige.
 */
export const OBJECT_BASE_COST = 500
export const OBJECT_COST_RATIO = 1.12

export function objectCost(objectsBroken) {
  return Math.ceil(OBJECT_BASE_COST * OBJECT_COST_RATIO ** objectsBroken)
}

/**
 * Applies `addedProgress` (a raw click amount — same value that credits
 * `total_clicks`) on top of whatever progress/level a user already has,
 * breaking as many objects as that amount covers in one go. Bounded by
 * construction: each iteration consumes at least OBJECT_BASE_COST off
 * `progress`, so this can't loop more than `addedProgress / OBJECT_BASE_COST`
 * times even for the largest single request the click route allows.
 */
export function applyObjectProgress(objectsBroken, progress, addedProgress) {
  let level = objectsBroken
  let remaining = progress + addedProgress
  let broken = 0
  let cost = objectCost(level)
  while (remaining >= cost) {
    remaining -= cost
    level += 1
    broken += 1
    cost = objectCost(level)
  }
  return { objectsBroken: level, objectProgress: remaining, broken }
}
