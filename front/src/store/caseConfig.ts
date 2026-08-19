/**
 * Presentation only — colors per rarity tier, matching CS:GO's classic skin
 * grade palette. The actual prize amounts/weights/roll come from the
 * backend (back/src/store/dailyCase.js is the source of truth).
 */
export interface CasePrizeStyle {
  color: string
  glow: string
}

export const CASE_PRIZE_STYLES: Record<string, CasePrizeStyle> = {
  consumer: { color: '#b0c3d9', glow: 'rgba(176,195,217,0.55)' },
  milspec: { color: '#4b69ff', glow: 'rgba(75,105,255,0.55)' },
  restricted: { color: '#8847ff', glow: 'rgba(136,71,255,0.55)' },
  classified: { color: '#d32ce6', glow: 'rgba(211,44,230,0.55)' },
  covert: { color: '#eb4b4b', glow: 'rgba(235,75,75,0.55)' },
  gold: { color: '#e4ae39', glow: 'rgba(228,174,57,0.7)' },
}

export const DEFAULT_CASE_PRIZE_STYLE: CasePrizeStyle = {
  color: '#9ca3af',
  glow: 'rgba(156,163,175,0.5)',
}
