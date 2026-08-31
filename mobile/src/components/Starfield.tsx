import { useEffect, useMemo } from 'react'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

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

function TwinklingStar({ cx, cy }: { cx: number; cy: number }) {
  const opacity = useSharedValue(0.15)

  useEffect(() => {
    const duration = 900 + Math.random() * 1600
    const delay = Math.random() * 3000
    const peak = 0.55 + Math.random() * 0.4
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(peak, { duration }), withTiming(0.15, { duration })),
        -1,
        true,
      ),
    )
  }, [opacity])

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }))

  return <AnimatedCircle cx={cx} cy={cy} r={0.6} fill="#fff" animatedProps={animatedProps} />
}

export function Starfield({ width, height }: { width: number; height: number }) {
  const brightStars = useMemo(
    () => Array.from({ length: 55 }, () => ({ x: Math.random() * 100, y: Math.random() * 100 })),
    [],
  )

  if (width === 0 || height === 0) return null

  return (
    <Svg style={{ position: 'absolute', width, height }} width={width} height={height} pointerEvents="none">
      <DimStars width={width} height={height} count={180} />
      {brightStars.map((s, i) => (
        <TwinklingStar key={i} cx={(s.x / 100) * width} cy={(s.y / 100) * height} />
      ))}
    </Svg>
  )
}
