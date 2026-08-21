/**
 * A temporary, high-variance version of the permanent Suerte upgrade: same
 * 1% chance per click, but a bigger multiplier for a short window. It
 * MULTIPLIES the permanent Suerte tier you own (see toPublicUser /
 * front Home.tsx), so tiers were deliberately kept modest — owning
 * permanent x10 and this x100 already caps the combined roll at x1000.
 * Freely purchasable — not sequential like the permanent ladder — since
 * only one can run at a time anyway (buying a new one replaces the old one).
 */
export const TIMED_LUCK_CATALOG = [
  { id: 'luck_x10', cost: 5_000, currency: 'clicks', durationSeconds: 20, chance: 0.01, multiplier: 10 },
  { id: 'luck_x25', cost: 10_000, currency: 'clicks', durationSeconds: 20, chance: 0.01, multiplier: 25 },
  { id: 'luck_x50', cost: 1, currency: 'gems', durationSeconds: 20, chance: 0.01, multiplier: 50 },
  { id: 'luck_x100', cost: 2, currency: 'gems', durationSeconds: 20, chance: 0.01, multiplier: 100 },
]

export function getTimedLuckPowerup(id) {
  return TIMED_LUCK_CATALOG.find((p) => p.id === id)
}
