/**
 * Free loot case — same weighted-prize idea as the CS:GO-style case opening
 * UI, but real: costs clicks and a key (no daily cooldown — repeatable as
 * long as you have both), the prize is rolled here on the server (never
 * trust the client for that) and its amount is added straight to the
 * user's total.
 */
export const DAILY_CASE_COST = 10_000
export const DAILY_CASE_KEY_COST = 1

// Gem-paid case: no cooldown (repeatable, like the old RevenueCat one was),
// costs a single gem — mirrors the $0.99 = 1 gem anchor price from the
// (not yet built) gem pack purchases, so opening one case still "costs"
// roughly what it used to before gems existed.
export const GEM_CASE_COST = 1

// Weighted so the average payout lands around 7,900 clicks (cost is 10,000
// — still a net loss on average, just a gentler one than before). Rescaled
// to a base of 10,000 (from 100) so the gem prizes below can sit at
// fractions of a percent without losing precision.
export const CASE_PRIZES = [
  { id: 'consumer', amount: 1_000, currency: 'clicks', weight: 3_500 },
  { id: 'milspec', amount: 3_000, currency: 'clicks', weight: 2_700 },
  { id: 'restricted', amount: 8_000, currency: 'clicks', weight: 1_700 },
  { id: 'classified', amount: 15_000, currency: 'clicks', weight: 1_500 },
  { id: 'covert', amount: 40_000, currency: 'clicks', weight: 500 },
  { id: 'gold', amount: 100_000, currency: 'clicks', weight: 100 },
  // Gems are a separate currency (not clicks) — vanishingly rare on top of
  // the click prizes above, not carved out of their share.
  { id: 'gem_1', amount: 1, currency: 'gems', weight: 10 }, // 0.1%
  { id: 'gem_3', amount: 3, currency: 'gems', weight: 5 }, // 0.05%
  { id: 'gem_5', amount: 5, currency: 'gems', weight: 1 }, // 0.01%
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
