import { type ReactNode, useCallback, useRef, useState } from 'react'
import { type GestureResponderEvent, type LayoutChangeEvent, View } from 'react-native'
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
// Ripple tint for a lucky hit — always this green regardless of the current
// heat tier's own ripple color, matching Home.tsx's `isLucky ? 'bg-green-
// 400/70' : heat.ripple`.
const LUCKY_RIPPLE_COLOR = 'rgba(74,222,128,0.7)'
// Hoisted so it's the same array reference on every render — OrbitingBots
// is memoized, and an inline array literal here would create a new
// reference each time, defeating that memo for the scout-drone swarm.
const SCOUT_BEAM_COLORS: [string, string, string] = ['rgba(252,211,77,0)', '#fde68a', '#ffffff']

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
  isLucky: boolean
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
// fires a shot.
//
// Multi-touch (Multidisparo): built on React Native's own low-level
// responder props (onStartShouldSetResponder/onResponderGrant/Move/Release)
// instead of `Pressable` — a `Pressable` only ever reports a single
// press-in/press-out cycle for whichever ONE touch first claims it, so a
// second finger landing on it never fires its own onPressIn at all (that
// was the "solo te deja disparar con 1 dedo a la vez" bug). The raw
// responder API instead hands every native touch event's full
// `touches`/`changedTouches` arrays (one entry per active finger, each with
// its own stable `identifier`) to whichever view is granted the responder —
// the exact same underlying multitouch primitive the web's Pointer Events
// (`activePointersRef` keyed by `pointerId`) are built on, just RN's own
// version of it. A header button's own nested Pressable still claims its
// own touch first via RN's innermost-view-first responder negotiation
// (unchanged from before), so this doesn't disturb any other button.
export function TapShootLayer({
  tierIndex,
  pct,
  isMaxed,
  rippleColor,
  autoClickLevel,
  scoutDroneLevel,
  multiShotValue,
  onTap,
  children,
}: {
  tierIndex: number
  pct: number
  isMaxed: boolean
  rippleColor: string
  autoClickLevel: number
  scoutDroneLevel: number
  /** How many fingers can be shooting at once — Tree's Multidisparo node. */
  multiShotValue: number
  onTap: () => { amount: number; isLucky: boolean }
  children: ReactNode
}) {
  const rootRef = useRef<View>(null)
  const asteroidBoxRef = useRef<View>(null)
  const impactCenterRef = useRef({ x: 0, y: 0 })
  const rootWindowRef = useRef({ x: 0, y: 0 })
  // Every finger currently down that this layer is tracking as a shot slot
  // — mirrors the web's activePointersRef exactly, keyed by RN's own
  // per-touch `identifier` instead of a DOM pointerId.
  const activeTouchesRef = useRef<Set<string>>(new Set())

  const shotsRef = useRef<Map<number, Shot>>(new Map())
  const [shotIds, setShotIds] = useState<number[]>([])
  const [effectIds, setEffectIds] = useState<number[]>([])
  const effectsRef = useRef<Map<number, { x: number; y: number; amount: number; isLucky: boolean }>>(new Map())
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
    effectsRef.current.set(effectId, { x: jitterX, y: jitterY, amount: shot.displayAmount, isLucky: shot.isLucky })
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

  // Fires one shot from a single touch point — called once per NEW finger
  // landing (never for an already-tracked finger just moving), same as the
  // web's fireShot firing once per real pointerdown.
  const fireFromTouch = useCallback(
    (pageX: number, pageY: number) => {
      const x = pageX - rootWindowRef.current.x
      const y = pageY - rootWindowRef.current.y
      const { x: impactX, y: impactY } = impactCenterRef.current

      const { amount, isLucky } = onTap()

      const dx = impactX - x
      const dy = impactY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      const id = nextShotId++
      shotsRef.current.set(id, { id, startX: x, startY: y, dx, dy, angleDeg, impactX, impactY, displayAmount: amount, isLucky })
      setShotIds((prev) => [...prev, id])
    },
    [onTap],
  )

  // Shared by onResponderGrant (the very first touch) and onResponderMove
  // (every subsequent touch-count change while already the responder,
  // including new fingers landing) — a touch only ever fires a shot the
  // first time its identifier is seen; a move event carrying an
  // already-tracked identifier is just that finger sliding, not a new tap.
  const handleTouchesChanged = useCallback(
    (e: GestureResponderEvent) => {
      for (const touch of e.nativeEvent.changedTouches) {
        const id = touch.identifier
        if (activeTouchesRef.current.has(id)) continue
        // Multidisparo's cap — a finger landing while the allowance is
        // already full is ignored entirely, not queued for later.
        if (activeTouchesRef.current.size >= multiShotValue) continue
        activeTouchesRef.current.add(id)
        fireFromTouch(touch.pageX, touch.pageY)
      }
    },
    [fireFromTouch, multiShotValue],
  )

  const handleTouchesEnded = useCallback((e: GestureResponderEvent) => {
    for (const touch of e.nativeEvent.changedTouches) {
      activeTouchesRef.current.delete(touch.identifier)
    }
  }, [])

  const handleTerminate = useCallback(() => {
    activeTouchesRef.current.clear()
  }, [])

  return (
    <View
      ref={rootRef}
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouchesChanged}
      onResponderMove={handleTouchesChanged}
      onResponderRelease={handleTouchesEnded}
      onResponderTerminate={handleTerminate}
    >
      {children}

      <View className="flex-1 items-center justify-center">
        <View ref={asteroidBoxRef} onLayout={measureAsteroidCenter} className="relative h-72 w-72 items-center justify-center">
          <OrbitingBots count={autoClickLevel} />
          <OrbitingBots
            count={scoutDroneLevel}
            color="#fcd34d"
            glowColor="rgba(251,191,36,0.65)"
            beamColors={SCOUT_BEAM_COLORS}
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
            isLucky={fx.isLucky}
            rippleColor={fx.isLucky ? LUCKY_RIPPLE_COLOR : rippleColor}
            onDone={handleEffectDone}
          />
        )
      })}
    </View>
  )
}
