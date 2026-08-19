/**
 * Free daily loot case — same weighted-prize idea as the CS:GO-style case
 * opening UI, but real: costs clicks, once per calendar day, the prize is
 * rolled here on the server (never trust the client for that) and its
 * amount is added straight to the user's total.
 */
export const DAILY_CASE_COST = 10_000

// Weighted so the average payout lands around 7,900 clicks (cost is 10,000
// — still a net loss on average, just a gentler one than before).
export const CASE_PRIZES = [
  { id: 'consumer', amount: 1_000, weight: 35 },
  { id: 'milspec', amount: 3_000, weight: 27 },
  { id: 'restricted', amount: 8_000, weight: 17 },
  { id: 'classified', amount: 15_000, weight: 15 },
  { id: 'covert', amount: 40_000, weight: 5 },
  { id: 'gold', amount: 100_000, weight: 1 },
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
