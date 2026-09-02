import { type ReactNode, useCallback, useMemo, useRef } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { Asteroid } from './Asteroid'
import { OrbitingBots } from './OrbitingBots'
import { ProgressRing } from './ProgressRing'
import { TapEffectsPool, type TapEffectsPoolHandle } from './TapEffectsPool'

// Every `fuseEvery` owned drones render as one bigger unit on a wider ring
// — see OrbitingBots' own comment. Applies to both swarms (regular and
// scout), each keeping its own palette. Matches the web's own 10.
const FUSE_EVERY = 10
// Hoisted so it's the same array reference on every render — OrbitingBots
// is memoized, and an inline array literal here would create a new
// reference each time, defeating that memo for the scout-drone swarm.
const SCOUT_BEAM_COLORS: [string, string, string] = ['rgba(252,211,77,0)', '#fde68a', '#ffffff']

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
// This component deliberately holds NO per-tap state: every pooled visual
// lives in TapEffectsPool below and is driven imperatively through a ref.
// That's what keeps a tap from re-rendering this component — which wraps
// the gesture detector, the whole asteroid/ring/drone subtree, and the
// entire screen passed in as `children` — dozens of times a second while
// someone taps.
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
  const poolRef = useRef<TapEffectsPoolHandle>(null)
  // Every finger currently down that this layer is tracking as a shot slot
  // — mirrors the web's activePointersRef exactly, keyed by RNGH's own
  // per-touch `id` instead of a DOM pointerId. Unrelated to the pooled
  // slots in TapEffectsPool — this one caps how many *fingers* count as
  // shooting (Multidisparo), those are fixed rendering resources.
  const activeTouchesRef = useRef<Set<number>>(new Set())

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
      const { x: impactX, y: impactY } = impactCenterRef.current
      const dx = impactX - x
      const dy = impactY - y
      poolRef.current?.fireShot({
        startX: x,
        startY: y,
        dx,
        dy,
        angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
        impactX,
        impactY,
        amount,
        isLucky,
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

  // Memoized, not rebuilt inline every render. A fresh Gesture object hands
  // GestureDetector something new to reconcile and re-attach every time,
  // and this used to be recreated on literally every tap (this component
  // owned the pool state back then). Its deps are all useCallback-stable,
  // so in practice this is now built once for the screen's lifetime.
  const touchGesture = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((e, manager) => {
          'worklet'
          manager.begin()
          manager.activate()
          for (const t of e.changedTouches) {
            runOnJS(handleTouchDown)(t.id, t.x, t.y)
          }
        })
        .onTouchesUp((e) => {
          'worklet'
          for (const t of e.changedTouches) runOnJS(handleTouchUp)(t.id)
        })
        .onTouchesCancelled((e) => {
          'worklet'
          for (const t of e.changedTouches) runOnJS(handleTouchUp)(t.id)
        }),
    [handleTouchDown, handleTouchUp],
  )

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
                <OrbitingBots count={autoClickLevel} fuseEvery={FUSE_EVERY} />
                <OrbitingBots
                  count={scoutDroneLevel}
                  color="#fcd34d"
                  bigColor="#fbbf24"
                  beamColors={SCOUT_BEAM_COLORS}
                  phaseOffset={0.4}
                  fuseEvery={FUSE_EVERY}
                />
                {/* Ring + asteroid shrunk together by the same 0.85 the orbit
                    radii were scaled by (OrbitingBots) — one shared wrapper so
                    the two always shrink in lockstep, matching the web. */}
                <View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: 0.85 }],
                  }}
                >
                  <View style={{ position: 'absolute', width: '70%', height: '70%' }}>
                    <ProgressRing pct={pct} isMaxed={isMaxed} />
                  </View>
                  <Asteroid tierIndex={tierIndex} pct={pct} />
                </View>
              </View>
            </View>

            <View className="pb-24" />
          </View>
        </GestureDetector>

        <TapEffectsPool ref={poolRef} rippleColor={rippleColor} />
      </View>
    </View>
  )
}
