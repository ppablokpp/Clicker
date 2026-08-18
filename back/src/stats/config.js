// Keep these numbers in sync with front/src/stats/config.ts — the front
// draws the bars from its own copy, but the server is what actually decides
// whether a milestone counts and hands out the reward.
export const STAT_CATEGORIES = {
  totalClicks: { statColumn: 'total_clicks', milestones: [50_000, 250_000, 500_000, 1_000_000] },
  bestCps: { statColumn: 'best_cps', milestones: [10, 25, 50, 100] },
  longestStreak: { statColumn: 'longest_streak', milestones: [5, 15, 30, 100] },
}

// Reward tiers apply by position (1st milestone in any category, 2nd, ...),
// not by category — so all three "hardest" milestones give the same kind of
// reward, just at different thresholds.
export const MILESTONE_REWARD_TIERS = [
  { type: 'powerup', powerupId: 'click_x2' },
  { type: 'clicks', amount: 1000 },
  { type: 'powerup', powerupId: 'click_x10' },
  { type: 'permanent_bonus', amount: 1 },
]

export function getMilestoneTierIndex(categoryKey, milestone) {
  const category = STAT_CATEGORIES[categoryKey]
  if (!category) return -1
  return category.milestones.indexOf(milestone)
}
