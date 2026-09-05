import type { AstronautSlot } from '../components/AstronautPiecePreview'

/**
 * Front-only preview of a cosmetics chest.
 *
 * Nothing here is authoritative and nothing here is owned: there is no
 * purchase, no unlock, no inventory and no server roll yet. This file exists
 * so the chest can be *looked at* — every item in it is a cosmetic that
 * already exists in astronautStyles.ts and already draws itself in the
 * customization grid, so the card shows real art rather than placeholders.
 *
 * When this becomes real, the roll moves to the backend (like every other
 * case in the store, which never decides a prize client-side) and the table
 * below becomes a seed for it, not the source of truth.
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

export interface CosmeticCaseItem {
  slot: AstronautSlot
  id: string
  rarity: CosmeticRarity
}

/**
 * Rarity here is a guess at *silhouette impact*, not at production cost: the
 * things that change the astronaut's outline from across a leaderboard row
 * (a companion, winged packs, a halo) sit at the top, and the pieces that
 * only recolour something sit at the bottom. That ordering is the part worth
 * arguing about once this is real — the exact ids are just what exists today.
 *
 * `pet` and `pet2` share one catalogue and appear here once, as `pet`: a
 * companion you own should be equippable on either shoulder, so listing both
 * slots would be selling the same item twice.
 */
export const COSMETIC_CASE_ITEMS: CosmeticCaseItem[] = [
  // Gold — the two companions that read as a second character on screen.
  { slot: 'pet', id: 'orbe', rarity: 'gold' },
  { slot: 'pet', id: 'satelite', rarity: 'gold' },

  // Covert — outline-changing gear.
  { slot: 'pet', id: 'mascota1', rarity: 'covert' },
  { slot: 'pack', id: 'alas', rarity: 'covert' },
  { slot: 'antenna', id: 'halo', rarity: 'covert' },

  // Classified.
  { slot: 'pack', id: 'reactor', rarity: 'classified' },
  { slot: 'trail', id: 'anillos', rarity: 'classified' },
  { slot: 'helmet', id: 'grafito', rarity: 'classified' },
  { slot: 'bracelet', id: 'oro', rarity: 'classified' },

  // Restricted.
  { slot: 'pack', id: 'aletas', rarity: 'restricted' },
  { slot: 'pack', id: 'cilindros', rarity: 'restricted' },
  { slot: 'trail', id: 'ionico', rarity: 'restricted' },
  { slot: 'badge', id: 'rayo', rarity: 'restricted' },
  { slot: 'belt', id: 'oro', rarity: 'restricted' },
  { slot: 'suit', id: 'carmesi', rarity: 'restricted' },

  // Mil-spec.
  { slot: 'antenna', id: 'doble', rarity: 'milspec' },
  { slot: 'pack', id: 'carga', rarity: 'milspec' },
  { slot: 'badge', id: 'estrella', rarity: 'milspec' },
  { slot: 'bracelet', id: 'esmeralda', rarity: 'milspec' },
  { slot: 'bracelet', id: 'cian', rarity: 'milspec' },
  { slot: 'boots', id: 'marino', rarity: 'milspec' },
  { slot: 'helmet', id: 'esmeralda', rarity: 'milspec' },

  // Consumer.
  { slot: 'trail', id: 'llama', rarity: 'consumer' },
  { slot: 'badge', id: 'planeta', rarity: 'consumer' },
  { slot: 'bracelet', id: 'violeta', rarity: 'consumer' },
  { slot: 'bracelet', id: 'grafito', rarity: 'consumer' },
  { slot: 'belt', id: 'cian', rarity: 'consumer' },
  { slot: 'boots', id: 'arena', rarity: 'consumer' },
  { slot: 'suit', id: 'acero', rarity: 'consumer' },
  { slot: 'accent', id: 'cian', rarity: 'consumer' },
]

/** Stable React key / lookup id — a slot+id pair, since ids repeat across slots. */
export function cosmeticKey(item: CosmeticCaseItem): string {
  return `${item.slot}:${item.id}`
}

/**
 * Which profile string names this slot. `pet` deliberately borrows the tab
 * label ("Mascotas") rather than "Primera mascota": in a chest you win the
 * companion, not the shoulder it stands on.
 */
export const COSMETIC_SLOT_LABEL_KEYS: Record<AstronautSlot, string> = {
  helmet: 'slotHelmet',
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
