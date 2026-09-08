/**
 * The four chests on the bench. Mirrors back/src/store/chestBench.js for the
 * two the server pays out — the server is still the authority on price and on
 * what drops; these are what the card draws.
 */
export type ChestId = 'material' | 'gems' | 'style' | 'styleRare'

export const MAX_SELECTED = 5

/**
 * Which chests the rack shows, in order.
 *
 * The two style chests are commented out until the customization screen
 * actually gates on what you own — right now every piece is available to
 * everyone there, so a chest that sells you one is selling something you
 * already have. Everything behind them is finished and left in place: the
 * server rolls and grants them, user_cosmetics records them, the catalogue
 * draws them. Put the two ids back in this array and they return.
 */
export const CHEST_ORDER: ChestId[] = ['material', 'gems', 'style', 'styleRare']

/**
 * Display only — the server charges from its own copy of these
 * (back/src/store/chestBench.js). Keep the two in step.
 */
export const CHEST_KEY_COST: Record<ChestId, number> = {
  material: 1,
  gems: 10,
  style: 1,
  styleRare: 10,
}

/**
 * Which chests pay out a cosmetic rather than a balance. Only affects how the
 * card draws them — every chest costs keys and every roll is the server's.
 */
const COSMETIC_CHESTS = new Set<ChestId>(['style', 'styleRare'])

export function isCosmeticChest(chest: ChestId): boolean {
  return COSMETIC_CHESTS.has(chest)
}
