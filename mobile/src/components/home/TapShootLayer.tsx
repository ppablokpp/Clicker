import { type ReactNode, useCallback, useRef, useState } from 'react'
import { type GestureResponderEvent, type LayoutChangeEvent, Pressable, View } from 'react-native'
import { Asteroid } from './Asteroid'
import { ClickImpactEffect } from './ClickImpactEffect'
import { DebrisChip } from './DebrisChip'
import { OrbitingBots } from './OrbitingBots'
import { ProgressRing } from './ProgressRing'
import { ShotBolt } from './ShotBolt'

const SHOT_DURATION_MS = 280
const PARTICLE_DURATION_MS = 380
const PARTICLE_COUNT = 4
const MIN_PARTICLE_INTERVAL_MS = 90

let nextShotId = 0
let nextEffectId = 0
let nextParticleId = 0

interface Shot {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  impactX: number
  impactY: number
  displayAmount: number
}

interface ParticleBurst {
  id: number
  x: number
  y: number
  chips: { angle: number; distance: number; size: number }[]
}

// Home's whole tap-to-shoot surface — mirrors front/src/pages/Home.tsx's
// own structure: `containerRef` (the pointerdown listener) wraps the
// *entire* screen (header included), not just a small zone around the
// asteroid, so tapping anywhere that isn't itself an interactive control
// fires a shot. React Native's touch responder system already gives an
// inner Pressable (a header button, a tab-bar icon) exclusive claim over
// its own touches — the outer Pressable here never also fires for that
// same touch — so no explicit "stopPropagation" equivalent is needed, only
// making this Pressable span everything.
//
// The asteroid's own on-screen box is measured relative to this layer (via
// `measureInWindow` on both, since the header's height pushes the asteroid
// down by a variable amount depending on device) so shots fired from
// anywhere aim at its real center, not a guessed position.
export function TapShootLayer({
  tierIndex,
  pct,
  isMaxed,
  rippleColor,
  autoClickLevel,
  scoutDroneLevel,
  onTap,
  children,
}: {
  tierIndex: number
  pct: number
  isMaxed: boolean
  rippleColor: string
  autoClickLevel: number
  scoutDroneLevel: number
  onTap: () => void
  children: ReactNode
}) {
  const rootRef = useRef<View>(null)
  const asteroidBoxRef = useRef<View>(null)
  const impactCenterRef = useRef({ x: 0, y: 0 })
  const rootWindowRef = useRef({ x: 0, y: 0 })

  const shotsRef = useRef<Map<number, Shot>>(new Map())
  const [shotIds, setShotIds] = useState<number[]>([])
  const [effectIds, setEffectIds] = useState<number[]>([])
  const effectsRef = useRef<Map<number, { x: number; y: number; amount: number }>>(new Map())
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])
  const lastParticleAtRef = useRef(0)

  const measureAsteroidCenter = useCallback((_e: LayoutChangeEvent) => {
    const root = rootRef.current
    const box = asteroidBoxRef.current
    if (!root || !box) return
    root.measureInWindow((rootX, rootY) => {
      rootWindowRef.current = { x: rootX, y: rootY }
      box.measureInWindow((boxX, boxY, boxWidth, boxHeight) => {
        impactCenterRef.current = {
          x: boxX - rootX + boxWidth / 2,
          y: boxY - rootY + boxHeight / 2,
        }
      })
    })
  }, [])

  const handleEffectDone = useCallback((id: number) => {
    effectsRef.current.delete(id)
    setEffectIds((prev) => prev.filter((eid) => eid !== id))
  }, [])

  const handleShotImpact = useCallback((id: number) => {
    const shot = shotsRef.current.get(id)
    shotsRef.current.delete(id)
    setShotIds((prev) => prev.filter((sid) => sid !== id))
    if (!shot) return

    const jitterX = shot.impactX + (Math.random() - 0.5) * 28
    const jitterY = shot.impactY + (Math.random() - 0.5) * 28
    const effectId = nextEffectId++
    effectsRef.current.set(effectId, { x: jitterX, y: jitterY, amount: shot.displayAmount })
    setEffectIds((prev) => [...prev, effectId])

    const impactAt = Date.now()
    if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
    lastParticleAtRef.current = impactAt
    const pId = nextParticleId++
    const chips = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * 360,
      distance: 38 + Math.random() * 48,
      size: 3.5 + Math.random() * 4,
    }))
    setParticleBursts((current) => [...current, { id: pId, x: shot.impactX, y: shot.impactY, chips }])
    setTimeout(() => {
      setParticleBursts((current) => current.filter((b) => b.id !== pId))
    }, PARTICLE_DURATION_MS)
  }, [])

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      // `locationX/Y` is relative to whichever (possibly deeply nested)
      // view actually caught the touch, not necessarily this outer
      // Pressable — a tap inside the header's own nested Views landed with
      // the wrong offset because of that (looked like it fired from
      // somewhere above your finger). `pageX/Y` is unambiguous (screen-
      // absolute), so converting it with this layer's own cached window
      // position gives the correct "relative to this Pressable" point
      // regardless of how deep the touched view is nested.
      const x = e.nativeEvent.pageX - rootWindowRef.current.x
      const y = e.nativeEvent.pageY - rootWindowRef.current.y
      const { x: impactX, y: impactY } = impactCenterRef.current

      onTap()

      const dx = impactX - x
      const dy = impactY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      const id = nextShotId++
      shotsRef.current.set(id, { id, startX: x, startY: y, dx, dy, angleDeg, impactX, impactY, displayAmount: 1 })
      setShotIds((prev) => [...prev, id])
    },
    [onTap],
  )

  return (
    <Pressable ref={rootRef} onPressIn={handlePressIn} className="flex-1">
      {children}

      <View className="flex-1 items-center justify-center">
        <View ref={asteroidBoxRef} onLayout={measureAsteroidCenter} className="relative h-72 w-72 items-center justify-center">
          <OrbitingBots count={autoClickLevel} />
          <OrbitingBots
            count={scoutDroneLevel}
            color="#fcd34d"
            glowColor="rgba(251,191,36,0.65)"
            beamColors={['rgba(252,211,77,0)', '#fde68a', '#ffffff']}
            phaseOffset={0.4}
          />
          <View style={{ position: 'absolute', width: '70%', height: '70%' }}>
            <ProgressRing pct={pct} isMaxed={isMaxed} />
          </View>
          <Asteroid tierIndex={tierIndex} pct={pct} />
        </View>
      </View>

      <View className="pb-24" />

      {shotIds.map((id) => {
        const shot = shotsRef.current.get(id)
        if (!shot) return null
        return (
          <ShotBolt
            key={id}
            shotId={id}
            startX={shot.startX}
            startY={shot.startY}
            dx={shot.dx}
            dy={shot.dy}
            angleDeg={shot.angleDeg}
            durationMs={SHOT_DURATION_MS}
            onImpact={handleShotImpact}
          />
        )
      })}

      {particleBursts.map((burst) =>
        burst.chips.map((chip, i) => {
          const rad = (chip.angle * Math.PI) / 180
          return (
            <DebrisChip
              key={`${burst.id}-${i}`}
              x={burst.x}
              y={burst.y}
              size={chip.size}
              dx={Math.cos(rad) * chip.distance}
              dy={Math.sin(rad) * chip.distance}
              durationMs={PARTICLE_DURATION_MS}
            />
          )
        }),
      )}

      {effectIds.map((id) => {
        const fx = effectsRef.current.get(id)
        if (!fx) return null
        return (
          <ClickImpactEffect
            key={id}
            effectId={id}
            x={fx.x}
            y={fx.y}
            amount={fx.amount}
            isLucky={false}
            rippleColor={rippleColor}
            onDone={handleEffectDone}
          />
        )
      })}
    </Pressable>
  )
}
