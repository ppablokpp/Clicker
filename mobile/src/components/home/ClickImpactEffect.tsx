import { memo, useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const RIPPLE_DURATION_MS = 600
const FLOAT_DURATION_MS = 900
const RIPPLE_SIZE = 96
const LUCKY_RIPPLE_SIZE = 144

// The ripple ring + floating "+N" that lands on every hit — ported from
// front/src/pages/Home.tsx's `.animate-ripple`/`.animate-float-up`
// keyframes. Self-contained: mounts, plays both animations once, and calls
// `onDone(effectId)` when the (longer-running) float-up finishes so the
// caller can drop it from its effects array. `onDone` is id-based and
// stable (see AsteroidClickArea) rather than a per-item closure, and every
// other prop here is a primitive, so memo actually holds: an
// already-mounted effect never re-renders just because another tap lands.
function ClickImpactEffectImpl({
  effectId,
  x,
  y,
  amount,
  isLucky,
  rippleColor,
  onDone,
}: {
  effectId: number
  x: number
  y: number
  amount: number
  isLucky: boolean
  rippleColor: string
  onDone: (id: number) => void
}) {
  const rippleProgress = useSharedValue(0)
  const floatProgress = useSharedValue(0)

  useEffect(() => {
    rippleProgress.value = withTiming(1, { duration: RIPPLE_DURATION_MS, easing: Easing.out(Easing.quad) })
    floatProgress.value = withTiming(1, { duration: FLOAT_DURATION_MS, easing: Easing.out(Easing.quad) })
    const timer = setTimeout(() => onDone(effectId), FLOAT_DURATION_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rippleSize = isLucky ? LUCKY_RIPPLE_SIZE : RIPPLE_SIZE
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - rippleProgress.value),
    transform: [{ scale: rippleProgress.value }],
  }))

  const floatStyle = useAnimatedStyle(() => {
    const scale = 0.8 + floatProgress.value * 0.5 // 0.8 -> 1.3
    const translateY = -floatProgress.value * (rippleSize * 1.2) // "-220%" of its own size, roughly
    return {
      opacity: 1 - floatProgress.value,
      transform: [{ translateY }, { scale }],
    }
  })

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -rippleSize / 2,
            top: -rippleSize / 2,
            width: rippleSize,
            height: rippleSize,
            borderRadius: rippleSize / 2,
            backgroundColor: rippleColor,
          },
          rippleStyle,
        ]}
      />
      <Animated.View style={[{ position: 'absolute' }, floatStyle]}>
        <Text
          style={{
            color: isLucky ? '#86efac' : '#fff',
            fontWeight: '700',
            fontSize: isLucky ? 18 : 14,
            textShadowColor: isLucky ? 'rgba(74,222,128,0.8)' : 'transparent',
            textShadowRadius: isLucky ? 10 : 0,
            transform: [{ translateX: -10 }, { translateY: -10 }],
          }}
        >
          +{amount}
          {isLucky ? '!' : ''}
        </Text>
      </Animated.View>
    </View>
  )
}

export const ClickImpactEffect = memo(ClickImpactEffectImpl)
