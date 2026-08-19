/**
 * Key packs — real money via RevenueCat, offering `keys`. `id` must match
 * the RevenueCat product identifier exactly. Only one tier exists in
 * RevenueCat so far — add more here once more products are created there.
 */
export const KEY_PACKS = [{ id: 'x5_keys', amount: 5 }]

export function getKeyPack(id) {
  return KEY_PACKS.find((p) => p.id === id)
}
