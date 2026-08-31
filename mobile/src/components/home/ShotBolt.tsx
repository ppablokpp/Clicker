import { LinearGradient } from 'expo-linear-gradient'
import { memo, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { RadialGlow } from '../RadialGlow'

const BOLT_LENGTH = 26
const BOLT_THICKNESS = 3
const AURA_SIZE = 30

// A short blaster bolt fired from the tap point at the asteroid — ported
// from front/src/pages/Home.tsx's shot-bolt (a plain CSS @keyframes
// translate+rotate there, reanimated here). `onImpact(shotId)` fires once
// the bolt has actually visually arrived (not on a fixed timer), same
// reasoning as the web's onAnimationEnd: a busy frame can fall behind real
// time, and the ripple/particles should never land before the bolt
// visually gets there.
//
// Wrapped in memo with a stable `onImpact` (id-based, not a per-item
// closure — see AsteroidClickArea) and otherwise-primitive props, so a fast
// tapper spawning new shots never re-renders the ones already in flight —
// same reasoning as the web's own OrbitingBots swarm (see its comment):
// keep every already-mounted effect instance untouched by unrelated state
// updates, not just fast to construct in the first place.
function ShotBoltImpl({
  shotId,
  startX,
  startY,
  dx,
  dy,
  angleDeg,
  durationMs,
  onImpact,
}: {
  shotId: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  durationMs: number
  onImpact: (id: number) => void
}) {
  const progress = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onImpact)(shotId)
    })
    opacity.value = withSequence(
      withTiming(1, { duration: durationMs / 2 }),
      withTiming(0, { duration: durationMs / 2 }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { rotate: `${angleDeg}deg` },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: startX - BOLT_LENGTH / 2,
          top: startY - BOLT_THICKNESS / 2,
          width: BOLT_LENGTH,
          height: BOLT_THICKNESS,
        },
        style,
      ]}
    >
      {/* Subtle aura around the bolt, matching the web's own
          `shadow-[0_0_8px_2px_rgba(216,180,254,0.85)]` — a real radial
          gradient (same RadialGlow used for the asteroid's aura and the
          modal header lights), not a flat translucent shape: a solid-color
          layer has a hard edge no matter how low its opacity, which reads
          as a faint box, not a diffuse glow. RN's native shadow* props were
          tried first and rejected — they get clipped by the gradient
          fill's own `overflow: hidden` below (needed to keep the fill
          inside the pill shape) and read far too faint on a bolt this thin
          regardless. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: BOLT_LENGTH / 2 - AURA_SIZE / 2,
          top: BOLT_THICKNESS / 2 - AURA_SIZE / 2,
        }}
      >
        <RadialGlow size={AURA_SIZE} color="rgba(216,180,254,0.65)" />
      </View>
      <Animated.View style={[{ flex: 1, borderRadius: BOLT_THICKNESS / 2, overflow: 'hidden' }]}>
        <LinearGradient
          colors={['rgba(196,181,253,0)', '#ddd6fe', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  )
}

export const ShotBolt = memo(ShotBoltImpl)
