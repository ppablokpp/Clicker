import { type ReactNode, useCallback, useRef, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
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
// Hard ceilings on how many of each effect can be alive at once — a circuit
// breaker against pile-up, not a normal-play limit (multiShotValue realistic
// values sit way below these). Under sustained multi-finger rapid-fire, if
// the JS thread ever falls behind (a slow frame, a GC pause), animation
// completion callbacks land late, which means MORE shots/effects pile up
// before the earlier ones clear — more concurrent native views makes each
// subsequent frame slower still, which delays cleanup further: a feedback
// loop whose visible symptom is exactly "se queda congelado un segundo".
// Capping the *visual* count (never the actual click registration, which
// always still counts — see fireFromTouch) breaks that loop outright
// instead of just making each individual effect cheaper.
const MAX_CONCURRENT_SHOTS = 16
const MAX_CONCURRENT_EFFECTS = 16
const MAX_CONCURRENT_PARTICLE_BURSTS = 6
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

// Home's tap-to-shoot surface. The web wraps the *entire* screen (header
// included) in one pointerdown listener, and lets each HUD/modal button opt
// out individually via `e.stopPropagation()`. That specific trick doesn't
// carry over to RN: there's no bubble-and-stop equivalent between a
// gesture-handler gesture and a nested Pressable's own touch handling.
//
// Two earlier attempts at faking it both backfired:
// - RN's own raw responder props (onResponderGrant/Move/Release) logged
//   "Ended a touch event which was not counted in trackedTouchCount" and
//   only ever delivered one finger's worth of shots — that system's
//   bookkeeping is built around a single already-granted responder tracking
//   its own gesture (a pinch, a drag), not N independent taps.
// - A `Gesture.Manual()` spanning the *whole* screen (header included) that
//   only conditionally called `manager.activate()` — skipping it for
//   touches measured to be over the header, so the real button underneath
//   would get them — logged the exact same trackedTouchCount warning. RN's
//   own touch bookkeeping apparently still counts a touch as "claimed" the
//   moment a gesture-handler view *could* receive it, regardless of
//   whether that gesture ever actually activates for it, so a header
//   Pressable independently claiming the same touch point still produced a
//   mismatch.
//
// The fix that actually holds: don't let the two overlap at all. The
// header (with its own real Pressable buttons) is a plain sibling entirely
// *outside* the gesture-detected subtree below — spatially separated, not
// click-excluded — so there is no touch landing in two touch-handling
// systems at once for RN to get confused by. The one real trade-off: the
// web still fires a shot when you tap the header's own empty background
// (nothing has stopped that particular tap); mobile's header is dense
// enough with buttons/gauges that this empty space barely exists.
//
// One more source of the same warning surfaced once fast, repeated tapping
// was actually tried: shots/particles/the "+N" text all mount and unmount
// every ~90-900ms, and they were rendered as direct children of the same
// view the gesture is attached to. While a finger is genuinely still down
// (rapid-fire keeps it there), removing a view *inside* the touch-tracked
// hierarchy mid-touch is a known way to desync RN's own touch bookkeeping
// from what's actually on screen. They're rendered in a separate sibling
// overlay now — same screen bounds (absolute-filled inside the same shared
// parent), zero touch handling of their own (`pointerEvents="none"`), but
// no longer a descendant of the node whose touches are being tracked, so
// their constant mount/unmount churn can't touch that bookkeeping at all.
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
  // Every finger currently down that this layer is tracking as a shot slot
  // — mirrors the web's activePointersRef exactly, keyed by RNGH's own
  // per-touch `id` instead of a DOM pointerId.
  const activeTouchesRef = useRef<Set<number>>(new Set())

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

    if (effectsRef.current.size < MAX_CONCURRENT_EFFECTS) {
      const jitterX = shot.impactX + (Math.random() - 0.5) * 28
      const jitterY = shot.impactY + (Math.random() - 0.5) * 28
      const effectId = nextEffectId++
      effectsRef.current.set(effectId, { x: jitterX, y: jitterY, amount: shot.displayAmount, isLucky: shot.isLucky })
      setEffectIds((prev) => [...prev, effectId])
    }

    const impactAt = Date.now()
    if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
    lastParticleAtRef.current = impactAt
    setParticleBursts((current) => {
      if (current.length >= MAX_CONCURRENT_PARTICLE_BURSTS) return current
      const pId = nextParticleId++
      const chips = Array.from({ length: PARTICLE_COUNT }, () => ({
        angle: Math.random() * 360,
        distance: 38 + Math.random() * 48,
        size: 3.5 + Math.random() * 4,
      }))
      setTimeout(() => {
        setParticleBursts((prev) => prev.filter((b) => b.id !== pId))
      }, PARTICLE_DURATION_MS)
      return [...current, { id: pId, x: shot.impactX, y: shot.impactY, chips }]
    })
  }, [])

  // Fires one shot from a single touch point — called once per NEW finger
  // landing (never for an already-tracked finger just moving), same as the
  // web's fireShot firing once per real pointerdown. `x`/`y` are already
  // relative to this layer's own root view (react-native-gesture-handler's
  // touch coordinates), no window-position math needed. The click itself
  // always registers via `onTap()` regardless of the concurrent-shots cap
  // below — only the *visual* bolt is ever skipped, never the score.
  const fireFromTouch = useCallback(
    (x: number, y: number) => {
      const { amount, isLucky } = onTap()
      if (shotsRef.current.size >= MAX_CONCURRENT_SHOTS) return

      const { x: impactX, y: impactY } = impactCenterRef.current

      const dx = impactX - x
      const dy = impactY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      const id = nextShotId++
      shotsRef.current.set(id, { id, startX: x, startY: y, dx, dy, angleDeg, impactX, impactY, displayAmount: amount, isLucky })
      setShotIds((prev) => [...prev, id])
    },
    [onTap],
  )

  // Touch-slot bookkeeping (activeTouchesRef/multiShotValue cap) and
  // actually firing all live on the JS thread — `manager.activate()`/`end()`
  // below must run as worklets, so this handoff is the other direction of
  // the same "worklet decides, JS thread does the real work" split
  // TreeCanvas's pinch/pan uses.
  const handleTouchDown = useCallback(
    (id: number, x: number, y: number) => {
      if (activeTouchesRef.current.has(id)) return
      // Multidisparo's cap — a finger landing while the allowance is
      // already full is ignored entirely, not queued for later.
      if (activeTouchesRef.current.size >= multiShotValue) return
      activeTouchesRef.current.add(id)
      fireFromTouch(x, y)
    },
    [fireFromTouch, multiShotValue],
  )

  const handleTouchUp = useCallback((id: number) => {
    activeTouchesRef.current.delete(id)
  }, [])

  const touchGesture = Gesture.Manual()
    .onTouchesDown((e, manager) => {
      'worklet'
      manager.begin()
      manager.activate()
      for (const t of e.changedTouches) {
        runOnJS(handleTouchDown)(t.id, t.x, t.y)
      }
    })
    .onTouchesUp((e, manager) => {
      'worklet'
      for (const t of e.changedTouches) runOnJS(handleTouchUp)(t.id)
      if (e.numberOfTouches === 0) manager.end()
    })
    .onTouchesCancelled((e, manager) => {
      'worklet'
      for (const t of e.changedTouches) runOnJS(handleTouchUp)(t.id)
      manager.end()
    })

  return (
    <View style={{ flex: 1 }}>
      {/* The header (with its own real Pressable buttons) sits *outside*
          the gesture-detected subtree entirely — spatially, not via any
          click-exclusion trick, so there's no overlapping touch-handling
          system for RN's own touch bookkeeping to get confused by. Taps on
          the header's buttons work exactly like any other screen; taps
          anywhere below (the asteroid and all the empty space around it)
          fire shots. */}
      {children}

      {/* Shared positioning context for both the gesture-tracked surface
          and the ephemeral-effects overlay below — same bounds, so a shot's
          x/y (measured relative to the gesture view) land in the right
          place in the overlay too without any extra conversion. */}
      <View style={{ flex: 1 }}>
        <GestureDetector gesture={touchGesture}>
          <View ref={rootRef} style={StyleSheet.absoluteFill}>
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
          </View>
        </GestureDetector>

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
      </View>
    </View>
  )
}
