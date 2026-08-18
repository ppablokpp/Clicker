/**
 * Permanent luck upgrades — not cumulative (only the highest-tier owned one
 * ever rolls, enforced client-side) and unlock in order: array order IS
 * purchase order, each tier requires owning the one right before it
 * (enforced in permanentUpgradesRepository.buy). Same multiplier tiers as
 * the temporary powerups, for consistency.
 */
export const PERMANENT_UPGRADE_CATALOG = [
  { id: 'luck_x2', cost: 5_000, chance: 0.01, multiplier: 2 },
  { id: 'luck_x3', cost: 10_000, chance: 0.01, multiplier: 3 },
  { id: 'luck_x5', cost: 25_000, chance: 0.01, multiplier: 5 },
  { id: 'luck_x10', cost: 50_000, chance: 0.01, multiplier: 10 },
]

export function getPermanentUpgrade(id) {
  return PERMANENT_UPGRADE_CATALOG.find((u) => u.id === id)
}
