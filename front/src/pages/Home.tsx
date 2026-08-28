import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import {
  Zap,
  Rocket,
  Joystick,
  Gem,
  Archive,
  Dices,
  Magnet,
  Key,
  Package,
  ClipboardList,
  Crosshair,
  Info,
  ChartNoAxesCombined,
  Split,
  Route,
  Lock,
  X,
  Sparkles,
  MousePointerClick,
  Check,
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
import { useTasksContext } from '../context/TasksContext'
import { useDailyCaseContext } from '../context/DailyCaseContext'
import { useGemChestContext } from '../context/GemChestContext'
import { useInventoryContext } from '../context/InventoryContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { playMagnetProc } from '../lib/caseSound'
import { playLaserShot } from '../lib/battleSound'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
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
  // Everything the ripple/+N popup and particle burst need once the bolt
  // actually finishes — carried on the shot itself instead of a second,
  // independent setTimeout(SHOT_DURATION_MS) racing the real animation
  // (see the impact handler below for why that used to fall behind on a
  // busy mobile thread).
  impactX: number
  impactY: number
  displayAmount: number
  isLucky: boolean
  rippleClass: string
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

// Legendary itself is gated behind the "Modo Legendario" tree node —
// without it, hitting 20 t/s caps out at Imparable instead (no combo meter,
// no per-tier multiplier past ×1 from heat).
function getHeatLevel(cps: number, legendaryUnlocked: boolean): (typeof HEAT_LEVELS)[number] {
  let level: (typeof HEAT_LEVELS)[number] = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (l.key === 'legendary' && !legendaryUnlocked) continue
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

const ASTEROID_POINTS = buildRoundRockOutline(20, 42, 3)
  .map((p) => p.join(','))
  .join(' ')

// Craters vary in size and get their own tiny rim highlight (offset toward
// the same upper-left "sun" the body gradient and sunlit patch below all
// share) so each one reads as an actual dented impact instead of a flat
// dark dot.
const CRATERS = [
  { cx: 38, cy: 38, r: 6.5 },
  { cx: 63, cy: 55, r: 8.5 },
  { cx: 68, cy: 32, r: 4 },
  { cx: 42, cy: 66, r: 5.5 },
  { cx: 55, cy: 40, r: 3 },
  { cx: 28, cy: 55, r: 3.5 },
  { cx: 60, cy: 68, r: 2.5 },
]

// Fine surface grain — small dark speckles scattered across the body,
// clipped to the rock's own silhouette, purely to break up the gradient
// fill so it doesn't read as smooth/plasticky at this size.
const SPECKLES = [
  { cx: 30, cy: 28, r: 1.4 },
  { cx: 48, cy: 24, r: 1 },
  { cx: 72, cy: 45, r: 1.2 },
  { cx: 58, cy: 58, r: 1 },
  { cx: 35, cy: 48, r: 0.9 },
  { cx: 45, cy: 72, r: 1.3 },
  { cx: 25, cy: 62, r: 1 },
  { cx: 65, cy: 25, r: 0.9 },
]

// Cosmetic color tier every 10 objects broken — same round rock throughout,
// just recolored so a long session doesn't stare at the exact same one
// forever. Per-object progress isn't shown visually at all right now (the
// earlier cracking-apart version and the bar under it both got dropped) —
// the rock just glows a little brighter as `pct` climbs. `light`/`dark` feed
// a radial gradient (instead of the old flat `fill`) so the rock reads as a
// lit, rounded body — brightest toward the upper-left "sun", falling off to
// a near-black shadow at the opposite rim.
const DEFAULT_SPECKLE_COLOR = 'rgba(0,0,0,0.22)'
const OBJECT_TIERS = MATERIAL_TIER_COLORS.map((colors) => ({
  ...colors,
  speckleColor: DEFAULT_SPECKLE_COLOR,
  speckles: SPECKLES,
}))

// Lifetime-platino threshold each OBJECT_TIERS entry unlocks at — first
// jump is 10M, then ×100 per tier after that. Index-aligned with
// OBJECT_TIERS (tier i spans [threshold[i], threshold[i+1])). Must match
// back/src/game/trajectory.js's own copy exactly (kept in sync by hand).
const TRAJECTORY_TIER_THRESHOLDS = [
  0, 10_000_000, 1_000_000_000, 100_000_000_000, 10_000_000_000_000, 1_000_000_000_000_000,
]

// The thing you're actually clicking — a slowly bobbing/rotating rock,
// no "breaking" moment anymore (that whole object/prestige-target loop is
// gone; Trayectoria's platino tiers are prestige now). Its color follows
// the real current tier, so the rock you click matches whichever
// Trayectoria stop you're actually on instead of always being violet.
function SpaceObject({ tierIndex, pct }: { tierIndex: number; pct: number }) {
  const tier = OBJECT_TIERS[tierIndex]
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
          <defs>
            {/* Body shading — brightest toward the upper-left "sun", falling
                off to a near-black shadow at the far rim, so the rock reads
                as a lit, rounded body instead of a flat color-filled shape. */}
            <radialGradient id="rockBody" cx="34%" cy="30%" r="80%">
              <stop offset="0%" stopColor={tier.light} />
              <stop offset="45%" stopColor={tier.fill} />
              <stop offset="100%" stopColor={tier.dark} />
            </radialGradient>
            {/* Crater depth — dark well with a faint lighter rim, reused by
                every crater below instead of a single flat dot each. */}
            <radialGradient id="craterWell" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
              <stop offset="75%" stopColor="rgba(0,0,0,0.32)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
            </radialGradient>
            <clipPath id="rockSilhouette">
              <polygon points={ASTEROID_POINTS} />
            </clipPath>
          </defs>

          <polygon
            points={ASTEROID_POINTS}
            fill="url(#rockBody)"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* Everything below is clipped to the rock's own silhouette so
              none of it ever pokes past the jagged outline. */}
          <g clipPath="url(#rockSilhouette)">
            {CRATERS.map((c, i) => (
              <g key={i}>
                <circle cx={c.cx} cy={c.cy} r={c.r} fill="url(#craterWell)" />
                {/* Tiny rim highlight on each crater's own sunlit edge —
                    sells the "dent", not just a dark smudge. */}
                <circle
                  cx={c.cx - c.r * 0.32}
                  cy={c.cy - c.r * 0.32}
                  r={c.r * 0.3}
                  fill="rgba(255,255,255,0.16)"
                />
              </g>
            ))}
            {tier.speckles.map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={tier.speckleColor} />
            ))}
            {/* Sunlit patch — a soft highlight blob, same corner as the body
                gradient's own bright spot, layered on top for a bit more
                punch without needing a second light source to fake. */}
            <ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />
          </g>
        </svg>
      </motion.div>
    </div>
  )
}

// A small rotating preview of one of the five OBJECT_TIERS rocks — same
// shading recipe as SpaceObject (gradient body, crater depth, grain,
// sunlit patch), just smaller and without the bob/glow/flash, for the
// Trayectoria roadmap list. `tierIndex` feeds unique gradient/clip ids
// (`traj...-${tierIndex}`) so five of these — plus SpaceObject's own fixed
// ids — can all sit in the DOM at once without one instance's gradient
// silently winning for every other rock on the page.
function MiniAsteroid({ tierIndex, dimmed }: { tierIndex: number; dimmed: boolean }) {
  const tier = OBJECT_TIERS[tierIndex]
  const bodyId = `trajRockBody-${tierIndex}`
  const craterId = `trajCraterWell-${tierIndex}`
  const clipId = `trajRockSilhouette-${tierIndex}`
  return (
    <motion.div
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center transition-opacity ${dimmed ? 'opacity-60' : ''}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 100 100" width={48} height={48}>
        <defs>
          <radialGradient id={bodyId} cx="34%" cy="30%" r="80%">
            <stop offset="0%" stopColor={tier.light} />
            <stop offset="45%" stopColor={tier.fill} />
            <stop offset="100%" stopColor={tier.dark} />
          </radialGradient>
          <radialGradient id={craterId} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="75%" stopColor="rgba(0,0,0,0.32)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </radialGradient>
          <clipPath id={clipId}>
            <polygon points={ASTEROID_POINTS} />
          </clipPath>
        </defs>
        <polygon
          points={ASTEROID_POINTS}
          fill={`url(#${bodyId})`}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${clipId})`}>
          {CRATERS.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={`url(#${craterId})`} />
          ))}
          {tier.speckles.map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={tier.speckleColor} />
          ))}
          <ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />
        </g>
      </svg>
    </motion.div>
  )
}

// Autoclick's swarm — one little drone per level, uncapped, orbiting just
// outside the prestige ring like Cookie Clicker's cursors circling the
// cookie. Purely decorative: each drone's orbit phase and pulse timing
// come from its own index, not real production data, since this only
// exists to make "you own N levels of autoclick" *feel* alive rather than
// to visualize the exact cps. Color props default to the regular drones'
// violet so that call site stays untouched; the scout-drone swarm passes
// its own amber palette plus a `phaseOffset` so the two swarms don't spawn
// at identical angles.
//
// Every animation here is plain CSS (see the `drone-*` keyframes/classes
// in index.css) instead of Framer Motion. With this swarm uncapped and
// potentially in the hundreds, Framer was recreating each drone's
// transition objects and reconciling all 3 of its per-drone animations on
// every Home re-render — which happens ~10x/sec purely from the autoclick
// tick, unrelated to the swarm itself — and that reconciliation cost is
// what actually scaled with drone count into visible lag, not the raw
// element count. CSS keyframes run on the compositor, fully decoupled
// from React's render cycle, so re-renders no longer touch a mounted
// drone at all. Wrapped in `memo` on top of that so React doesn't even
// re-run this component's own render (rebuilding `count` elements' worth
// of JSX) unless a prop here actually changed — which in practice means
// only when the player buys another level, not on every click/tick.
const OrbitingBots = memo(function OrbitingBots({
  count,
  colorClass = 'text-violet-300',
  glowColor = 'rgba(168,85,247,0.65)',
  beamClass = 'from-violet-300/0 via-violet-200 to-white',
  beamShadow = 'rgba(216,180,254,0.8)',
  phaseOffset = 0,
}: {
  count: number
  colorClass?: string
  glowColor?: string
  beamClass?: string
  beamShadow?: string
  phaseOffset?: number
}) {
  if (count <= 0) return null
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => {
        const orbitDuration = 18 + (i % 3) * 3
        // Negative delay pre-advances the loop so drones start already
        // spread around the circle instead of all bunched at angle 0.
        const orbitDelay = -((i / count + phaseOffset) * orbitDuration)
        const pulseDelay = (i * 0.53) % 2.4
        const clockwise = i % 2 === 0
        // `Record<string, string>` instead of CSSProperties — custom
        // properties (--foo) aren't part of that type, and both wrappers
        // below need the exact same pair, just to drive opposite keyframes.
        const orbitVars: Record<string, string> = {
          '--drone-orbit-duration': `${orbitDuration}s`,
          '--drone-orbit-delay': `${orbitDelay}s`,
        }
        const pulseDelayVar: Record<string, string> = { '--drone-pulse-delay': `${pulseDelay}s` }
        return (
          <div
            key={i}
            className={`drone-orbit-anchor ${clockwise ? 'drone-spin-cw' : 'drone-spin-ccw'}`}
            style={orbitVars}
          >
            {/* Static orbit-radius offset lives on a separate element from
                the spin above — a single CSS animation touching `transform`
                always wins that property outright on its element, so it
                can't be layered with an unanimated transform the way the
                old Framer version (which composes the whole transform
                itself) could on one node. */}
            <div className="drone-radius-offset">
              {/* Counter-rotates opposite the parent orbit, same duration/
                  delay, so the icon itself stays visually level instead of
                  tumbling around its own axis as it orbits. */}
              <div className={clockwise ? 'drone-spin-ccw' : 'drone-spin-cw'} style={orbitVars}>
                <div
                  className={`drone-pulse ${colorClass}`}
                  style={{ ...pulseDelayVar, filter: `drop-shadow(0 0 6px ${glowColor})` }}
                >
                  <DroneIcon size={20} animated />
                </div>
              </div>

              {/* The shot — a short bolt fired straight at the counter every
                  pulse (same travelling-dot shape the main click shot uses,
                  just vertical since the drone's own orbit rotation,
                  applied one level up, already points "down" at the ring
                  center). */}
              <div
                className={`drone-beam w-[3px] rounded-full bg-gradient-to-b ${beamClass}`}
                style={{ ...pulseDelayVar, height: 10, boxShadow: `0 0 6px 1px ${beamShadow}` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
})

// Below 1M, the exact number — it's short enough to read at a glance and
// watching the digits climb is part of the fun. From 1M up it switches to a
// 2-decimal + suffix form (1.23M, 999.90M, 1.00B, 1.00T…) since a raw digit
// string past that point is just noise; the suffix keeps the display length
// short and constant instead of needing to keep shrinking the font forever.
// The decimal point here is always a literal "." regardless of language —
// unlike the plain-number branch below, this is a compact game-style unit
// suffix, not a localized number, so it stays consistent either way.
function formatPlatino(value: number, language: 'es' | 'en'): string {
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const floored = Math.floor(value)
  const abs = Math.abs(floored)
  if (abs < 1_000_000) return floored.toLocaleString(locale)
  const tiers: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
  ]
  const [threshold, suffix] = tiers.find(([t]) => abs >= t) ?? tiers[tiers.length - 1]
  // Truncated, not rounded — a rounded-up decimal would flash a number
  // slightly bigger than what's actually owned.
  const scaled = Math.floor((floored / threshold) * 100) / 100
  return `${scaled.toFixed(2)}${suffix}`
}

// One of the four "switches" flanking the platino screen (two stacked on
// each side) — icon only now, small enough to fit two-high next to the
// display, but the same chrome as before: bordered tinted box, permanently-
// lit LED dot (flavor only, every switch reads as "powered") in the
// button's own accent color.
function CockpitIconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  iconClass,
  ledClass,
  borderClass,
}: {
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
  iconClass: string
  ledClass: string
  borderClass: string
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.06] active:bg-white/[0.09] sm:h-10 sm:w-10 ${borderClass}`}
    >
      <span className={`absolute right-1 top-1 h-1 w-1 rounded-full ${ledClass}`} />
      <Icon size={15} className={iconClass} />
    </button>
  )
}

// Exactly the cockpit header's own shape — square top corners, bottom
// corners cut — reused as-is by the three cockpit-styled modals below
// (Centro de mando, Inventario, Tareas) so they all read as panels off the
// same console.
const MODAL_CLIP_PATH =
  'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))'

// The scanline texture + corner rivets from the cockpit header/tab bar,
// dropped into a modal's own outer card unchanged — everything else about
// these three modals (header strip, glow, icon badge, body content) stays
// exactly as it already was.
function CockpitModalChrome() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />
      <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
      <span className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
    </>
  )
}

export function Home() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const { promptSignIn } = useSignInPrompt()
  const {
    totalClicks,
    lifetimePlatino,
    prestigeTier,
    isConfirmingPrestige,
    confirmPrestige,
    clicksPerSecond,
    registerClick,
  } = useClickCounterContext()
  // Trayectoria's roadmap — driven by lifetime platino earned (migration
  // 028), not objectsBroken; a placeholder order-of-magnitude ramp (1M →
  // 10M → 100M → 1B → 10B) until the real curve gets designed.
  //
  // The *displayed* tier is prestigeTier (migration 029), not whatever
  // lifetimePlatino's raw threshold position would imply — lifetimePlatino
  // keeps climbing past the next tier's floor for as long as the player
  // wants, still shown as the current material, until they explicitly
  // confirm the prestige (see handleConfirmPrestige below).
  const currentTierIndex = prestigeTier
  const {
    autoClickCps,
    autoClickLevel,
    luckChance: permanentLuckChance,
    luckMultiplier: permanentLuckMultiplier,
    multiplierValue: baseClickMultiplier,
    tapMultiplierValue,
    legendaryUnlockLevel,
    legendaryStreakBase,
    legendaryBonusStep,
    multiShotValue,
    multiShotLevel,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneCps,
    autoMultiplierValue,
    refetch: refetchTree,
  } = useTreeContext()
  // Only the Reactor's permanent multiplier is still read here — the rest
  // of the prestige UI (shop, reset flow) is disabled below.
  const { reactorValue } = usePrestigeContext()
  const { language, strings } = useLanguage()
  // Whatever's currently being mined — every "your balance" label follows
  // this instead of hardcoding "platino", so it reads correctly after a
  // prestige moves the player onto Amatista, Esmeralda, etc.
  const currentMaterialName = strings.home.trajectoryTierNames[currentTierIndex]
  // Onboarding tasks — completion reads straight off the tree's own live
  // levels (no separate counter to keep in sync); the backend re-verifies
  // the same level against user_permanent_upgrades before ever paying out
  // (see tasksRepository.claim), so nothing here needs to be trusted.
  const TASKS = [
    {
      id: 'first_drone',
      // Same icon + badge color as Centro de mando's own "Drones" tile.
      name: strings.home.taskFirstDroneName,
      desc: strings.home.taskFirstDroneDesc,
      reward: 1000,
      icon: DroneIcon,
      badgeClass: 'bg-violet-500/20 text-violet-300',
      progress: Math.min(autoClickLevel, 1),
      required: 1,
      completed: autoClickLevel >= 1,
    },
    {
      id: 'second_cannon',
      // Same icon + badge color as Centro de mando's own "Multidisparo" tile.
      name: strings.home.taskSecondCannonName,
      desc: strings.home.taskSecondCannonDesc,
      reward: 2000,
      icon: Split,
      badgeClass: 'bg-cyan-500/20 text-cyan-300',
      progress: Math.min(multiShotLevel, 1),
      required: 1,
      completed: multiShotLevel >= 1,
    },
    {
      id: 'first_scout_drone',
      // Same icon + badge color as Centro de mando's own "Drones
      // buscadores" tile.
      name: strings.home.taskFirstScoutDroneName,
      desc: strings.home.taskFirstScoutDroneDesc,
      reward: 5000,
      icon: DroneIcon,
      badgeClass: 'bg-amber-500/20 text-amber-300',
      progress: Math.min(scoutDroneLevel, 1),
      required: 1,
      completed: scoutDroneLevel >= 1,
    },
  ]
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
  const { claimed: claimedTasks, claimingId: claimingTaskId, claim: claimTask } = useTasksContext()
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const [shots, setShots] = useState<ShotEffect[]>([])
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false)
  const [prestigeError, setPrestigeError] = useState<string | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [showShip, setShowShip] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showLog, setShowLog] = useState(false)
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
  const heat = useMemo(
    () => getHeatLevel(clicksPerSecond, legendaryUnlockLevel > 0),
    [clicksPerSecond, legendaryUnlockLevel],
  )
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

  // Prestige is tier-based now — each Trayectoria tier *is* a prestige
  // level, driven by lifetime platino (see TRAJECTORY_TIER_THRESHOLDS), not
  // by breaking objects. The ring shows progress within the *current*
  // (confirmed) tier toward the next one — once lifetimePlatino clears that
  // next tier's floor, `readyToPrestige` goes true and the ring stops
  // filling (pct clamps at 1) but the asteroid/material stays exactly as-is
  // until the player actually confirms (see handleConfirmPrestige):
  // lifetimePlatino keeps climbing in the background for as long as they
  // keep farming past that point. `isMaxed` is a separate, final state —
  // true only once there's no tier left above the current one at all.
  const hasNextTier = currentTierIndex < OBJECT_TIERS.length - 1
  const prestige = useMemo(() => {
    const tierFrom = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex]
    const tierTo = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex + 1]
    return {
      isMaxed: !hasNextTier,
      readyToPrestige: hasNextTier && lifetimePlatino >= tierTo,
      pct: tierTo ? Math.min(1, (lifetimePlatino - tierFrom) / (tierTo - tierFrom)) : 1,
    }
  }, [lifetimePlatino, currentTierIndex, hasNextTier])

  const starsDim = useMemo(() => generateStars(220, 0.5), [])
  const starsBright = useMemo(() => generateStars(60, 0.9), [])

  // total_clicks and every tree node's owned level reset server-side (see
  // confirmPrestige/DELETE FROM user_permanent_upgrades) — refetching the
  // tree here pulls those just-reset levels in immediately instead of
  // showing stale ones for up to POLL_INTERVAL_MS. Keys/gems/inventory
  // aren't touched by a prestige at all, so nothing else needs refreshing.
  const handleConfirmPrestige = async () => {
    setPrestigeError(null)
    const result = await confirmPrestige()
    if (result.ok) {
      setShowPrestigeConfirm(false)
      refetchTree()
    } else if (result.error !== 'not-signed-in') {
      setPrestigeError(result.error ?? 'error')
    }
  }

  // Fires exactly when a bolt's own Framer animation reports finishing
  // (see the shot's onAnimationComplete below) — never on a fixed timer,
  // so the ripple/+N and particle burst can't land before, or after, the
  // bolt has actually visually arrived regardless of how far behind a busy
  // mobile thread's frame delivery has fallen.
  const handleShotImpact = useCallback((shot: ShotEffect) => {
    setShots((current) => current.filter((s) => s.id !== shot.id))

    const jitterX = shot.impactX + (Math.random() - 0.5) * 28
    const jitterY = shot.impactY + (Math.random() - 0.5) * 28
    const id = effectId++
    setEffects((prev) => [
      ...prev,
      { id, x: jitterX, y: jitterY, ripple: shot.rippleClass, amount: shot.displayAmount, isLucky: shot.isLucky },
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
    setParticleBursts((current) => [...current, { id: pId, x: shot.impactX, y: shot.impactY, chips }])
    window.setTimeout(() => {
      setParticleBursts((current) => current.filter((b) => b.id !== pId))
    }, PARTICLE_DURATION_MS)
  }, [])

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

      // Fire a shot from the tap point at the space object — the ripple/+N
      // and particle burst below only land once the bolt's own Framer
      // animation actually reports finishing (see handleShotImpact), not
      // after a fixed SHOT_DURATION_MS timer. A busy mobile thread can fall
      // behind real time, so a wall-clock timer used to remove the bolt (and
      // fire the impact effects) before the animation had visually caught
      // up — bolts that looked like they stopped short of the object. A
      // small random offset around the object's center keeps rapid clicks
      // from stacking their ripple on the exact same pixel.
      const sId = shotId++
      const dx = objX - x
      const dy = objY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      setShots((prev) => [
        ...prev,
        {
          id: sId,
          startX: x,
          startY: y,
          dx,
          dy,
          angleDeg,
          impactX: objX,
          impactY: objY,
          displayAmount,
          isLucky,
          rippleClass: isLucky ? 'bg-green-400/70' : heat.ripple,
        },
      ])
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
      {prestige.readyToPrestige && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="animate-pulse-glow absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 65%)' }}
          />
        </div>
      )}

      {/* ============================================================
          Cockpit console — Home's own header, styled as the top instrument
          panel of a ship (pilot's-eye view of the asteroid out the
          "windshield" below). Absolute/overlaid — now that the console is
          this compact (buttons moved to flank the platino screen instead
          of their own row), there's no realistic viewport height where it'd
          ever clip the asteroid section, which goes back to being truly
          viewport-centered below instead of centering itself in the
          leftover space. Only Home gets this treatment; every other screen
          keeps the plain global Header. The tab bar carries a matching
          cockpit look on every screen. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-3 sm:pt-4">
        <div className="relative mx-auto w-full max-w-md px-3 sm:max-w-lg sm:px-4">
          <div
            className="relative overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-[0_10px_34px_-10px_rgba(0,0,0,0.75)]"
            style={{
              clipPath:
                'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
          >
            {/* top edge light strip */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
            {/* fine scanline texture — pure flavor, very low opacity */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
              }}
            />
            {/* corner rivets */}
            <span className="pointer-events-none absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
            <span className="pointer-events-none absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />

            <div className="relative flex flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3">
              {/* Row 1 — twin gauges: heat/tempo on the left (tier-colored,
                  same HEAT_LEVELS data as before), production rate on the
                  right (violet, unchanged theme). */}
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1 overflow-hidden rounded-[3px] border border-white/10 bg-black/30 px-2.5 py-1.5">
                  {heat.key === 'legendary' && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-white/[0.08] transition-[width] duration-200 ease-out"
                      style={{
                        width:
                          legendaryStreak.tier >= LEGENDARY_TIER_MAX
                            ? '100%'
                            : `${Math.min(100, (legendaryStreak.count / legendaryStreakThreshold(legendaryStreak.tier, legendaryStreakBase)) * 100)}%`,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-1.5 overflow-hidden">
                    <Zap size={11} className={`shrink-0 ${clicksPerSecond > 0 ? heat.icon : 'text-neutral-600'}`} />
                    <span className="shrink-0 whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-widest text-neutral-500">
                      {strings.home.hudHeatLabel}
                    </span>
                    {/* Heat status ("en racha"/"imparable"/"legendario ×N")
                        lives up here next to the micro-label — not down by
                        the t/s value, which never has room to spare once
                        Legendario's multiplier suffix joins in, and used to
                        wrap onto a third line and grow the whole console
                        every time the tier changed. */}
                    {heatLabel && (
                      <span
                        className={`truncate whitespace-nowrap text-[8px] font-bold uppercase tracking-wide ${heat.badge}`}
                      >
                        {heatLabel}
                        {heat.key === 'legendary' &&
                          ` ×${legendaryBonusForTier(legendaryStreak.tier, legendaryBonusStep).toFixed(1)}`}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 mt-0.5">
                    <span
                      className={`whitespace-nowrap font-mono text-sm font-bold tabular-nums ${clicksPerSecond > 0 ? heat.badge : 'text-neutral-300'}`}
                    >
                      {clicksPerSecond.toFixed(1)} {strings.home.tps}
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden rounded-[3px] border border-violet-400/20 bg-violet-500/[0.06] px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <MousePointerClick size={11} className="text-violet-300" />
                    <span className="whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-widest text-violet-400/70">
                      {strings.home.hudProdLabel}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
                    <span className="font-mono text-sm font-bold tabular-nums text-violet-200">
                      {(clicksPerSecond * totalMultiplier).toFixed(1)} {strings.home.cps}
                    </span>
                    {activePowerup && (
                      <span className="flex items-center gap-0.5 text-[9px] tabular-nums text-violet-300">
                        <Rocket size={9} />
                        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2 — the main display screen: platino, front and center,
                  like the ship's primary readout, now flanked by the four
                  switches instead of racking them in their own row below —
                  two stacked on each side, icon-only so they fit at this
                  size. Corner brackets + a slow scanline sweep sell the
                  "active screen" feel. */}
              <div className="flex items-stretch gap-2">
                <div className="pointer-events-auto flex flex-col justify-center gap-2">
                  <CockpitIconButton
                    icon={Joystick}
                    ariaLabel={strings.home.commandCenterTitle}
                    onClick={() => setShowShip(true)}
                    iconClass="text-violet-300"
                    ledClass="bg-violet-400 shadow-[0_0_3px_1px_rgba(167,139,250,0.9)]"
                    borderClass="border-violet-400/20"
                  />
                  <CockpitIconButton
                    icon={Package}
                    ariaLabel={strings.home.inventory}
                    onClick={() => setShowInventory(true)}
                    iconClass="text-amber-300"
                    ledClass="bg-amber-400 shadow-[0_0_3px_1px_rgba(251,191,36,0.9)]"
                    borderClass="border-amber-400/20"
                  />
                </div>

                <div className="relative min-w-0 flex-1 overflow-hidden rounded-[3px] border border-white/10 bg-black/40 px-3 py-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.65)]">
                  <span className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l border-t border-violet-400/40" />
                  <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 border-r border-t border-violet-400/40" />
                  <span className="pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b border-l border-violet-400/40" />
                  <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-violet-400/40" />
                  <motion.div
                    className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-white/[0.05] to-transparent"
                    initial={{ y: '-2.5rem' }}
                    animate={{ y: '8rem' }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="relative flex flex-col items-center">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                      {strings.home.hudPlatinoLabel(currentMaterialName)}
                    </span>
                    <motion.span
                      key={totalClicks}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1.06, 1] }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="bg-clip-text text-center font-[Space_Grotesk] text-4xl font-bold leading-none tabular-nums text-transparent bg-gradient-to-b from-white to-neutral-400 [filter:drop-shadow(0_0_18px_rgba(167,139,250,0.25))] sm:text-5xl"
                    >
                      {formatPlatino(totalClicks, language)}
                    </motion.span>
                  </div>
                </div>

                <div className="pointer-events-auto flex flex-col justify-center gap-2">
                  <CockpitIconButton
                    icon={ClipboardList}
                    ariaLabel={strings.home.tasks}
                    onClick={() => setShowTasks(true)}
                    iconClass="text-emerald-300"
                    ledClass="bg-emerald-400 shadow-[0_0_3px_1px_rgba(52,211,153,0.9)]"
                    borderClass="border-emerald-400/20"
                  />
                  <CockpitIconButton
                    icon={Route}
                    ariaLabel={strings.home.log}
                    onClick={() => setShowLog(true)}
                    iconClass="text-sky-300"
                    ledClass="bg-sky-400 shadow-[0_0_3px_1px_rgba(56,189,248,0.9)]"
                    borderClass="border-sky-400/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* main counter — the space object you click. The big ring tracks
          progress within the *current* Trayectoria tier toward the next one
          (see `prestige` above). Truly viewport-centered via the root's own
          `justify-center` — the cockpit console above is an absolute
          overlay, not flow content, so it never pushes this down. */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <div ref={objectRef} className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
            <OrbitingBots count={autoClickLevel} />
          <OrbitingBots
            count={scoutDroneLevel}
            colorClass="text-amber-300"
            glowColor="rgba(251,191,36,0.65)"
            beamClass="from-amber-300/0 via-amber-200 to-white"
            beamShadow="rgba(252,211,77,0.8)"
            phaseOffset={0.4}
          />
          {/* Scaled down from the object's own box — the ring used to hug
              the object edge-to-edge, which read as oversized next to it. */}
          <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.7)' }}>
            <ProgressRing pct={prestige.pct} isMaxed={prestige.readyToPrestige} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <SpaceObject tierIndex={currentTierIndex} pct={prestige.pct} />
          </div>
        </div>

        {/* Prestige-ready banner + button — `absolute top-full`, not
            static flow, so it hangs below the ring without adding to this
            flex-col's own height. That mattered: as a normal-flow sibling
            it was pushing the whole stack (ring included) upward to stay
            centered on the page whenever it appeared. */}
        {prestige.readyToPrestige && (
          <div className="pointer-events-none absolute left-0 right-0 top-full mt-8 flex flex-col items-center px-3">
            <span className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              {strings.home.prestigeReady}
            </span>
            <div className="pointer-events-auto flex flex-col items-center gap-1.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowPrestigeConfirm(true)}
                className="animate-prestige-pulse flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 px-4 py-2 text-xs font-bold text-amber-200 shadow-lg shadow-amber-500/10 transition-transform hover:scale-105"
              >
                <Sparkles size={13} className="text-amber-300" />
                {strings.home.changePrestige}
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
          visual and plain CSS now (see .shot-bolt/@keyframes shot-fly) —
          native onAnimationEnd still gates the impact effects on the bolt
          actually finishing, same fix as before, just off the browser's own
          animation event instead of Framer's. */}
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

      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowInventory(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
            style={{ clipPath: MODAL_CLIP_PATH }}
            onClick={(e) => e.stopPropagation()}
          >
            <CockpitModalChrome />
            <div className="relative shrink-0 overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)' }}
              />
              <button
                onClick={() => setShowInventory(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
              >
                <X size={16} />
              </button>
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-amber-200">
                  <Package size={19} />
                </div>
                <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.inventoryTitle}</p>
              </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5">
            <div className="flex flex-col gap-4">
              {(ownedClickChests > 0 || ownedGemChests > 0) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.casesSection}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedClickChests > 0 && (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                        <Archive size={18} className="text-neutral-400" />
                        <span className="text-xs font-semibold text-white">
                          {strings.store.caseTitleClicks(currentMaterialName)}
                        </span>
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
                        <Archive size={18} className="text-indigo-300" />
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

      {showShip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowShip(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
            style={{ clipPath: MODAL_CLIP_PATH }}
            onClick={(e) => e.stopPropagation()}
          >
            <CockpitModalChrome />
            {/* Cockpit-glow header strip — same radial-gradient trick as the
                asteroid/prestige glows elsewhere (never a CSS `blur()`, which
                flashes-to-square on some mobile Chromium builds). */}
            <div className="relative overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)' }}
              />
              <button
                onClick={() => setShowShip(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
              >
                <X size={16} />
              </button>
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
                  <Joystick size={19} />
                </div>
                <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.commandCenterTitle}</p>
              </div>
            </div>

            <div className="scroll-thin flex max-h-[60vh] flex-col gap-5 overflow-y-auto p-5">
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {strings.home.shipSection}
                </p>
                <div className="flex flex-col gap-2.5">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                        <Crosshair size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipPower}</p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {strings.home.shipPowerDesc(currentMaterialName)}{' '}
                      <span className="font-semibold text-white">
                        {(baseClickMultiplier * tapMultiplierValue).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                        <Split size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipMultiShot}</p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {strings.home.shipMultiShotDesc} <span className="font-semibold text-white">{multiShotValue}</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-300">
                        <Sparkles size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipLuckChance}</p>
                    </div>
                    {hasLuck ? (
                      <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                        <p>
                          {strings.home.shipLuckPowerDesc}{' '}
                          <span className="font-semibold text-white">{combinedLuckMultiplier}</span>
                        </p>
                        <p>
                          {strings.home.shipLuckChanceDesc}{' '}
                          <span className="font-semibold text-white">{Math.round(luckChance * 100)}%</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {strings.home.fleetSection}
                </p>
                <div className="flex flex-col gap-2.5">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-500/20 text-zinc-300">
                        <ChartNoAxesCombined size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipDroneProduction}</p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {strings.home.shipDroneProductionDesc}{' '}
                      <span className="font-semibold text-white">
                        {(autoClickCps + scoutDroneCps).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', {
                          maximumFractionDigits: 2,
                        })}
                      </span>{' '}
                      {strings.home.cps}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                        <DroneIcon size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipDroneCount}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                      <p>
                        {strings.home.shipDroneCountDesc}{' '}
                        <span className="font-semibold text-white">{autoClickLevel}</span>
                      </p>
                      <p>
                        {strings.home.shipDronePerUnitDesc}{' '}
                        <span className="font-semibold text-white">
                          {autoMultiplierValue.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', {
                            maximumFractionDigits: 2,
                          })}
                        </span>{' '}
                        {strings.home.cps}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                        <DroneIcon size={14} />
                      </div>
                      <p className="text-sm font-semibold text-white">{strings.home.shipScoutDrones}</p>
                    </div>
                    {scoutDroneLevel > 0 ? (
                      <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                        <p>
                          {strings.home.shipScoutDronesCountDesc}{' '}
                          <span className="font-semibold text-white">{scoutDroneLevel}</span>
                        </p>
                        <p>
                          {strings.home.shipScoutDronesPerUnitDesc}{' '}
                          <span className="font-semibold text-white">
                            {scoutDroneRate.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', {
                              maximumFractionDigits: 2,
                            })}
                          </span>{' '}
                          {strings.home.cps}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTasks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowTasks(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
            style={{ clipPath: MODAL_CLIP_PATH }}
            onClick={(e) => e.stopPropagation()}
          >
            <CockpitModalChrome />
            <div className="relative shrink-0 overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%)' }}
              />
              <button
                onClick={() => setShowTasks(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
              >
                <X size={16} />
              </button>
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 text-emerald-200">
                  <ClipboardList size={19} />
                </div>
                <div className="flex flex-col">
                  <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.tasksTitle}</p>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-emerald-400/70">
                    {strings.home.tasksProgress(
                      String(TASKS.filter((t) => claimedTasks.has(t.id)).length),
                      String(TASKS.length),
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Graph-paper texture — a manifest/clipboard feel distinct from
                the scanline used everywhere else, just for this board. */}
            <div
              className="scroll-thin relative min-h-0 flex-1 overflow-y-auto p-5"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 22px)',
              }}
            >
              <div className="flex flex-col gap-3">
                {TASKS.map((task, i) => {
                  const isClaimed = claimedTasks.has(task.id)
                  const isClaiming = claimingTaskId === task.id
                  const Icon = task.icon
                  const pct = Math.min(1, task.progress / task.required) * 100
                  return (
                    <div
                      key={task.id}
                      className={`relative flex overflow-hidden rounded-lg border shadow-lg shadow-black/20 transition-colors ${
                        isClaimed
                          ? 'border-white/5 bg-[#0d0d13]/80 opacity-50'
                          : task.completed
                            ? 'border-white/15 bg-[#12121a]'
                            : 'border-white/5 bg-[#0d0d13]'
                      }`}
                    >
                      {/* Mission index tab — a small torn-off corner label,
                          like a manifest sheet's own line numbers. */}
                      <div className={`flex w-7 shrink-0 items-center justify-center ${task.badgeClass}`}>
                        <span className="rotate-180 font-mono text-[9px] font-bold tracking-widest [writing-mode:vertical-rl]">
                          M-0{i + 1}
                        </span>
                      </div>

                      <div className="flex flex-1 items-center gap-3 px-3.5 py-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${task.badgeClass}`}>
                          <Icon size={19} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{task.name}</p>
                          <p className="text-xs text-neutral-500">{task.desc}</p>
                          {/* Always violet, same family as Stats' own
                              progress rings — a task's own badge color
                              stays on the icon/tab, not the bar. */}
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Perforated stub — the reward "ticket half", torn
                          off from the objective by a dashed seam with a
                          rivet dot at each end. */}
                      <div className="relative flex w-[86px] shrink-0 flex-col items-center justify-center gap-1.5 border-l border-dashed border-white/15 py-2">
                        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-black/60" />
                        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-black/60" />
                        {isClaimed ? (
                          <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300">
                            <Check size={13} />
                          </span>
                        ) : task.completed ? (
                          <button
                            onClick={() => claimTask(task.id)}
                            disabled={isClaiming}
                            className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition-transform hover:scale-105 disabled:opacity-60"
                          >
                            <PlatinumIcon size={13} className="opacity-80" />
                            {isClaiming ? strings.home.taskClaiming : strings.home.taskReward(task.reward.toLocaleString(language === 'en' ? 'en-US' : 'es-ES'))}
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-xs font-semibold text-neutral-600">
                            <PlatinumIcon size={13} className="opacity-50" />
                            {task.reward.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trayectoria — same empty-state shell as Tareas, invented as a
          fourth switch so the console's two side stacks come out even (two
          each). Nothing behind it yet. */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowLog(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
            style={{ clipPath: MODAL_CLIP_PATH }}
            onClick={(e) => e.stopPropagation()}
          >
            <CockpitModalChrome />
            <div className="relative shrink-0 overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, transparent 70%)' }}
              />
              <button
                onClick={() => setShowLog(false)}
                aria-label="Close"
                className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
              >
                <X size={16} />
              </button>
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/30 bg-gradient-to-br from-sky-400/30 to-cyan-500/20 text-sky-200">
                  <Route size={19} />
                </div>
                <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.logTitle}</p>
              </div>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-2.5">
                {OBJECT_TIERS.map((tier, i) => {
                  const isCurrent = i === currentTierIndex
                  const isLocked = i > currentTierIndex
                  // Locked (future) tiers are a mystery. Cleared tiers cap
                  // at their own ceiling instead of ballooning to the full
                  // (much higher) lifetime total. The current tier is the
                  // one exception — it shows the real, uncapped number even
                  // once it's past its own ceiling, since the player keeps
                  // farming it for as long as they want before confirming
                  // the actual prestige (see handleConfirmPrestige).
                  const tierCeiling = TRAJECTORY_TIER_THRESHOLDS[i + 1]
                  const extractionText = isLocked
                    ? strings.home.trajectoryExtractionUnknown
                    : strings.home.trajectoryExtraction(
                        formatPlatino(isCurrent ? lifetimePlatino : Math.min(lifetimePlatino, tierCeiling), language),
                        formatPlatino(tierCeiling, language),
                      )
                  return (
                    <div
                      key={i}
                      className={`relative flex items-center gap-3 overflow-hidden rounded-[3px] border p-3 transition-colors ${
                        isCurrent ? 'border-white/15 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02]'
                      }`}
                      style={isCurrent ? { boxShadow: `0 0 0 1px ${tier.glow}` } : undefined}
                    >
                      <MiniAsteroid tierIndex={i} dimmed={isLocked} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={`text-sm font-semibold ${isLocked ? 'text-neutral-500' : 'text-white'}`}>
                            {strings.home.trajectoryTierNames[i]}
                          </p>
                          {isCurrent && (
                            <span
                              className="rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest"
                              style={{ borderColor: tier.glow, color: tier.fill }}
                            >
                              {strings.home.trajectoryCurrent}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-neutral-500">{extractionText}</p>
                      </div>
                      {isLocked && <Lock size={14} className="shrink-0 text-neutral-600" />}
                    </div>
                  )
                })}

                <div className="flex items-center justify-center rounded-[3px] border border-dashed border-white/10 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                  {strings.home.trajectoryComingSoon}
                </div>
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

      {showPrestigeConfirm && (
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
              <p className="text-sm font-semibold text-white">{strings.home.trajectoryPrestigeTitle}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              {strings.home.trajectoryPrestigeBody(currentMaterialName, strings.home.trajectoryTierNames[currentTierIndex + 1])}
            </p>
            {prestigeError && <p className="mb-3 text-xs text-red-400">{prestigeError}</p>}
            <div className="flex gap-2">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowPrestigeConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-neutral-300"
              >
                {strings.home.trajectoryPrestigeCancel}
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleConfirmPrestige}
                disabled={isConfirmingPrestige}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-sm font-bold text-neutral-900 disabled:opacity-60"
              >
                {strings.home.trajectoryPrestigeConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The old prestige_points/Reactor shop — a separate, already-
          disabled system (see PrestigeContext) kept dormant on purpose:
          anyone with an existing Reactor level keeps its multiplier, but
          there's no way to earn more points or reach this modal anymore.
          Left commented instead of deleted per explicit instruction not to
          touch it while it might still get reused later. */}
      {/* {showPrestigeShop && (
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
