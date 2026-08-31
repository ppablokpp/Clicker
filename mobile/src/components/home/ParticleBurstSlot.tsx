import { memo, useEffect } from 'react'
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated'
import { DebrisChip } from './DebrisChip'

export interface BurstChip {
  angle: number
  distance: number
  size: number
}

// A pooled particle burst — TapShootLayer keeps a fixed number of these
// mounted for the screen's whole lifetime and re-arms a free one (a fresh
// `chips` array + a bumped `fireId`) instead of mounting/unmounting one per
// hit, same reasoning as ShotBolt/ClickImpactEffect. All PARTICLE_COUNT
// chips of one burst share a *single* progress value (owned here, passed
// down to each DebrisChip) since they all animate over the same
// duration/easing — one shared value driving 4 children is cheaper than 4
// independent ones for what's visually one effect.
function ParticleBurstSlotImpl({
  slotIndex,
  fireId,
  x,
  y,
  chips,
  durationMs,
  onDone,
}: {
  slotIndex: number
  /** Increments every time this slot is (re)armed with a new burst; 0 means "never fired yet". */
  fireId: number
  x: number
  y: number
  chips: BurstChip[]
  durationMs: number
  onDone: (slotIndex: number) => void
}) {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (fireId === 0) return
    progress.value = 0
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onDone)(slotIndex)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireId])

  return (
    <>
      {chips.map((chip, i) => {
        const rad = (chip.angle * Math.PI) / 180
        return (
          <DebrisChip
            key={i}
            x={x}
            y={y}
            size={chip.size}
            dx={Math.cos(rad) * chip.distance}
            dy={Math.sin(rad) * chip.distance}
            progress={progress}
          />
        )
      })}
    </>
  )
}

export const ParticleBurstSlot = memo(ParticleBurstSlotImpl)
