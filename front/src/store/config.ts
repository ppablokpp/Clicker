import { Zap, Flame, Rocket, Crown, type LucideIcon } from 'lucide-react'

// Maps a backend powerup id to how it's displayed — the backend owns
// price/duration/multiplier (the real, enforced numbers); this is presentation only.
export const POWERUP_ICONS: Record<string, LucideIcon> = {
  click_x2: Zap,
  click_x3: Flame,
  click_x5: Rocket,
  click_x10: Crown,
}

export const DEFAULT_POWERUP_ICON = Zap
