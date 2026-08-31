import { memo } from 'react'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

// One debris chip bursting off the asteroid on impact — ported from
// front/src/pages/Home.tsx's debris-chip (@keyframes debris-fly).
//
// Takes an *external* `progress` shared value instead of owning one —
// ParticleBurstSlot (its pooled parent) drives all PARTICLE_COUNT chips of
// one burst from a single shared value, since they all animate over the
// exact same duration/easing and only differ in dx/dy/size. That parent is
// the actual pooled slot (fixed number mounted for good, re-armed via
// `fireId` — see its own comment); this chip itself has no fireId/mount
// logic of its own to worry about.
function DebrisChipImpl({
  x,
  y,
  size,
  dx,
  dy,
  progress,
}: {
  x: number
  y: number
  size: number
  dx: number
  dy: number
  progress: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value
    return {
      transform: [{ translateX: p * dx }, { translateY: p * dy }, { scale: 1 - p * 0.7 }],
      opacity: 1 - p,
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
          // A near-white fill reads as "glowing" on its own at this size
          // without an actual shadow — iOS has to re-rasterize a shadow's
          // bitmap on every change to the view it's on, and this view's
          // position/scale/opacity all change every frame. A burst of 4 of
          // these per hit, potentially several hits overlapping during
          // rapid tapping, made that add up into real, felt lag.
          backgroundColor: '#f5f3ff',
        },
        style,
      ]}
    />
  )
}

export const DebrisChip = memo(DebrisChipImpl)
