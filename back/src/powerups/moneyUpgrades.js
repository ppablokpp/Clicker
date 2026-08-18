/**
 * A flat, guaranteed multiplier applied to every click forever — same
 * reward as the final milestone bonus, just bought directly with money
 * through RevenueCat. Sequential and non-cumulative: only the highest-tier
 * owned one applies. `id` here must match the RevenueCat product identifier
 * exactly, since it's what we look for in the subscriber's
 * non_subscriptions when syncing ownership.
 */
export const MONEY_UPGRADE_CATALOG = [
  { id: 'x2_clicks', multiplier: 2 },
  { id: 'x3_clicks', multiplier: 3 },
  { id: 'x5_clicks', multiplier: 5 },
  { id: 'x10_clicks', multiplier: 10 },
]

export function getMoneyUpgrade(id) {
  return MONEY_UPGRADE_CATALOG.find((u) => u.id === id)
}
