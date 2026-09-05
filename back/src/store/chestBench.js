import { CASE_PRIZES, pickWeightedPrize } from './dailyCase.js'
import { GEM_CHEST_PRIZES, pickGemChestPrize } from './gemChest.js'

/**
 * The chest bench — the reworked loot flow that replaced "buy a chest with
 * material, then open it with a key".
 *
 * A chest now has exactly one price, in keys, and opening it needs nothing
 * else: no owned-chest inventory, no second currency, no 10-chest cap. Up to
 * five are opened in a single transaction so a batch either all lands or none
 * of it does — five separate requests could half-succeed and leave the client
 * showing prizes the server never granted.
 */
export const MAX_CHESTS_PER_PULL = 5

/**
 * `kind` decides how a chest pays out, and it's the only thing that differs
 * between them here:
 *
 * - 'currency' chests roll before the transaction opens (nothing about the
 *   roll depends on the user's state) and credit a balance.
 * - 'cosmetic' chests roll INSIDE it, because the pool depends on what the
 *   user already owns — see rollCosmetic's no-duplicates rule.
 */
export const BENCH_CHESTS = {
  material: { kind: 'currency', keyCost: 1, prizes: CASE_PRIZES, roll: pickWeightedPrize },
  gems: { kind: 'currency', keyCost: 10, prizes: GEM_CHEST_PRIZES, roll: pickGemChestPrize },
  style: { kind: 'cosmetic', keyCost: 1 },
  styleRare: { kind: 'cosmetic', keyCost: 5 },
}

export function isBenchChest(id) {
  return Object.prototype.hasOwnProperty.call(BENCH_CHESTS, id)
}
