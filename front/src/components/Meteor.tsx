import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Asteroid, type AsteroidColors } from './Asteroid'

const FLIGHT_DURATION_MS = 3200

export interface MeteorProps {
  colors: AsteroidColors
  glow: string
  label: string
  onCapture: () => void
  onMiss: () => void
}

// Home's "Anomalía" event, now flying across the screen like a shooting
// star instead of just sitting still at a fixed point — same rock as the
// main asteroid (via the shared <Asteroid>), just small and trailing a
// comet tail along its own travel direction. Pure CSS movement (see
// .meteor-fly/@keyframes meteor-fly in index.css) so it costs nothing extra
// on top of everything else already animating on Home.
export function Meteor({ colors, glow, label, onCapture, onMiss }: MeteorProps) {
  // Diagonal sweep from one top corner to the opposite bottom corner —
  // computed once per spawn (not per render) so the trajectory doesn't
  // jitter mid-flight. vw/vh keep it correct across any screen size.
  const [trajectory] = useState(() => {
    const fromLeft = Math.random() < 0.5
    return {
      startX: fromLeft ? -12 : 112,
      endX: fromLeft ? 112 : -12,
      startY: 4 + Math.random() * 18,
      endY: 58 + Math.random() * 34,
    }
  })

  // Real pixel deltas (not raw vw/vh, which scale differently) so the
  // trail actually points back along the visual path instead of drifting
  // off at the wrong angle on non-square viewports.
  const angleDeg = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 390
    const h = typeof window !== 'undefined' ? window.innerHeight : 844
    const dx = ((trajectory.endX - trajectory.startX) / 100) * w
    const dy = ((trajectory.endY - trajectory.startY) / 100) * h
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }, [trajectory])

  useEffect(() => {
    const timeout = window.setTimeout(onMiss, FLIGHT_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [onMiss])

  return (
    <div
      className="meteor-fly fixed left-0 top-0 z-30"
      style={
        {
          '--meteor-start-x': `${trajectory.startX}vw`,
          '--meteor-start-y': `${trajectory.startY}vh`,
          '--meteor-end-x': `${trajectory.endX}vw`,
          '--meteor-end-y': `${trajectory.endY}vh`,
          '--meteor-duration': `${FLIGHT_DURATION_MS}ms`,
        } as CSSProperties
      }
    >
      <div className="relative" style={{ transform: `rotate(${angleDeg}deg)` }}>
        <div
          className="meteor-trail"
          style={{ background: `linear-gradient(to left, ${glow}, transparent)` }}
        />
        {/* Padded past the rock's own 34px so the real tap target clears
            the recommended ~44px minimum without inflating what's drawn. */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation()
            onCapture()
          }}
          aria-label={label}
          className="meteor-rock-spin relative flex items-center justify-center p-2.5"
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        >
          <Asteroid idPrefix="meteor" size={34} colors={colors} />
        </button>
      </div>
    </div>
  )
}
