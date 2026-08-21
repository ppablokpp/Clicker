/**
 * Branch A's real node: a repeatable luck upgrade, replacing the old fixed
 * 4-tier "Suerte" ladder from the Store (×2/×3/×5/×10 for 5k/10k/25k/50k
 * clicks). Same underlying mechanic — a chance per click to count for a
 * multiplier instead of ×1 — but now infinite instead of capped at ×10:
 *
 *   - The multiplier grows by exactly 1 per level (level 1 = ×2, matching
 *     the old first tier, level 2 = ×3, etc.) — linear on purpose, same as
 *     auto-click's own per-level output; the cost curve below is what does
 *     the "gets harder" work, not the payout curve.
 *   - Cost is the same shape as auto-click (exponential per level), just
 *     steeper, since a permanent payout multiplier is worth more than a
 *     flat clicks-per-second trickle.
 *
 * The chance itself used to be a flat 1% (see git history) — it's now its
 * own node, branch A's second one (see luckChance.js), so this module no
 * longer owns it.
 */
export const LUCK_NODE_ID = 'luck'

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
