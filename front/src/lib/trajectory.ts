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
  10_000_000, // Amatista  → 10M
  250_000_000, // Platino   → 250M
  10_000_000_000, // Zafiro    → 10B
  1_000_000_000_000, // Esmeralda → 1T
  100_000_000_000_000, // Cuarzo    → 100T
  1_000_000_000_000_000, // Rubí      → 1Qa
  3_000_000_000_000_000_000, // Oro       → 3Qi
  100_000_000_000_000_000_000_000, // Diamante  → 100Sx, meant to be out of reach
]

export const TRAJECTORY_TIER_COUNT = 8

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
 * How much of a tier's own goal you may stake on one duel: 0.1%, and never
 * more than 1B. Mirrors maxWagerForTier in back/src/game/battles.js, which is
 * the authority and explains both numbers — this copy only decides which
 * rungs the picker draws.
 */
export const BATTLE_MIN_MAX_WAGER = 100_000
export const BATTLE_ABSOLUTE_MAX_WAGER = 1_000_000_000

export function maxWagerForTier(tier: number): number {
  const goal = TRAJECTORY_TIER_THRESHOLDS[tier + 1]
  const capped = Number.isFinite(goal) ? goal * 0.001 : 0
  return Math.min(BATTLE_ABSOLUTE_MAX_WAGER, Math.max(BATTLE_MIN_MAX_WAGER, capped))
}
