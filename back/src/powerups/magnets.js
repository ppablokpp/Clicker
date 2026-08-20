/**
 * Passive currency-gamble powerup: while active, every click has a small
 * independent chance to also grant one key or one gem — rolled server-side
 * in clicks.js's /increment (never trusted from the client, unlike the
 * click-multiplier/luck powerups which just scale a display number). Same
 * cooldown-locked-category pattern as the other timed powerups — buying
 * either one locks both for an hour.
 */
export const MAGNET_PROC_CHANCE = 0.001

export const MAGNET_CATALOG = [
  { id: 'key_magnet', currency: 'keys', cost: 100_000, durationSeconds: 10, procChance: MAGNET_PROC_CHANCE },
  { id: 'gem_magnet', currency: 'gems', cost: 100_000, durationSeconds: 10, procChance: MAGNET_PROC_CHANCE },
]

export function getMagnet(id) {
  return MAGNET_CATALOG.find((m) => m.id === id)
}
