import type { AstronautSlot } from '../components/AstronautPiecePreview'

/**
 * The client's copy of the cosmetics catalogue: what exists, how rare it is,
 * what it costs in gems, and which of it the style chests can drop.
 *
 * Nothing here is authoritative. The real table lives in
 * back/src/store/cosmetics.js, which is what actually rolls, grants, charges
 * and — crucially — decides what a player is allowed to *equip*. This copy
 * exists so the reel, the odds modal, the price tags and the locked-item
 * grid can all draw themselves without a round trip. A client that disagrees
 * with the server draws a wrong price tag; it can never win, buy or wear
 * something the server doesn't list. Keep the two in step when adding a piece.
 */

/**
 * Same six-step ladder the click/gem cases already use, so a rarity reads
 * the same everywhere in the store — the colours come straight from
 * CASE_PRIZE_STYLES rather than being redefined here.
 */
export type CosmeticRarity = 'consumer' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'gold'

/**
 * Roll weight per rarity rather than per item, so the table below stays
 * readable as a list of *what's in the chest* — the odds are one decision
 * made once, in one place, instead of 30 numbers to keep consistent.
 */
export const COSMETIC_RARITY_WEIGHTS: Record<CosmeticRarity, number> = {
  consumer: 100,
  milspec: 55,
  restricted: 24,
  classified: 9,
  covert: 3,
  gold: 1,
}

/**
 * Ascending, common first. The catalogue reads down to the rarest band, so
 * the thing you're actually chasing is the last thing you see — and it means
 * an index into this array is already a "how good was this pull" tier, which
 * is exactly what the reveal sound wants.
 */
export const COSMETIC_RARITY_ORDER: CosmeticRarity[] = [
  'consumer',
  'milspec',
  'restricted',
  'classified',
  'covert',
  'gold',
]

/**
 * Buy-it-outright price per rarity, in gems. Mirrors COSMETIC_GEM_PRICES in
 * back/src/store/cosmetics.js, which is the one that actually charges — this
 * copy only draws the price tag.
 *
 * Anchored to the rest of the gem economy, not to the chest: every other gem
 * sink sits between 1 and 15, with a single 50 for the x10-clicks permanent
 * upgrade, and a cosmetic must stay under that. See the backend copy for the
 * full reasoning.
 */
export const COSMETIC_GEM_PRICES: Record<CosmeticRarity, number> = {
  consumer: 1,
  milspec: 2,
  restricted: 4,
  classified: 8,
  covert: 15,
  gold: 25,
}

export interface CosmeticCaseItem {
  slot: AstronautSlot
  id: string
  rarity: CosmeticRarity
}

/**
 * Every piece a player can own — i.e. everything except the stock kit, which
 * is free, permanent, and deliberately absent from this table (see
 * DEFAULT_STYLE_IDS: a default piece is never sold, never rolled and never
 * locked, so listing it here would put a price on something nobody can buy).
 *
 * Rarity is a guess at *silhouette impact*, not at production cost: the
 * things that change the astronaut's outline from across a leaderboard row
 * (a companion, winged packs, a halo) sit at the top, and the pieces that
 * only recolour something sit at the bottom.
 *
 * Every piece can be bought outright with gems, and the style chest can roll
 * any of them except the second shoulder (see COSMETIC_CASE_ITEMS).
 *
 * `pet` and `pet2` share one catalogue and appear here once, as `pet`: a
 * companion you own should be equippable on either shoulder, so listing both
 * slots would be selling the same item twice.
 */
export const COSMETIC_CATALOG: CosmeticCaseItem[] = [
  // The companions, one full ladder of their own — Chispa (three shapes, no
  // chassis) up to the Orbe. The right shoulder is its own purchase at every
  // rung: owning the droid on the left says nothing about the right.
  { slot: 'pet', id: 'chispa', rarity: 'milspec' },
  { slot: 'pet2', id: 'chispa', rarity: 'milspec' },
  { slot: 'pet', id: 'mascota1', rarity: 'classified' },
  { slot: 'pet2', id: 'mascota1', rarity: 'classified' },
  { slot: 'pet', id: 'satelite', rarity: 'covert' },
  { slot: 'pet2', id: 'satelite', rarity: 'covert' },
  { slot: 'pet', id: 'orbe', rarity: 'gold' },
  { slot: 'pet2', id: 'orbe', rarity: 'gold' },

  // Covert — outline-changing gear.
  { slot: 'antenna', id: 'halo', rarity: 'covert' },

  // Classified.
  { slot: 'pack', id: 'reactor', rarity: 'classified' },
  { slot: 'trail', id: 'anillos', rarity: 'classified' },
  { slot: 'pack', id: 'alas', rarity: 'classified' },
  { slot: 'helmet', id: 'grafito', rarity: 'classified' },

  // Restricted.
  { slot: 'pack', id: 'aletas', rarity: 'restricted' },
  { slot: 'pack', id: 'cilindros', rarity: 'restricted' },
  { slot: 'trail', id: 'ionico', rarity: 'restricted' },
  { slot: 'badge', id: 'rayo', rarity: 'restricted' },
  { slot: 'suit', id: 'carmesi', rarity: 'restricted' },
  { slot: 'suit', id: 'grafito', rarity: 'restricted' },
  { slot: 'boots', id: 'grafito', rarity: 'restricted' },

  // Mil-spec.
  { slot: 'antenna', id: 'doble', rarity: 'milspec' },
  { slot: 'pack', id: 'carga', rarity: 'milspec' },
  { slot: 'badge', id: 'estrella', rarity: 'milspec' },
  { slot: 'boots', id: 'marino', rarity: 'milspec' },
  { slot: 'helmet', id: 'esmeralda', rarity: 'milspec' },
  { slot: 'helmet', id: 'diamante', rarity: 'classified' },
  { slot: 'helmet', id: 'oro', rarity: 'restricted' },
  { slot: 'helmet', id: 'carmesi', rarity: 'milspec' },
  { slot: 'suit', id: 'marino', rarity: 'milspec' },
  { slot: 'boots', id: 'carmesi', rarity: 'milspec' },

  // Consumer.
  { slot: 'boots', id: 'arena', rarity: 'consumer' },
  { slot: 'suit', id: 'acero', rarity: 'consumer' },
  { slot: 'suit', id: 'arena', rarity: 'consumer' },
  { slot: 'boots', id: 'acero', rarity: 'consumer' },

  // --- The visor and the backdrop: two slots added after the rest, plus
  //     the turbine pack. Grouped here rather than filed into the rarity
  //     blocks above so the newest batch stays findable; the locker and the
  //     odds table both sort by rarity anyway, so position in this array
  //     never reaches a player.
  { slot: 'visor', id: 'reticula', rarity: 'milspec' },
  { slot: 'visor', id: 'grieta', rarity: 'restricted' },
  { slot: 'visor', id: 'agujero', rarity: 'gold' },
  { slot: 'pack', id: 'turbinas', rarity: 'covert' },
  { slot: 'background', id: 'rejilla', rarity: 'milspec' },
  { slot: 'background', id: 'meteoros', rarity: 'classified' },

  // --- The shared accessory colours. -------------------------------------
  //     Bracelets, belts and trim are one six-colour set (violeta is the
  //     free default of all three), so a colour costs the same and sits in
  //     the same place whichever of the three you are looking at. Three
  //     different rarity ladders had them sorting three different ways.
  //     Grouped by slot rather than filed into the rarity blocks above so
  //     that order stays visible and cannot drift again.
  { slot: 'bracelet', id: 'diamante', rarity: 'restricted' },
  { slot: 'bracelet', id: 'esmeralda', rarity: 'consumer' },
  { slot: 'bracelet', id: 'grafito', rarity: 'consumer' },
  { slot: 'bracelet', id: 'carmesi', rarity: 'consumer' },
  { slot: 'bracelet', id: 'oro', rarity: 'restricted' },
  { slot: 'belt', id: 'diamante', rarity: 'restricted' },
  { slot: 'belt', id: 'esmeralda', rarity: 'consumer' },
  { slot: 'belt', id: 'grafito', rarity: 'consumer' },
  { slot: 'belt', id: 'carmesi', rarity: 'consumer' },
  { slot: 'belt', id: 'oro', rarity: 'restricted' },
  { slot: 'accent', id: 'diamante', rarity: 'restricted' },
  { slot: 'accent', id: 'esmeralda', rarity: 'consumer' },
  { slot: 'accent', id: 'grafito', rarity: 'consumer' },
  { slot: 'accent', id: 'carmesi', rarity: 'consumer' },
  { slot: 'accent', id: 'oro', rarity: 'restricted' },
]

/**
 * What the cheap style chest can roll: everything except the second shoulder,
 * which is gems only. The reel and the odds table both read this, and both
 * still hide what you already own.
 */
export const COSMETIC_CASE_ITEMS: CosmeticCaseItem[] = COSMETIC_CATALOG.filter(
  (i) => i.slot !== 'pet2',
)

/** Stable React key / lookup id — a slot+id pair, since ids repeat across slots. */
export function cosmeticKey(item: { slot: AstronautSlot; id: string }): string {
  return `${item.slot}:${item.id}`
}

const CATALOG_BY_KEY = new Map(COSMETIC_CATALOG.map((item) => [cosmeticKey(item), item]))

/**
 * The catalogue entry for a piece, or null if it's stock kit (free, unlisted).
 *
 * `pet` and `pet2` are separate entries on purpose: two shoulders, two
 * purchases. Owning the droid on the left says nothing about the right.
 */
export function getCosmetic(slot: AstronautSlot, id: string): CosmeticCaseItem | null {
  return CATALOG_BY_KEY.get(`${slot}:${id}`) ?? null
}

/** Gem price for a piece, or 0 for anything from the stock kit. */
export function cosmeticPrice(slot: AstronautSlot, id: string): number {
  const item = getCosmetic(slot, id)
  return item ? COSMETIC_GEM_PRICES[item.rarity] : 0
}

/**
 * Which profile string names this slot. `pet` deliberately borrows the tab
 * label ("Mascotas") rather than "Primera mascota": in a chest you win the
 * companion, not the shoulder it stands on.
 */
export const COSMETIC_SLOT_LABEL_KEYS: Record<AstronautSlot, string> = {
  helmet: 'slotHelmet',
  visor: 'slotVisor',
  background: 'slotBackground',
  suit: 'slotSuit',
  boots: 'slotBoots',
  bracelet: 'slotBracelet',
  belt: 'slotBelt',
  accent: 'slotAccent',
  antenna: 'slotAntenna',
  pack: 'slotPack',
  trail: 'slotTrail',
  badge: 'slotBadge',
  pet: 'slotPet',
  pet2: 'slotPet',
}

/**
 * The pricier style chest's pool: everything from Raro up. Same items and the
 * same relative odds within the band — the expensive chest doesn't roll a
 * different table, it just can't roll the cheap half. That's a difference a
 * player can hold in their head without reading a second odds screen.
 */
export const COSMETIC_RARE_POOL: CosmeticCaseItem[] = COSMETIC_CASE_ITEMS.filter(
  (i) => i.rarity !== 'consumer' && i.rarity !== 'milspec',
)

function poolWeight(pool: CosmeticCaseItem[]): number {
  return pool.reduce((sum, item) => sum + COSMETIC_RARITY_WEIGHTS[item.rarity], 0)
}

/** Odds for one whole rarity band, as a percentage of the given pool. */
export function cosmeticRarityChance(
  rarity: CosmeticRarity,
  pool: CosmeticCaseItem[] = COSMETIC_CASE_ITEMS,
): number {
  const total = poolWeight(pool)
  if (total === 0) return 0
  const bandWeight =
    pool.filter((i) => i.rarity === rarity).length * COSMETIC_RARITY_WEIGHTS[rarity]
  return (bandWeight / total) * 100
}

/**
 * Local weighted roll — preview only. The real chest will roll server-side
 * like the others; this exists purely so the reel has something to land on
 * while the economy doesn't exist.
 */
export function rollCosmetic(pool: CosmeticCaseItem[] = COSMETIC_CASE_ITEMS): CosmeticCaseItem {
  let r = Math.random() * poolWeight(pool)
  for (const item of pool) {
    const w = COSMETIC_RARITY_WEIGHTS[item.rarity]
    if (r < w) return item
    r -= w
  }
  return pool[pool.length - 1]
}
