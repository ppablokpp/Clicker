/**
 * Home's random "Anomalía" event — a small tappable target that appears on
 * its own timer and, if beaten (100 taps within 15s, both enforced
 * client-side since there's no per-tap round trip fast enough for this),
 * pays out a cut of the player's *current* material (total_clicks), not
 * their lifetime_platino score. The actual reward percentage and spawn
 * cadence are governed by the Anomalías tree branch (see
 * back/src/tree/anomalyReward.js and anomalyFrequency.js) — this file only
 * holds the anti-spam cooldown below.
 */
// Must never be longer than the client's own minimum spacing between two
// claims, or it rejects legitimately-earned rewards and the player is told
// "Anomalía perdida" for a challenge they actually beat.
//
// That client-side minimum is Home.tsx's ANOMALY_MIN_GAP_SECONDS (10s): the
// spawn gap is an exponential draw around anomalyFrequencySeconds() floored
// at 10s, and on top of the gap the player still has to fly the meteor down
// and land 100 taps (≥5s even for the fastest tapper), so the real floor
// between two claims is ~15s.
//
// This was 30s, set against a stale reading of anomalyFrequency.js that
// assumed the fastest cadence was 60s. It is a 30s *average* at max
// Detección, not a minimum — so any short draw produced a second anomaly the
// server then refused to pay: ~1 in 7 at level 0, ~1 in 2 at max level, and
// always the one that spawned right after the last, which is why players
// read it as a fixed pattern rather than bad luck. Matching
// ANOMALY_MIN_GAP_SECONDS exactly leaves the whole challenge as margin.
//
// Note this cooldown was never real anti-cheat: the payout is a compounding
// 5–10% of current material and the endpoint trusts the client's "I beat it".
// It only stops accidental double-claims and casual endpoint spam.
export const EVENT_MIN_INTERVAL_SECONDS = 10
