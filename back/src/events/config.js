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
// Shorter than the client's own fastest possible spawn cadence (60s, at
// Frecuencia's max level — see anomalyFrequency.js)
// so this cooldown is never what's actually gating a legitimately-spawned
// next event — it only exists to stop a client from calling the claim
// endpoint back-to-back without a real spawn/challenge happening at all.
export const EVENT_MIN_INTERVAL_SECONDS = 30
