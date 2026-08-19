/**
 * Second case — same CS:GO-style mechanic as the click case, but pays out
 * gems instead. The chest is bought with clicks, then opened with keys —
 * or opened straight away with gems, bypassing the need to own a chest at
 * all.
 */
export const GEM_CHEST_CHEST_COST = 20_000
export const GEM_CHEST_KEY_COST = 10
export const GEM_CHEST_GEM_COST = 2

export const GEM_CHEST_PRIZES = [
  { id: 'gem_1', amount: 1, currency: 'gems', weight: 65 },
  { id: 'gem_2', amount: 2, currency: 'gems', weight: 30 },
  { id: 'gem_3', amount: 3, currency: 'gems', weight: 5 },
]

export function pickGemChestPrize() {
  const total = GEM_CHEST_PRIZES.reduce((sum, p) => sum + p.weight, 0)
  let r = Math.random() * total
  for (const p of GEM_CHEST_PRIZES) {
    if (r < p.weight) return p
    r -= p.weight
  }
  return GEM_CHEST_PRIZES[GEM_CHEST_PRIZES.length - 1]
}
