/**
 * Trayectoria's tier ladder — mirrors front/src/pages/Home.tsx's own
 * TRAJECTORY_TIER_THRESHOLDS exactly (keep both in sync by hand; there's no
 * shared package between front/back in this repo). Index i's floor is
 * TRAJECTORY_TIER_THRESHOLDS[i], its ceiling is [i + 1] — one more entry
 * than TRAJECTORY_TIER_COUNT since the last tier still needs a ceiling for
 * "extraction" progress display even though there's no tier past it to
 * prestige into.
 */
export const TRAJECTORY_TIER_THRESHOLDS = [
  0, 10_000_000, 1_000_000_000, 100_000_000_000, 10_000_000_000_000, 1_000_000_000_000_000,
]
export const TRAJECTORY_TIER_COUNT = 5

// Every prestige (crossing into Platino, Esmeralda, Oro, Diamante...) is a
// full soft-reset with a permanent ×5 head start baked in per tier —
// Amatista (tier 0) is untouched (5**0 = 1), Platino is ×5, Esmeralda ×25,
// Oro ×125, Diamante ×625. Applied uniformly to every tree node's cost, and
// additionally to the two production baselines themselves (click power and
// per-drone rate — see treeRepository.js) so "level 0 after a prestige"
// already outproduces "maxed out the tier before."
const PRESTIGE_TIER_COST_MULTIPLIER = 5

export function prestigeTierMultiplier(tier) {
  return PRESTIGE_TIER_COST_MULTIPLIER ** tier
}
