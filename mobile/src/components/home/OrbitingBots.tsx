import { LinearGradient } from 'expo-linear-gradient'
import { memo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { DroneIcon } from './DroneIcon'

// Kept in step with front/src/index.css's --drone-orbit-radius pair: the
// base ring, and a second one ~37.5% wider that only the fused drones ride.
const ORBIT_RADIUS = 100
const ORBIT_RADIUS_BIG = 138
// How many owned drones collapse into one bigger unit — see `fuseEvery`.
const DEFAULT_BEAM_COLORS: [string, string, string] = ['rgba(196,181,253,0)', '#ddd6fe', '#ffffff']

// One drone: swings around the asteroid at a fixed radius, pulses gently,
// and fires a short beam "tick" toward the counter — ported from
// front/src/pages/Home.tsx's OrbitingBots. Performance-critical: this can
// mount dozens/hundreds of instances (one per auto-click/scout-drone level,
// uncapped), so every choice here is about keeping that scaling cheap, not
// just "using reanimated":
//   - `memo()` + only primitive props, so a tap elsewhere (which re-renders
//     TapShootLayer, this swarm's ultimate ancestor) never re-renders an
//     already-mounted drone.
//   - Position, rotation, scale and opacity for the icon are ONE
//     `useAnimatedStyle` on ONE view — not several separate animated
//     views/worklets — since they all update every frame together anyway.
//     A worklet invocation plus its native view update costs far more than
//     the two Math.sin/cos calls inside it, so merging is what matters here,
//     not shaving the trig.
//   - No `shadow*` props on anything that also animates every frame: iOS
//     has to re-rasterize a shadow's bitmap on every change to the view it
//     sits on, so an animated-opacity/scale/position view WITH a shadow is
//     a well-known way to light the GPU on fire with enough of them on
//     screen at once — the glow is a flat tint circle behind the icon
//     instead, which is just alpha blending, not a re-rasterized shadow.
//   - The beam holds a byte-identical style for the ~78% of its cycle it
//     spends spent/invisible, so Reanimated's own diffing skips pushing any
//     native update for it across that whole stretch (see beamStyle).
function DroneImpl({
  index,
  count,
  big,
  color,
  beamColors,
  phaseOffset,
}: {
  index: number
  count: number
  big: boolean
  color: string
  beamColors: [string, string, string]
  phaseOffset: number
}) {
  const radius = big ? ORBIT_RADIUS_BIG : ORBIT_RADIUS
  const size = big ? 30 : 20
  // Tangential (visual) speed held constant across both rings: a wider ring
  // covers more distance per lap, so it gets a proportionally longer lap.
  // Same 1.375 ratio the two radii above differ by — keep the two in step.
  const orbitDurationMs = (18 + (index % 3) * 3) * 1000 * (big ? 1.375 : 1)
  const phaseDeg = (index / count + phaseOffset) * 360
  const clockwise = index % 2 === 0
  const pulseDelayMs = ((index * 0.53) % 1.8) * 1000

  const angle = useSharedValue(0)
  const pulse = useSharedValue(0)
  // Starts SPENT (1), not 0. At 0 this computes to "sitting on the drone at
  // full opacity", so every beam was parked visibly on top of its drone
  // until its stagger timer below fired — up to ~1.8s of stuck beams on
  // every fresh mount, then correct forever after. The web had the exact
  // same bug via a positive CSS animation-delay; both now start in the
  // resting state instead of leaking a pre-start one.
  const beam = useSharedValue(1)

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

  const iconStyle = useAnimatedStyle(() => {
    const deg = phaseDeg + angle.value
    const rad = (deg * Math.PI) / 180
    return {
      opacity: 0.75 + pulse.value * 0.25,
      transform: [
        { translateX: Math.sin(rad) * radius },
        { translateY: -Math.cos(rad) * radius },
        // Rides the orbit rather than staying level. The web used to spend
        // a whole extra always-running animation counter-rotating this back
        // upright; the icon is a quadcopter with 4-fold symmetry, so letting
        // it turn just reads as slowly spinning on its own axis. Free here
        // (this worklet already runs), and it keeps the two clients matched.
        { rotate: `${deg}deg` },
        { scale: 1 + pulse.value * 0.12 },
      ],
    }
  })
  const beamStyle = useAnimatedStyle(() => {
    // Spent and invisible for ~78% of every cycle. Returning a constant
    // style across that stretch means Reanimated diffs it as unchanged and
    // pushes nothing to the native view — no transform update, no trig —
    // until the next shot actually starts. Without this the beam kept
    // recomputing and re-applying a full transform every frame purely to
    // move something at opacity 0, once per drone, forever.
    if (beam.value >= 1) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] }
    }
    const deg = phaseDeg + angle.value
    const rad = (deg * Math.PI) / 180
    const dist = radius * (1 - beam.value)
    return {
      opacity: 1 - beam.value,
      transform: [{ translateX: Math.sin(rad) * dist }, { translateY: -Math.cos(rad) * dist }, { rotate: `${deg}deg` }],
    }
  })

  return (
    <View pointerEvents="none" style={{ position: 'absolute' }}>
      {/* No glow behind the icon on purpose. A real shadow is out (it would
          have to be re-rasterized on a view that scales every frame — see
          the file header), and a flat tint circle standing in for the web's
          `filter: drop-shadow` was tried and reads as an aura/halo rather
          than a glow at this size. The drone is drawn bare. */}
      <Animated.View
        style={[{ position: 'absolute', width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, iconStyle]}
      >
        <DroneIcon size={size} color={color} />
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
  bigColor = '#a78bfa',
  beamColors = DEFAULT_BEAM_COLORS,
  phaseOffset = 0,
  fuseEvery,
}: {
  count: number
  color?: string
  /** Tint for a fused unit — one shade deeper than `color`, matching the web. */
  bigColor?: string
  beamColors?: [string, string, string]
  phaseOffset?: number
  // When set (regular drones only, so far — 10), every `fuseEvery` owned
  // units render as ONE bigger drone on a wider ring instead of that many
  // small ones: 15 owned = 1 big + 5 small. `count` itself (and everything
  // cps-related upstream) is untouched — but unlike the web, where this is
  // mostly a visual idea, here it's also the single biggest performance
  // lever there is: every drone on screen costs two per-frame worklets and
  // their native view updates forever, so collapsing 20 of them into 2 cuts
  // that by an order of magnitude.
  fuseEvery?: number
}) {
  if (count <= 0) return null
  const bigUnits = fuseEvery ? Math.floor(count / fuseEvery) : 0
  const smallUnits = fuseEvery ? count % fuseEvery : count
  const totalUnits = bigUnits + smallUnits
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View className="flex-1 items-center justify-center">
        {Array.from({ length: totalUnits }, (_, i) => {
          const big = i < bigUnits
          return (
            <Drone
              key={i}
              index={i}
              count={totalUnits}
              big={big}
              color={big ? bigColor : color}
              beamColors={beamColors}
              phaseOffset={phaseOffset}
            />
          )
        })}
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
