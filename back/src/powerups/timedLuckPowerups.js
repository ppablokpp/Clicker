/**
 * A temporary, high-variance version of the permanent Suerte upgrade: a
 * bigger multiplier for a short window. It MULTIPLIES the permanent Suerte
 * tier you own (see toPublicUser / front Home.tsx) rather than replacing it,
 * which is why the tiers here are modest.
 *
 * `chance` is a FLOOR, not the real odds: Home takes the better of this and
 * the player's own Prob. de suerte level, so a maxed tree keeps its 19% while
 * one of these runs. It used to be read as the actual chance, which meant
 * activating one dropped a maxed player from 19% to 1%.
 *
 * The ids do NOT match their multipliers any more, and renaming them is not
 * an option: they are the primary key in user_inventory, so a rename orphans
 * whatever people already own — there is still a luck_x75 row in there from
 * an earlier catalogue to prove it.
 *
 * Freely purchasable — not sequential like the permanent ladder — since
 * only one can run at a time anyway (buying a new one replaces the old one).
 */
export const TIMED_LUCK_CATALOG = [
  { id: 'luck_x10', cost: 5_000, currency: 'clicks', durationSeconds: 20, chance: 0.01, multiplier: 2 },
  { id: 'luck_x25', cost: 10_000, currency: 'clicks', durationSeconds: 20, chance: 0.01, multiplier: 5 },
  { id: 'luck_x50', cost: 1, currency: 'gems', durationSeconds: 20, chance: 0.01, multiplier: 10 },
  { id: 'luck_x100', cost: 2, currency: 'gems', durationSeconds: 20, chance: 0.01, multiplier: 20 },
]

export function getTimedLuckPowerup(id) {
  return TIMED_LUCK_CATALOG.find((p) => p.id === id)
}
