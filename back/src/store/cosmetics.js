/**
 * The astronaut's cosmetics catalogue: what can be owned, how rare it is,
 * what it costs in gems, and which of it the style chests can drop.
 *
 * This table is deliberately duplicated in front/src/store/cosmeticCase.ts —
 * the client needs it to draw the reel, the catalogue and the price tags, the
 * server needs it to roll, to grant and to charge, and neither can be the
 * other's source of truth. The SERVER is authoritative: a client that
 * disagrees draws the wrong filler tiles or the wrong price tag, but it can
 * never win or buy something this file doesn't list, and it can never equip
 * something the user hasn't paid for. Keep the two in step when adding a piece.
 *
 * Rarity here is a guess at silhouette impact, not at production cost: what
 * changes the astronaut's outline from across a leaderboard row sits at the
 * top, what only recolours something sits at the bottom.
 */

/**
 * The stock kit — what a brand new astronaut is already wearing.
 *
 * These are free, permanent and invisible to the whole ownership system: they
 * are never written to user_cosmetics, never rolled by a chest and never
 * priced. That's what makes "unlocked" a real state rather than a formality —
 * a player always has one complete outfit, so a locked piece is genuinely an
 * upgrade over something rather than the difference between dressed and naked.
 *
 * Mirrors DEFAULT_STYLE_IDS in front/src/lib/astronautStyles.ts.
 */
export const DEFAULT_COSMETICS = {
  helmet: 'estandar',
  // Stock glass, empty hand, no backdrop: adding these three slots must
  // change nothing for anyone who doesn't go looking for them.
  visor: 'limpio',
  background: 'estrellas',
  suit: 'estandar',
  boots: 'estandar',
  belt: 'violeta',
  bracelet: 'violeta',
  antenna: 'estandar',
  pack: 'estandar',
  trail: 'llama',
  badge: 'planeta',
  // Both shoulders start empty: a companion is a second character, so it's
  // the one slot where "nothing" is a real look rather than a hole.
  pet: 'ninguna',
  pet2: 'ninguna',
  accent: 'violeta',
}

export function isDefaultCosmetic(slot, itemId) {
  return DEFAULT_COSMETICS[slot] === itemId
}

export const COSMETIC_RARITY_WEIGHTS = {
  consumer: 100,
  milspec: 55,
  restricted: 24,
  classified: 9,
  covert: 3,
  gold: 1,
}

/**
 * Buy-it-outright price per rarity, in gems.
 *
 * Anchored to the rest of the gem economy, NOT to the chest. Every other gem
 * sink in the game lives between 1 and 15 (powerups 1-2, click packs 1-15),
 * with a single 50 at the very top for the x10-clicks permanent upgrade. A
 * cosmetic must stay under that 50: nothing that only changes how you look
 * should cost more than the strongest thing you can actually play with.
 *
 * The chest is deliberately not the anchor. Its rarity weights make a
 * *specific* Gold piece a ~1076-key chase (1 in 1076 per pull), so pricing
 * off expected chest cost would put the top tier near 200 gems. Instead:
 * buying is the sane, boring route to any one piece, and the chest is the
 * lucky shortcut that occasionally beats it at the cheap end.
 *
 * For reference, a gem is worth roughly 5.4 keys (the gem chest pays ~1.85
 * gems per 10-key roll).
 */
export const COSMETIC_GEM_PRICES = {
  consumer: 1,
  milspec: 2,
  restricted: 4,
  classified: 8,
  covert: 15,
  gold: 25,
}

/**
 * Every piece a player can own, i.e. everything except the stock kit above.
 *
 * Every piece can be bought outright with gems, and the style chest can roll
 * any of them except the second shoulder (see COSMETIC_CHEST_POOL). The chest
 * is the cheap, random route; gems are the expensive, certain one.
 */
export const COSMETIC_ITEMS = [
  // --- The companions, one full ladder of their own. ----------------------
  //     Chispa (three shapes, no chassis) up to the Orbe. The right shoulder
  //     is its own purchase at every rung: owning the droid on the left says
  //     nothing about the right.
  { slot: 'pet', itemId: 'chispa', rarity: 'milspec' },
  { slot: 'pet2', itemId: 'chispa', rarity: 'milspec' },
  { slot: 'pet', itemId: 'mascota1', rarity: 'classified' },
  { slot: 'pet2', itemId: 'mascota1', rarity: 'classified' },
  { slot: 'pet', itemId: 'satelite', rarity: 'covert' },
  { slot: 'pet2', itemId: 'satelite', rarity: 'covert' },
  { slot: 'pet', itemId: 'orbe', rarity: 'gold' },
  { slot: 'pet2', itemId: 'orbe', rarity: 'gold' },

  // --- Covert: outline-changing gear. ------------------------------------
  { slot: 'antenna', itemId: 'halo', rarity: 'covert' },

  // --- Classified. -------------------------------------------------------
  { slot: 'pack', itemId: 'reactor', rarity: 'classified' },
  { slot: 'trail', itemId: 'anillos', rarity: 'classified' },
  { slot: 'pack', itemId: 'alas', rarity: 'classified' },
  { slot: 'helmet', itemId: 'grafito', rarity: 'classified' },

  // --- Restricted. -------------------------------------------------------
  { slot: 'pack', itemId: 'aletas', rarity: 'restricted' },
  { slot: 'pack', itemId: 'cilindros', rarity: 'restricted' },
  { slot: 'trail', itemId: 'ionico', rarity: 'restricted' },
  { slot: 'badge', itemId: 'rayo', rarity: 'restricted' },
  { slot: 'suit', itemId: 'carmesi', rarity: 'restricted' },
  { slot: 'suit', itemId: 'grafito', rarity: 'restricted' },
  { slot: 'boots', itemId: 'grafito', rarity: 'restricted' },

  // --- Mil-spec. ---------------------------------------------------------
  { slot: 'antenna', itemId: 'doble', rarity: 'milspec' },
  { slot: 'pack', itemId: 'carga', rarity: 'milspec' },
  { slot: 'badge', itemId: 'estrella', rarity: 'milspec' },
  { slot: 'boots', itemId: 'marino', rarity: 'milspec' },
  { slot: 'helmet', itemId: 'zafiro', rarity: 'milspec' },
  { slot: 'helmet', itemId: 'esmeralda', rarity: 'milspec' },
  { slot: 'helmet', itemId: 'diamante', rarity: 'classified' },
  { slot: 'helmet', itemId: 'rubi', rarity: 'restricted' },
  { slot: 'helmet', itemId: 'oro', rarity: 'restricted' },
  { slot: 'helmet', itemId: 'carmesi', rarity: 'milspec' },
  { slot: 'suit', itemId: 'marino', rarity: 'milspec' },
  { slot: 'boots', itemId: 'carmesi', rarity: 'milspec' },

  // --- Consumer. ---------------------------------------------------------
  { slot: 'boots', itemId: 'arena', rarity: 'consumer' },
  { slot: 'suit', itemId: 'acero', rarity: 'consumer' },
  { slot: 'suit', itemId: 'arena', rarity: 'consumer' },
  { slot: 'boots', itemId: 'acero', rarity: 'consumer' },

  // --- The visor and the backdrop: two slots added after the rest, plus
  //     the turbine pack. Grouped here rather than filed into the rarity
  //     blocks above so the newest batch stays findable; the locker and the
  //     odds table both sort by rarity anyway, so position in this array
  //     never reaches a player.
  { slot: 'visor', itemId: 'reticula', rarity: 'milspec' },
  { slot: 'visor', itemId: 'grieta', rarity: 'restricted' },
  { slot: 'visor', itemId: 'agujero', rarity: 'gold' },
  { slot: 'pack', itemId: 'turbinas', rarity: 'covert' },
  { slot: 'background', itemId: 'rejilla', rarity: 'milspec' },
  { slot: 'background', itemId: 'meteoros', rarity: 'classified' },

  // --- The shared accessory colours. -------------------------------------
  //     Bracelets, belts and trim are one six-colour set (violeta is the
  //     free default of all three), so a colour costs the same and sits in
  //     the same place whichever of the three you are looking at. Three
  //     different rarity ladders had them sorting three different ways.
  //     Grouped by slot rather than filed into the rarity blocks above so
  //     that order stays visible and cannot drift again.
  { slot: 'bracelet', itemId: 'zafiro', rarity: 'consumer' },
  { slot: 'bracelet', itemId: 'grafito', rarity: 'consumer' },
  { slot: 'bracelet', itemId: 'carmesi', rarity: 'consumer' },
  { slot: 'bracelet', itemId: 'esmeralda', rarity: 'milspec' },
  { slot: 'bracelet', itemId: 'rubi', rarity: 'milspec' },
  { slot: 'bracelet', itemId: 'diamante', rarity: 'restricted' },
  { slot: 'bracelet', itemId: 'oro', rarity: 'restricted' },
  { slot: 'belt', itemId: 'zafiro', rarity: 'consumer' },
  { slot: 'belt', itemId: 'grafito', rarity: 'consumer' },
  { slot: 'belt', itemId: 'carmesi', rarity: 'consumer' },
  { slot: 'belt', itemId: 'esmeralda', rarity: 'milspec' },
  { slot: 'belt', itemId: 'rubi', rarity: 'milspec' },
  { slot: 'belt', itemId: 'diamante', rarity: 'restricted' },
  { slot: 'belt', itemId: 'oro', rarity: 'restricted' },
  { slot: 'accent', itemId: 'zafiro', rarity: 'consumer' },
  { slot: 'accent', itemId: 'grafito', rarity: 'consumer' },
  { slot: 'accent', itemId: 'carmesi', rarity: 'consumer' },
  { slot: 'accent', itemId: 'esmeralda', rarity: 'milspec' },
  { slot: 'accent', itemId: 'rubi', rarity: 'milspec' },
  { slot: 'accent', itemId: 'diamante', rarity: 'restricted' },
  { slot: 'accent', itemId: 'oro', rarity: 'restricted' },
]

/**
 * What the cheap style chest can roll: everything except the second shoulder.
 *
 * A chest can hand you a companion, but never the *pair* — `pet2` is gems
 * only. Excluded by slot rather than by a per-item flag because that is
 * exactly the rule: it isn't that these three particular droids are special,
 * it's that the right shoulder is never a drop.
 */
export const COSMETIC_CHEST_POOL = COSMETIC_ITEMS.filter((i) => i.slot !== 'pet2')

/** The pricier chest can't roll the cheap half — same items, same relative odds. */
export const COSMETIC_RARE_POOL = COSMETIC_CHEST_POOL.filter(
  (i) => i.rarity !== 'consumer' && i.rarity !== 'milspec',
)

export function cosmeticKey(item) {
  return `${item.slot}:${item.itemId}`
}

const BY_KEY = new Map(COSMETIC_ITEMS.map((item) => [cosmeticKey(item), item]))

/**
 * The catalogue entry for a slot+id, or null if it isn't ownable — which
 * covers both the stock kit (free, so nothing to sell) and anything the
 * client made up.
 *
 * `pet` and `pet2` are deliberately separate entries rather than one shared
 * companion: they're two shoulders and two purchases, so owning the droid on
 * the left says nothing about the right.
 */
export function getCosmetic(slot, itemId) {
  return BY_KEY.get(`${slot}:${itemId}`) ?? null
}

/** Gem price for a piece, or null if it isn't something you can buy. */
export function cosmeticPrice(slot, itemId) {
  const item = getCosmetic(slot, itemId)
  return item ? COSMETIC_GEM_PRICES[item.rarity] : null
}

/**
 * Can this user wear this? True for the stock kit always, for anything else
 * only once it's in their user_cosmetics rows.
 *
 * This is the gate the whole feature rests on, and it lives here rather than
 * in the client because the client is where the *try-on* happens: previewing
 * an unowned piece is a supported, encouraged thing to do, so "what's on
 * screen" and "what's allowed to be saved" are legitimately different, and
 * only the server can hold the second one.
 */
export function canEquip(slot, itemId, ownedKeys) {
  if (isDefaultCosmetic(slot, itemId)) return true
  return ownedKeys.has(`${slot}:${itemId}`)
}

export function cosmeticPoolFor(chest) {
  return chest === 'styleRare' ? COSMETIC_RARE_POOL : COSMETIC_CHEST_POOL
}

/**
 * Rolls one cosmetic the user doesn't already own, or null if there's nothing
 * left in that chest's pool for them.
 *
 * No duplicates, by design: with a pool this size there's no room for a shard
 * or pity currency to earn its complexity, and a key spent on a piece you
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
