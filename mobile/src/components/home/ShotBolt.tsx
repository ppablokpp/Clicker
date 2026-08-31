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
// translate+rotate there, reanimated here). `onImpact(slotIndex)` fires once
// the bolt has actually visually arrived (not on a fixed timer), same
// reasoning as the web's onAnimationEnd: a busy frame can fall behind real
// time, and any follow-up effect should never land before the bolt visually
// gets there.
//
// This is a pooled slot, not a one-shot effect: TapShootLayer always keeps
// exactly MAX_CONCURRENT_SHOTS of these mounted (`key` is the fixed slot
// index, never the shot id) and re-fires the *same* component instance by
// changing its props, instead of mounting a brand new one per shot and
// unmounting it 280ms later. Even the web itself doesn't bother with this
// — it mounts/unmounts a fresh `<div>` per shot too — because that costs
// almost nothing in a browser. It's a real, felt cost in React Native
// specifically: "creating a view" here means asking iOS/Android to
// instantiate a real native view across the JS<->native bridge, not just a
// cheap DOM node, and Multidisparo can trigger this dozens of times a
// second. `fireId` (an ever-incrementing counter, never 0 twice) is what
// tells this instance "you've been re-armed with new numbers, play your
// animation again" — plain prop equality on dx/dy/angleDeg alone wouldn't
// reliably retrigger if two consecutive shots from the same slot happened
// to land with identical values.
function ShotBoltImpl({
  slotIndex,
  fireId,
  startX,
  startY,
  dx,
  dy,
  angleDeg,
  durationMs,
  onImpact,
}: {
  slotIndex: number
  /** Increments every time this slot is (re)armed with a new shot; 0 means "never fired yet". */
  fireId: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  durationMs: number
  onImpact: (slotIndex: number) => void
}) {
  const progress = useSharedValue(0)
  // Starts invisible — an idle pooled slot that's never fired yet (or just
  // finished its last run) should show nothing, not a stray bolt sitting at
  // whatever position it was last used at.
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (fireId === 0) return
    // Snap back to the start instantly (no animation) before beginning the
    // new run — without this, a slot whose previous run already reached
    // progress=1 would animate from 1 to 1 and never visibly move.
    progress.value = 0
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onImpact)(slotIndex)
    })
    opacity.value = withSequence(
      withTiming(1, { duration: durationMs / 2 }),
      withTiming(0, { duration: durationMs / 2 }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireId])

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
