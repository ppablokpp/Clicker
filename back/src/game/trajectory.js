/**
 * Trayectoria's tier ladder — mirrors front/src/pages/Home.tsx's own
 * TRAJECTORY_TIER_THRESHOLDS exactly (keep both in sync by hand; there's no
 * shared package between front/back in this repo). Index i's floor is
 * TRAJECTORY_TIER_THRESHOLDS[i], its ceiling is [i + 1] — one more entry
 * than TRAJECTORY_TIER_COUNT since the last tier still needs a ceiling for
 * "extraction" progress display even though there's no tier past it to
 * prestige into.
 */
export const TRAJECTORY_TIER_THRESHOLDS = [0, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000]
export const TRAJECTORY_TIER_COUNT = 5
