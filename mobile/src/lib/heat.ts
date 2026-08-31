// Same escalating "combo meter" as front/src/pages/Home.tsx's HEAT_LEVELS,
// purely derived from clicksPerSecond. The `legendary` tier is left out for
// now — it's gated behind the Umbral tree node, and TreeContext hasn't been
// ported to mobile yet.
export type HeatKey = 'onFire' | 'unstoppable' | null

export interface HeatLevel {
  min: number
  key: HeatKey
  badge: string
  icon: string
  /** Click-ripple tint for this tier — matches the web's HEAT_LEVELS.ripple. */
  ripple: string
}

export const HEAT_LEVELS: HeatLevel[] = [
  { min: 0, key: null, badge: '#d4d4d4', icon: '#525252', ripple: 'rgba(167,139,250,0.4)' },
  { min: 6, key: 'onFire', badge: '#fcd34d', icon: '#fbbf24', ripple: 'rgba(251,191,36,0.5)' },
  { min: 10, key: 'unstoppable', badge: '#fdba74', icon: '#fb923c', ripple: 'rgba(249,115,22,0.55)' },
]

export function getHeatLevel(cps: number): HeatLevel {
  let level = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (cps >= l.min) level = l
  }
  return level
}
