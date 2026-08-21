/**
 * Branch A's real node: a repeatable luck upgrade, replacing the old fixed
 * 4-tier "Suerte" ladder from the Store (×2/×3/×5/×10 for 5k/10k/25k/50k
 * clicks). Same underlying mechanic — a flat chance per click to count for
 * a multiplier instead of ×1 — but now infinite instead of capped at ×10:
 *
 *   - Chance stays fixed at 1% (LUCK_CHANCE) at every level, matching every
 *     other luck source in the game (timed luck powerups are also 1%) —
 *     scaling a percentage sensibly toward some cap is a much messier
 *     formula than scaling a payout size, and a flat rare-chance keeps the
 *     "exciting rare big hit" feel instead of it becoming "almost every
 *     click is boosted" at high levels.
 *   - The multiplier grows by exactly 1 per level (level 1 = ×2, matching
 *     the old first tier, level 2 = ×3, etc.) — linear on purpose, same as
 *     auto-click's own per-level output; the cost curve below is what does
 *     the "gets harder" work, not the payout curve.
 *   - Cost is the same shape as auto-click (exponential per level), just
 *     steeper, since a permanent payout multiplier is worth more than a
 *     flat clicks-per-second trickle.
 */
export const LUCK_NODE_ID = 'luck'

export const LUCK_CHANCE = 0.01
export const LUCK_BASE_COST = 1000
export const LUCK_COST_RATIO = 1.6

// Cost to go from `level` owned to `level + 1`.
export function luckCost(level) {
  return Math.ceil(LUCK_BASE_COST * LUCK_COST_RATIO ** level)
}

// Level 0 = no luck node owned yet = no bonus (×1, i.e. inert).
export function luckMultiplier(level) {
  return level > 0 ? level + 1 : 1
}
