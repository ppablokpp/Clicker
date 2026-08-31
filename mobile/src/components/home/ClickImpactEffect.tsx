import { memo, useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const RIPPLE_DURATION_MS = 600
const FLOAT_DURATION_MS = 900
const RIPPLE_SIZE = 96
const LUCKY_RIPPLE_SIZE = 144

// The ripple ring + floating "+N" that lands on every hit — ported from
// front/src/pages/Home.tsx's `.animate-ripple`/`.animate-float-up`
// keyframes.
//
// Pooled slot, same pattern as ShotBolt: TapShootLayer keeps a fixed number
// of these mounted for the screen's whole lifetime and re-arms a free one
// (new props + a bumped `fireId`) instead of mounting a fresh instance per
// hit and unmounting it ~900ms later — mount/unmount is real, felt cost in
// RN specifically (crossing the JS<->native bridge to create/destroy an
// actual native view), unlike the web's equivalent `<div>`, which is why
// this isn't just a straight port of the original one-shot version.
function ClickImpactEffectImpl({
  slotIndex,
  fireId,
  x,
  y,
  amount,
  isLucky,
  rippleColor,
  onDone,
}: {
  slotIndex: number
  /** Increments every time this slot is (re)armed with a new hit; 0 means "never fired yet". */
  fireId: number
  x: number
  y: number
  amount: number
  isLucky: boolean
  rippleColor: string
  onDone: (slotIndex: number) => void
}) {
  const rippleProgress = useSharedValue(0)
  const floatProgress = useSharedValue(0)

  useEffect(() => {
    if (fireId === 0) return
    // Snap back before replaying — see ShotBolt's own comment for why this
    // matters (a slot whose previous run already reached progress=1 would
    // otherwise animate 1 -> 1 and never visibly move).
    rippleProgress.value = 0
    floatProgress.value = 0
    rippleProgress.value = withTiming(1, { duration: RIPPLE_DURATION_MS, easing: Easing.out(Easing.quad) })
    floatProgress.value = withTiming(1, { duration: FLOAT_DURATION_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onDone)(slotIndex)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireId])

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
