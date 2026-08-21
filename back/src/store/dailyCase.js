/**
 * Free loot case — same weighted-prize idea as the CS:GO-style case opening
 * UI, but real: the chest itself is bought with clicks, then opened with a
 * key (no daily cooldown — repeatable as long as you own a chest and have a
 * key), the prize is rolled here on the server (never trust the client for
 * that) and its amount is added straight to the user's total.
 */
export const DAILY_CASE_CHEST_COST = 10_000
export const DAILY_CASE_KEY_COST = 1

// Gem-paid case: no cooldown (repeatable, like the old RevenueCat one was),
// costs a single gem — mirrors the $0.99 = 1 gem anchor price from the
// (not yet built) gem pack purchases, so opening one case still "costs"
// roughly what it used to before gems existed.
export const GEM_CASE_COST = 1

// Weighted so the average payout lands around 12,700 clicks (cost is
// 10,000 — a net gain on average, unlike before).
export const CASE_PRIZES = [
  { id: 'consumer', amount: 3_000, currency: 'clicks', weight: 3_500 },
  { id: 'milspec', amount: 7_000, currency: 'clicks', weight: 2_700 },
  { id: 'restricted', amount: 15_000, currency: 'clicks', weight: 1_700 },
  { id: 'classified', amount: 25_000, currency: 'clicks', weight: 1_500 },
  { id: 'covert', amount: 50_000, currency: 'clicks', weight: 500 },
  { id: 'gold', amount: 100_000, currency: 'clicks', weight: 100 },
]

export function pickWeightedPrize() {
  const total = CASE_PRIZES.reduce((sum, p) => sum + p.weight, 0)
  let r = Math.random() * total
  for (const p of CASE_PRIZES) {
    if (r < p.weight) return p
    r -= p.weight
  }
  return CASE_PRIZES[CASE_PRIZES.length - 1]
}
