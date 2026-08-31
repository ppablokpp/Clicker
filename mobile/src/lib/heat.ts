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
}

export const HEAT_LEVELS: HeatLevel[] = [
  { min: 0, key: null, badge: '#d4d4d4', icon: '#525252' },
  { min: 6, key: 'onFire', badge: '#fcd34d', icon: '#fbbf24' },
  { min: 10, key: 'unstoppable', badge: '#fdba74', icon: '#fb923c' },
]

export function getHeatLevel(cps: number): HeatLevel {
  let level = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (cps >= l.min) level = l
  }
  return level
}
