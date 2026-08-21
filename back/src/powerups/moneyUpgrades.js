/**
 * A flat, guaranteed multiplier applied to every click forever — same
 * reward as the final milestone bonus. Sequential and non-cumulative: only
 * the highest-tier owned one applies. Bought with gems (see
 * permanentUpgradesRepository.buyWithGems) — `id` used to also double as
 * the RevenueCat product identifier from when this was money-only; kept
 * as-is since user_permanent_upgrades rows already exist under these ids.
 *
 * 9 linear tiers (×2 through ×10, one level per multiplier point) instead
 * of the old 4 big jumps — no ×1 tier since a x1 multiplier is a no-op.
 */
export const MONEY_UPGRADE_CATALOG = [
  { id: 'x2_clicks', multiplier: 2, cost: 1 },
  { id: 'x3_clicks', multiplier: 3, cost: 7 },
  { id: 'x4_clicks', multiplier: 4, cost: 10 },
  { id: 'x5_clicks', multiplier: 5, cost: 15 },
  { id: 'x6_clicks', multiplier: 6, cost: 20 },
  { id: 'x7_clicks', multiplier: 7, cost: 25 },
  { id: 'x8_clicks', multiplier: 8, cost: 30 },
  { id: 'x9_clicks', multiplier: 9, cost: 40 },
  { id: 'x10_clicks', multiplier: 10, cost: 50 },
]

export function getMoneyUpgrade(id) {
  return MONEY_UPGRADE_CATALOG.find((u) => u.id === id)
}
