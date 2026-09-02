import { memo, useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { StyleSheet, View } from 'react-native'
import { ClickImpactEffect } from './ClickImpactEffect'
import { ParticleBurstSlot, type BurstChip } from './ParticleBurstSlot'
import { ShotBolt } from './ShotBolt'

const SHOT_DURATION_MS = 280
const PARTICLE_DURATION_MS = 380
const PARTICLE_COUNT = 4
const MIN_PARTICLE_INTERVAL_MS = 90

// The pool sizes — always this many slots mounted, for the whole screen's
// lifetime, never grown/shrunk. MAX_CONCURRENT_SHOTS also doubles as a
// circuit-breaker ceiling: past it a tap still scores, it just doesn't draw
// a bolt.
//
// Sized from what's actually reachable rather than "as high as it'll go".
// A bolt lives SHOT_DURATION_MS (280ms) and each finger fires once per
// touch-down, so concurrency is capped by how many taps land in one 280ms
// window: Multidisparo tops out at 10 fingers, and even a furious ~8 taps/
// sec per finger only overlaps ~22 bolts. 40 leaves comfortable headroom.
// It had drifted to 128 on the theory that idle slots are free — they cost
// no *per-frame* work, true, but each one is still a real native view (two,
// counting its LinearGradient) held for the screen's whole lifetime, and
// ~250 of those is memory and view-hierarchy weight paid around the clock
// for shots that can never physically be in flight at once.
const MAX_CONCURRENT_SHOTS = 40
const MAX_CONCURRENT_EFFECTS = 24
const MAX_CONCURRENT_BURSTS = 8

// Ripple tint for a lucky hit — always this green regardless of the current
// heat tier's own ripple color, matching Home.tsx's `isLucky ? 'bg-green-
// 400/70' : heat.ripple`.
const LUCKY_RIPPLE_COLOR = 'rgba(74,222,128,0.7)'

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

export interface FireShotParams {
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  impactX: number
  impactY: number
  amount: number
  isLucky: boolean
}

export interface TapEffectsPoolHandle {
  /** One tap = one bolt; its impact spawns the ripple/"+N" and (throttled) debris on its own. */
  fireShot: (params: FireShotParams) => void
}

// Every ephemeral visual a tap produces — the bolt, the ripple/"+N", the
// debris burst — together with all of the pool bookkeeping that drives
// them. Split out of TapShootLayer, and that split is itself an
// optimization, not tidying:
//
// These three arrays change on every single tap (a shot is armed, then its
// impact ~280ms later arms an effect and a burst, each freeing itself again
// on its own timer). Held in TapShootLayer, each of those state writes
// re-rendered TapShootLayer — which wraps the gesture detector, the whole
// asteroid/ring/drone subtree AND the entire screen passed in as
// `children`. React had to walk all of that on every tap, and worse,
// TapShootLayer builds its `Gesture.Manual()` inline, so every one of those
// re-renders handed GestureDetector a brand-new gesture object to
// reconcile — during exactly the sustained rapid tapping that made the
// phone hot.
//
// Owning the state down here means a tap re-renders only this component,
// and TapShootLayer above holds no per-tap state at all. It drives this
// imperatively through the ref handle, so even *calling* fireShot can't
// schedule a render up there. Same fix the web got in
// front/src/components/TapEffectsLayer.tsx — the difference being that
// there the pooling itself is pointless (a DOM node is cheap to create,
// and reusing one would need a forced reflow to restart its CSS animation),
// while here creating a view crosses the JS<->native bridge and pooling is
// exactly right.
function TapEffectsPoolImpl({ rippleColor, ref }: { rippleColor: string; ref?: Ref<TapEffectsPoolHandle> }) {
  // Each pool has a React state array (what actually renders) plus a plain
  // ref array mirroring the same data (so callbacks can read a slot's
  // *current* contents synchronously, e.g. to carry a shot's amount/isLucky
  // through to the effect it spawns on impact, without needing them in a
  // dependency array) and a busy[] ref (which slots are currently
  // mid-animation, so a new hit claims a genuinely free one).
  const [shotSlots, setShotSlots] = useState<ShotSlot[]>(() => Array.from({ length: MAX_CONCURRENT_SHOTS }, () => IDLE_SHOT))
  const shotDataRef = useRef<ShotSlot[]>(shotSlots)
  const busyShotSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_SHOTS).fill(false))

  const [effectSlots, setEffectSlots] = useState<EffectSlot[]>(() => Array.from({ length: MAX_CONCURRENT_EFFECTS }, () => IDLE_EFFECT))
  const busyEffectSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_EFFECTS).fill(false))

  const [burstSlots, setBurstSlots] = useState<BurstSlot[]>(() => Array.from({ length: MAX_CONCURRENT_BURSTS }, () => IDLE_BURST))
  const busyBurstSlotsRef = useRef<boolean[]>(Array(MAX_CONCURRENT_BURSTS).fill(false))
  const lastParticleAtRef = useRef(0)

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

  const fireShot = useCallback((params: FireShotParams) => {
    const slotIndex = busyShotSlotsRef.current.indexOf(false)
    // Pool exhausted — the tap has already scored upstream, only the bolt
    // is skipped.
    if (slotIndex === -1) return
    busyShotSlotsRef.current[slotIndex] = true
    const shot: ShotSlot = { fireId: nextFireId++, ...params }
    shotDataRef.current[slotIndex] = shot
    setShotSlots((prev) => {
      const next = prev.slice()
      next[slotIndex] = shot
      return next
    })
  }, [])

  useImperativeHandle(ref, () => ({ fireShot }), [fireShot])

  return (
    /* `key` is always the fixed slot index, never a shot/effect/burst id —
       that's what tells React "this is the same component, just re-render it
       with new props" instead of unmount-the-old/mount-a-new-one, for every
       pool below. */
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
  )
}

// memo'd on a single, rarely-changing prop (`rippleColor` only moves when
// the heat tier does), so nothing above can re-render this — the only thing
// that ever does is its own pool state.
export const TapEffectsPool = memo(TapEffectsPoolImpl)
