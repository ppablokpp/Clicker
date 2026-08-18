/**
 * Single source of truth for powerups: cost/duration/multiplier are enforced
 * here server-side, never trusted from the client. Add more by adding an
 * entry — the frontend fetches this list instead of hardcoding it.
 */
export const POWERUP_CATALOG = [
  { id: 'click_x2', cost: 300, durationSeconds: 30, multiplier: 2 },
  { id: 'click_x3', cost: 1500, durationSeconds: 60, multiplier: 3 },
  { id: 'click_x5', cost: 2500, durationSeconds: 45, multiplier: 5 },
  { id: 'click_x10', cost: 5000, durationSeconds: 15, multiplier: 10 },
]

export function getPowerup(id) {
  return POWERUP_CATALOG.find((p) => p.id === id)
}
