import { memo, useEffect } from 'react'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import Svg, { Circle, G, Line, Rect } from 'react-native-svg'

const AnimatedG = Animated.createAnimatedComponent(G)

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
// `flicker` gates a fast opacity flicker on the rotor-blur circles (reads as
// spinning blades catching light without actually animating rotation
// per-frame) — reserved for the real orbiting drones on Home, every other
// use (tree node, modal, pill) stays static (omit the prop). Memoized:
// OrbitingBots can mount dozens of these, and an already-mounted one should
// never re-render just because a sibling drone or a tap effect elsewhere
// changes state.
//
// `flicker` is a shared value passed in from the *caller*, not created
// internally per icon — a swarm of N drones flickering in perfect sync
// looks identical to N independently-phased ones (unlike the orbit sweep or
// the pulse/beam timing, this has no per-drone identity to preserve), so
// OrbitingBots drives one shared value for the whole swarm instead of
// paying for N independent fast-updating worklets.
function DroneIconImpl({
  size = 22,
  color = 'currentColor',
  flicker,
}: {
  size?: number
  color?: string
  flicker?: SharedValue<number>
}) {
  const animatedProps = useAnimatedProps(() => ({ opacity: flicker ? flicker.value : 0.15 }))

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        {ARMS.map((a, i) => (
          <Line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />
        ))}
      </G>
      <AnimatedG fill={color} animatedProps={animatedProps}>
        {ROTORS.map((r, i) => (
          <Circle key={i} cx={r.cx} cy={r.cy} r={4.5} />
        ))}
      </AnimatedG>
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

// One shared flicker driver per swarm — call once in OrbitingBots and hand
// the returned shared value to every Drone/DroneIcon in that swarm.
export function useDroneRotorFlicker() {
  const flicker = useSharedValue(0.15)
  useEffect(() => {
    flicker.value = withRepeat(withSequence(withTiming(0.42, { duration: 80 }), withTiming(0.15, { duration: 80 })), -1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return flicker
}
