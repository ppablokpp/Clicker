import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import {
  Zap,
  Rocket,
  Joystick,
  Archive,
  Dices,
  Magnet,
  Package,
  ClipboardList,
  Crosshair,
  Info,
  ChartNoAxesCombined,
  Orbit,
  Split,
  Route,
  Lock,
  X,
  Sparkles,
  Check,
  Medal,
  type LucideIcon,
} from 'lucide-react'
import { MILESTONE_TIER_KEYS, MILESTONE_TIER_COLORS } from '../stats/config'
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
import { useClickPacksContext } from '../context/ClickPacksContext'
import { useInventoryContext } from '../context/InventoryContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { playMagnetProc } from '../lib/caseSound'
import { playLaserShot } from '../lib/battleSound'
import { MATERIAL_TIER_COLORS, MATERIAL_BUTTON_THEMES, MATERIAL_ABBREVIATIONS } from '../lib/materialTiers'
import { formatPlatino } from '../lib/formatPlatino'
import { DroneIcon } from '../components/DroneIcon'
import { PlatinumIcon } from '../components/PlatinumIcon'
import { EventChallenge } from '../components/EventChallenge'
import { Meteor } from '../components/Meteor'
import type { AsteroidColors } from '../components/Asteroid'
import { TapEffectsLayer, type TapEffectsHandle } from '../components/TapEffectsLayer'

interface InfoModalData {
  icon: LucideIcon
  color: string
  name: string
  desc: string
  durationSeconds: number
}

// Escalates the whole screen's feel with click speed — a free "combo meter"
// with no server round trip, purely derived from clicksPerSecond. Legendario
// also doubles the value of each click (registerClick(multiplier)). `key` is
// resolved against strings.home.heat inside the component for translation.
const HEAT_LEVELS = [
  { min: 0, key: null, badge: 'text-neutral-300', icon: 'text-neutral-600', ripple: 'bg-violet-400/40', glow: 'rgba(168,85,247,0.25)', multiplier: 1 },
  { min: 6, key: 'onFire', badge: 'text-amber-300', icon: 'text-amber-400', ripple: 'bg-amber-400/50', glow: 'rgba(251,191,36,0.35)', multiplier: 1 },
  { min: 10, key: 'unstoppable', badge: 'text-orange-300', icon: 'text-orange-400', ripple: 'bg-orange-500/55', glow: 'rgba(249,115,22,0.4)', multiplier: 1 },
  // `min` here is just the tier-0 default — the tree's Umbral node (see
  // legendaryThresholdTps) lowers the real threshold as it levels up, so
  // getHeatLevel takes that as its own parameter instead of reading this.
  { min: 30, key: 'legendary', badge: 'text-red-300', icon: 'text-red-400', ripple: 'bg-red-500/60', glow: 'rgba(239,68,68,0.45)', multiplier: 2 },
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
// without it, hitting the threshold caps out at Imparable instead (no
// combo meter, no per-tier multiplier past ×1 from heat). The threshold
// itself (legendaryMinTps) comes from Umbral, Modo Legendario's own child —
// 30 t/s by default, shrinking down to a 20 t/s floor as it's leveled up.
function getHeatLevel(cps: number, legendaryUnlocked: boolean, legendaryMinTps: number): (typeof HEAT_LEVELS)[number] {
  let level: (typeof HEAT_LEVELS)[number] = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (l.key === 'legendary') {
      if (legendaryUnlocked && cps >= legendaryMinTps) level = l
      continue
    }
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
const LEGENDARY_BONUS_BASE = 1.1
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
// transition objects and reconciling its per-drone animations on every
// Home re-render — which happens ~10x/sec purely from the autoclick tick,
// unrelated to the swarm itself — and that reconciliation cost is what
// actually scaled with drone count into visible lag, not the raw element
// count. CSS keyframes run on the compositor, fully decoupled from React's
// render cycle, so re-renders no longer touch a mounted drone at all.
// Wrapped in `memo` on top of that so React doesn't even re-run this
// component's own render (rebuilding `count` elements' worth of JSX)
// unless a prop here actually changed — which in practice means only when
// the player buys another level, not on every click/tick.
//
// Compositor-driven or not, every always-running animation here is a live
// layer that exists for as long as its drone does, and the swarm is
// uncapped — so what each drone costs per frame is what actually decides
// whether 20 of them idling on screen keep a phone cool or cook it. Two
// things were cut on those grounds:
//   - A counter-rotation that cancelled the orbit's own spin to keep the
//     icon level. The icon is a quadcopter with 4-fold symmetry, so letting
//     it ride the orbit just reads as slowly spinning on its own axis.
//   - The beam's dead phase: it stays (it's the swarm reading as *working*,
//     not decoration) but no longer animates a transform nobody can see for
//     78% of every cycle — see @keyframes drone-beam in index.css.
const OrbitingBots = memo(function OrbitingBots({
  count,
  colorClass = 'text-violet-300',
  glowColor = 'rgba(168,85,247,0.65)',
  beamClass = 'from-violet-300/0 via-violet-200 to-white',
  beamShadow = 'rgba(216,180,254,0.8)',
  phaseOffset = 0,
  fuseEvery,
}: {
  count: number
  colorClass?: string
  glowColor?: string
  beamClass?: string
  beamShadow?: string
  phaseOffset?: number
  // When set (regular drones only, so far — 10), every `fuseEvery` owned
  // units render as a single bigger drone instead of that many small
  // ones: 15 owned = 1 big + 5 small, always floor(count/N) big plus the
  // count%N remainder as small. Purely a rendering choice — `count` itself
  // (and everything cps-related upstream) is untouched, this only changes
  // how many <DroneIcon>s get drawn and at what size.
  fuseEvery?: number
}) {
  if (count <= 0) return null
  const bigUnits = fuseEvery ? Math.floor(count / fuseEvery) : 0
  const smallUnits = fuseEvery ? count % fuseEvery : count
  const totalUnits = bigUnits + smallUnits
  const isBigUnit = (i: number) => i < bigUnits
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: totalUnits }, (_, i) => {
        const big = isBigUnit(i)
        // Tangential (visual, px/s) speed = 2π·radius / duration — radius
        // changed (index.css: base ring ×0.85, the big ring another ×1.375
        // on top of that) but duration didn't automatically follow, which
        // would've left the small ring visibly slower and the big ring
        // visibly faster than the swarm's original speed. Scaling duration
        // by the exact same per-ring ratio keeps px/s constant — the small
        // ring laps a little quicker (smaller circle, same speed), the big
        // one a little slower (bigger circle, same speed), matching how it
        // looked before either ring's radius changed. Keep the 1.375 in
        // sync with --drone-orbit-radius-big's own multiplier in index.css.
        const orbitDuration = (18 + (i % 3) * 3) * 0.85 * (big ? 1.375 : 1)
        // Negative delay pre-advances the loop so drones start already
        // spread around the circle instead of all bunched at angle 0.
        const orbitDelay = -((i / totalUnits + phaseOffset) * orbitDuration)
        // Negative, exactly like orbitDelay above, and for a reason that's
        // visible on any reload: a *positive* animation-delay leaves the
        // element showing its own base styles until its turn comes, and the
        // beam's base styles are "fully opaque, no transform" — so every
        // beam sat parked and visible on top of its drone for up to a whole
        // delay's worth of seconds before its first shot, then behaved
        // correctly forever after (the delay only ever applies once, ahead
        // of iteration 1). A negative delay instead starts the animation
        // already that far in, so there's no pre-start state to leak: the
        // swarm comes up mid-cycle, as if it had been firing all along.
        // Modulo the real 1.8s cycle length so the offset always lands
        // inside one period while still staggering each drone differently.
        const pulseDelay = -((i * 0.53) % 1.8)
        const clockwise = i % 2 === 0
        // `Record<string, string>` instead of CSSProperties — custom
        // properties (--foo) aren't part of that type, and both wrappers
        // below need the exact same pair, just to drive opposite keyframes.
        const orbitVars: Record<string, string> = {
          '--drone-orbit-duration': `${orbitDuration}s`,
          '--drone-orbit-delay': `${orbitDelay}s`,
        }
        // Fused drones ride a second, wider ring — overriding the custom
        // property here (read by .drone-radius-offset in index.css) cascades
        // straight to this unit's own descendants without touching anyone
        // else's, same trick already used for duration/delay above.
        if (big) orbitVars['--drone-orbit-radius'] = 'var(--drone-orbit-radius-big)'
        const pulseDelayVar: Record<string, string> = { '--drone-pulse-delay': `${pulseDelay}s` }
        // A fused drone reads as "the same unit, leveled up" — just one
        // shade darker than the small ones, barely noticeable on its own,
        // with the size/glow-radius difference doing the actual work.
        const droneColorClass = big ? 'text-violet-400' : colorClass
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
              {/* The pulse WRAPS the glow, never the other way round, and
                  that order is load-bearing. `filter: drop-shadow` applies
                  to an element's fully rendered content — descendants
                  included — so with the pulse nested *inside* the filter
                  (as it was), its scale changed the filter's own input
                  every frame, forcing the browser to re-rasterize the SVG
                  and re-trace/re-blur its alpha silhouette 60x a second,
                  per drone, forever. Exactly the same failure the rotor
                  flicker had (see DroneIcon.tsx), just driven by the scale
                  instead.
                  Nested this way the filtered element's content is fully
                  static, so it's rasterized and filtered ONCE and cached;
                  the pulse then just transforms that finished layer, which
                  is pure compositor work. */}
              <div className="drone-pulse" style={pulseDelayVar}>
                <div className={droneColorClass} style={{ filter: `drop-shadow(0 0 ${big ? 10 : 6}px ${glowColor})` }}>
                  <DroneIcon size={big ? 30 : 20} />
                </div>
              </div>

              {/* The shot — a short bolt fired straight at the counter every
                  pulse (same travelling-dot shape the main click shot uses,
                  just vertical since the drone's own orbit rotation, applied
                  one level up, already points "down" at the ring center).
                  It only does real work for the ~22% of its cycle it's
                  actually visible — see @keyframes drone-beam in index.css
                  for how the resting 78% was made genuinely idle. */}
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


// One of the four "switches" flanking the platino screen (two stacked on
// each side) — icon only now, small enough to fit two-high next to the
// display, but the same chrome as before: bordered tinted box, LED dot in
// the button's own accent color. The LED is a real notification light, not
// flavor — lit only while `lit` is true (something new behind that button:
// a claimable task, a ready prestige, an unseen inventory item/upgrade).
function CockpitIconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  iconClass,
  ledClass,
  borderClass,
  lit,
}: {
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
  iconClass: string
  ledClass: string
  borderClass: string
  lit: boolean
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.06] active:bg-white/[0.09] sm:h-10 sm:w-10 ${borderClass}`}
    >
      {lit && <span className={`absolute right-1 top-1 h-1 w-1 rounded-full ${ledClass}`} />}
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
    luckyClicksFound,
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
    legendaryThresholdTps,
    multiShotValue,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneCps,
    autoMultiplierValue,
    anomalyUnlockLevel,
    anomalyFrequencySeconds,
    offlineProductionValue,
    refetch: refetchTree,
    hasNewUpgrade,
    markUpgradesSeen,
  } = useTreeContext()
  // Only the Reactor's permanent multiplier is still read here — the rest
  // of the prestige UI (shop, reset flow) is disabled below.
  const { reactorValue } = usePrestigeContext()
  const { language, strings } = useLanguage()
  // Whatever's currently being mined — every "your balance" label follows
  // this instead of hardcoding "platino", so it reads correctly after a
  // prestige moves the player onto Amatista, Esmeralda, etc.
  const currentMaterialName = strings.home.trajectoryTierNames[currentTierIndex]
  // "pt/s" only ever meant Platino — now the unit tracks whichever material
  // the current prestige tier actually produces (am/pt/es/or/di).
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[currentTierIndex]}/s`
  // Onboarding tasks — completion reads straight off the tree's own live
  // levels (no separate counter to keep in sync for 'node-level' tiers);
  // the backend re-verifies the same condition before ever paying out (see
  // tasksRepository.claim), so nothing here needs to be trusted. Grouped
  // into missions of 3 escalating tiers each, all shown at once — same
  // bronze/silver/gold medal language as Stats' own milestones, just 3
  // tiers instead of 4 and a claim action on top of the badge.
  const { claimed: claimedTasks, claimingId: claimingTaskId, anomaliesNeutralized, claim: claimTask } = useTasksContext()
  // Which tier's reward a mission's card is showing — defaults to that
  // mission's own active tier (see `activeTier` below) until the player
  // clicks a medal to browse another one, same interaction as Stats'
  // milestone badges re-targeting their ring.
  const [selectedTierByMission, setSelectedTierByMission] = useState<Record<string, number>>({})
  const MISSIONS = [
    {
      missionId: 'drones',
      missionName: strings.home.missionDronesName,
      // Same icon + badge color as Centro de mando's own "Drones" tile.
      icon: DroneIcon,
      badgeClass: 'bg-violet-500/20 text-violet-300',
      progressValue: autoClickLevel,
      tiers: [
        { id: 'first_drone', name: strings.home.taskFirstDroneName, desc: strings.home.taskFirstDroneDesc, reward: 1_000, required: 1 },
        { id: 'drone_squadron', name: strings.home.taskDroneSquadronName, desc: strings.home.taskDroneSquadronDesc, reward: 2_000, required: 10 },
        { id: 'drone_swarm', name: strings.home.taskDroneSwarmName, desc: strings.home.taskDroneSwarmDesc, reward: 50_000, required: 30 },
      ],
    },
    {
      missionId: 'scout',
      missionName: strings.home.missionScoutName,
      // Same icon + badge color as Centro de mando's own "Drones
      // buscadores" tile.
      icon: DroneIcon,
      badgeClass: 'bg-amber-500/20 text-amber-300',
      progressValue: scoutDroneLevel,
      tiers: [
        { id: 'first_scout_drone', name: strings.home.taskFirstScoutDroneName, desc: strings.home.taskFirstScoutDroneDesc, reward: 5_000, required: 1 },
        { id: 'scout_squad', name: strings.home.taskScoutSquadName, desc: strings.home.taskScoutSquadDesc, reward: 10_000, required: 10 },
        { id: 'scout_fleet', name: strings.home.taskScoutFleetName, desc: strings.home.taskScoutFleetDesc, reward: 100_000, required: 20 },
      ],
    },
    {
      missionId: 'lucky',
      missionName: strings.home.missionLuckyName,
      // Same green as the tree's own Destello/Telescopio family.
      icon: Sparkles,
      badgeClass: 'bg-green-500/20 text-green-300',
      progressValue: luckyClicksFound,
      tiers: [
        { id: 'first_glimmers', name: strings.home.taskFirstGlimmersName, desc: strings.home.taskFirstGlimmersDesc, reward: 5_000, required: 100 },
        { id: 'glimmer_streak', name: strings.home.taskGlimmerStreakName, desc: strings.home.taskGlimmerStreakDesc, reward: 20_000, required: 1_000 },
        { id: 'glimmer_master', name: strings.home.taskGlimmerMasterName, desc: strings.home.taskGlimmerMasterDesc, reward: 100_000, required: 10_000 },
      ],
    },
    {
      missionId: 'multishot',
      missionName: strings.home.missionMultiShotName,
      // Same icon + badge color as Centro de mando's own "Multidisparo" tile.
      icon: Split,
      badgeClass: 'bg-cyan-500/20 text-cyan-300',
      // Cannon *count* (multiShotValue = 1 + level), not the raw tree
      // level — the tiers' own descriptions already talk in terms of "2nd
      // cannon"/"5 cannons"/"10 cannons", so the progress readout below
      // them has to match (starts at 1/2, 1/5, 1/10 — everyone has 1 cannon
      // by default, see multiShot.js).
      progressValue: multiShotValue,
      tiers: [
        { id: 'second_cannon', name: strings.home.taskSecondCannonName, desc: strings.home.taskSecondCannonDesc, reward: 2_000, required: 2 },
        { id: 'full_battery', name: strings.home.taskFullBatteryName, desc: strings.home.taskFullBatteryDesc, reward: 10_000, required: 5 },
        { id: 'total_arsenal', name: strings.home.taskTotalArsenalName, desc: strings.home.taskTotalArsenalDesc, reward: 100_000, required: 10 },
      ],
    },
    {
      missionId: 'anomaly',
      missionName: strings.home.missionAnomalyName,
      // Same orange family as the tree's own Anomalías branch.
      icon: Orbit,
      badgeClass: 'bg-orange-500/20 text-orange-300',
      progressValue: anomaliesNeutralized,
      tiers: [
        { id: 'first_anomaly', name: strings.home.taskFirstAnomalyName, desc: strings.home.taskFirstAnomalyDesc, reward: 5_000, required: 1 },
        { id: 'anomaly_hunter', name: strings.home.taskAnomalyHunterName, desc: strings.home.taskAnomalyHunterDesc, reward: 10_000, required: 5 },
        { id: 'sector_guardian', name: strings.home.taskSectorGuardianName, desc: strings.home.taskSectorGuardianDesc, reward: 20_000, required: 15 },
      ],
    },
  ]
  // Lights the header's "Tareas" button — true while any tier of any
  // mission has actually been reached but not yet claimed. Purely
  // state-based (unlike the inventory/upgrade LEDs): it goes dark on its
  // own the moment the last claimable tier is claimed, no "seen" flag
  // needed.
  const hasClaimableTask = MISSIONS.some((mission) =>
    mission.tiers.some((tier) => mission.progressValue >= tier.required && !claimedTasks.has(tier.id)),
  )
  const {
    catalog: powerupCatalog,
    active: activePowerup,
    secondsLeft,
    activatingId: activatingPowerupId,
    activate: activatePowerup,
    refetchCatalog: refetchPowerupCatalog,
  } = usePowerupContext()
  const {
    catalog: luckCatalog,
    active: activeLuckPowerup,
    secondsLeft: luckSecondsLeft,
    activatingId: activatingLuckId,
    activate: activateLuck,
    refetchCatalog: refetchLuckCatalog,
  } = useTimedLuckPowerupContext()
  const {
    catalog: magnetCatalog,
    active: activeMagnet,
    secondsLeft: magnetSecondsLeft,
    activatingId: activatingMagnetId,
    activate: activateMagnet,
    refetchCatalog: refetchMagnetCatalog,
  } = useMagnetContext()
  const { keys } = useKeysContext()
  const { gems } = useGemsContext()
  const { ownedChests: ownedClickChests, refetchCatalog: refetchDailyCaseCatalog } = useDailyCaseContext()
  const { ownedChests: ownedGemChests, refetchCatalog: refetchGemChestCatalog } = useGemChestContext()
  const { refetchCatalog: refetchClickPacksCatalog } = useClickPacksContext()
  const { inventory, hasNewItem, markInventorySeen } = useInventoryContext()
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
  // Every per-tap visual (bolt, ripple/+N, debris) is owned by
  // TapEffectsLayer and driven imperatively through this ref — deliberately
  // NOT React state up here, since state for something that changes on every
  // tap would re-render this whole (very large, ~20-context) component
  // several times per tap. See that component's own header comment.
  const tapEffectsRef = useRef<TapEffectsHandle>(null)
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false)
  const [prestigeError, setPrestigeError] = useState<string | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [showShip, setShowShip] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null)
  // "Anomalía" event — a small asteroid that flies across the whole screen
  // like a shooting star on its own timer (see the Meteor spawn effect
  // below); tapping it opens EventChallenge (100 taps in 10s for a 5% cut
  // of the *current* material). Its color is random per spawn purely for
  // visual variety — unrelated to the player's actual current material,
  // which is what the reward is still actually named/paid out in.
  const [eventMeteor, setEventMeteor] = useState<{ colors: AsteroidColors; glow: string } | null>(null)
  const [showEventChallenge, setShowEventChallenge] = useState(false)
  const [eventChallengeColors, setEventChallengeColors] = useState<{ colors: AsteroidColors; glow: string } | null>(
    null,
  )
  // Every one of these is its own `fixed inset-0` full-screen overlay (see
  // each modal's JSX below) — none of them ever stopped the page itself
  // from scrolling underneath while open, since only the overlay's own
  // content was ever made scrollable.
  useLockBodyScroll(
    showPrestigeConfirm || showInventory || showShip || showTasks || showLog || showEventChallenge || infoModal !== null,
  )
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
  // existing one lifts and frees a slot. On desktop there's only ever one
  // mouse pointerId no matter which button is down, so right-click and the
  // Space bar (see the keydown listener below) get their own string keys
  // instead — that's what actually lets a desktop player use more than one
  // "hand" at once and feel Multidisparo's extra cannons the same way a
  // second/third finger does on mobile.
  const activePointersRef = useRef<Set<number | string>>(new Set())
  const RIGHT_CLICK_KEY = 'right-click'
  const SPACE_KEY = 'space'
  // Last known mouse position — the Space bar has no coordinates of its
  // own, so a space-triggered shot fires from wherever the cursor last was.
  const cursorPosRef = useRef({ x: 0, y: 0 })
  const heat = useMemo(
    () => getHeatLevel(clicksPerSecond, legendaryUnlockLevel > 0, legendaryThresholdTps),
    [clicksPerSecond, legendaryUnlockLevel, legendaryThresholdTps],
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
      const { x, y } = lastPosRef.current
      tapEffectsRef.current?.spawnEffect({ x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'key' })
      playMagnetProc('keys')
    }
    prevKeysRef.current = keys
  }, [keys, activeMagnet, heat.ripple])
  useEffect(() => {
    if (prevGemsRef.current !== null && gems > prevGemsRef.current && activeMagnet?.currency === 'gems') {
      const amount = gems - prevGemsRef.current
      const { x, y } = lastPosRef.current
      tapEffectsRef.current?.spawnEffect({ x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'gem' })
      playMagnetProc('gems')
    }
    prevGemsRef.current = gems
  }, [gems, activeMagnet, heat.ripple])
  // Anomalía's own spawn timer — gated on the Anomalías tree node
  // (anomalyUnlockLevel, see Tree.tsx's branch D): nothing spawns at all
  // until that's bought, same as Modo Legendario gating the Legendary heat
  // tier. Once unlocked, one meteor at a time flies across the whole
  // screen (see <Meteor>, which self-manages its own on-screen lifetime and
  // calls handleMeteorMiss if it isn't tapped in time); anomalyFrequencySeconds
  // (which the Detección node shortens) is only the *average* wait now, not
  // a fixed one — each gap is drawn from an exponential distribution around
  // that average (a Poisson process, same "random events at a steady long-run
  // rate" model real-world things like radioactive decay or bus arrivals
  // follow), floored at ANOMALY_MIN_GAP_SECONDS so two can't spawn back to
  // back. That means a level whose average is 2 minutes might occasionally
  // fire twice within 10-20 seconds of each other, or leave a much longer
  // gap than 2 minutes — but across a long enough stretch (say 10 minutes)
  // the real count still lands close to what the average implies, just with
  // natural variance around it instead of a metronome. Next spawn is
  // scheduled fresh once this cycle ends, either by that miss or by the
  // player capturing it and finishing the challenge. Every spawn picks a
  // random material tier purely for color variety — decorative only, the
  // actual reward material is always the player's real current tier.
  useEffect(() => {
    if (!userId || anomalyUnlockLevel <= 0 || showEventChallenge || eventMeteor) return
    let cancelled = false
    const ANOMALY_MIN_GAP_SECONDS = 10
    const gapSeconds = Math.max(ANOMALY_MIN_GAP_SECONDS, -anomalyFrequencySeconds * Math.log(1 - Math.random()))
    const spawnTimeout = window.setTimeout(() => {
      if (cancelled) return
      const tier = MATERIAL_TIER_COLORS[Math.floor(Math.random() * MATERIAL_TIER_COLORS.length)]
      setEventMeteor({ colors: tier, glow: tier.glow })
    }, gapSeconds * 1000)
    return () => {
      cancelled = true
      window.clearTimeout(spawnTimeout)
    }
  }, [userId, anomalyUnlockLevel, anomalyFrequencySeconds, showEventChallenge, eventMeteor])

  const handleMeteorCapture = useCallback(() => {
    setEventMeteor((current) => {
      if (current) setEventChallengeColors(current)
      return null
    })
    setShowEventChallenge(true)
  }, [])

  const handleMeteorMiss = useCallback(() => {
    setEventMeteor(null)
  }, [])
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
  // quantities aren't touched by a prestige at all, but the chest/pack
  // catalogs' own material-denominated numbers scale with the new tier (see
  // usersRepository.scaleMaterialAmount) — refetch those too or the Store
  // keeps showing pre-prestige costs/payouts for the rest of the session.
  const handleConfirmPrestige = async () => {
    setPrestigeError(null)
    const result = await confirmPrestige()
    if (result.ok) {
      setShowPrestigeConfirm(false)
      refetchTree()
      refetchDailyCaseCatalog()
      refetchGemChestCatalog()
      refetchClickPacksCatalog()
      refetchPowerupCatalog()
      refetchLuckCatalog()
      refetchMagnetCatalog()
    } else if (result.error !== 'not-signed-in') {
      setPrestigeError(result.error ?? 'error')
    }
  }

  // The actual "take a shot" logic, keyed by an arbitrary pointer key
  // instead of always `e.pointerId` — a real touch/mouse pointerdown passes
  // its own `e.pointerId`, but the Space bar and right-click (added so
  // desktop players can feel Multidisparo's extra cannons at all, since a
  // mouse only ever has one pointerId no matter which button is down) pass
  // their own fixed string keys instead, so all three can hold independent
  // slots in `activePointersRef` at once.
  const fireShot = useCallback(
    (pointerKey: number | string, clientX: number, clientY: number) => {
      if (!userId) {
        promptSignIn()
        return
      }

      // Multidisparo's cap — a finger/click/key landing while the allowance
      // is already full is ignored entirely, not queued for when a slot
      // frees up, so it reads as "this tap just didn't register" rather
      // than a delayed extra shot later.
      if (!activePointersRef.current.has(pointerKey) && activePointersRef.current.size >= multiShotValue) {
        return
      }
      activePointersRef.current.add(pointerKey)

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = clientX - rect.left
      const y = clientY - rect.top

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
      registerClick(amount, isLucky)
      playLaserShot()

      // Fire a shot from the tap point at the space object. Handed straight
      // to TapEffectsLayer rather than stored here: this is per-tap state,
      // and keeping it out of Home is what stops every single tap from
      // re-rendering this whole component (see that file's header comment).
      // The layer spawns the ripple/+N and debris itself once the bolt's own
      // animation actually reports finishing, never on a wall-clock timer.
      const dx = objX - x
      const dy = objY - y
      tapEffectsRef.current?.fireShot({
        startX: x,
        startY: y,
        dx,
        dy,
        angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
        impactX: objX,
        impactY: objY,
        displayAmount,
        isLucky,
        rippleClass: isLucky ? 'bg-green-400/70' : heat.ripple,
      })
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

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      // A mouse only ever reports one pointerId regardless of which button
      // is down, so a right-click held alongside a left-click would
      // otherwise just re-occupy the same Multidisparo slot instead of
      // taking a second one — giving it its own fixed key is what actually
      // lets the two combine into 2 simultaneous shots.
      const pointerKey = e.button === 2 ? RIGHT_CLICK_KEY : e.pointerId
      fireShot(pointerKey, e.clientX, e.clientY)
    },
    [fireShot],
  )

  // Tracks the mouse for the Space-bar shortcut below, which has no
  // coordinates of its own to fire from. Only updated for real mouse
  // movement (not touch drags, which report pointer moves too) since a
  // finger's last position isn't a meaningful "aim point" the way a cursor
  // is.
  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') cursorPosRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Frees the pointer's slot the moment it lifts (or the gesture is
  // cancelled, e.g. an OS gesture taking over) so the next finger down can
  // use it — a plain ref mutation, no re-render needed for either handler.
  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const pointerKey = e.button === 2 ? RIGHT_CLICK_KEY : e.pointerId
    activePointersRef.current.delete(pointerKey)
  }, [])

  // Right-click and Space both act as an extra "hand" for Multidisparo on
  // desktop, where a single mouse cursor otherwise has no way to land more
  // than one shot at once the way multiple fingers do on mobile.
  const handleContextMenu = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // None of Home's own modals should let Space "reach through" them to
  // fire a shot on the (hidden, backdropped) game underneath — a modal's
  // own backdrop already blocks pointer clicks via stopPropagation, but a
  // window-level keydown listener bypasses that bubbling entirely, so this
  // needs its own explicit check.
  const isAnyModalOpen =
    showPrestigeConfirm || showInventory || showShip || showTasks || showLog || infoModal !== null || showEventChallenge

  useEffect(() => {
    if (isAnyModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      // Don't hijack Space from an actually-focused control (a text field,
      // a link) — only treat it as "fire" when nothing interactive has
      // focus, i.e. the player is just looking at the game.
      const target = e.target as HTMLElement | null
      if (target && target !== document.body && target.tagName !== 'DIV') return
      e.preventDefault()
      fireShot(SPACE_KEY, cursorPosRef.current.x, cursorPosRef.current.y)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      activePointersRef.current.delete(SPACE_KEY)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [fireShot, isAnyModalOpen])

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
      onContextMenu={handleContextMenu}
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
      <div data-tutorial="home-hud" className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-3 sm:pt-4">
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
                    <PlatinumIcon size={11} className="text-violet-300" />
                    <span className="whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-widest text-violet-400/70">
                      {strings.home.hudProdLabel}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    <span className="font-mono text-sm font-bold tabular-nums text-violet-200">
                      {/* Fleet output (autoClickCps + scoutDroneCps) is the
                          real, steady per-second rate straight from the
                          server — always showing, never fluctuating with
                          click timing. Manual output (clicksPerSecond *
                          totalMultiplier) is what real taps add on top right
                          now, decaying back toward 0 the moment you stop. */}
                      {(autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier).toFixed(1)} {cpsUnit}
                    </span>
                    {activePowerup && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] tabular-nums text-violet-300">
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
                    onClick={() => {
                      setShowShip(true)
                      markUpgradesSeen()
                    }}
                    iconClass="text-violet-300"
                    ledClass="bg-violet-400 shadow-[0_0_3px_1px_rgba(167,139,250,0.9)]"
                    borderClass="border-violet-400/20"
                    lit={hasNewUpgrade}
                  />
                  <CockpitIconButton
                    icon={Package}
                    ariaLabel={strings.home.inventory}
                    onClick={() => {
                      setShowInventory(true)
                      markInventorySeen()
                    }}
                    iconClass="text-amber-300"
                    ledClass="bg-amber-400 shadow-[0_0_3px_1px_rgba(251,191,36,0.9)]"
                    borderClass="border-amber-400/20"
                    lit={hasNewItem}
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
                    {/* Was a motion.span keyed on totalClicks, with a
                        scale-pop animation on every change — totalClicks
                        changes every tap AND every ~100ms straight while
                        any auto-click production is running (see
                        TreeContext's own local tick), so a `key` change
                        that often meant React fully unmounting and
                        remounting this element, retriggering Framer's
                        animation *and* forcing the browser to recompute the
                        drop-shadow filter below (which traces the actual
                        digit shapes, themselves also changing) — all three
                        at once, continuously, just from owning any drones,
                        no tapping needed. A plain span still updates
                        instantly on every change; it just doesn't restart
                        an animation that was too fast to read as a "pop"
                        anyway at that cadence. */}
                    <span className="bg-clip-text text-center font-[Space_Grotesk] text-4xl font-bold leading-none tabular-nums text-transparent bg-gradient-to-b from-white to-neutral-400 [filter:drop-shadow(0_0_18px_rgba(167,139,250,0.25))] sm:text-5xl">
                      {formatPlatino(totalClicks, language)}
                    </span>
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
                    lit={hasClaimableTask}
                  />
                  <CockpitIconButton
                    icon={Route}
                    ariaLabel={strings.home.log}
                    onClick={() => setShowLog(true)}
                    iconClass="text-sky-300"
                    ledClass="bg-sky-400 shadow-[0_0_3px_1px_rgba(56,189,248,0.9)]"
                    borderClass="border-sky-400/20"
                    lit={prestige.readyToPrestige}
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
        <div
          ref={objectRef}
          data-tutorial="home-click-area"
          className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96"
        >
            <OrbitingBots count={autoClickLevel} fuseEvery={10} />
          <OrbitingBots
            count={scoutDroneLevel}
            colorClass="text-amber-300"
            glowColor="rgba(251,191,36,0.65)"
            beamClass="from-amber-300/0 via-amber-200 to-white"
            beamShadow="rgba(252,211,77,0.8)"
            phaseOffset={0.4}
          />
          {/* Ring + asteroid shrunk together by the same 0.85 the orbit
              radius below was scaled by (index.css) — one shared wrapper so
              the two always shrink in lockstep instead of two separately
              hand-tuned scale factors drifting apart later. */}
          <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.85)' }}>
            {/* Scaled down from the object's own box — the ring used to hug
                the object edge-to-edge, which read as oversized next to it. */}
            <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.7)' }}>
              <ProgressRing pct={prestige.pct} isMaxed={prestige.readyToPrestige} />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <SpaceObject tierIndex={currentTierIndex} pct={prestige.pct} />
            </div>
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

      {/* Every per-tap visual — bolt, ripple/+N, debris — with its own state
          held inside, so a tap never re-renders Home. Driven imperatively
          via tapEffectsRef; takes no props on purpose (see its own comment). */}
      <TapEffectsLayer ref={tapEffectsRef} />

      {/* Anomalía spawn — a small asteroid flying across the whole screen
          like a shooting star; stopPropagation inside Meteor's own button
          keeps a capture tap from also counting as a real production click
          on the object underneath. */}
      {eventMeteor && (
        <Meteor
          colors={eventMeteor.colors}
          glow={eventMeteor.glow}
          label={strings.event.ariaLabel}
          onCapture={handleMeteorCapture}
          onMiss={handleMeteorMiss}
        />
      )}

      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
                        {(baseClickMultiplier * tapMultiplierValue * moneyMultiplier).toLocaleString(
                          language === 'en' ? 'en-US' : 'es-ES',
                          { maximumFractionDigits: 2 },
                        )}
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
                    <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                      <p>
                        {strings.home.shipDroneProductionDesc}{' '}
                        <span className="font-semibold text-white">
                          {(autoClickCps + scoutDroneCps).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', {
                            maximumFractionDigits: 2,
                          })}
                        </span>{' '}
                        {cpsUnit}
                      </p>
                      <p>
                        {strings.home.shipOfflineProductionDesc}{' '}
                        <span className="font-semibold text-white">
                          {((autoClickCps + scoutDroneCps) * offlineProductionValue).toLocaleString(
                            language === 'en' ? 'en-US' : 'es-ES',
                            { maximumFractionDigits: 2 },
                          )}
                        </span>{' '}
                        {cpsUnit}
                      </p>
                    </div>
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
                        {cpsUnit}
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
                          {cpsUnit}
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
                      String(MISSIONS.filter((m) => m.tiers.every((tier) => claimedTasks.has(tier.id))).length),
                      String(MISSIONS.length),
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
                {MISSIONS.map((mission, i) => {
                  const tierKeys = MILESTONE_TIER_KEYS.slice(0, mission.tiers.length)
                  const allTiersClaimed = mission.tiers.every((tier) => claimedTasks.has(tier.id))
                  const activeTierIdx = mission.tiers.findIndex((tier) => !claimedTasks.has(tier.id))
                  const selectedTierIdx = selectedTierByMission[mission.missionId] ?? (activeTierIdx === -1 ? mission.tiers.length - 1 : activeTierIdx)
                  const selectedTier = mission.tiers[selectedTierIdx]
                  // Desc + progress bar follow whichever medal is being
                  // browsed, not necessarily the mission's next unclaimed
                  // tier — clicking an earlier/later medal re-targets both,
                  // same as Stats' own milestone rings.
                  const pct = allTiersClaimed ? 100 : Math.min(1, mission.progressValue / selectedTier.required) * 100
                  const Icon = mission.icon
                  return (
                    <div
                      key={mission.missionId}
                      className={`relative flex overflow-hidden rounded-lg border shadow-lg shadow-black/20 transition-colors ${
                        allTiersClaimed ? 'border-white/5 bg-[#0d0d13]/80 opacity-50' : 'border-white/5 bg-[#0d0d13]'
                      }`}
                    >
                      {/* Mission index tab — a small torn-off corner label,
                          like a manifest sheet's own line numbers. */}
                      <div className={`flex w-7 shrink-0 items-center justify-center ${mission.badgeClass}`}>
                        <span className="rotate-180 font-mono text-[9px] font-bold tracking-widest [writing-mode:vertical-rl]">
                          M-0{i + 1}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-2.5 px-3.5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${mission.badgeClass}`}>
                            <Icon size={19} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{mission.missionName}</p>
                            <p className="text-xs text-neutral-500">{allTiersClaimed ? strings.home.tasksAllClaimed : selectedTier.desc}</p>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-1 text-right font-mono text-[10px] tabular-nums text-neutral-500">
                              {allTiersClaimed
                                ? selectedTier.required.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')
                                : Math.min(mission.progressValue, selectedTier.required).toLocaleString(
                                    language === 'en' ? 'en-US' : 'es-ES',
                                  )}
                              /{selectedTier.required.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
                            </p>
                          </div>
                        </div>

                        {/* Medal row — same rank badges + click-to-browse
                            interaction as Stats' own milestones
                            (bronze/silver/gold): always clickable, colored
                            once the tier's own objective is met, and picks
                            which tier's reward shows below. */}
                        <div className="flex items-center justify-center gap-3">
                          {mission.tiers.map((tier, tierIdx) => {
                            const tierKey = tierKeys[tierIdx]
                            const reached = mission.progressValue >= tier.required
                            const isSelected = selectedTierIdx === tierIdx
                            return (
                              <button
                                key={tier.id}
                                onClick={() => setSelectedTierByMission((prev) => ({ ...prev, [mission.missionId]: tierIdx }))}
                                aria-label={tier.name}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                                  isSelected ? 'border-white/40 bg-white/10' : 'border-white/5 bg-white/[0.02]'
                                }`}
                              >
                                <Medal size={14} className={reached ? MILESTONE_TIER_COLORS[tierKey] : 'text-neutral-700'} />
                              </button>
                            )
                          })}
                        </div>

                        {/* Horizontal dashed seam — same seam language as the
                            reward "ticket stub" used elsewhere, rotated
                            horizontal, cut open only around its label. */}
                        <div className="flex items-center gap-2">
                          <div className="h-0 flex-1 border-t border-dashed border-white/15" />
                          <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-widest text-neutral-600">
                            {strings.home.tasksRewardsLabel}
                          </span>
                          <div className="h-0 flex-1 border-t border-dashed border-white/15" />
                        </div>

                        <div className="flex items-center justify-center">
                          {(() => {
                            const isClaimed = claimedTasks.has(selectedTier.id)
                            const isClaiming = claimingTaskId === selectedTier.id
                            const isCompleted = mission.progressValue >= selectedTier.required
                            if (isClaimed) {
                              return (
                                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 opacity-70">
                                  <Check size={13} />
                                  <PlatinumIcon size={13} className="opacity-80" />
                                  {selectedTier.reward.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
                                </span>
                              )
                            }
                            if (isCompleted) {
                              return (
                                <button
                                  onClick={() => claimTask(selectedTier.id)}
                                  disabled={isClaiming}
                                  className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-transform hover:scale-105 disabled:opacity-60 ${MATERIAL_BUTTON_THEMES[currentTierIndex].pill}`}
                                >
                                  <PlatinumIcon size={13} className="opacity-80" />
                                  {isClaiming ? strings.home.taskClaiming : selectedTier.reward.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
                                </button>
                              )
                            }
                            return (
                              <span
                                aria-disabled="true"
                                className="flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-xs font-semibold text-neutral-600"
                              >
                                <PlatinumIcon size={13} className="opacity-50" />
                                {selectedTier.reward.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
                              </span>
                            )
                          })()}
                        </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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

      {showEventChallenge && eventChallengeColors && (
        <EventChallenge
          colors={eventChallengeColors.colors}
          glow={eventChallengeColors.glow}
          onClose={() => {
            setShowEventChallenge(false)
            setEventChallengeColors(null)
          }}
        />
      )}
    </div>
  )
}
