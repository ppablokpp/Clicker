import { Zap, Flame, Rocket, Crown, Clover, type LucideIcon } from 'lucide-react'

// Maps a backend catalog id to how it's displayed — the backend owns
// price/duration/multiplier/chance (the real, enforced numbers); this is presentation only.
export const POWERUP_ICONS: Record<string, LucideIcon> = {
  click_x2: Zap,
  click_x3: Flame,
  click_x5: Rocket,
  click_x10: Crown,
}

export const DEFAULT_POWERUP_ICON = Zap

export const UPGRADE_ICON = Clover
