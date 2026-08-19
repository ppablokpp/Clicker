/**
 * Key packs — real money via RevenueCat, offering `keys`. `id` must match
 * the RevenueCat product identifier exactly.
 */
export const KEY_PACKS = [
  { id: 'x5_keys', amount: 5 },
  { id: 'x25_keys', amount: 25 },
  { id: 'x50_keys', amount: 50 },
  { id: 'x100_keys', amount: 100 },
]

export function getKeyPack(id) {
  return KEY_PACKS.find((p) => p.id === id)
}
