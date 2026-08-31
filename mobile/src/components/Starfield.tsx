import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

// RN has no equivalent to the web version's one-div, comma-separated
// `box-shadow` star trick (RN's shadow props take a single offset/radius,
// not a list) — same star count/opacity split, rendered as SVG circles in
// two layers (dim/static, bright/twinkling) instead.
function generateStars(count: number, opacity: number) {
  const stars: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random() * 100, y: Math.random() * 100 })
  }
  return stars.map((s) => ({ ...s, opacity }))
}

export function Starfield({ width, height }: { width: number; height: number }) {
  const starsDim = useMemo(() => generateStars(140, 0.5), [])
  const starsBright = useMemo(() => generateStars(40, 0.9), [])
  const twinkle = useSharedValue(1)

  twinkle.value = withRepeat(withTiming(0.3, { duration: 1400 }), -1, true)
  const twinkleStyle = useAnimatedStyle(() => ({ opacity: twinkle.value }))

  if (width === 0 || height === 0) return null

  return (
    <>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        {starsDim.map((s, i) => (
          <Circle key={i} cx={(s.x / 100) * width} cy={(s.y / 100) * height} r={0.9} fill="#fff" opacity={s.opacity} />
        ))}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, twinkleStyle]}>
        <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
          {starsBright.map((s, i) => (
            <Circle key={i} cx={(s.x / 100) * width} cy={(s.y / 100) * height} r={1} fill="#fff" opacity={s.opacity} />
          ))}
        </Svg>
      </Animated.View>
    </>
  )
}
