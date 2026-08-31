import { memo, useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

// One debris chip bursting off the asteroid on impact — ported from
// front/src/pages/Home.tsx's debris-chip (@keyframes debris-fly). Purely
// data-in, no callback prop, so it's already memo-safe: an already-mounted
// chip never re-renders just because a sibling shot/chip/effect spawns
// elsewhere in AsteroidClickArea.
function DebrisChipImpl({
  x,
  y,
  size,
  dx,
  dy,
  durationMs,
}: {
  x: number
  y: number
  size: number
  dx: number
  dy: number
  durationMs: number
}) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.out(Easing.quad) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = useAnimatedStyle(() => {
    const scale = 1 - progress.value * 0.7
    return {
      transform: [{ translateX: progress.value * dx }, { translateY: progress.value * dy }, { scale }],
      opacity: 1 - progress.value,
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: 2,
          backgroundColor: '#ede9fe',
          shadowColor: '#e9d5ff',
          shadowOpacity: 0.9,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  )
}

export const DebrisChip = memo(DebrisChipImpl)
