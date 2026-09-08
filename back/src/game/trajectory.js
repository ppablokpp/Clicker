/**
 * Trayectoria's tier ladder — mirrors front/src/lib/trajectory.ts's own
 * TRAJECTORY_TIER_THRESHOLDS exactly (keep both in sync by hand; there's no
 * shared package between front/back in this repo). Index i's floor is
 * TRAJECTORY_TIER_THRESHOLDS[i], its ceiling is [i + 1] — one more entry
 * than TRAJECTORY_TIER_COUNT since the last tier still needs a ceiling for
 * "extraction" progress display even though there's no tier past it to
 * prestige into.
 *
 * Seven materials now — Zafiro sits between Platino and Esmeralda, Rubí
 * between Esmeralda and Oro — so the ladder climbs about x21 a step instead
 * of the old x100 across five.
 *
 * The top rung is deliberately still 1000T. A straight x100 over seven tiers
 * would end at 1e19, which overflows the BIGINT that holds total_clicks and
 * is three orders past the largest integer JavaScript can represent exactly,
 * so the counter itself would start drifting two tiers before the end. The
 * ladder keeps the original 10M / 100B / 1000T rungs and fills the rest with
 * round numbers between them.
 * It was 10M x100, and x100 a tier was simply more than the tree could
 * answer — total production only grows about x43 per prestige, so every
 * tier fell further behind the goal than the last and Diamante worked out
 * at over a thousand days. 58 is not a round number by accident: it is
 * 1.311^15, the cost ratio of a scaled node raised to the levels each
 * prestige unlocks, which is exactly how fast the frontier of the tree
 * moves. Goal growth and tree growth are the same number on purpose.
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

// Every prestige is a full soft-reset with a permanent head start baked in
// per tier, applied to the two production baselines (see treeRepository.js)
// and to the cost of every fixed-level node.
//
// The fleet and the hand get DIFFERENT multipliers, and the one-point gap
// between them is load-bearing: at x5 for both, the manual and automatic
// sides kept the same ratio forever, so whichever one led at Amatista still
// led at Diamante. At 5 and 4 the hand starts out ahead (about half your
// production in Amatista) and fades to a fifth by Diamante — present the
// whole way, dominant only at the start. That arc is the entire reason
// these are two constants and not one.
const PRESTIGE_FLEET_MULTIPLIER = 5
const PRESTIGE_CLICK_MULTIPLIER = 4

// Fixed-level nodes (the ones that never gain levels) pay this per tier.
// Deliberately the fleet's 5 and NOT the goal's 58: prestige wipes the tree,
// so a scaled node re-enters at its level-1 price of 150 every single tier,
// while a fixed node pays its full price up front. Charging those the goal's
// growth took Modo Legendario from about an hour of a fresh tier's output
// at Amatista to several years of it at Diamante — re-buying a gate you
// already earned has to stay a formality.
const PRESTIGE_TIER_COST_MULTIPLIER = 5

export function prestigeTierMultiplier(tier) {
  return PRESTIGE_TIER_COST_MULTIPLIER ** tier
}

/** Per-drone production head start. */
export function prestigeFleetMultiplier(tier) {
  return PRESTIGE_FLEET_MULTIPLIER ** tier
}

/**
 * Anti-abuse ceiling on a single /clicks/increment, per prestige tier.
 *
 * This has to scale, and not by a little. A tap is worth about 9.8K on
 * Amatista and 11.6T on Diamante — ten orders of magnitude — because its
 * value carries both the x4 tier multiplier and the 15 extra Potencia levels
 * each prestige unlocks. A flat ceiling that is generous on the first
 * asteroid is smaller than a SINGLE TAP from Platino onward, and the client
 * dutifully splits the overflow into one request per chunk: at Zafiro a
 * second of tapping needed 346 sequential round trips, which is why a
 * purchase there took the best part of a minute to go through (every
 * click-gated action flushes the whole buffer first).
 *
 * 50 per tier covers the ~32.5 the click value actually grows by, with
 * headroom, and leaves tier 0 exactly where it was — which is where an
 * anti-abuse floor is worth having, since that is where a fresh account
 * sits.
 */
const MAX_CLICKS_BASE = 150_000
const MAX_CLICKS_GROWTH_PER_PRESTIGE = 50

export function maxClicksPerRequest(tier) {
  return MAX_CLICKS_BASE * MAX_CLICKS_GROWTH_PER_PRESTIGE ** Number(tier)
}

/** Manual click-value head start. Lower than the fleet's, on purpose. */
export function prestigeClickMultiplier(tier) {
  return PRESTIGE_CLICK_MULTIPLIER ** tier
}
