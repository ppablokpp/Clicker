/**
 * A temporary, high-variance version of the permanent Suerte upgrade: same
 * 1% chance per click, but a much bigger multiplier for a short window.
 * Freely purchasable — not sequential like the permanent ladder — since
 * only one can run at a time anyway (buying a new one replaces the old one).
 */
export const TIMED_LUCK_CATALOG = [
  { id: 'luck_x50', cost: 1_000, durationSeconds: 30, chance: 0.01, multiplier: 50 },
  { id: 'luck_x100', cost: 3_000, durationSeconds: 25, chance: 0.01, multiplier: 100 },
  { id: 'luck_x200', cost: 8_000, durationSeconds: 20, chance: 0.01, multiplier: 200 },
  { id: 'luck_x500', cost: 20_000, durationSeconds: 15, chance: 0.01, multiplier: 500 },
]

export function getTimedLuckPowerup(id) {
  return TIMED_LUCK_CATALOG.find((p) => p.id === id)
}
