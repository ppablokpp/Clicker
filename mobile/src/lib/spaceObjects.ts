// Mirrors back/src/game/spaceObjects.js's formula exactly — the backend is
// the source of truth for what actually gets persisted, this is purely so
// the ring can show "progress toward the current object's cost" without a
// round trip.
export const OBJECT_BASE_COST = 500
export const OBJECT_COST_RATIO = 1.12

export function objectCost(objectsBroken: number): number {
  return Math.ceil(OBJECT_BASE_COST * OBJECT_COST_RATIO ** objectsBroken)
}

/**
 * Mirrors back/src/game/spaceObjects.js's applyObjectProgress exactly —
 * used here purely for local prediction (the object visibly filling up and
 * even breaking on the very click that does it), same idea as how
 * totalClicks predicts ahead of the real flush instead of waiting for it.
 */
export function applyObjectProgress(
  objectsBroken: number,
  progress: number,
  addedProgress: number,
): { objectsBroken: number; objectProgress: number } {
  let level = objectsBroken
  let remaining = progress + addedProgress
  let cost = objectCost(level)
  while (remaining >= cost) {
    remaining -= cost
    level += 1
    cost = objectCost(level)
  }
  return { objectsBroken: level, objectProgress: remaining }
}
