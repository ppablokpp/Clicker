/**
 * Gem packs — real money via RevenueCat, offering `gems`. `id` must match
 * the RevenueCat product identifier exactly. Only one tier exists in
 * RevenueCat so far — add more here once more products are created there.
 */
export const GEM_PACKS = [{ id: 'x1_gem', amount: 1 }]

export function getGemPack(id) {
  return GEM_PACKS.find((p) => p.id === id)
}
