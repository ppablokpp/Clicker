/**
 * Trayectoria's tier ladder — mirrors front/src/lib/trajectory.ts's own
 * TRAJECTORY_TIER_THRESHOLDS exactly (keep both in sync by hand; there's no
 * shared package between front/back in this repo). Index i's floor is
 * TRAJECTORY_TIER_THRESHOLDS[i], its ceiling is [i + 1] — one more entry
 * than TRAJECTORY_TIER_COUNT since the last tier still needs a ceiling for
 * "extraction" progress display even though there's no tier past it to
 * prestige into.
 *
 * Eight materials: Cuarzo sits between Esmeralda and Rubí (migration 041
 * moved everyone from Rubí up one index to make room).
 *
 * The first three steps stay gentle (x25, x40) because that is what a fresh
 * account can actually climb; Esmeralda and Cuarzo are x100 apiece. The old
 * top was being walked straight through — it ended at 1Qa and there were
 * accounts sitting at a thousand times that.
 *
 * The last three rungs are not an economy, they are a shape, and the shape
 * is deliberate. Rubí is a short stop (x10 — about half an Amatista run at
 * the x43-per-prestige production growth the tree delivers). Oro is a real
 * haul (x3000, on the order of fifty Amatista runs). And Diamante, at
 * 100Sx, is a horizon: x33333 puts it tens of thousands of Amatista runs
 * out, which is to say nobody reaches it. That is the point — there is no
 * tier past it yet, so the last one has to be somewhere the ladder can end
 * without anyone ever standing on top of it. When there is something beyond
 * Diamante, this is the number to bring down.
 *
 * The ladder used to stop at 1Qa on the grounds that total_clicks was a
 * BIGINT; it has been a double since migration 022, and a double keeps its
 * leading digits exact at any size a goal will reach. Nothing here needs to
 * be an exact integer.
 */
export const TRAJECTORY_TIER_THRESHOLDS = [
  0,
  10_000_000, // Amatista  → 10M
  250_000_000, // Platino   → 250M   x25
  10_000_000_000, // Zafiro    → 10B    x40
  1_000_000_000_000, // Esmeralda → 1T     x100
  100_000_000_000_000, // Cuarzo    → 100T   x100
  1_000_000_000_000_000, // Rubí      → 1Qa    x10
  3_000_000_000_000_000_000, // Oro       → 3Qi    x3000
  100_000_000_000_000_000_000_000, // Diamante  → 100Sx  x33333
]
export const TRAJECTORY_TIER_COUNT = 8

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
