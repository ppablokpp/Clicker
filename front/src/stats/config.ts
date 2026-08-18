import { Target, Zap, Flame } from 'lucide-react'

/**
 * Single place to tune the stat bars. Each category maps one stat from
 * `useUserStats()` onto a bar from 0 to `max`, with `milestones` rendered as
 * clickable pins along the way — add/remove/edit numbers here, nothing else
 * needs to change.
 */
export const STAT_CATEGORIES = [
  {
    key: 'totalClicks' as const,
    icon: Target,
    color: 'text-violet-300',
    max: 100_000,
    milestones: [1_000, 10_000, 50_000, 100_000],
  },
  {
    key: 'bestCps' as const,
    icon: Zap,
    color: 'text-yellow-300',
    max: 100,
    milestones: [10, 25, 50, 100],
  },
  {
    key: 'longestStreak' as const,
    icon: Flame,
    color: 'text-orange-400',
    max: 100,
    milestones: [5, 15, 30, 100],
  },
]

export type StatCategoryKey = (typeof STAT_CATEGORIES)[number]['key']
