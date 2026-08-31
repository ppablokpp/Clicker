import { type ReactNode, useCallback, useRef, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { Asteroid } from './Asteroid'
import { OrbitingBots } from './OrbitingBots'
import { ProgressRing } from './ProgressRing'
import { ShotBolt } from './ShotBolt'

const SHOT_DURATION_MS = 280
// A circuit breaker, not a normal-play limit — see the file-level comment.
const MAX_CONCURRENT_SHOTS = 16
// Hoisted so it's the same array reference on every render — OrbitingBots
// is memoized, and an inline array literal here would create a new
// reference each time, defeating that memo for the scout-drone swarm.
const SCOUT_BEAM_COLORS: [string, string, string] = ['rgba(252,211,77,0)', '#fde68a', '#ffffff']

let nextShotId = 0

interface Shot {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
}

// Home's tap-to-shoot surface, deliberately stripped down to just the shot
// bolt + its sound while chasing a real bug: sustained fast tapping (a
// while of it, not just a quick burst) still eventually logged "Ended a
// touch event which was not counted in trackedTouchCount" and produced
// real, felt lag/heat, even after the ripple/"+N"/particle-burst effects
// were moved to their own non-touch-tracked overlay layer (which fixed the
// short-burst case). No "+N" popup, no lucky-hit ripple, no debris
// particles right now — once this minimal version is confirmed clean under
// a genuinely long tapping session, those come back one at a time so
// whichever one (if any) still causes trouble is obvious instead of guessed
// at again.
//
// Multi-touch (Multidisparo) is `Gesture.Manual()` from
// react-native-gesture-handler, not React Native's own raw responder props
// (onResponderGrant/Move/Release) — that was the very first thing tried
// here and is a dead end: its `touches`/`changedTouches` bookkeeping is
// built around a single already-granted responder tracking its own gesture
// (a pinch, a drag), not N independent, uncoordinated taps, and it only
// ever actually delivered one finger's worth of shots regardless.
//
// The web stops a tap on a HUD/modal button from also firing a shot with
// `e.stopPropagation()` on every one of them — no RN equivalent exists
// between a gesture-handler gesture and a nested Pressable's own touch
// handling. The header (with its own real buttons) is a plain sibling
// entirely *outside* the gesture-detected subtree below instead —
// spatially separated, not click-excluded, so there's never a touch
// landing in two touch-handling systems at once.
//
// This gesture is also never explicitly `end()`-ed on touches-up anymore —
// see the comment on touchGesture itself for why.
export function TapShootLayer({
  tierIndex,
  pct,
  isMaxed,
  autoClickLevel,
  scoutDroneLevel,
  multiShotValue,
  onTap,
  children,
}: {
  tierIndex: number
  pct: number
  isMaxed: boolean
  autoClickLevel: number
  scoutDroneLevel: number
  /** How many fingers can be shooting at once — Tree's Multidisparo node. */
  multiShotValue: number
  onTap: () => void
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

  const handleShotImpact = useCallback((id: number) => {
    shotsRef.current.delete(id)
    setShotIds((prev) => prev.filter((sid) => sid !== id))
  }, [])

  // Fires one shot from a single touch point — called once per NEW finger
  // landing (never for an already-tracked finger just moving), same as the
  // web's fireShot firing once per real pointerdown. `x`/`y` are already
  // relative to this layer's own root view (react-native-gesture-handler's
  // touch coordinates), no window-position math needed. The click always
  // registers via `onTap()` regardless of the concurrent-shots cap below —
  // only the *visual* bolt is ever skipped, never the score.
  const fireFromTouch = useCallback(
    (x: number, y: number) => {
      onTap()
      if (shotsRef.current.size >= MAX_CONCURRENT_SHOTS) return

      const { x: impactX, y: impactY } = impactCenterRef.current
      const dx = impactX - x
      const dy = impactY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      const id = nextShotId++
      shotsRef.current.set(id, { id, startX: x, startY: y, dx, dy, angleDeg })
      setShotIds((prev) => [...prev, id])
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

  // Deliberately never calls `manager.end()`. This is meant to be a
  // perpetual, always-on tap catcher for the screen's whole lifetime, not a
  // single discrete gesture — ending and re-beginning it on every single
  // touches-up/touches-down cycle means a fast tapper cycles this gesture's
  // *entire* native state machine (UNDETERMINED -> BEGAN -> ACTIVE -> END
  // -> UNDETERMINED...) potentially dozens of times a second. The
  // trackedTouchCount warning only ever showed up after a *while* of rapid
  // tapping, not immediately — consistent with drift accumulating across
  // many repeated end/restart cycles rather than a one-time setup mistake.
  // Calling `begin()`/`activate()` on every touches-down instead of once
  // is harmless (idempotent) and keeps this correct even if the state ever
  // did get reset by something outside our control.
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
          and the shot-bolt overlay below — same bounds, so a shot's x/y
          (measured relative to the gesture view) land in the right place in
          the overlay too without any extra conversion. Shots are rendered
          outside the touch-tracked view on purpose: they mount/unmount
          every ~280ms, and removing a view *inside* the hierarchy RN is
          touch-tracking while a finger is still down is a known way to
          desync its bookkeeping from what's actually on screen. */}
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
        </View>
      </View>
    </View>
  )
}
