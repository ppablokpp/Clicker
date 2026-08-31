import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { ClipPath, Defs, Ellipse, G, Polygon, RadialGradient, Stop, Circle } from 'react-native-svg'
import { RadialGlow } from '../RadialGlow'
import { ASTEROID_POLYGON_POINTS, CRATERS, SPECKLES } from '../../lib/asteroidShape'
import { MATERIAL_TIER_COLORS } from '../../lib/materialTiers'
import { Crater } from './Crater'

const DEFAULT_SPECKLE_COLOR = 'rgba(0,0,0,0.22)'
const OBJECT_TIERS = MATERIAL_TIER_COLORS.map((colors) => ({ ...colors, speckleColor: DEFAULT_SPECKLE_COLOR }))

// The thing you're actually tap — a slowly bobbing/rotating rock. Its color
// follows the real current Trayectoria tier, ported from
// front/src/pages/Home.tsx's SpaceObject (Framer Motion -> reanimated,
// inline SVG -> react-native-svg).
export function Asteroid({ tierIndex, pct }: { tierIndex: number; pct: number }) {
  const tier = OBJECT_TIERS[tierIndex] ?? OBJECT_TIERS[0]
  const rotate = useSharedValue(0)
  const bob = useSharedValue(0)

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1)
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    )
  }, [bob, rotate])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${rotate.value}deg` }],
  }))

  return (
    <View className="items-center justify-center" style={{ width: 96, height: 96 }}>
      {/* Subtle ambient glow, deliberately much fainter than a first pass at
          this looked — the web version barely shows at all except right at
          the rock's edge. */}
      <View pointerEvents="none" style={{ position: 'absolute' }}>
        <RadialGlow size={96 + 48} color={tier.glow} opacity={(0.22 + pct * 0.5) * 0.35} />
      </View>
      <Animated.View style={spinStyle}>
        <Svg viewBox="0 0 100 100" width={76} height={76}>
          <Defs>
            <RadialGradient id="rockBody" cx="34%" cy="30%" r="80%">
              <Stop offset="0%" stopColor={tier.light} />
              <Stop offset="45%" stopColor={tier.fill} />
              <Stop offset="100%" stopColor={tier.dark} />
            </RadialGradient>
            <ClipPath id="rockSilhouette">
              <Polygon points={ASTEROID_POLYGON_POINTS} />
            </ClipPath>
          </Defs>

          <Polygon
            points={ASTEROID_POLYGON_POINTS}
            fill="url(#rockBody)"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          <G clipPath="url(#rockSilhouette)">
            {CRATERS.map((c, i) => (
              <Crater key={i} cx={c.cx} cy={c.cy} r={c.r} />
            ))}
            {SPECKLES.map((s, i) => (
              <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={tier.speckleColor} />
            ))}
            <Ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  )
}
