/**
 * Single source of truth for powerups: cost/duration/multiplier are enforced
 * here server-side, never trusted from the client. Add more by adding an
 * entry — the frontend fetches this list instead of hardcoding it.
 */
export const POWERUP_CATALOG = [
  { id: 'click_x2', cost: 1000, currency: 'clicks', durationSeconds: 20, multiplier: 2 },
  { id: 'click_x3', cost: 5000, currency: 'clicks', durationSeconds: 45, multiplier: 3 },
  { id: 'click_x5', cost: 1, currency: 'gems', durationSeconds: 30, multiplier: 5 },
  { id: 'click_x10', cost: 2, currency: 'gems', durationSeconds: 15, multiplier: 10 },
]

export function getPowerup(id) {
  return POWERUP_CATALOG.find((p) => p.id === id)
}
