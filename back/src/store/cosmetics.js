/**
 * The cosmetics the style chests can drop.
 *
 * This table is deliberately duplicated in front/src/store/cosmeticCase.ts —
 * the client needs it to draw the reel and the catalogue, the server needs it
 * to roll and to grant, and neither can be the other's source of truth. The
 * SERVER is authoritative: a client that disagrees just draws the wrong
 * filler tiles, it can never win something this file doesn't list. Keep the
 * two in step when adding a piece.
 *
 * Rarity here is a guess at silhouette impact, not at production cost: what
 * changes the astronaut's outline from across a leaderboard row sits at the
 * top, what only recolours something sits at the bottom.
 */

export const COSMETIC_RARITY_WEIGHTS = {
  consumer: 100,
  milspec: 55,
  restricted: 24,
  classified: 9,
  covert: 3,
  gold: 1,
}

export const COSMETIC_ITEMS = [
  { slot: 'pet', itemId: 'orbe', rarity: 'gold' },
  { slot: 'pet', itemId: 'satelite', rarity: 'gold' },

  { slot: 'pet', itemId: 'mascota1', rarity: 'covert' },
  { slot: 'pack', itemId: 'alas', rarity: 'covert' },
  { slot: 'antenna', itemId: 'halo', rarity: 'covert' },

  { slot: 'pack', itemId: 'reactor', rarity: 'classified' },
  { slot: 'trail', itemId: 'anillos', rarity: 'classified' },
  { slot: 'helmet', itemId: 'grafito', rarity: 'classified' },
  { slot: 'bracelet', itemId: 'oro', rarity: 'classified' },

  { slot: 'pack', itemId: 'aletas', rarity: 'restricted' },
  { slot: 'pack', itemId: 'cilindros', rarity: 'restricted' },
  { slot: 'trail', itemId: 'ionico', rarity: 'restricted' },
  { slot: 'badge', itemId: 'rayo', rarity: 'restricted' },
  { slot: 'belt', itemId: 'oro', rarity: 'restricted' },
  { slot: 'suit', itemId: 'carmesi', rarity: 'restricted' },

  { slot: 'antenna', itemId: 'doble', rarity: 'milspec' },
  { slot: 'pack', itemId: 'carga', rarity: 'milspec' },
  { slot: 'badge', itemId: 'estrella', rarity: 'milspec' },
  { slot: 'bracelet', itemId: 'esmeralda', rarity: 'milspec' },
  { slot: 'bracelet', itemId: 'cian', rarity: 'milspec' },
  { slot: 'boots', itemId: 'marino', rarity: 'milspec' },
  { slot: 'helmet', itemId: 'esmeralda', rarity: 'milspec' },

  { slot: 'trail', itemId: 'llama', rarity: 'consumer' },
  { slot: 'badge', itemId: 'planeta', rarity: 'consumer' },
  { slot: 'bracelet', itemId: 'violeta', rarity: 'consumer' },
  { slot: 'bracelet', itemId: 'grafito', rarity: 'consumer' },
  { slot: 'belt', itemId: 'cian', rarity: 'consumer' },
  { slot: 'boots', itemId: 'arena', rarity: 'consumer' },
  { slot: 'suit', itemId: 'acero', rarity: 'consumer' },
  { slot: 'accent', itemId: 'cian', rarity: 'consumer' },
]

/** The pricier chest can't roll the cheap half — same items, same relative odds. */
export const COSMETIC_RARE_POOL = COSMETIC_ITEMS.filter(
  (i) => i.rarity !== 'consumer' && i.rarity !== 'milspec',
)

export function cosmeticKey(item) {
  return `${item.slot}:${item.itemId}`
}

export function cosmeticPoolFor(chest) {
  return chest === 'styleRare' ? COSMETIC_RARE_POOL : COSMETIC_ITEMS
}

/**
 * Rolls one cosmetic the user doesn't already own, or null if there's nothing
 * left in that chest's pool for them.
 *
 * No duplicates, by design: with 30 pieces there's no room for a shard or
 * pity currency to earn its complexity, and a key spent on a piece you
 * already have is the fastest way to make a cosmetics chest feel like a scam.
 * Filtering the pool costs one array pass and removes the whole problem — the
 * cost is that the chest eventually runs dry, which is a collection finishing
 * rather than a failure.
 */
export function rollCosmetic(chest, ownedKeys) {
  const pool = cosmeticPoolFor(chest).filter((item) => !ownedKeys.has(cosmeticKey(item)))
  if (pool.length === 0) return null
  const total = pool.reduce((sum, item) => sum + COSMETIC_RARITY_WEIGHTS[item.rarity], 0)
  let r = Math.random() * total
  for (const item of pool) {
    const w = COSMETIC_RARITY_WEIGHTS[item.rarity]
    if (r < w) return item
    r -= w
  }
  return pool[pool.length - 1]
}
