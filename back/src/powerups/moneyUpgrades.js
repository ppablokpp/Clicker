/**
 * A flat, guaranteed multiplier applied to every click forever — same
 * reward as the final milestone bonus. Sequential and non-cumulative: only
 * the highest-tier owned one applies. Bought with gems (see
 * permanentUpgradesRepository.buyWithGems) — `id` used to also double as
 * the RevenueCat product identifier from when this was money-only; kept
 * as-is since user_permanent_upgrades rows already exist under these ids.
 */
export const MONEY_UPGRADE_CATALOG = [
  { id: 'x2_clicks', multiplier: 2, cost: 1 },
  { id: 'x3_clicks', multiplier: 3, cost: 7 },
  { id: 'x5_clicks', multiplier: 5, cost: 15 },
  { id: 'x10_clicks', multiplier: 10, cost: 30 },
]

export function getMoneyUpgrade(id) {
  return MONEY_UPGRADE_CATALOG.find((u) => u.id === id)
}
