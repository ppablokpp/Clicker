/**
 * Click packs — bought with gems, not real money. Straightforward currency
 * exchange (no RevenueCat, no idempotency table needed): gems in, clicks
 * out, atomic in the same transaction.
 */
export const CLICK_PACKS = [
  { id: 'clicks_10k', gemCost: 1, clicks: 10_000 },
  { id: 'clicks_35k', gemCost: 3, clicks: 35_000 },
  { id: 'clicks_100k', gemCost: 7, clicks: 100_000 }, // exactly 30% cheaper per click than the base tier
  { id: 'clicks_250k', gemCost: 15, clicks: 250_000 },
]

export function getClickPack(id) {
  return CLICK_PACKS.find((p) => p.id === id)
}
