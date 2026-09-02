import { memo } from 'react'
import Svg, { Circle, G, Line, Rect } from 'react-native-svg'

const ARMS = [
  { x1: 16, y1: 16, x2: 6, y2: 6 },
  { x1: 16, y1: 16, x2: 26, y2: 6 },
  { x1: 16, y1: 16, x2: 6, y2: 26 },
  { x1: 16, y1: 16, x2: 26, y2: 26 },
]
const ROTORS = [
  { cx: 6, cy: 6 },
  { cx: 26, cy: 6 },
  { cx: 6, cy: 26 },
  { cx: 26, cy: 26 },
]

// A small quadcopter silhouette — ported from front/src/components/DroneIcon.tsx.
// Memoized: OrbitingBots can mount dozens of these, and an already-mounted
// one should never re-render just because a sibling drone or a tap effect
// elsewhere changes state.
//
// Used to take a `flicker` shared value animating the rotor-blur circles'
// opacity (a fast 160ms cycle, one driver shared across the whole swarm).
// Removed: react-native-svg has to re-render the whole vector each time,
// so even a single shared driver still meant every drone's SVG repainting
// on that same 160ms cadence, uncapped by count — cheaper than doing it
// per-drone, but still a real, ever-growing cost with the swarm. The web
// version dropped the same effect for the equivalent reason (see
// front/src/components/DroneIcon.tsx); orbit + pulse + beam already carry
// the swarm's sense of motion without it.
function DroneIconImpl({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        {ARMS.map((a, i) => (
          <Line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />
        ))}
      </G>
      <G fill={color} opacity={0.15}>
        {ROTORS.map((r, i) => (
          <Circle key={i} cx={r.cx} cy={r.cy} r={4.5} />
        ))}
      </G>
      <G fill={color}>
        {ROTORS.map((r, i) => (
          <Circle key={i} cx={r.cx} cy={r.cy} r={1.3} />
        ))}
      </G>
      <Rect x={11} y={11} width={10} height={10} rx={2.5} fill={color} />
      <Circle cx={16} cy={16} r={1.6} fill="#fff" />
    </Svg>
  )
}

export const DroneIcon = memo(DroneIconImpl)
