import { type ReactNode, useCallback, useRef, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { Asteroid } from './Asteroid'
import { ClickImpactEffect } from './ClickImpactEffect'
import { OrbitingBots } from './OrbitingBots'
import { ParticleBurstSlot, type BurstChip } from './ParticleBurstSlot'
import { ProgressRing } from './ProgressRing'
import { ShotBolt } from './ShotBolt'

const SHOT_DURATION_MS = 280
const PARTICLE_DURATION_MS = 380
const PARTICLE_COUNT = 4
const MIN_PARTICLE_INTERVAL_MS = 90
// The pool sizes — always this many views mounted, for the whole screen's
// lifetime (see the object-pooling comment below), never grown/shrunk.
// MAX_CONCURRENT_SHOTS also doubles as the old circuit-breaker ceiling:
// normal multiShotValue never gets close. Bumped 16 -> 48 -> this once
// pooling itself was confirmed to fix the sustained-tapping lag entirely —
// idle pooled slots are cheap (no mount/unmount churn happens regardless of
// how many exist), so there's real headroom here. Effects/bursts stay
// smaller since they're shorter-lived (finish faster than a sustained
// multi-finger tap stream could plausibly need many concurrent at once).
const MAX_CONCURRENT_SHOTS = 128
const MAX_CONCURRENT_EFFECTS = 32
const MAX_CONCURRENT_BURSTS = 8
// Ripple tint for a lucky hit — always this green regardless of the current
// heat tier's own ripple color, matching Home.tsx's `isLucky ? 'bg-green-
// 400/70' : heat.ripple`.
const LUCKY_RIPPLE_COLOR = 'rgba(74,222,128,0.7)'
// Hoisted so it's the same array reference on every render — OrbitingBots
// is memoized, and an inline array literal here would create a new
// reference each time, defeating that memo for the scout-drone swarm.
const SCOUT_BEAM_COLORS: [string, string, string] = ['rgba(252,211,77,0)', '#fde68a', '#ffffff']

// Shared across all three pools — only ever used to tell one specific
// pooled slot "you've been re-armed, play your animation again", never
// compared between different slot *types*, so one counter for all of them
// is fine.
let nextFireId = 1

interface ShotSlot {
  fireId: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  // Carried through from fire-time to impact-time, so handleShotImpact can
  // spawn the "+N"/particles at the right spot with the right numbers
  // without needing a second lookup.
  impactX: number
  impactY: number
  amount: number
  isLucky: boolean
}

interface EffectSlot {
  fireId: number
  x: number
  y: number
  amount: number
  isLucky: boolean
}

interface BurstSlot {
  fireId: number
  x: number
  y: number
  chips: BurstChip[]
}

const IDLE_SHOT: ShotSlot = { fireId: 0, startX: 0, startY: 0, dx: 0, dy: 0, angleDeg: 0, impactX: 0, impactY: 0, amount: 0, isLucky: false }
const IDLE_EFFECT: EffectSlot = { fireId: 0, x: 0, y: 0, amount: 0, isLucky: false }
const IDLE_BURST: BurstSlot = { fireId: 0, x: 0, y: 0, chips: [] }

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
// - A `Gesture.Manual()` spanning the *whole* screen that only conditionally
//   called `manager.activate()` (skipping it for touches over the header)
//   logged the exact same warning — RN's touch bookkeeping apparently still
//   counts a touch as "claimed" the moment a gesture-handler view *could*
//   receive it, regardless of whether it ever activates.
//
// The fix that actually holds: the header (with its own real Pressable
// buttons) is a plain sibling entirely *outside* the gesture-detected
// subtree below — spatially separated, not click-excluded, so there's
// never a touch landing in two touch-handling systems at once. The one
// real trade-off: the web still fires a shot when you tap the header's own
// empty background; mobile's header is dense enough with buttons/gauges
// that this barely exists.
//
// This gesture is also never explicitly `end()`-ed on touches-up — it's
// meant to be a perpetual, always-on tap catcher for the screen's whole
// lifetime, not a single discrete gesture. Ending and re-beginning it on
// every touches-up/touches-down cycle meant a fast tapper cycled this
// gesture's *entire* native state machine dozens of times a second, which
// is what was actually behind the trackedTouchCount warning showing up
// only after a *while* of rapid tapping (drift accumulating across many
// repeated end/restart cycles), not the header-overlap theory above.
//
// Object pooling for every visual effect (shots, the "+N"/ripple, particle
// bursts): a fixed number of each are always mounted (see the three
// `.map()`s below) — firing/hitting reuses a free slot's *existing* view
// (new props + a bumped `fireId` re-triggers its animation, see each
// component's own comment) instead of mounting a new one and unmounting it
// shortly after. Even the web doesn't bother with this — a fresh DOM node
// per hit costs it almost nothing — but "create a view" crosses the
// JS<->native bridge in RN and is real, felt cost at Multidisparo's rate.
// This was the concrete fix for lag that only showed up after sustained
// rapid tapping, once touch handling, context re-renders, and audio were
// all already sorted out.
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
  // per-touch `id` instead of a DOM pointerId. Unrelated to the pooled
  // slots below — this one caps how many *fingers* count as shooting
  // (Multidisparo), those are fixed rendering resources.
  const activeTouchesRef = useRef<Set<number>>(new Set())

  // The three pools. Each has a React state array (what actually renders)
  // plus a plain ref array mirroring the same data (so callbacks can read a
  // slot's *current* contents synchronously, e.g. to carry a shot's
  // amount/isLucky through to the effect it spawns on impact, without
  // needing them in a dependency array) and a busy[] ref (which slots are
  // currently mid-animation, so a new hit claims a genuinely free one).
  const [shotSlots, setShotSlots] = useState<ShotSlot[]>(() => Array.from({ length: MAX_CONCURRENT_SHOTS }, () => IDLE_SHOT))
  const shotDataRef = useRef<ShotSlot[]>(shotSlots)
  const busyShotSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_SHOTS).fill(false))

  const [effectSlots, setEffectSlots] = useState<EffectSlot[]>(() => Array.from({ length: MAX_CONCURRENT_EFFECTS }, () => IDLE_EFFECT))
  const busyEffectSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_EFFECTS).fill(false))

  const [burstSlots, setBurstSlots] = useState<BurstSlot[]>(() => Array.from({ length: MAX_CONCURRENT_BURSTS }, () => IDLE_BURST))
  const busyBurstSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_BURSTS).fill(false))
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

  const handleEffectDone = useCallback((slotIndex: number) => {
    busyEffectSlotsRef.current[slotIndex] = false
  }, [])

  const handleBurstDone = useCallback((slotIndex: number) => {
    busyBurstSlotsRef.current[slotIndex] = false
  }, [])

  // A shot's bolt finished its flight — free its slot, then spawn the
  // "+N"/ripple (always) and a particle burst (throttled) at the spot it
  // landed, each claiming their own free pooled slot the exact same way.
  const handleShotImpact = useCallback((shotSlotIndex: number) => {
    busyShotSlotsRef.current[shotSlotIndex] = false
    const shot = shotDataRef.current[shotSlotIndex]

    const effectIndex = busyEffectSlotsRef.current.indexOf(false)
    if (effectIndex !== -1) {
      busyEffectSlotsRef.current[effectIndex] = true
      const jitterX = shot.impactX + (Math.random() - 0.5) * 28
      const jitterY = shot.impactY + (Math.random() - 0.5) * 28
      setEffectSlots((prev) => {
        const next = prev.slice()
        next[effectIndex] = { fireId: nextFireId++, x: jitterX, y: jitterY, amount: shot.amount, isLucky: shot.isLucky }
        return next
      })
    }

    const impactAt = Date.now()
    if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
    const burstIndex = busyBurstSlotsRef.current.indexOf(false)
    if (burstIndex === -1) return
    lastParticleAtRef.current = impactAt
    busyBurstSlotsRef.current[burstIndex] = true
    const chips: BurstChip[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * 360,
      distance: 38 + Math.random() * 48,
      size: 3.5 + Math.random() * 4,
    }))
    setBurstSlots((prev) => {
      const next = prev.slice()
      next[burstIndex] = { fireId: nextFireId++, x: shot.impactX, y: shot.impactY, chips }
      return next
    })
  }, [])

  // Fires one shot from a single touch point — called once per NEW finger
  // landing (never for an already-tracked finger just moving), same as the
  // web's fireShot firing once per real pointerdown. `x`/`y` are already
  // relative to this layer's own root view (react-native-gesture-handler's
  // touch coordinates), no window-position math needed. The click always
  // registers via `onTap()` regardless of whether a free slot exists —
  // only the *visual* bolt is ever skipped, never the score.
  const fireFromTouch = useCallback(
    (x: number, y: number) => {
      const { amount, isLucky } = onTap()
      const slotIndex = busyShotSlotsRef.current.indexOf(false)
      if (slotIndex === -1) return

      const { x: impactX, y: impactY } = impactCenterRef.current
      const dx = impactX - x
      const dy = impactY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      busyShotSlotsRef.current[slotIndex] = true
      const shot: ShotSlot = { fireId: nextFireId++, startX: x, startY: y, dx, dy, angleDeg, impactX, impactY, amount, isLucky }
      shotDataRef.current[slotIndex] = shot
      setShotSlots((prev) => {
        const next = prev.slice()
        next[slotIndex] = shot
        return next
      })
    },
    [onTap],
  )

  // Touch-slot bookkeeping (activeTouchesRef/multiShotValue cap) and
  // actually firing all live on the JS thread — `manager.activate()` below
  // must run as a worklet, so this handoff is the other direction of the
  // same "worklet decides, JS thread does the real work" split TreeCanvas's
  // pinch/pan uses.
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
    })
    .onTouchesCancelled((e) => {
      'worklet'
      for (const t of e.changedTouches) runOnJS(handleTouchUp)(t.id)
    })

  return (
    <View style={{ flex: 1 }}>
      {/* The header (with its own real Pressable buttons) sits *outside*
          the gesture-detected subtree entirely — see the file-level comment
          for why. */}
      {children}

      {/* Shared positioning context for both the gesture-tracked surface
          and the effects overlay below — same bounds, so a shot's x/y
          (measured relative to the gesture view) land in the right place in
          the overlay too without any extra conversion. Every pooled effect
          lives outside the touch-tracked view on purpose: even *reusing* a
          slot still touches the view during an active touch, and keeping
          the whole overlay separate from the gesture's own view is what
          actually avoids RN's touch bookkeeping ever looking at them. */}
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

        {/* `key` is always the fixed slot index, never a shot/effect/burst
            id — that's what tells React "this is the same component, just
            re-render it with new props" instead of unmount-the-old/
            mount-a-new-one, for every pool below. */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {shotSlots.map((slot, i) => (
            <ShotBolt
              key={i}
              slotIndex={i}
              fireId={slot.fireId}
              startX={slot.startX}
              startY={slot.startY}
              dx={slot.dx}
              dy={slot.dy}
              angleDeg={slot.angleDeg}
              durationMs={SHOT_DURATION_MS}
              onImpact={handleShotImpact}
            />
          ))}

          {burstSlots.map((burst, i) => (
            <ParticleBurstSlot
              key={i}
              slotIndex={i}
              fireId={burst.fireId}
              x={burst.x}
              y={burst.y}
              chips={burst.chips}
              durationMs={PARTICLE_DURATION_MS}
              onDone={handleBurstDone}
            />
          ))}

          {effectSlots.map((effect, i) => (
            <ClickImpactEffect
              key={i}
              slotIndex={i}
              fireId={effect.fireId}
              x={effect.x}
              y={effect.y}
              amount={effect.amount}
              isLucky={effect.isLucky}
              rippleColor={effect.isLucky ? LUCKY_RIPPLE_COLOR : rippleColor}
              onDone={handleEffectDone}
            />
          ))}
        </View>
      </View>
    </View>
  )
}
