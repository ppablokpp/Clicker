import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import {
  Zap,
  Rocket,
  Clover,
  Gem,
  Dices,
  Magnet,
  Key,
  Gift,
  TrendingUp,
  Backpack,
  Info,
  X,
  Sparkles,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext } from '../context/PowerupContext'
import { useTimedLuckPowerupContext } from '../context/TimedLuckPowerupContext'
import { useMagnetContext } from '../context/MagnetContext'
import { useKeysContext } from '../context/KeysContext'
import { useGemsContext } from '../context/GemsContext'
import { useGemUpgradesContext } from '../context/GemUpgradesContext'
import { useTreeContext } from '../context/TreeContext'
import { usePrestigeContext } from '../context/PrestigeContext'
import { useMilestonesContext } from '../context/MilestonesContext'
import { useDailyCaseContext } from '../context/DailyCaseContext'
import { useGemChestContext } from '../context/GemChestContext'
import { useInventoryContext } from '../context/InventoryContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { playMagnetProc } from '../lib/caseSound'
import { playLaserShot } from '../lib/battleSound'
import { objectCost } from '../lib/spaceObjects'
import { DroneIcon } from '../components/DroneIcon'
import { PlatinumIcon } from '../components/PlatinumIcon'

interface InfoModalData {
  icon: LucideIcon
  color: string
  name: string
  desc: string
  durationSeconds: number
}

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
// every click — like the original travelling dot, just elongated and
// rotated to face its own direction of travel. dx/dy/angleDeg are computed
// once at creation time (positions never move mid-flight): rotate is set
// as a Framer style prop (not a manual CSS transform string), so it
// composes cleanly with the animated x/y translate on the very same
// element — no need for the two-element split OrbitingBots' static offset
// requires (that one sets transform via a literal string, which is what
// Framer can't share the element with).
interface ShotEffect {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
}

const BOLT_LENGTH = 26
const BOLT_THICKNESS = 3

let shotId = 0
// Must match the shot's own Framer transition duration below — the ripple/
// +N effect waits this long before landing, so it appears exactly when the
// shot visually arrives at the object instead of at an arbitrary offset.
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

// The orbiting drones' distance from the ring's center. Plain `vmin` alone
// looked right on mobile (where the viewport roughly matches the object
// box's own size) but blew up on desktop — a wide, tall browser window
// pushes vmin far past the object box's actual fixed size (h-72/sm:h-96),
// sending the drones flying way out past the ring. Clamping bounds it to
// roughly what the ring itself already spans across breakpoints, so it
// still scales a little with viewport but can never drift far from "just
// outside the ring" — mobile's own natural value already sits inside this
// range, so it renders unchanged there.
const DRONE_ORBIT_RADIUS = 'clamp(105px, 32vmin, 165px)'

// Escalates the whole screen's feel with click speed — a free "combo meter"
// with no server round trip, purely derived from clicksPerSecond. Legendario
// also doubles the value of each click (registerClick(multiplier)). `key` is
// resolved against strings.home.heat inside the component for translation.
const HEAT_LEVELS = [
  { min: 0, key: null, badge: 'text-neutral-300', icon: 'text-neutral-600', ripple: 'bg-violet-400/40', glow: 'rgba(168,85,247,0.25)', multiplier: 1 },
  { min: 6, key: 'onFire', badge: 'text-amber-300', icon: 'text-amber-400', ripple: 'bg-amber-400/50', glow: 'rgba(251,191,36,0.35)', multiplier: 1 },
  { min: 10, key: 'unstoppable', badge: 'text-orange-300', icon: 'text-orange-400', ripple: 'bg-orange-500/55', glow: 'rgba(249,115,22,0.4)', multiplier: 1 },
  { min: 20, key: 'legendary', badge: 'text-red-300', icon: 'text-red-400', ripple: 'bg-red-500/60', glow: 'rgba(239,68,68,0.45)', multiplier: 2 },
] as const satisfies readonly {
  min: number
  key: 'onFire' | 'unstoppable' | 'legendary' | null
  badge: string
  icon: string
  ripple: string
  glow: string
  multiplier: number
}[]

// 0.015 -> "1.5%", 0.01 -> "1%" — never a trailing ".0" for the whole steps.
// Suerte's own % now varies per player (the Probabilidad tree node), so the
// pill can't just hardcode "1%" anymore.
function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(1).replace(/\.0$/, '')}%`
}

function getHeatLevel(cps: number): (typeof HEAT_LEVELS)[number] {
  let level: (typeof HEAT_LEVELS)[number] = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (cps >= l.min) level = l
  }
  return level
}

// Legendary's own combo meter: real taps landed *while* legendary (not
// auto-click ticks) fill a bar; filling it once bumps the bonus from the
// base x1.5 up and resets the bar for the next one, which takes more taps
// than the last — same shape as the tree's cost curves (linear reward,
// exponential requirement). Dropping out of legendary resets both back to
// zero, since this rewards *sustaining* the combo, not a lifetime total.
// The first threshold (streakBase) and the per-fill bonus increase
// (bonusStep) both come from the tree now — Reflejos/Impulso, Multiplicador's
// two children — so they're parameters here, not fixed constants. The bar
// can only fill LEGENDARY_TIER_MAX times, period — a fixed cap on *how many
// times* it can go up, not on the resulting value, so Impulso raising
// bonusStep actually raises the ceiling instead of just getting there
// faster.
const LEGENDARY_STREAK_RATIO = 1.4
const LEGENDARY_BONUS_BASE = 1.5
const LEGENDARY_TIER_MAX = 5

function legendaryStreakThreshold(tier: number, streakBase: number): number {
  return Math.ceil(streakBase * LEGENDARY_STREAK_RATIO ** tier)
}

function legendaryBonusForTier(tier: number, bonusStep: number): number {
  return LEGENDARY_BONUS_BASE + bonusStep * Math.min(tier, LEGENDARY_TIER_MAX)
}

// A whole starfield from one 1x1px element — every star is just another
// point in a single giant box-shadow list, so there's no per-star DOM cost.
// Two layers (dim/static, bright/twinkling) give it a bit of depth.
function generateStars(count: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    stars.push(`${x}vw ${y}vh 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

// First prestige threshold — reaching it is meant to be when prestige becomes
// available (prestige itself isn't built yet, this is just the ring's
// target). Driven by objectsBroken (how many space objects you've shattered)
// instead of a raw click count now — roughly the same pacing as the old
// 1,000,000-click target given the object cost curve in lib/spaceObjects.ts.
const PRESTIGE_OBJECT_TARGET = 50

// Glowing ring around the counter that fills up towards the prestige target.
// Once maxed, it stops being a progress indicator and becomes a spinning gold
// halo instead — a visibly different state for "you've got something to do here".
function ProgressRing({ pct, isMaxed }: { pct: number; isMaxed: boolean }) {
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, pct)))

  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible -rotate-90 ${isMaxed ? 'animate-spin-slow' : ''}`}
    >
      <defs>
        <linearGradient id="homeProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id="homePrestigeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
      <circle
        cx="100"
        cy="100"
        r={radius}
        stroke={isMaxed ? 'url(#homePrestigeGradient)' : 'url(#homeProgressGradient)'}
        strokeWidth={isMaxed ? 4 : 3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={isMaxed ? 0 : offset}
        style={{
          transition: 'stroke-dashoffset 0.6s ease-out',
          filter: isMaxed
            ? 'drop-shadow(0 0 10px rgba(245,158,11,0.8))'
            : 'drop-shadow(0 0 6px rgba(217,70,239,0.55))',
        }}
      />
    </svg>
  )
}

type Point = [number, number]

// Deterministic wobble (not random) so the shape is stable across renders —
// two overlapping sine waves at different frequencies read as an organic,
// rounded rock instead of a perfect circle or the earlier jagged/spiky one.
function buildRoundRockOutline(pointCount: number, baseRadius: number, jitter: number): Point[] {
  const points: Point[] = []
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2
    const wobble = Math.sin(angle * 3) * jitter * 0.6 + Math.sin(angle * 5 + 1) * jitter * 0.4
    const r = baseRadius + wobble
    points.push([50 + Math.cos(angle) * r, 50 + Math.sin(angle) * r])
  }
  return points
}

const ASTEROID_POINTS = buildRoundRockOutline(20, 42, 5)
  .map((p) => p.join(','))
  .join(' ')

const CRATERS = [
  { cx: 38, cy: 38, r: 6 },
  { cx: 63, cy: 55, r: 8 },
  { cx: 68, cy: 32, r: 4 },
  { cx: 42, cy: 66, r: 5 },
]

// Cosmetic color tier every 10 objects broken — same round rock throughout,
// just recolored so a long session doesn't stare at the exact same one
// forever. Per-object progress isn't shown visually at all right now (the
// earlier cracking-apart version and the bar under it both got dropped) —
// the rock just glows a little brighter as `pct` climbs.
const OBJECT_TIERS = [
  { fill: '#a78bfa', glow: 'rgba(168,85,247,0.6)' },
  { fill: '#67e8f9', glow: 'rgba(34,211,238,0.6)' },
  { fill: '#fda4af', glow: 'rgba(251,113,133,0.6)' },
  { fill: '#fde68a', glow: 'rgba(251,191,36,0.6)' },
  { fill: '#6ee7b7', glow: 'rgba(52,211,153,0.6)' },
]

// The thing you're actually clicking now, instead of a bare number — a
// slowly bobbing/rotating rock with a one-shot white flash (replayed by
// remounting on `objectsBroken` changing) when it's done. Color no longer
// cycles with `objectsBroken` (it used to change tier every 10 broken) —
// it should only ever change on prestige, which isn't wired back up yet
// (see the disabled prestige blocks elsewhere in this file), so it's
// pinned to the first tier (violet) for now.
function SpaceObject({ objectsBroken, pct }: { objectsBroken: number; pct: number }) {
  const tier = OBJECT_TIERS[0]
  return (
    <div className="pointer-events-none relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
      {/* A radial-gradient glow instead of a blurred solid circle — some
          mobile Chromium builds flash the pre-filter unblurred shape (a
          hard-edged square, since `blur-lg` blurs the element's own box)
          before the `filter: blur()` layer finishes compositing. A gradient
          fades out on its own with no filter involved, so there's nothing
          to flash. */}
      <div
        className="absolute -inset-6 rounded-full transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)`,
          opacity: 0.22 + pct * 0.5,
        }}
      />
      <motion.div
        key={objectsBroken}
        className="absolute inset-0 rounded-full bg-white"
        initial={{ opacity: 0.8, scale: 0.5 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.div
        animate={{ rotate: 360, y: [0, -6, 0] }}
        transition={{
          rotate: { duration: 26, repeat: Infinity, ease: 'linear' },
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        {/* No `filter: drop-shadow()` here on purpose — same mobile
            Chromium flash-to-square bug as the old blurred glow div above,
            just triggered by this SVG's own filter instead. The ambient
            radial-gradient glow behind the rock already sells the "aura"
            without needing a second, shape-hugging filtered glow on top. */}
        <svg viewBox="0 0 100 100" width={76} height={76}>
          <polygon points={ASTEROID_POINTS} fill={tier.fill} stroke="rgba(0,0,0,0.25)" strokeWidth={2} strokeLinejoin="round" />
          {CRATERS.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="rgba(0,0,0,0.18)" />
          ))}
        </svg>
      </motion.div>
    </div>
  )
}

// Autoclick's swarm — one little drone per level, uncapped, orbiting just
// outside the prestige ring like Cookie Clicker's cursors circling the
// cookie. Purely decorative: each
// drone's orbit phase and pulse timing come from its own index, not real
// production data, since this only exists to make "you own N levels of
// autoclick" *feel* alive rather than to visualize the exact cps.
function OrbitingBots({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => {
        const orbitDuration = 18 + (i % 3) * 3
        // Negative delay pre-advances the loop so drones start already
        // spread around the circle instead of all bunched at angle 0.
        const orbitDelay = -((i / count) * orbitDuration)
        const pulseDelay = (i * 0.53) % 2.4
        const clockwise = i % 2 === 0
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            animate={{ rotate: clockwise ? 360 : -360 }}
            transition={{ duration: orbitDuration, delay: orbitDelay, repeat: Infinity, ease: 'linear' }}
          >
            {/* Static orbit-radius offset lives on a plain (non-motion) div
                — Framer Motion owns the *whole* transform string on any
                element it animates x/y/scale/rotate on, so a manually set
                style.transform on that same element gets silently
                overwritten (this is what was collapsing every drone onto
                the exact center point). Keeping it on a separate plain div
                sidesteps that entirely. The drone body itself also counter-
                rotates against the orbit spin so it stays visually level
                instead of tumbling around its own axis as it orbits. */}
            <div
              className="absolute left-0 top-0"
              style={{ transform: `translate(-50%, -50%) translateY(calc(${DRONE_ORBIT_RADIUS} * -1))` }}
            >
              <motion.div
                animate={{
                  rotate: clockwise ? -360 : 360,
                  scale: [1, 1.12, 1],
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{
                  rotate: { duration: orbitDuration, delay: orbitDelay, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1.8, delay: pulseDelay, repeat: Infinity, ease: 'easeInOut' },
                  opacity: { duration: 1.8, delay: pulseDelay, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="text-violet-300"
                style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.65))' }}
              >
                <DroneIcon size={20} animated />
              </motion.div>

              {/* The shot — a short bolt fired straight at the counter every
                  pulse (same travelling-dot shape the main click shot uses,
                  just vertical since the drone's own orbit rotation,
                  applied one level up, already points "down" at the ring
                  center). `x: '-50%'` is a Framer style value, not a raw
                  CSS transform string, so it composes with the animated y
                  on this same element instead of fighting it. */}
              <motion.div
                className="absolute left-1/2 top-1/2 w-[3px] rounded-full bg-gradient-to-b from-violet-300/0 via-violet-200 to-white shadow-[0_0_6px_1px_rgba(216,180,254,0.8)]"
                style={{ height: 10, x: '-50%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: DRONE_ORBIT_RADIUS, opacity: [1, 1, 0] }}
                transition={{
                  duration: 0.4,
                  delay: pulseDelay,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: 'easeIn',
                }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function Home() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const { promptSignIn } = useSignInPrompt()
  const { totalClicks, clicksPerSecond, registerClick, objectsBroken, objectProgress } = useClickCounterContext()
  const {
    autoClickCps,
    autoClickLevel,
    luckChance: permanentLuckChance,
    luckMultiplier: permanentLuckMultiplier,
    multiplierValue: baseClickMultiplier,
    tapMultiplierValue,
    legendaryStreakBase,
    legendaryBonusStep,
    multiShotValue,
  } = useTreeContext()
  // Only the Reactor's permanent multiplier is still read here — the rest
  // of the prestige UI (shop, reset flow) is disabled below.
  const { reactorValue } = usePrestigeContext()
  const { language, strings } = useLanguage()
  const {
    catalog: powerupCatalog,
    active: activePowerup,
    secondsLeft,
    activatingId: activatingPowerupId,
    activate: activatePowerup,
  } = usePowerupContext()
  const {
    catalog: luckCatalog,
    active: activeLuckPowerup,
    secondsLeft: luckSecondsLeft,
    activatingId: activatingLuckId,
    activate: activateLuck,
  } = useTimedLuckPowerupContext()
  const {
    catalog: magnetCatalog,
    active: activeMagnet,
    secondsLeft: magnetSecondsLeft,
    activatingId: activatingMagnetId,
    activate: activateMagnet,
  } = useMagnetContext()
  const { keys } = useKeysContext()
  const { gems } = useGemsContext()
  const { ownedChests: ownedClickChests } = useDailyCaseContext()
  const { ownedChests: ownedGemChests } = useGemChestContext()
  const { inventory } = useInventoryContext()
  // Keeps the just-activated item visible (its owned count can drop to 0)
  // until its own timer runs out, instead of it vanishing the instant it starts.
  const ownedPowerups = powerupCatalog.filter((p) => (inventory[p.id] ?? 0) > 0 || activePowerup?.id === p.id)
  const ownedLuckPowerups = luckCatalog.filter(
    (p) => (inventory[p.id] ?? 0) > 0 || activeLuckPowerup?.id === p.id,
  )
  const ownedMagnets = magnetCatalog.filter((m) => (inventory[m.id] ?? 0) > 0 || activeMagnet?.id === m.id)
  const isInventoryEmpty =
    ownedClickChests === 0 &&
    ownedGemChests === 0 &&
    ownedPowerups.length === 0 &&
    ownedLuckPowerups.length === 0 &&
    ownedMagnets.length === 0
  const { bestOwned: bestMoneyOwned } = useGemUpgradesContext()
  const { bonusMultiplier } = useMilestonesContext()
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const [shots, setShots] = useState<ShotEffect[]>([])
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])
  // The real reset flow (confirm/shop modals) is still parked — see the
  // commented-out blocks further down — so the button just flashes a
  // "coming soon" label instead of opening anything for now.
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // The space object's own on-screen box — click shots animate from the tap
  // point to this element's center, computed fresh on every click since the
  // object stays centered in the viewport but the viewport itself can resize.
  const objectRef = useRef<HTMLDivElement>(null)
  const prevKeysRef = useRef<number | null>(null)
  const prevGemsRef = useRef<number | null>(null)
  // Every click's *real* value can end up fractional once a non-integer
  // multiplier exists (e.g. a future x1.5 upgrade) — the actual total sent
  // to registerClick keeps that full precision, but the floating "+N" is
  // never allowed to show a decimal. Instead it carries the leftover
  // fraction forward and only flashes a whole number once enough has
  // accumulated, so across many clicks the numbers shown still average out
  // to the true value (e.g. x1.5 reads as an alternating +1, +2, +1, +2…).
  const popupCarryRef = useRef(0)
  // Where the last real tap landed — a magnet proc has no coordinates of its
  // own (it's rolled server-side inside the batched click flush, up to ~1s
  // later), so its "+1" effect spawns from here instead, reading as just
  // another click landing rather than a separate notification.
  const lastPosRef = useRef({ x: 0, y: 0 })
  // Every finger currently down, keyed by pointerId — Multidisparo raises
  // how many of these can be active at once (level 0 = 1, the game's
  // default). A new finger landing past the cap is ignored outright: no
  // click, no shot, nothing — it doesn't even start "counting" until an
  // existing one lifts and frees a slot.
  const activePointersRef = useRef<Set<number>>(new Set())
  const lastParticleAtRef = useRef(0)
  const heat = useMemo(() => getHeatLevel(clicksPerSecond), [clicksPerSecond])
  const [legendaryStreak, setLegendaryStreak] = useState({ tier: 0, count: 0 })
  // Falling out of legendary breaks the combo — back to the base x2 and an
  // empty bar, so the bonus only ever reflects a *sustained* streak.
  useEffect(() => {
    if (heat.key !== 'legendary') setLegendaryStreak({ tier: 0, count: 0 })
  }, [heat.key])
  useEffect(() => {
    if (prevKeysRef.current !== null && keys > prevKeysRef.current && activeMagnet?.currency === 'keys') {
      const amount = keys - prevKeysRef.current
      const id = effectId++
      const { x, y } = lastPosRef.current
      setEffects((prev) => [...prev, { id, x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'key' }])
      playMagnetProc('keys')
      window.setTimeout(() => setEffects((prev) => prev.filter((fx) => fx.id !== id)), 900)
    }
    prevKeysRef.current = keys
  }, [keys, activeMagnet, heat.ripple])
  useEffect(() => {
    if (prevGemsRef.current !== null && gems > prevGemsRef.current && activeMagnet?.currency === 'gems') {
      const amount = gems - prevGemsRef.current
      const id = effectId++
      const { x, y } = lastPosRef.current
      setEffects((prev) => [...prev, { id, x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'gem' }])
      playMagnetProc('gems')
      window.setTimeout(() => setEffects((prev) => prev.filter((fx) => fx.id !== id)), 900)
    }
    prevGemsRef.current = gems
  }, [gems, activeMagnet, heat.ripple])
  const heatLabel = heat.key ? strings.home.heat[heat.key] : ''
  const powerupMultiplier = activePowerup?.multiplier ?? 1
  const moneyMultiplier = bestMoneyOwned?.multiplier ?? 1
  // baseClickMultiplier (branch E, "Productividad") is the base value a
  // click starts from; tapMultiplierValue (branch E, "Multiplicador")
  // stacks a genuine ×multiplier on top of it — everything else stacks on
  // top the same way it always has, order doesn't matter since it's all
  // multiplication. Legendary's own multiplier grows with the
  // sustained-combo streak instead of staying a flat x2 like the other
  // heat tiers.
  const heatMultiplier =
    heat.key === 'legendary' ? legendaryBonusForTier(legendaryStreak.tier, legendaryBonusStep) : heat.multiplier
  const totalMultiplier =
    baseClickMultiplier *
    tapMultiplierValue *
    heatMultiplier *
    powerupMultiplier *
    bonusMultiplier *
    moneyMultiplier *
    reactorValue

  // Permanent Suerte (now a tree node, branch A) and the timed one aren't
  // two separate rolls — owning both multiplies together into a single
  // number under one shared 1% roll, so buying the timed one actually
  // amplifies the permanent level you already have.
  const hasLuck = Boolean(permanentLuckChance > 0 || activeLuckPowerup)
  const luckChance = activeLuckPowerup?.chance ?? permanentLuckChance
  const combinedLuckMultiplier = permanentLuckMultiplier * (activeLuckPowerup?.multiplier ?? 1)

  const prestige = useMemo(
    () => ({
      isMaxed: objectsBroken >= PRESTIGE_OBJECT_TARGET,
      pct: Math.min(1, objectsBroken / PRESTIGE_OBJECT_TARGET),
    }),
    [objectsBroken],
  )

  // The current space object's own progress (independent of the prestige
  // ring above it) — this is what the ring around the object actually shows.
  const currentObjectCost = objectCost(objectsBroken)
  const objectPct = Math.min(1, objectProgress / currentObjectCost)

  const starsDim = useMemo(() => generateStars(220, 0.5), [])
  const starsBright = useMemo(() => generateStars(60, 0.9), [])

  // Reset flow disabled along with the rest of the prestige UI — a full
  // reload on success was deliberate here (every other context would need
  // its own "zero everything out" logic otherwise), worth keeping in mind
  // if this gets re-enabled.
  // const handleConfirmPrestige = async () => {
  //   setPrestigeError(null)
  //   const result = await resetPrestige()
  //   if (result.ok) {
  //     window.location.reload()
  //   } else if (result.error !== 'not-signed-in') {
  //     setPrestigeError(result.error ?? 'error')
  //   }
  // }

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!userId) {
        promptSignIn()
        return
      }

      // Multidisparo's cap — a finger landing while the allowance is
      // already full is ignored entirely, not queued for when a slot frees
      // up, so it reads as "this tap just didn't register" rather than a
      // delayed extra shot later.
      if (!activePointersRef.current.has(e.pointerId) && activePointersRef.current.size >= multiShotValue) {
        return
      }
      activePointersRef.current.add(e.pointerId)

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // The impact point — the object's own center, not the tap — is what
      // magnet-proc effects (which have no coordinates of their own) and
      // the ripple/+N below now spawn from, so they all read as "hitting
      // the object" instead of hovering over your finger.
      const objectRect = objectRef.current?.getBoundingClientRect()
      const objX = objectRect ? objectRect.left + objectRect.width / 2 - rect.left : x
      const objY = objectRect ? objectRect.top + objectRect.height / 2 - rect.top : y
      lastPosRef.current = { x: objX, y: objY }

      const luckMultiplier = hasLuck && Math.random() < luckChance ? combinedLuckMultiplier : 1
      const isLucky = luckMultiplier > 1
      const amount = totalMultiplier * luckMultiplier

      // Only real taps feed the combo meter — same source clicksPerSecond
      // itself reads from, so it can't be padded by auto-click ticks.
      if (heat.key === 'legendary') {
        setLegendaryStreak((prev) => {
          // Already filled the max number of times — stop counting instead
          // of endlessly refilling a bar that can't buy anything more.
          if (prev.tier >= LEGENDARY_TIER_MAX) return prev
          const nextCount = prev.count + 1
          const threshold = legendaryStreakThreshold(prev.tier, legendaryStreakBase)
          return nextCount >= threshold ? { tier: prev.tier + 1, count: 0 } : { tier: prev.tier, count: nextCount }
        })
      }

      // The popup only ever shows the carried-forward whole part — see
      // popupCarryRef above. registerClick still gets the exact `amount`.
      popupCarryRef.current += amount
      const displayAmount = Math.floor(popupCarryRef.current)
      popupCarryRef.current -= displayAmount
      registerClick(amount)
      playLaserShot()

      // Fire a shot from the tap point at the space object, then land the
      // ripple/+N there once the shot actually arrives instead of showing
      // it instantly at the tap point — a small random offset around the
      // object's center keeps rapid clicks from stacking on the exact same
      // pixel.
      setShots((prev) => {
        const sId = shotId++
        const dx = objX - x
        const dy = objY - y
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
        window.setTimeout(() => {
          setShots((current) => current.filter((s) => s.id !== sId))
        }, SHOT_DURATION_MS)
        return [...prev, { id: sId, startX: x, startY: y, dx, dy, angleDeg }]
      })

      window.setTimeout(() => {
        const jitterX = objX + (Math.random() - 0.5) * 28
        const jitterY = objY + (Math.random() - 0.5) * 28
        const id = effectId++
        setEffects((prev) => [
          ...prev,
          {
            id,
            x: jitterX,
            y: jitterY,
            ripple: isLucky ? 'bg-green-400/70' : heat.ripple,
            amount: displayAmount,
            isLucky,
          },
        ])
        window.setTimeout(() => {
          setEffects((prev) => prev.filter((fx) => fx.id !== id))
        }, 900)

        // Debris burst — same recipe as Battle.tsx's duel screen, throttled
        // separately from shots so a fast tapper doesn't pile up dozens of
        // animated chips at once.
        const impactAt = Date.now()
        if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
        lastParticleAtRef.current = impactAt
        const pId = particleId++
        const chips: ParticleChip[] = Array.from({ length: PARTICLE_COUNT }, () => ({
          angle: Math.random() * 360,
          distance: 38 + Math.random() * 48,
          size: 3.5 + Math.random() * 4,
        }))
        setParticleBursts((current) => [...current, { id: pId, x: objX, y: objY, chips }])
        window.setTimeout(() => {
          setParticleBursts((current) => current.filter((b) => b.id !== pId))
        }, PARTICLE_DURATION_MS)
      }, SHOT_DURATION_MS)
    },
    [
      userId,
      promptSignIn,
      registerClick,
      heat,
      totalMultiplier,
      hasLuck,
      luckChance,
      combinedLuckMultiplier,
      legendaryStreakBase,
      multiShotValue,
    ],
  )

  // Frees the pointer's slot the moment it lifts (or the gesture is
  // cancelled, e.g. an OS gesture taking over) so the next finger down can
  // use it — a plain ref mutation, no re-render needed for either handler.
  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId)
  }, [])

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex h-[100dvh] w-full touch-none select-none flex-col items-center justify-center overflow-hidden bg-[#08080c]"
    >
      {/* starfield — replaces the old scattered ambient glows entirely */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>

      {/* Prestige-ready ambient glow — a radial-gradient instead of the old
          `blur-[140px]` div (same mobile Chromium flash-to-square bug fixed
          on the asteroid's own glow, so it's built the filter-free way
          from the start here). */}
      {prestige.isMaxed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="animate-pulse-glow absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 65%)' }}
          />
        </div>
      )}

      {/* Inventory button — mirrors the CPS badge's position on the right. */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowInventory(true)}
        aria-label={strings.home.inventory}
        className="pointer-events-auto absolute right-4 top-20 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:right-6"
      >
        <Backpack size={16} />
      </button>

      {/* CPS badge + combined multiplier (below the fixed header) */}
      <div className="pointer-events-none absolute left-4 top-20 z-10 flex flex-col gap-1.5 sm:left-6">
        <span className="relative flex w-fit items-center gap-1.5 overflow-hidden rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-medium shadow-lg shadow-black/20 transition-colors">
          {/* Legendary's combo bar — very subtle, purely a gray fill behind
              the text so everything stays readable; fills up with real taps
              landed while legendary, resets (and the bonus bumps) each time
              it fills. Once it's filled LEGENDARY_TIER_MAX times it just
              shows full instead of continuing to fill/reset for no further
              gain. */}
          {heat.key === 'legendary' && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-white/[0.07] transition-[width] duration-200 ease-out"
              style={{
                width:
                  legendaryStreak.tier >= LEGENDARY_TIER_MAX
                    ? '100%'
                    : `${Math.min(100, (legendaryStreak.count / legendaryStreakThreshold(legendaryStreak.tier, legendaryStreakBase)) * 100)}%`,
              }}
            />
          )}
          <Zap size={13} className={`relative z-10 ${clicksPerSecond > 0 ? heat.icon : 'text-neutral-600'}`} />
          <span className={`relative z-10 ${clicksPerSecond > 0 ? heat.badge : 'text-neutral-300'}`}>
            {clicksPerSecond.toFixed(1)} {strings.home.tps}
          </span>
          {heatLabel && (
            <span className={`relative z-10 font-semibold uppercase tracking-wide ${heat.badge}`}>
              · {heatLabel}
              {heat.key === 'legendary' &&
                ` ×${legendaryBonusForTier(legendaryStreak.tier, legendaryBonusStep).toFixed(1)}`}
            </span>
          )}
        </span>

        <span className="flex w-fit items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-bold text-violet-200 shadow-lg shadow-black/20">
          <MousePointerClick size={15} className="text-violet-300" />
          {(clicksPerSecond * totalMultiplier).toFixed(1)} {strings.home.cps}
          {activePowerup && (
            <>
              <Rocket size={12} className="text-violet-300" />
              <span className="tabular-nums text-violet-300">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            </>
          )}
        </span>

        {autoClickCps > 0 && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-zinc-400/25 bg-zinc-500/30 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-lg shadow-black/20">
            <span className="text-zinc-400">
              <DroneIcon size={12} />
            </span>
            {autoClickCps.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 2 })}{' '}
            {strings.home.cps}
          </span>
        )}

        {bestMoneyOwned && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-3 py-1.5 text-xs font-bold text-fuchsia-200 shadow-lg shadow-black/20">
            <Gem size={12} className="text-fuchsia-300" />×{bestMoneyOwned.multiplier}
          </span>
        )}

        {hasLuck && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-green-400/20 bg-green-500/[0.07] px-3 py-1.5 text-xs font-bold text-green-200 shadow-lg shadow-black/20">
            <Clover size={12} className="text-green-300" />×{combinedLuckMultiplier}
            <span className="font-medium text-green-300/80">({formatChance(luckChance)})</span>
            {activeLuckPowerup && (
              <>
                <Dices size={12} className="text-green-300" />
                <span className="tabular-nums text-green-300">
                  {Math.floor(luckSecondsLeft / 60)}:{String(luckSecondsLeft % 60).padStart(2, '0')}
                </span>
              </>
            )}
          </span>
        )}

        {activeMagnet && (
          <span
            className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg shadow-black/20 ${
              activeMagnet.currency === 'keys'
                ? 'border-amber-400/20 bg-amber-500/[0.07] text-amber-200'
                : 'border-indigo-400/20 bg-indigo-500/[0.07] text-indigo-200'
            }`}
          >
            <Magnet size={12} className={activeMagnet.currency === 'keys' ? 'text-amber-300' : 'text-indigo-300'} />
            <span className="tabular-nums">
              {Math.floor(magnetSecondsLeft / 60)}:{String(magnetSecondsLeft % 60).padStart(2, '0')}
            </span>
          </span>
        )}

        {bonusMultiplier > 1 && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-200 shadow-lg shadow-black/20">
            <TrendingUp size={12} className="text-emerald-300" />×{bonusMultiplier}
          </span>
        )}

        {/* Prestige points pill disabled along with the rest of the
            prestige UI — see the other commented-out prestige blocks below. */}
        {/* {(prestigePoints > 0 || reactorLevel > 0) && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowPrestigeShop(true)}
            className="pointer-events-auto flex w-fit items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/[0.07] px-3 py-1.5 text-xs font-bold text-amber-200 shadow-lg shadow-black/20"
          >
            <Sparkles size={12} className="text-amber-300" />
            {prestigePoints}
          </button>
        )} */}
      </div>

      {/* Platino — same pill language as the Store header's badge, sitting
          below the header/pills row instead of sharing its exact top-20/24 line. */}
      <div className="pointer-events-none absolute left-0 right-0 top-44 z-10 flex justify-center sm:top-48">
        <motion.span
          key={totalClicks}
          initial={{ scale: 1 }}
          animate={{ scale: [1.08, 1] }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-5 py-2 text-sm font-semibold tabular-nums text-violet-200 shadow-lg shadow-black/20"
        >
          <PlatinumIcon size={19} className="opacity-70" />
          {totalClicks.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
        </motion.span>
      </div>

      {/* main counter — the space object you break with clicks. The big
          ring tracks progress toward the *next prestige* (objectsBroken /
          PRESTIGE_OBJECT_TARGET). */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <div ref={objectRef} className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
          <OrbitingBots count={autoClickLevel} />
          {/* Scaled down from the object's own box — the ring used to hug
              the object edge-to-edge, which read as oversized next to it. */}
          <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.7)' }}>
            <ProgressRing pct={prestige.pct} isMaxed={prestige.isMaxed} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <SpaceObject objectsBroken={objectsBroken} pct={objectPct} />
          </div>
        </div>

        {/* Prestige-ready banner + button — `absolute top-full`, not
            static flow, so it hangs below the ring without adding to this
            flex-col's own height. That mattered: as a normal-flow sibling
            it was pushing the whole stack (ring included) upward to stay
            centered on the page whenever it appeared. */}
        {prestige.isMaxed && (
          <div className="pointer-events-none absolute left-0 right-0 top-full mt-8 flex flex-col items-center px-3">
            <span className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              {strings.home.prestigeReady}
            </span>
            <div className="pointer-events-auto flex flex-col items-center gap-1.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowComingSoon(true)
                  window.setTimeout(() => setShowComingSoon(false), 1800)
                }}
                className="animate-prestige-pulse flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 px-4 py-2 text-xs font-bold text-amber-200 shadow-lg shadow-amber-500/10 transition-transform hover:scale-105"
              >
                <Sparkles size={13} className="text-amber-300" />
                {showComingSoon ? strings.home.prestigeComingSoon : strings.home.changePrestige}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* click ripples + floating +N */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* shots — a short blaster bolt fired at the object per click, purely
          visual. rotate is a Framer style prop (not a manual CSS transform
          string), so it composes with the animated x/y translate on this
          same element instead of fighting it. */}
      {shots.map((shot) => (
        <motion.div
          key={shot.id}
          className="pointer-events-none absolute z-20 rounded-full bg-gradient-to-r from-violet-300/0 via-violet-200 to-white shadow-[0_0_8px_2px_rgba(216,180,254,0.85)]"
          style={{
            left: shot.startX - BOLT_LENGTH / 2,
            top: shot.startY - BOLT_THICKNESS / 2,
            width: BOLT_LENGTH,
            height: BOLT_THICKNESS,
            rotate: shot.angleDeg,
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: shot.dx, y: shot.dy, opacity: [1, 1, 0] }}
          transition={{ duration: SHOT_DURATION_MS / 1000, ease: 'easeIn' }}
        />
      ))}

      {/* Debris — small chips bursting off the object on every hit. */}
      {particleBursts.map((burst) =>
        burst.chips.map((chip, i) => {
          const rad = (chip.angle * Math.PI) / 180
          const dx = Math.cos(rad) * chip.distance
          const dy = Math.sin(rad) * chip.distance
          return (
            <motion.span
              key={`${burst.id}-${i}`}
              className="pointer-events-none absolute z-20 rounded-sm bg-violet-100"
              style={{
                left: burst.x - chip.size / 2,
                top: burst.y - chip.size / 2,
                width: chip.size,
                height: chip.size,
                boxShadow: '0 0 8px 1px rgba(233,213,255,0.9)',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: dx, y: dy, opacity: 0, scale: 0.3 }}
              transition={{ duration: PARTICLE_DURATION_MS / 1000, ease: 'easeOut' }}
            />
          )
        }),
      )}

      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowInventory(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-white/10 bg-[#0d0d14] py-6 pl-6 pr-2 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInventory(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex shrink-0 items-center gap-2 pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-sky-500/20 text-cyan-200">
                <Backpack size={17} />
              </div>
              <p className="text-sm font-semibold text-white">{strings.home.inventoryTitle}</p>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-4">
              {(ownedClickChests > 0 || ownedGemChests > 0) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.casesSection}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedClickChests > 0 && (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                        <Gift size={18} className="text-neutral-400" />
                        <span className="text-xs font-semibold text-white">{strings.store.caseTitleClicks}</span>
                        <span className="text-[10px] tabular-nums text-neutral-500">x{ownedClickChests}</span>
                        <button
                          onClick={() => navigate('/tienda')}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1]"
                        >
                          {strings.home.openButton}
                        </button>
                      </div>
                    )}

                    {ownedGemChests > 0 && (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                        <Gift size={18} className="text-indigo-300" />
                        <span className="text-xs font-semibold text-white">{strings.store.caseTitleGems}</span>
                        <span className="text-[10px] tabular-nums text-neutral-500">x{ownedGemChests}</span>
                        <button
                          onClick={() => navigate('/tienda')}
                          className="w-full rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-2 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/15"
                        >
                          {strings.home.openButton}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ownedPowerups.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.powerupsCardTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedPowerups.map((powerup) => {
                      const isThisActive = activePowerup?.id === powerup.id
                      const name = strings.store.powerups[powerup.id]?.name ?? powerup.id
                      return (
                        <div
                          key={powerup.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Rocket,
                                color: 'text-violet-300',
                                name,
                                desc: strings.store.powerups[powerup.id]?.desc ?? '',
                                durationSeconds: powerup.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Rocket size={18} className="text-violet-300" />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[powerup.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className="w-full rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1.5 text-xs font-semibold tabular-nums text-violet-200">
                              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activatePowerup(powerup)}
                              disabled={Boolean(activePowerup) || activatingPowerupId !== null}
                              className="w-full rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {ownedLuckPowerups.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.timedLuckTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedLuckPowerups.map((powerup) => {
                      const isThisActive = activeLuckPowerup?.id === powerup.id
                      const name = strings.store.timedLuckPowerups[powerup.id]?.name ?? powerup.id
                      return (
                        <div
                          key={powerup.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Dices,
                                color: 'text-green-300',
                                name,
                                desc: strings.store.timedLuckPowerups[powerup.id]?.desc ?? '',
                                durationSeconds: powerup.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Dices size={18} className="text-green-300" />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[powerup.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className="w-full rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-1.5 text-xs font-semibold tabular-nums text-green-200">
                              {Math.floor(luckSecondsLeft / 60)}:{String(luckSecondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activateLuck(powerup)}
                              disabled={Boolean(activeLuckPowerup) || activatingLuckId !== null}
                              className="w-full rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-1.5 text-xs font-semibold text-green-200 transition-colors hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {ownedMagnets.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.magnetsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedMagnets.map((magnet) => {
                      const isThisActive = activeMagnet?.id === magnet.id
                      const accent =
                        magnet.currency === 'keys'
                          ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                          : 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200'
                      const accentHover =
                        magnet.currency === 'keys' ? 'hover:bg-amber-500/15' : 'hover:bg-indigo-500/15'
                      const iconColor = magnet.currency === 'keys' ? 'text-amber-300' : 'text-indigo-300'
                      const name = strings.store.magnets[magnet.id]?.name ?? magnet.id
                      return (
                        <div
                          key={magnet.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Magnet,
                                color: iconColor,
                                name,
                                desc: strings.store.magnets[magnet.id]?.desc ?? '',
                                durationSeconds: magnet.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Magnet size={18} className={iconColor} />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[magnet.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold tabular-nums ${accent}`}>
                              {Math.floor(magnetSecondsLeft / 60)}:{String(magnetSecondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activateMagnet(magnet)}
                              disabled={Boolean(activeMagnet) || activatingMagnetId !== null}
                              className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${accent} ${accentHover}`}
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {isInventoryEmpty && (
                <p className="py-6 text-center text-sm text-neutral-500">{strings.home.inventoryEmpty}</p>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {infoModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setInfoModal(null)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInfoModal(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <infoModal.icon size={18} className={infoModal.color} />
              <p className="text-sm font-semibold text-white">{infoModal.name}</p>
            </div>
            <p className="mb-3 text-sm text-neutral-400">{infoModal.desc}</p>
            <p className="text-xs font-medium text-neutral-500">
              {strings.home.durationLabel(infoModal.durationSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* Prestige confirm + shop modals disabled along with the rest of the
          prestige UI (feedback: the maxed-ring flow was rendering badly).
          Neither can be reached anymore since every trigger above is
          commented out too — kept here, disabled, instead of deleted, so
          the whole feature is a quick uncomment away once it's revisited. */}
      {/* {showPrestigeConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowPrestigeConfirm(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-amber-400/20 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPrestigeConfirm(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.prestige.confirmTitle}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              {strings.prestige.confirmBody(objectsBroken.toLocaleString(language === 'en' ? 'en-US' : 'es-ES'))}
            </p>
            {prestigeError && <p className="mb-3 text-xs text-red-400">{prestigeError}</p>}
            <div className="flex gap-2">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowPrestigeConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-neutral-300"
              >
                {strings.prestige.cancelButton}
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleConfirmPrestige}
                disabled={isResetting}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-sm font-bold text-neutral-900 disabled:opacity-60"
              >
                {strings.prestige.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrestigeShop && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowPrestigeShop(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-amber-400/20 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPrestigeShop(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.prestige.shopTitle}</p>
            </div>
            <p className="mb-4 text-xs font-medium text-neutral-400">
              {strings.prestige.pointsLabel} <span className="font-bold text-amber-200">{prestigePoints}</span>
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-1 text-sm font-semibold text-white">{strings.prestige.reactorName}</p>
              <p className="mb-3 text-xs text-neutral-400">{strings.prestige.reactorDesc}</p>
              <div className="mb-3 flex flex-col gap-1 text-xs text-neutral-400">
                <span>
                  {strings.prestige.currentMultiplier}{' '}
                  <span className="font-semibold text-white">×{reactorValue.toFixed(2)}</span>
                </span>
                <span>
                  {strings.prestige.nextMultiplier}{' '}
                  <span className="font-semibold text-white">×{(reactorValue + 0.05).toFixed(2)}</span>
                </span>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => buyReactor()}
                disabled={isBuyingReactor || prestigePoints < reactorNextCost}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isBuyingReactor || prestigePoints < reactorNextCost
                    ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                    : 'bg-white text-neutral-900 hover:opacity-90'
                }`}
              >
                <Sparkles size={14} className="opacity-70" />
                {reactorNextCost}
              </button>
              {prestigePoints < reactorNextCost && (
                <p className="mt-2 text-center text-[10px] text-neutral-500">{strings.prestige.notEnoughPoints}</p>
              )}
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}
