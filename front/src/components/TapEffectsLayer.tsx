import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { Gem, Key } from 'lucide-react'

// Every ephemeral visual a tap produces — the laser bolt, the ripple/"+N"
// popup, the debris burst — lives here rather than in Home.tsx, and that
// separation IS the optimization, not a tidiness pass.
//
// These three lists change constantly (a bolt spawns on every tap, and its
// impact ~280ms later spawns an effect + a burst, each of which removes
// itself again on its own timer), so they were forcing roughly four full
// re-renders of Home per tap. Home is the app's largest component and
// consumes ~20 contexts, so each of those re-renders re-ran its whole body
// (context reads, the owned-item `.filter()`s, getHeatLevel, ...) and made
// React reconcile its entire tree — thousands of elements — just to add or
// drop one small absolutely-positioned div. At a sustained tap rate, with
// Multidisparo firing several at once, that reconciliation (not the CSS
// animations, which run on the compositor and cost the main thread nothing)
// was the real per-tap cost, and it's what made the phone heat up while
// tapping.
//
// Holding the state here instead means a tap re-renders only this component
// — a handful of tiny divs with no context reads at all — while Home itself
// never re-renders for a shot at all. Home drives it imperatively through
// the ref handle below, so even *calling* fireShot can't schedule a render
// up there.
//
// Deliberately NOT object-pooled, unlike the mobile port's TapShootLayer:
// there, pooling avoids creating a native view per hit (a real JS<->native
// bridge cost). On the web a fresh DOM node is cheap, while *reusing* one
// would mean re-triggering its CSS animation, which needs a forced
// synchronous reflow (`void el.offsetWidth`) — reliably more expensive than
// just letting React mount and drop the node. Same goal, opposite mechanic,
// because the underlying platform cost is different.

interface ClickEffect {
  id: number
  x: number
  y: number
  ripple: string
  amount: number
  isLucky: boolean
  /** Set only for a magnet proc "click" — shows the currency icon next to the +N instead of the lucky "!". */
  icon?: 'key' | 'gem'
}

let effectId = 0

// A short blaster bolt fired from the tap point to the space object on
// every click. dx/dy/angleDeg are computed once at creation time (positions
// never move mid-flight) and ride in as CSS custom properties, so the whole
// flight is one compositor-driven keyframe animation with no per-frame JS.
interface ShotEffect {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  // Everything the ripple/+N popup and particle burst need once the bolt
  // actually finishes — carried on the shot itself instead of a second,
  // independent setTimeout(SHOT_DURATION_MS) racing the real animation (see
  // the impact handler below for why that used to fall behind on a busy
  // mobile thread).
  impactX: number
  impactY: number
  displayAmount: number
  isLucky: boolean
  rippleClass: string
}

const BOLT_LENGTH = 26
const BOLT_THICKNESS = 3

let shotId = 0
// Must match the bolt's own CSS animation duration (.shot-bolt in
// index.css) — the ripple/+N effect is gated on the animation actually
// ending, not on this, but the two staying in step is what makes the impact
// land exactly when the bolt visually arrives.
const SHOT_DURATION_MS = 280

// Small debris chips that burst outward from the object on every hit, same
// recipe as Battle.tsx's duel screen — spawned from the object's own center
// at impact time, not from the tap point.
interface ParticleChip {
  angle: number
  distance: number
  size: number
}
interface ParticleBurst {
  id: number
  x: number
  y: number
  chips: ParticleChip[]
}
let particleId = 0
const PARTICLE_DURATION_MS = 380
const PARTICLE_COUNT = 4
// A fast tapper can fire well past 20-30 shots/second — spawning a burst on
// every single one piles up too many simultaneously-animated elements and
// visibly janks on mobile. Bursts are throttled independently of shots so
// the laser bolts themselves stay perfectly responsive either way.
const MIN_PARTICLE_INTERVAL_MS = 90

const EFFECT_LIFETIME_MS = 900

export interface FireShotParams {
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
  impactX: number
  impactY: number
  displayAmount: number
  isLucky: boolean
  rippleClass: string
}

export interface SpawnEffectParams {
  x: number
  y: number
  ripple: string
  amount: number
  isLucky: boolean
  icon?: 'key' | 'gem'
}

export interface TapEffectsHandle {
  /** One tap = one bolt; its impact spawns the ripple/+N and (throttled) debris on its own. */
  fireShot: (params: FireShotParams) => void
  /** A ripple/+N with no bolt in front of it — used by magnet procs, which have no tap of their own. */
  spawnEffect: (params: SpawnEffectParams) => void
}

// `ref` as a plain prop, not forwardRef — that's the React 19 way (and
// forwardRef is deprecated there). It's also the only prop this takes,
// which is what lets the memo below never re-render it from Home.
function TapEffectsLayerImpl({ ref }: { ref?: Ref<TapEffectsHandle> }) {
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const [shots, setShots] = useState<ShotEffect[]>([])
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])
  const lastParticleAtRef = useRef(0)
  // Every self-removal timer still pending, so unmounting mid-flight can't
  // leave one firing setState on a gone component.
  const timersRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const id of timers) window.clearTimeout(id)
      timers.clear()
    }
  }, [])

  const scheduleCleanup = useCallback((fn: () => void, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId)
      fn()
    }, delayMs)
    timersRef.current.add(timerId)
  }, [])

  const spawnEffect = useCallback(
    ({ x, y, ripple, amount, isLucky, icon }: SpawnEffectParams) => {
      const id = effectId++
      setEffects((prev) => [...prev, { id, x, y, ripple, amount, isLucky, icon }])
      scheduleCleanup(() => setEffects((prev) => prev.filter((fx) => fx.id !== id)), EFFECT_LIFETIME_MS)
    },
    [scheduleCleanup],
  )

  // Fires exactly when a bolt's own CSS animation reports finishing (see
  // onAnimationEnd below) — never on a fixed timer, so the ripple/+N and
  // particle burst can't land before, or after, the bolt has actually
  // visually arrived regardless of how far behind a busy mobile thread's
  // frame delivery has fallen.
  const handleShotImpact = useCallback(
    (shot: ShotEffect) => {
      setShots((current) => current.filter((s) => s.id !== shot.id))

      // A small random offset around the object's center keeps rapid clicks
      // from stacking their ripple on the exact same pixel.
      spawnEffect({
        x: shot.impactX + (Math.random() - 0.5) * 28,
        y: shot.impactY + (Math.random() - 0.5) * 28,
        ripple: shot.rippleClass,
        amount: shot.displayAmount,
        isLucky: shot.isLucky,
      })

      const impactAt = Date.now()
      if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
      lastParticleAtRef.current = impactAt
      const pId = particleId++
      const chips: ParticleChip[] = Array.from({ length: PARTICLE_COUNT }, () => ({
        angle: Math.random() * 360,
        distance: 38 + Math.random() * 48,
        size: 3.5 + Math.random() * 4,
      }))
      setParticleBursts((current) => [...current, { id: pId, x: shot.impactX, y: shot.impactY, chips }])
      scheduleCleanup(
        () => setParticleBursts((current) => current.filter((b) => b.id !== pId)),
        PARTICLE_DURATION_MS,
      )
    },
    [spawnEffect, scheduleCleanup],
  )

  const fireShot = useCallback((params: FireShotParams) => {
    setShots((prev) => [...prev, { id: shotId++, ...params }])
  }, [])

  useImperativeHandle(ref, () => ({ fireShot, spawnEffect }), [fireShot, spawnEffect])

  return (
    <>
      {/* shots — a short blaster bolt fired at the object per click, plain
          CSS (see .shot-bolt/@keyframes shot-fly in index.css); native
          onAnimationEnd gates the impact effects on the bolt actually
          finishing rather than on a wall-clock timer that a busy thread can
          fall behind. */}
      {shots.map((shot) => (
        <div
          key={shot.id}
          className="shot-bolt pointer-events-none absolute z-20 rounded-full bg-gradient-to-r from-violet-300/0 via-violet-200 to-white shadow-[0_0_8px_2px_rgba(216,180,254,0.85)]"
          style={
            {
              left: shot.startX - BOLT_LENGTH / 2,
              top: shot.startY - BOLT_THICKNESS / 2,
              width: BOLT_LENGTH,
              height: BOLT_THICKNESS,
              '--shot-dx': `${shot.dx}px`,
              '--shot-dy': `${shot.dy}px`,
              '--shot-angle': `${shot.angleDeg}deg`,
              '--shot-duration': `${SHOT_DURATION_MS}ms`,
            } as CSSProperties
          }
          onAnimationEnd={() => handleShotImpact(shot)}
        />
      ))}

      {/* Debris — small chips bursting off the object on every hit. */}
      {particleBursts.map((burst) =>
        burst.chips.map((chip, i) => {
          const rad = (chip.angle * Math.PI) / 180
          const dx = Math.cos(rad) * chip.distance
          const dy = Math.sin(rad) * chip.distance
          return (
            <span
              key={`${burst.id}-${i}`}
              className="debris-chip pointer-events-none absolute z-20 rounded-sm bg-violet-100"
              style={
                {
                  left: burst.x - chip.size / 2,
                  top: burst.y - chip.size / 2,
                  width: chip.size,
                  height: chip.size,
                  boxShadow: '0 0 8px 1px rgba(233,213,255,0.9)',
                  '--chip-dx': `${dx}px`,
                  '--chip-dy': `${dy}px`,
                  '--chip-duration': `${PARTICLE_DURATION_MS}ms`,
                } as CSSProperties
              }
            />
          )
        }),
      )}

      {/* click ripples + floating +N. No <AnimatePresence> around this:
          these are plain divs running CSS keyframes, with no Framer exit
          animation for it to orchestrate — it was tracking every child on
          every change for nothing. */}
      {effects.map((fx) => (
        <div key={fx.id} className="pointer-events-none absolute inset-0 z-20">
          <span
            className={`animate-ripple absolute rounded-full ${fx.ripple} ${fx.isLucky ? 'h-36 w-36' : 'h-24 w-24'}`}
            style={{ left: fx.x, top: fx.y }}
          />
          <span
            className={`animate-float-up absolute flex select-none items-center gap-1 font-bold ${
              fx.isLucky
                ? 'text-lg text-green-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                : fx.icon === 'key'
                  ? 'text-sm text-amber-300'
                  : fx.icon === 'gem'
                    ? 'text-sm text-indigo-300'
                    : 'text-sm text-white'
            }`}
            style={{ left: fx.x, top: fx.y }}
          >
            +{fx.amount}
            {fx.isLucky && '!'}
            {fx.icon === 'key' && <Key size={11} />}
            {fx.icon === 'gem' && <Gem size={11} />}
          </span>
        </div>
      ))}
    </>
  )
}

// memo + a single stable `ref` prop: Home re-renders ~10x/second from the
// auto-click tick alone, and without this every one of those would walk
// this component too (re-reconciling every in-flight bolt/chip) despite
// nothing here having changed. The ref object identity never changes, so
// memo's comparison always passes and the only thing that ever re-renders
// this is its own internal state.
export const TapEffectsLayer = memo(TapEffectsLayerImpl)
