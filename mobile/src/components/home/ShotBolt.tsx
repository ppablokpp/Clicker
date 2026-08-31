import { LinearGradient } from 'expo-linear-gradient'
import { memo, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const BOLT_LENGTH = 26
const BOLT_THICKNESS = 3

// A short blaster bolt fired from the tap point at the asteroid — ported
// from front/src/pages/Home.tsx's shot-bolt (a plain CSS @keyframes
// translate+rotate there, reanimated here). `onImpact(shotId)` fires once
// the bolt has actually visually arrived (not on a fixed timer), same
// reasoning as the web's onAnimationEnd: a busy frame can fall behind real
// time, and the ripple/particles should never land before the bolt
// visually gets there.
//
// No separate glow/aura layer (an earlier version had one, a small
// react-native-svg RadialGlow behind the gradient core) — the web's own
// version gets its glow for free from a single CSS `box-shadow` on one
// `<div>`, which the browser composites essentially for free. Neither RN
// equivalent is: a *second* native SVG view per bolt turned out to be
// real, felt cost once Multidisparo lets several fingers fire at once —
// with 3-4 fingers rapid-tapping, that's a dozen-plus concurrent SVG scenes
// alive simultaneously, which is exactly what made rapid multi-finger
// firing stutter/freeze while the equivalent web scene stayed smooth. A
// native `shadow*` prop was tried instead of SVG and rejected too: this
// view's `opacity` animates every frame (the fade-out), and an animated
// opacity forces iOS to re-rasterize the shadow's bitmap every frame it
// changes — same root cause as the debris-chip shadow removal earlier.
// The gradient core alone (violet fading to white) already reads as a
// glowing streak in motion; dropping the extra aura is the actual fix, not
// a regression to patch around later.
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
          borderRadius: BOLT_THICKNESS / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(196,181,253,0)', '#ddd6fe', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

export const ShotBolt = memo(ShotBoltImpl)
