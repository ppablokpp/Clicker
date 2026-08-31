import { memo, useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

// Glowing ring around the asteroid that fills up towards the prestige
// target. Once maxed, it stops being a progress indicator and becomes a
// spinning gold halo instead. Ported from front/src/pages/Home.tsx's
// ProgressRing (Framer Motion -> reanimated). Memoized for the same reason
// as Asteroid — AsteroidClickArea's tap effects shouldn't force this to
// re-render on every tap.
function ProgressRingImpl({ pct, isMaxed }: { pct: number; isMaxed: boolean }) {
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, pct)))
  const spin = useSharedValue(0)

  useEffect(() => {
    if (isMaxed) {
      spin.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1)
    } else {
      spin.value = 0
    }
  }, [isMaxed, spin])

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value - 90}deg` }] }))

  return (
    <Animated.View style={[{ width: '100%', height: '100%' }, spinStyle]}>
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        <Defs>
          <LinearGradient id="homeProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#a855f7" />
            <Stop offset="100%" stopColor="#e879f9" />
          </LinearGradient>
          <LinearGradient id="homePrestigeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fde68a" />
            <Stop offset="50%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#fde68a" />
          </LinearGradient>
        </Defs>
        <Circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={3} fill="none" />
        <Circle
          cx="100"
          cy="100"
          r={radius}
          stroke={isMaxed ? 'url(#homePrestigeGradient)' : 'url(#homeProgressGradient)'}
          strokeWidth={isMaxed ? 4 : 3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isMaxed ? 0 : offset}
        />
      </Svg>
    </Animated.View>
  )
}

export const ProgressRing = memo(ProgressRingImpl)
