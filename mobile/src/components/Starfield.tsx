import { useEffect, useMemo } from 'react'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// Every twinkling star used to own its *own* independent Reanimated loop
// (infinite withRepeat, running forever) — with 100 of them that's 100
// concurrently-active animations driving SVG circles just from having Home
// open and idle, no taps needed. SVG is considerably more expensive to
// animate in RN than a plain View (see Asteroid.tsx's own single transform
// loop for the cheap alternative), and at this count it was almost
// certainly the dominant cause of the phone heating up at rest. A small,
// fixed pool of shared oscillators — each with its own duration/phase —
// gives the same "every star twinkles on its own timer" look (each star
// still picks its own random peak brightness once, so even stars sharing an
// oscillator look distinct) for a fraction of the concurrent animation cost.
const OSCILLATOR_COUNT = 5
const OSCILLATOR_CONFIGS = [
  { duration: 1100, delay: 0 },
  { duration: 1400, delay: 300 },
  { duration: 1700, delay: 600 },
  { duration: 2000, delay: 900 },
  { duration: 2300, delay: 1200 },
]

// Hardcoded to exactly OSCILLATOR_COUNT calls (not a loop) since hooks can't
// be called a variable number of times — this is the one place that count
// is allowed to be "hidden" from the rest of the file.
function useOscillatorPool(): SharedValue<number>[] {
  const o0 = useSharedValue(0)
  const o1 = useSharedValue(0)
  const o2 = useSharedValue(0)
  const o3 = useSharedValue(0)
  const o4 = useSharedValue(0)
  const oscillators = useMemo(() => [o0, o1, o2, o3, o4], [o0, o1, o2, o3, o4])

  useEffect(() => {
    oscillators.forEach((osc, i) => {
      const { duration, delay } = OSCILLATOR_CONFIGS[i]
      osc.value = withDelay(
        delay,
        withRepeat(withSequence(withTiming(1, { duration }), withTiming(0, { duration })), -1, true),
      )
    })
  }, [oscillators])

  return oscillators
}

// RN has no equivalent to the web version's one-div, comma-separated
// `box-shadow` star trick (RN's shadow props take a single offset/radius,
// not a list) — rendered as SVG circles instead. Two layers: a static dim
// one, and a twinkling bright one where every star blinks on its own
// randomized timer (not one shared fade for the whole layer, which read as
// the entire sky pulsing in unison instead of individual stars twinkling).
function DimStars({ width, height, count }: { width: number; height: number; count: number }) {
  const stars = useMemo(() => Array.from({ length: count }, () => ({ x: Math.random() * 100, y: Math.random() * 100 })), [count])
  return (
    <>
      {stars.map((s, i) => (
        <Circle key={i} cx={(s.x / 100) * width} cy={(s.y / 100) * height} r={0.5} fill="#fff" opacity={0.45} />
      ))}
    </>
  )
}

function TwinklingStar({ cx, cy, oscillator }: { cx: number; cy: number; oscillator: SharedValue<number> }) {
  // Picked once per star, not animated — this is what keeps stars sharing
  // the same oscillator from all looking identical, since each still has
  // its own floor/peak brightness.
  const { minOpacity, peak } = useMemo(
    () => ({ minOpacity: 0.1 + Math.random() * 0.1, peak: 0.55 + Math.random() * 0.4 }),
    [],
  )

  const animatedProps = useAnimatedProps(() => ({
    opacity: minOpacity + oscillator.value * (peak - minOpacity),
  }))

  return <AnimatedCircle cx={cx} cy={cy} r={0.6} fill="#fff" animatedProps={animatedProps} />
}

export function Starfield({ width, height }: { width: number; height: number }) {
  const brightStars = useMemo(
    () => Array.from({ length: 100 }, () => ({ x: Math.random() * 100, y: Math.random() * 100 })),
    [],
  )
  const oscillators = useOscillatorPool()

  if (width === 0 || height === 0) return null

  return (
    <Svg style={{ position: 'absolute', width, height }} width={width} height={height} pointerEvents="none">
      {/* Denser than the web's own starfield (220/60) on purpose — the size
          variety between the dim/twinkling tiers reads better with more of
          each to actually fill the sky instead of looking sparse. */}
      <DimStars width={width} height={height} count={340} />
      {brightStars.map((s, i) => (
        <TwinklingStar
          key={i}
          cx={(s.x / 100) * width}
          cy={(s.y / 100) * height}
          oscillator={oscillators[i % OSCILLATOR_COUNT]}
        />
      ))}
    </Svg>
  )
}
