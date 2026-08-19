/**
 * Gem packs — real money via RevenueCat, offering `gems`. `id` must match
 * the RevenueCat product identifier exactly.
 */
export const GEM_PACKS = [
  { id: 'x1_gem', amount: 1 },
  { id: 'x10_gems', amount: 10 },
  { id: 'x50_gems', amount: 50 },
  { id: 'x100_gems', amount: 100 },
]

export function getGemPack(id) {
  return GEM_PACKS.find((p) => p.id === id)
}
