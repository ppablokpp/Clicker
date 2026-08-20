import { MousePointerClick, Zap, Gift, Flame } from 'lucide-react'

/** Fixed rank order shared by every category's 4 milestone badges. */
export const MILESTONE_TIER_KEYS = ['bronze', 'silver', 'gold', 'platinum'] as const
export type MilestoneTierKey = (typeof MILESTONE_TIER_KEYS)[number]

/** Badge tint per rank — same 4 colors regardless of category. */
export const MILESTONE_TIER_COLORS: Record<MilestoneTierKey, string> = {
  bronze: 'text-[#a9784a]',
  silver: 'text-neutral-300',
  gold: 'text-yellow-400',
  platinum: 'text-cyan-200',
}

/** Ring gradient per rank — the selected milestone's tier recolors the ring. */
export const MILESTONE_TIER_GRADIENTS: Record<MilestoneTierKey, { from: string; to: string }> = {
  bronze: { from: '#7c4a24', to: '#b8814f' },
  silver: { from: '#9ca3af', to: '#f3f4f6' },
  gold: { from: '#ca8a04', to: '#fde047' },
  platinum: { from: '#67e8f9', to: '#f0fdfa' },
}

/**
 * Single place to tune the stat cards. Each category maps one stat from
 * `useUserStats()` onto a circular progress ring, plus 4 milestone
 * thresholds (bronze/silver/gold/platinum) shown as small badges below the
 * ring — clicking one re-targets the ring at that milestone.
 */
export const STAT_CATEGORIES = [
  {
    key: 'totalClicks' as const,
    icon: MousePointerClick,
    color: 'text-violet-300',
    milestones: [50_000, 250_000, 500_000, 1_000_000],
  },
  {
    key: 'bestCps' as const,
    icon: Zap,
    color: 'text-yellow-300',
    milestones: [10, 25, 50, 100],
  },
  {
    key: 'longestStreak' as const,
    icon: Flame,
    color: 'text-orange-400',
    milestones: [5, 15, 30, 100],
  },
  {
    key: 'casesOpened' as const,
    icon: Gift,
    color: 'text-red-300',
    milestones: [5, 20, 50, 100],
  },
]

export type StatCategoryKey = (typeof STAT_CATEGORIES)[number]['key']
