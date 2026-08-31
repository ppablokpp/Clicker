import { LinearGradient } from 'expo-linear-gradient'
import { memo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { DroneIcon, useDroneRotorFlicker } from './DroneIcon'

const ORBIT_RADIUS = 118
const DEFAULT_BEAM_COLORS: [string, string, string] = ['rgba(196,181,253,0)', '#ddd6fe', '#ffffff']

// One drone: swings around the asteroid at a fixed radius, pulses gently,
// and fires a short beam "tick" toward the counter — ported from
// front/src/pages/Home.tsx's OrbitingBots. Performance-critical: this can
// mount dozens/hundreds of instances (one per auto-click/scout-drone level,
// uncapped), so every choice here is about keeping that scaling cheap, not
// just "using reanimated":
//   - `memo()` + only primitive/shared-value props, so a tap elsewhere
//     (which re-renders TapShootLayer, this swarm's ultimate ancestor)
//     never re-renders an already-mounted drone.
//   - Position, scale and opacity for the icon are ONE `useAnimatedStyle`
//     on ONE view — not three separate animated views/worklets — since
//     they all update every frame together anyway.
//   - No `shadow*` props on anything that also animates every frame: iOS
//     has to re-rasterize a shadow's bitmap on every change to the view it
//     sits on, so an animated-opacity/scale/position view WITH a shadow is
//     a well-known way to light the GPU on fire with enough of them on
//     screen at once — the glow is a flat additive tint behind the icon
//     instead, which is just alpha blending, not a re-rasterized shadow.
//   - The rotor flicker is ONE shared value for the whole swarm (see
//     useDroneRotorFlicker in DroneIcon.tsx), not one independent
//     fast-updating (80ms) worklet per drone.
function DroneImpl({
  index,
  count,
  color,
  glowColor,
  beamColors,
  phaseOffset,
  flicker,
}: {
  index: number
  count: number
  color: string
  glowColor: string
  beamColors: [string, string, string]
  phaseOffset: number
  flicker: SharedValue<number>
}) {
  const orbitDurationMs = (18 + (index % 3) * 3) * 1000
  const phaseDeg = (index / count + phaseOffset) * 360
  const clockwise = index % 2 === 0
  const pulseDelayMs = ((index * 0.53) % 2.4) * 1000

  const angle = useSharedValue(0)
  const pulse = useSharedValue(0)
  const beam = useSharedValue(0)

  useEffect(() => {
    angle.value = withRepeat(withTiming(clockwise ? 360 : -360, { duration: orbitDurationMs, easing: Easing.linear }), -1)

    // A plain JS setTimeout instead of reanimated's own `withDelay` — every
    // drone fired in perfect unison with `withDelay(pulseDelayMs, ...)`
    // despite each having its own per-index delay value, so something
    // about nesting it around a `withRepeat` wasn't staggering the actual
    // start the way a one-shot `withDelay` normally does. Deferring the
    // *assignment itself* by a real timer sidesteps needing that to work.
    const timer = setTimeout(() => {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
      // A hard reset to 0 (duration: 0) as the first step of each cycle,
      // since withSequence doesn't get the same automatic "restart from
      // where this animation began" treatment a bare withTiming does —
      // without it, each new cycle's first step animates from where the
      // previous one ended (1, a no-op) instead of resweeping from the top.
      beam.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) }),
          withTiming(1, { duration: 1400 }),
        ),
        -1,
      )
    }, pulseDelayMs)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Position + scale + opacity together in one worklet/view instead of
  // three — they all recompute every frame regardless, so splitting them
  // across separate `useAnimatedStyle`s and nested Animated.Views only adds
  // worklet-invocation and view-tree overhead without buying anything.
  const iconStyle = useAnimatedStyle(() => {
    const rad = ((phaseDeg + angle.value) * Math.PI) / 180
    return {
      opacity: 0.75 + pulse.value * 0.25,
      transform: [
        { translateX: Math.sin(rad) * ORBIT_RADIUS },
        { translateY: -Math.cos(rad) * ORBIT_RADIUS },
        { scale: 1 + pulse.value * 0.12 },
      ],
    }
  })
  const beamStyle = useAnimatedStyle(() => {
    const rad = ((phaseDeg + angle.value) * Math.PI) / 180
    const dist = ORBIT_RADIUS * (1 - beam.value)
    return {
      opacity: 1 - beam.value,
      transform: [
        { translateX: Math.sin(rad) * dist },
        { translateY: -Math.cos(rad) * dist },
        { rotate: `${phaseDeg + angle.value}deg` },
      ],
    }
  })

  return (
    <View pointerEvents="none" style={{ position: 'absolute' }}>
      <Animated.View style={[{ position: 'absolute', width: 20, height: 20, marginLeft: -10, marginTop: -10 }, iconStyle]}>
        {/* Flat additive glow tint instead of a native shadow — see the
            component-level comment for why a real shadow here is expensive
            on an already-animating view. */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: glowColor, borderRadius: 10, opacity: 0.35 }]} />
        <DroneIcon size={20} color={color} flicker={flicker} />
      </Animated.View>
      <Animated.View
        style={[
          { position: 'absolute', width: 3, height: 10, marginLeft: -1.5, marginTop: -5, borderRadius: 1.5, overflow: 'hidden' },
          beamStyle,
        ]}
      >
        <LinearGradient colors={beamColors} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  )
}

const Drone = memo(DroneImpl)

function OrbitingBotsImpl({
  count,
  color = '#c4b5fd',
  glowColor = 'rgba(168,85,247,0.65)',
  beamColors = DEFAULT_BEAM_COLORS,
  phaseOffset = 0,
}: {
  count: number
  color?: string
  glowColor?: string
  beamColors?: [string, string, string]
  phaseOffset?: number
}) {
  // One flicker driver for every drone in this swarm — see DroneIcon.tsx.
  // Called unconditionally (before the `count <= 0` bail-out below) since
  // hooks can't be called conditionally; the cost of one idle shared value
  // when there's nothing to render is negligible.
  const flicker = useDroneRotorFlicker()

  if (count <= 0) return null
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View className="flex-1 items-center justify-center">
        {Array.from({ length: count }, (_, i) => (
          <Drone
            key={i}
            index={i}
            count={count}
            color={color}
            glowColor={glowColor}
            beamColors={beamColors}
            phaseOffset={phaseOffset}
            flicker={flicker}
          />
        ))}
      </View>
    </View>
  )
}

// Memoized so a tap elsewhere (TapShootLayer's shots/particles/effects
// state, which sits above this in the tree) never re-renders — let alone
// reconciles — the entire swarm just because something unrelated changed.
// With dozens/hundreds of drones, skipping that reconciliation walk on
// every single tap is the single biggest win here.
export const OrbitingBots = memo(OrbitingBotsImpl)
