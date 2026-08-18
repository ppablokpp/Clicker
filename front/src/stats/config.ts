import { Target, Zap, Flame } from 'lucide-react'

/**
 * Single place to tune the stat bars. Each category maps one stat from
 * `useUserStats()` onto a bar from 0 to `max`, with `milestones` rendered as
 * clickable pins along the way — add/remove/edit numbers here, nothing else
 * needs to change.
 */
export interface StatAccent {
  dotReached: string
  dotClaimed: string
  rewardBorder: string
  rewardBg: string
  rewardLabelColor: string
  rewardTextColor: string
}

export const STAT_CATEGORIES = [
  {
    key: 'totalClicks' as const,
    icon: Target,
    color: 'text-violet-300',
    max: 1_000_000,
    milestones: [50_000, 250_000, 500_000, 1_000_000],
    accent: {
      dotReached: 'bg-violet-300',
      dotClaimed: 'bg-violet-300/50',
      rewardBorder: 'border-violet-400/20',
      rewardBg: 'bg-violet-500/[0.08]',
      rewardLabelColor: 'text-violet-300/80',
      rewardTextColor: 'text-violet-100',
    },
  },
  {
    key: 'bestCps' as const,
    icon: Zap,
    color: 'text-yellow-300',
    max: 100,
    milestones: [10, 25, 50, 100],
    accent: {
      dotReached: 'bg-yellow-300',
      dotClaimed: 'bg-yellow-300/50',
      rewardBorder: 'border-yellow-400/20',
      rewardBg: 'bg-yellow-500/[0.08]',
      rewardLabelColor: 'text-yellow-300/80',
      rewardTextColor: 'text-yellow-100',
    },
  },
  {
    key: 'longestStreak' as const,
    icon: Flame,
    color: 'text-orange-400',
    max: 100,
    milestones: [5, 15, 30, 100],
    accent: {
      dotReached: 'bg-orange-400',
      dotClaimed: 'bg-orange-400/50',
      rewardBorder: 'border-orange-400/20',
      rewardBg: 'bg-orange-500/[0.08]',
      rewardLabelColor: 'text-orange-300/80',
      rewardTextColor: 'text-orange-100',
    },
  },
]

export type StatCategoryKey = (typeof STAT_CATEGORIES)[number]['key']

// Presentation only, matching back/src/stats/config.js by position — the
// server is what actually decides and applies the reward.
export const MILESTONE_REWARD_TIERS = [
  { type: 'powerup' as const, powerupId: 'click_x2' },
  { type: 'clicks' as const, amount: 1000 },
  { type: 'powerup' as const, powerupId: 'click_x10' },
  { type: 'permanentBonus' as const, amount: 1 },
]
