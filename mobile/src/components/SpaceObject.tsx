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
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Polygon, RadialGradient, Stop } from 'react-native-svg'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'

// Ported from front/src/pages/Home.tsx's ProgressRing/SpaceObject — same
// deterministic rock outline, craters, speckles and gradients, redrawn with
// react-native-svg (no native `viewBox`-relative `<clipPath>` gotchas — RN's
// SVG lib supports it the same way) and animated with reanimated instead of
// Framer Motion.

type Point = [number, number]

function buildRoundRockOutline(pointCount: number, baseRadius: number, jitter: number): Point[] {
  const points: Point[] = []
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2
    const wobble = Math.sin(angle * 3) * jitter * 0.6 + Math.sin(angle * 5 + 1) * jitter * 0.4
    const r = baseRadius + wobble
    points.push([50 + Math.cos(angle) * r, 50 + Math.sin(angle) * r])
  }
  return points
}

const ASTEROID_POINTS = buildRoundRockOutline(20, 42, 3)

const CRATERS = [
  { cx: 38, cy: 38, r: 6.5 },
  { cx: 63, cy: 55, r: 8.5 },
  { cx: 68, cy: 32, r: 4 },
  { cx: 42, cy: 66, r: 5.5 },
  { cx: 55, cy: 40, r: 3 },
  { cx: 28, cy: 55, r: 3.5 },
  { cx: 60, cy: 68, r: 2.5 },
]

const SPECKLES = [
  { cx: 30, cy: 28, r: 1.4 },
  { cx: 48, cy: 24, r: 1 },
  { cx: 72, cy: 45, r: 1.2 },
  { cx: 58, cy: 58, r: 1 },
  { cx: 35, cy: 48, r: 0.9 },
  { cx: 45, cy: 72, r: 1.3 },
  { cx: 25, cy: 62, r: 1 },
  { cx: 65, cy: 25, r: 0.9 },
]

const DEFAULT_SPECKLE_COLOR = 'rgba(0,0,0,0.22)'
const OBJECT_TIERS = MATERIAL_TIER_COLORS.map((colors) => ({ ...colors, speckleColor: DEFAULT_SPECKLE_COLOR }))

export function SpaceObject({ tierIndex, pct }: { tierIndex: number; pct: number }) {
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
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 96 + 48,
          height: 96 + 48,
          borderRadius: 999,
          backgroundColor: tier.glow,
          opacity: 0.22 + pct * 0.5,
        }}
      />
      <Animated.View style={spinStyle}>
        <Svg viewBox="0 0 100 100" width={76} height={76}>
          <Defs>
            <RadialGradient id="rockBody" cx="34%" cy="30%" r="80%">
              <Stop offset="0%" stopColor={tier.light} />
              <Stop offset="45%" stopColor={tier.fill} />
              <Stop offset="100%" stopColor={tier.dark} />
            </RadialGradient>
            <RadialGradient id="craterWell" cx="50%" cy="38%" r="70%">
              <Stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <Stop offset="75%" stopColor="rgba(0,0,0,0.32)" />
              <Stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
            </RadialGradient>
            <ClipPath id="rockSilhouette">
              <Polygon points={ASTEROID_POINTS.map((p) => p.join(',')).join(' ')} />
            </ClipPath>
          </Defs>

          <Polygon
            points={ASTEROID_POINTS.map((p) => p.join(',')).join(' ')}
            fill="url(#rockBody)"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          <G clipPath="url(#rockSilhouette)">
            {CRATERS.map((c, i) => (
              <G key={i}>
                <Circle cx={c.cx} cy={c.cy} r={c.r} fill="url(#craterWell)" />
                <Circle cx={c.cx - c.r * 0.32} cy={c.cy - c.r * 0.32} r={c.r * 0.3} fill="rgba(255,255,255,0.16)" />
              </G>
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

export function ProgressRing({ pct, isMaxed }: { pct: number; isMaxed: boolean }) {
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
