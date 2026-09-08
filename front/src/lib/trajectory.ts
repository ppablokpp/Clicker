/**
 * Trayectoria's tier ladder — mirrors back/src/game/trajectory.js exactly
 * (keep both in sync by hand; there's no shared package between front/back
 * in this repo). Index i's floor is TRAJECTORY_TIER_THRESHOLDS[i], its
 * ceiling is [i + 1] — one more entry than TRAJECTORY_TIER_COUNT since the
 * last tier still needs a ceiling for "extraction" progress display even
 * though there's no tier past it to prestige into.
 *
 * Lived as a private const inside Home.tsx until the duel wager cap needed
 * it too; one copy per client is enough.
 */
export const TRAJECTORY_TIER_THRESHOLDS = [
  0,
  10_000_000,
  200_000_000,
  5_000_000_000,
  100_000_000_000,
  2_000_000_000_000,
  50_000_000_000_000,
  1_000_000_000_000_000,
]

export const TRAJECTORY_TIER_COUNT = 7

/**
 * Mirrors back/src/game/trajectory.js's maxClicksPerRequest exactly — the
 * backend rejects a single increment above this, so the flush has to split
 * anything bigger into several requests.
 *
 * It scales with the tier because the value of one tap does: a flat ceiling
 * ends up smaller than a single Platino tap, and every click-gated action
 * (buying a node, claiming a task, paying a wager) flushes the whole buffer
 * before it fires — so the chunking turns straight into wait time before the
 * purchase even reaches the server.
 */
const MAX_CLICKS_BASE = 150_000
const MAX_CLICKS_GROWTH_PER_PRESTIGE = 50

export function maxClicksPerRequest(tier: number): number {
  return MAX_CLICKS_BASE * MAX_CLICKS_GROWTH_PER_PRESTIGE ** tier
}

/**
 * How much of a tier's own goal you may stake on one duel: 1%. Mirrors
 * maxWagerForTier in back/src/game/battles.js, which is the authority — this
 * copy only decides which rungs the picker draws.
 *
 * At tier 0 the goal is 250M, so the cap is 2.5M, and it climbs ×58 with each
 * prestige exactly as the goals do — which lands every cap precisely on a
 * rung of the wager ladder.
 */
export const BATTLE_MIN_MAX_WAGER = 100_000

export function maxWagerForTier(tier: number): number {
  const goal = TRAJECTORY_TIER_THRESHOLDS[tier + 1]
  const capped = Number.isFinite(goal) ? goal * 0.01 : 0
  return Math.max(BATTLE_MIN_MAX_WAGER, capped)
}
