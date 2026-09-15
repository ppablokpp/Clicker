// The goal ring, as a planetary ring.
//
// Progress towards the prestige goal used to be a 3px stroke drawn round the
// rock like a dial. This is the same reading — starts at a fixed point, fills
// clockwise, wears the mineral's colour, goes gold when the goal is met — but
// the ring is now a thing in the scene: a tilted band of ice and dust with the
// front half in front of the rock and the back half behind it, the rock's own
// shadow falling across it, and grains orbiting in its plane.
//
// It's rendered twice, once per half, either side of <Asteroid> in the tree.
// Both halves are the same drawing under a different clip, so nothing has to
// be kept in sync by hand.
//
// All the foreshortening comes from a single `scale(1 0.37)` on the group:
// inside it everything is plain circles — the bands are a stroked circle, the
// dust orbits by rotating about the origin — and the squash turns them into
// the right ellipses, thins the bands at the front and back, and flattens the
// grains' motion into an orbit. No ellipse maths anywhere.

import { memo, type ReactNode } from 'react'
import type { MaterialTierColors } from '../lib/materialTiers'

/** Tilt of the ring plane on screen, degrees. Negative lifts the right side. */
const TILT = -16
/** How edge-on the ring is: 1 would be face-on, 0 a line. */
const SQUASH = 0.37
/** The rock's radius in px at Home's size (Asteroid size 76 → 76 · 0.42). The
 *  ring is sized from it, so it stays in proportion if the rock is resized. */
const ROCK_R = 32
const R0 = ROCK_R * 1.38
const R1 = ROCK_R * 2.18
const RM = (R0 + R1) / 2
const BAND_W = R1 - R0
/** The SVG's box, in px. Wider than the ring so the tip glow never clips. */
const SIZE = 196
const HALF = SIZE / 2

/**
 * One full circle at the band's mid radius, starting at the bottom (the point
 * nearest the viewer once tilted) and running clockwise. Progress is a dash
 * along it, so where the path starts is where the fill starts: it comes
 * towards you across the front, disappears behind the rock, and closes on the
 * right.
 */
const RING_D = `M0,${RM} A${RM},${RM} 0 1 1 0,${-RM} A${RM},${RM} 0 1 1 0,${RM}Z`
/** Outer and inner circles, for an even-odd clip that keeps the shadow on the
 *  band and off the rock's face. */
const ANNULUS_D = `M${R1 + 3},0 A${R1 + 3},${R1 + 3} 0 1 1 ${-(R1 + 3)},0 A${R1 + 3},${R1 + 3} 0 1 1 ${R1 + 3},0Z M${R0 - 3},0 A${R0 - 3},${R0 - 3} 0 1 1 ${-(R0 - 3)},0 A${R0 - 3},${R0 - 3} 0 1 1 ${R0 - 3},0Z`

/** The finished state stays gold whatever the tier — see ProgressRing's old
 *  note: at that point the ring has stopped reporting progress and become a
 *  "there's something to do here" halo. */
const GOLD: MaterialTierColors = { light: '#fff3c4', fill: '#f5b514', dark: '#7c3f0c', glow: 'rgba(250,204,21,0.7)' }
/** What the unmined part is made of: grey dust, no tint, so the mined part is
 *  the only coloured thing on the ring. */
const DUST = { light: '#b7bac6', fill: '#7d8190' }

/** Same sin-fract hash as the asteroid's craters — the ring texture and the
 *  grain positions must be identical on every render. */
function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}
function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

/**
 * The band texture, as radial-gradient stops from the inner edge to the outer.
 *
 * Built like Saturn's, coarsely: a thin translucent inner ring, the bright
 * wide one, a dark division two thirds of the way out, and a slightly thinner
 * outer ring fading at the rim. Within each, the opacity wobbles stop to stop
 * so the band reads as many fine ringlets rather than one flat stroke.
 */
const BAND_STOPS = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40
  let a = 0.68 + hash01(i * 2.9 + 0.7) * 0.32
  if (t < 0.14) a *= 0.35
  else if (t > 0.58 && t < 0.66) a = 0.06
  else if (t > 0.66) a *= 0.72
  if (t > 0.95) a *= 0.4
  return { offset: (R0 + t * BAND_W) / R1, a, m: 0.24 + hash01(i * 4.1 + 3.3) * 0.5 }
})

/** Grains in the ring plane. A little wider than the band either side, so a
 *  few stray past the ice like the real thing's shepherded edges. */
const GRAINS = Array.from({ length: 84 }, (_, i) => {
  const th = hash01(i * 1.7 + 0.2) * Math.PI * 2
  const r = R0 - 2 + hash01(i * 2.3 + 0.9) * (BAND_W + 5)
  return { cx: Math.cos(th) * r, cy: Math.sin(th) * r, r: 0.4 + hash01(i * 3.7 + 1.4) * 0.7, a: 0.35 + hash01(i * 5.1 + 2.6) * 0.65 }
})

/** Sparks for the finished state, at fixed places on the ring; each twinkles
 *  on its own phase. */
const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  th: hash01(i * 4.4 + 1.1) * Math.PI * 2,
  r: R0 + hash01(i * 6.2 + 2.2) * BAND_W,
  delay: hash01(i * 8.3) * 1.6,
}))

/** A point of the ring plane, on screen: squash, tilt, centre. */
function toScreen(th: number, r: number): [number, number] {
  const x = Math.cos(th) * r
  const y = Math.sin(th) * r * SQUASH
  const t = (TILT * Math.PI) / 180
  return [HALF + x * Math.cos(t) - y * Math.sin(t), HALF + x * Math.sin(t) + y * Math.cos(t)]
}
/** Front of the ring is the half nearer the viewer — positive y in the plane,
 *  i.e. the lower half before the tilt. */
const isFront = (th: number) => Math.sin(th) > 0

/**
 * The grains, on their own layer.
 *
 * They used to be circles inside the ring's SVG, spun by a CSS rotation on an
 * inner <g>. A transform on an element INSIDE an SVG is not something the
 * compositor can do on its own: every frame the whole SVG is painted again —
 * gradients, masks, clips, every circle — on the main thread, at 60fps, for
 * as long as the app is open. Two halves of that was a phone warming up in
 * your hand with nothing else going on.
 *
 * So the grains are a separate <svg> element that is painted ONCE, and the
 * spin is a transform animation on the element itself, which the compositor
 * runs off the main thread as a texture rotating. The tilt and squash sit on
 * a wrapper (a plain CSS transform, same numbers as the ring's), so inside
 * the wrapper a rotation is still an orbit in the ring plane; and the half
 * is a clip-path on that wrapper, which clips in the wrapper's own box —
 * i.e. in ring-plane space — exactly like the SVG clip did.
 *
 * One copy, one colour. The mined/unmined split the grains used to carry
 * needed a mask driven by the dash, and a mask is repainted with everything
 * under it. The band carries the progress; the grains are texture.
 */
function PlaneLayer({
  half,
  spinClass,
  children,
}: {
  half: 'back' | 'front'
  /** The spin, as a class on the <svg> (ring-grains / ring-orbit-fast…). */
  spinClass: string
  children: ReactNode
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `calc(50% - ${HALF}px)`,
        top: `calc(50% - ${HALF}px)`,
        width: SIZE,
        height: SIZE,
        transform: `rotate(${TILT}deg) scaleY(${SQUASH})`,
        clipPath: half === 'back' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className={spinClass}>
        {children}
      </svg>
    </div>
  )
}

const Grains = memo(function Grains({
  half,
  color,
  fast,
  paused,
}: {
  half: 'back' | 'front'
  color: string
  fast: boolean
  paused: boolean
}) {
  return (
    <PlaneLayer
      half={half}
      spinClass={`ring-grains${fast ? ' ring-grains-fast' : ''}${paused ? ' ring-grains-paused' : ''}`}
    >
      <g fill={color} opacity={0.5}>
        {GRAINS.map((g, i) => (
          <circle key={i} cx={HALF + g.cx} cy={HALF + g.cy} r={g.r} opacity={g.a} />
        ))}
      </g>
    </PlaneLayer>
  )
})

/**
 * The loading screen's travelling arc, as its own turning layer. It used to
 * be a CSS animation on stroke-dashoffset, which repaints the SVG every
 * frame — on the one screen that is up while the main thread is busiest.
 * A fixed 34% dash on a layer that rotates is the same picture for the cost
 * of a texture turning.
 */
const OrbitArc = memo(function OrbitArc({ half, id, colors }: { half: 'back' | 'front'; id: string; colors: MaterialTierColors }) {
  return (
    <PlaneLayer half={half} spinClass="ring-grains ring-orbit-fast">
      <defs>
        <Bands id={`${id}-orbit-ice`} colors={colors} alpha={1} />
      </defs>
      <g transform={`translate(${HALF} ${HALF})`}>
        <path d={RING_D} pathLength={100} fill="none" stroke={`url(#${id}-orbit-ice)`} strokeWidth={BAND_W} strokeDasharray="34 66" />
        <path d={RING_D} pathLength={100} fill="none" stroke={colors.light} strokeOpacity={0.45} strokeWidth={BAND_W * 0.14} strokeDasharray="34 66" />
      </g>
    </PlaneLayer>
  )
})

const Bands = memo(function Bands({ id, colors, alpha }: { id: string; colors: { light: string; fill: string }; alpha: number }) {
  return (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R1}>
      {BAND_STOPS.map((s, i) => (
        <stop key={i} offset={s.offset} stopColor={mix(colors.fill, colors.light, s.m)} stopOpacity={s.a * alpha} />
      ))}
    </radialGradient>
  )
})

export const SaturnRing = memo(function SaturnRing({
  half,
  pct,
  isMaxed,
  colors,
  paused = false,
  idPrefix = 'homeRing',
  mode = 'progress',
}: {
  /** Which half of the ring this instance draws. 'back' goes behind the
   *  rock in the tree, 'front' in front of it. */
  half: 'back' | 'front'
  pct: number
  isMaxed: boolean
  colors: MaterialTierColors
  /** Freezes the orbiting grains, same as Asteroid's `paused`. */
  paused?: boolean
  /** Keeps the two halves' gradient and clip ids apart from any other
   *  instance on the page, same as Asteroid's. */
  idPrefix?: string
  /** 'progress' fills the ring to `pct`. 'orbit' ignores `pct` and sends a
   *  short lit arc round and round instead — the loading screen's spinner,
   *  drawn as a thing in orbit rather than a stroke going in circles. */
  mode?: 'progress' | 'orbit'
}) {
  const id = `${idPrefix}-${half}`
  const c = isMaxed ? GOLD : colors
  const p = isMaxed ? 1 : Math.max(0, Math.min(1, pct))
  // pathLength=100, dash of 100 and gap of 100: the offset is simply the
  // percentage left to mine.
  const offset = 100 - p * 100
  const dash = 'stroke-dashoffset 0.6s ease-out'
  // A closed ring gets no dash at all: a full-length dash still leaves a
  // hairline seam where its two ends meet at the start of the path.
  // In orbit the arc is a separate turning layer (OrbitArc) and the ring
  // here is only the dust track and the shadow.
  const orbit = mode === 'orbit' && !isMaxed
  const dashArray = isMaxed ? undefined : '100 100'

  const tipAngle = Math.PI / 2 + p * Math.PI * 2
  const showTip = !isMaxed && !orbit && p > 0.002 && isFront(tipAngle) === (half === 'front')
  const [tx, ty] = toScreen(tipAngle, RM)

  return (
    <>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        <defs>
          <Bands id={`${id}-ice`} colors={c} alpha={1} />
          <Bands id={`${id}-dust`} colors={DUST} alpha={0.23} />
          {/* The rock's shadow on the ring. The sun everything in the game is
              lit by sits upper-left, so the shadow falls lower-right, onto the
              front of the ring just past the rock's limb. In ring-plane units,
              like everything under the squash. */}
          <radialGradient id={`${id}-shadow`} gradientUnits="userSpaceOnUse" cx={ROCK_R * 0.55} cy={ROCK_R * 1.1} r={ROCK_R * 1.5}>
            <stop offset="0%" stopColor="#000" stopOpacity="0.72" />
            <stop offset="55%" stopColor="#000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-tip`}>
            <stop offset="0%" stopColor={c.light} stopOpacity="0.95" />
            <stop offset="35%" stopColor={c.fill} stopOpacity="0.55" />
            <stop offset="100%" stopColor={c.fill} stopOpacity="0" />
          </radialGradient>
          {/* The half. A rect over the top or bottom of the ring plane; clipped
              inside the tilted, squashed group so "top" means the far side. */}
          <clipPath id={`${id}-half`}>
            <rect x={-SIZE} y={half === 'back' ? -SIZE : 0} width={SIZE * 2} height={SIZE} />
          </clipPath>
          <clipPath id={`${id}-annulus`} clipRule="evenodd">
            <path d={ANNULUS_D} clipRule="evenodd" />
          </clipPath>
        </defs>

        <g transform={`translate(${HALF} ${HALF}) rotate(${TILT}) scale(1 ${SQUASH})`} clipPath={`url(#${id}-half)`}>
          {/* What's left to mine: the same bands, in dust. */}
          <path d={RING_D} fill="none" stroke={`url(#${id}-dust)`} strokeWidth={BAND_W} />
          {/* What's mined: ice in the mineral's colour, a dash that grows. */}
          {!orbit && (
            <path
              d={RING_D}
              pathLength={100}
              fill="none"
              stroke={`url(#${id}-ice)`}
              strokeWidth={BAND_W}
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
              style={{ transition: dash }}
            />
          )}
          {/* A bright core down the middle of the mined ice, so the filled arc
              reads from across the room and not only up close. */}
          {!orbit && (
            <path
              d={RING_D}
              pathLength={100}
              fill="none"
              stroke={c.light}
              strokeOpacity={0.45}
              strokeWidth={BAND_W * 0.14}
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
              style={{ transition: dash }}
            />
          )}
          {half === 'front' && (
            <g clipPath={`url(#${id}-annulus)`}>
              <circle r={R1 + 3} fill={`url(#${id}-shadow)`} />
            </g>
          )}
        </g>

        {/* The leading edge, in screen space so its glow stays round. */}
        {showTip && (
          <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)})`}>
            <circle r={11} fill={`url(#${id}-tip)`} />
            <circle r={2.2} fill="#fff" />
          </g>
        )}
      </svg>

      {orbit && <OrbitArc half={half} id={id} colors={c} />}
      <Grains half={half} color={c.light} fast={isMaxed || orbit} paused={paused} />

      {/* Goal met: sparks along the ring, each on its own twinkle. HTML
          spans, not SVG circles, for the same reason the grains moved out:
          each is its own tiny layer whose opacity the compositor animates,
          instead of a repaint of the whole ring per frame. */}
      {isMaxed &&
        SPARKS.filter((sp) => isFront(sp.th) === (half === 'front')).map((sp, i) => {
          const [x, y] = toScreen(sp.th, sp.r)
          return (
            <span
              key={i}
              className="ring-spark pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-[#fff8d6]"
              style={{
                left: `calc(50% - ${HALF}px + ${x.toFixed(1)}px)`,
                top: `calc(50% - ${HALF}px + ${y.toFixed(1)}px)`,
                marginLeft: -1.5,
                marginTop: -1.5,
                animationDelay: `${sp.delay}s`,
              }}
            />
          )
        })}
    </>
  )
})
