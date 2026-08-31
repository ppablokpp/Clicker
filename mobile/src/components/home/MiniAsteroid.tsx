import { useEffect } from 'react'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Polygon, RadialGradient, Stop } from 'react-native-svg'
import { ASTEROID_POLYGON_POINTS, CRATERS, SPECKLES } from '../../lib/asteroidShape'
import { MATERIAL_TIER_COLORS } from '../../lib/materialTiers'
import { Crater } from './Crater'

const DEFAULT_SPECKLE_COLOR = 'rgba(0,0,0,0.22)'

// A small rotating preview of one of the material tiers' rocks — same
// shading recipe as Asteroid, just smaller and without the bob/glow, for
// the Trayectoria log. Ported from front/src/pages/Home.tsx's MiniAsteroid.
export function MiniAsteroid({ tierIndex, dimmed }: { tierIndex: number; dimmed: boolean }) {
  const tier = MATERIAL_TIER_COLORS[tierIndex] ?? MATERIAL_TIER_COLORS[0]
  const rotate = useSharedValue(0)

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 22000, easing: Easing.linear }), -1)
  }, [rotate])

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }))

  return (
    <Animated.View style={[{ width: 48, height: 48, opacity: dimmed ? 0.6 : 1 }, spinStyle]}>
      <Svg viewBox="0 0 100 100" width={48} height={48}>
        <Defs>
          <RadialGradient id="trajRockBody" cx="34%" cy="30%" r="80%">
            <Stop offset="0%" stopColor={tier.light} />
            <Stop offset="45%" stopColor={tier.fill} />
            <Stop offset="100%" stopColor={tier.dark} />
          </RadialGradient>
          <ClipPath id="trajRockSilhouette">
            <Polygon points={ASTEROID_POLYGON_POINTS} />
          </ClipPath>
        </Defs>
        <Polygon
          points={ASTEROID_POLYGON_POINTS}
          fill="url(#trajRockBody)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <G clipPath="url(#trajRockSilhouette)">
          {CRATERS.map((c, i) => (
            <Crater key={i} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
          {SPECKLES.map((s, i) => (
            <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={DEFAULT_SPECKLE_COLOR} />
          ))}
          <Ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />
        </G>
      </Svg>
    </Animated.View>
  )
}
