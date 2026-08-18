import { Target, Zap, Flame } from 'lucide-react'

/**
 * Single place to tune achievements. Each category compares one stat from
 * `useUserStats()` against three ascending thresholds — add/remove/edit
 * numbers here, nothing else needs to change.
 */
export const ACHIEVEMENT_CATEGORIES = [
  {
    key: 'totalClicks' as const,
    icon: Target,
    color: 'text-violet-300',
    ring: 'ring-violet-400/50',
    tiers: [1_000, 10_000, 100_000],
  },
  {
    key: 'bestCps' as const,
    icon: Zap,
    color: 'text-yellow-300',
    ring: 'ring-yellow-400/50',
    tiers: [10, 20, 30],
  },
  {
    key: 'longestStreak' as const,
    icon: Flame,
    color: 'text-orange-400',
    ring: 'ring-orange-400/50',
    tiers: [5, 15, 30],
  },
]

export type AchievementCategoryKey = (typeof ACHIEVEMENT_CATEGORIES)[number]['key']
