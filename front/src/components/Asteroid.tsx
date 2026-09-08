// THE rock. Every asteroid in the game is this component now — Home's target,
// the Trayectoria list's previews, the Anomalía meteor and its full-size
// challenge target, and the one in a click battle.
//
// It used to exist in three hand-copied versions (here, Home.tsx and
// Battle.tsx), which is why feedback_meteorite_sync exists as a convention at
// all: someone had to remember to mirror every visual change by hand. Three
// copies of a flat polygon was tolerable; three copies of a lit sphere with a
// generated crater field was not, so the convention is retired in favour of
// there being one of it.
//
// `idPrefix` keeps every instance's SVG gradient/clip ids unique, so several
// on screen at once never collide over a definition.

import { memo } from 'react'

type Point = [number, number]

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

/**
 * Catmull-Rom through every wobble point, converted to cubic Béziers.
 *
 * The outline used to be a <polygon>, and twenty straight segments is exactly
 * what a faceted object looks like — the one thing a sphere never is. Curves
 * cost nothing extra to draw and the silhouette stops reading as cut paper.
 *
 * The 1/6 tension is the standard uniform Catmull-Rom conversion: each control
 * point sits a sixth of the way along the chord between the neighbours either
 * side, which is what makes the curve pass exactly *through* the points rather
 * than near them.
 */
function smoothClosedPath(points: Point[]): string {
  const n = points.length
  const at = (i: number) => points[(i + n) % n]
  const xy = (p: Point) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`
  let d = `M${xy(at(0))}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${xy(c1)} ${xy(c2)} ${xy(p2)}`
  }
  return `${d}Z`
}

// Jitter is 2.2, down from the 3 the polygon used. The rock still isn't a
// ball, but a sphere's silhouette is smooth, and every unit of wobble is one
// the eye reads as "flat irregular shape" instead of "lit body".
export const ASTEROID_PATH = smoothClosedPath(buildRoundRockOutline(24, 42, 2.2))

const ROCK_R = 42
const ROCK_CY = 50

/**
 * How wide one full turn of the surface is, in viewBox units.
 *
 * The visible window is only the ~84 units the silhouette spans, so a band of
 * 100 would show very nearly the whole loop at once and the same craters would
 * come back every cycle — a repeating texture, not a body. At 300 a revolution
 * carries three and a half windows of distinct terrain past you before
 * anything returns, which is what a real asteroid does: features come round
 * again, once per rotation.
 */
export const SURFACE_BAND = 300

/** Deterministic hash, the standard sin-fract one. Not Math.random: the
 *  terrain has to be identical on every render and every reload, or a rock
 *  would re-shuffle its own craters whenever React re-rendered it. */
function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface Crater {
  /** The bowl's outline. A path, not a circle — see buildCraterPath. */
  d: string
  /** The raised rim's outline, or null on craters too small to be worth one. */
  lip: string | null
}

interface Speckle {
  cx: number
  cy: number
  r: number
}

/** How many points each crater outline is sampled at. Enough that the curve
 *  through them reads as a smooth closed shape rather than a rounded polygon —
 *  at 9 the corners were plainly visible and a crater clipped by the
 *  silhouette put a straight edge on the rock's own outline. */
const CRATER_POINTS = 14

/**
 * One crater's outline: an irregular blob, elongated and turned.
 *
 * These were perfect circles, and a field of perfect circles is the tell that
 * they were drawn rather than excavated — real craters are ragged, most are
 * oval rather than round, and the ovals point every which way because the
 * things that dug them came in at every angle. Three separate irregularities
 * do that here, and it takes all three: the radius wobbles point to point, the
 * whole shape is squashed along one axis, and that axis is rotated freely.
 *
 * The radius wobbles the same way the silhouette's does — two low-frequency
 * sinusoids with their own phase, not an independent draw per point. That
 * distinction is the whole difference between a crater and a blob: a random
 * radius at every point is high-frequency noise, and a smooth curve fitted
 * through noise comes out as a rounded polygon with visible corners. Two slow
 * lobes give the gentle bean and egg shapes real craters actually have.
 *
 * Built around (cx, cy) rather than the origin and translated, so the position
 * is baked into the path and each crater stays a single node with no transform
 * of its own.
 */
function buildCraterPath(cx: number, cy: number, r: number, seed: number, squash: number, rot: number): string {
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const phaseA = hash01(seed + 0.7) * Math.PI * 2
  const phaseB = hash01(seed + 3.4) * Math.PI * 2
  const points: Point[] = []
  for (let i = 0; i < CRATER_POINTS; i++) {
    const angle = (i / CRATER_POINTS) * Math.PI * 2
    const wobble = 1 + Math.sin(angle * 2 + phaseA) * 0.11 + Math.sin(angle * 3 + phaseB) * 0.075
    const x = Math.cos(angle) * r * wobble * squash
    const y = (Math.sin(angle) * r * wobble) / squash
    points.push([cx + x * cos - y * sin, cy + x * sin + y * cos])
  }
  return smoothClosedPath(points)
}

/**
 * Half the silhouette's width at height `y` — i.e. how much of a row of
 * surface is ever on screen at once.
 *
 * This is the correction that makes the poles look worked over. The rock is
 * round, so a row at y=19 shows only 28.4 units of its width against 42 at the
 * equator. Laying every row out with the same number of columns puts barely
 * two thirds of the density on screen near the poles — a gap the eye reads as
 * missing craters, no matter that they're there in the band.
 */
function halfWidthAt(y: number): number {
  const d = Math.abs(y - ROCK_CY)
  return d >= ROCK_R ? 0 : Math.sqrt(ROCK_R * ROCK_R - d * d)
}

/**
 * Size classes, coarse to fine, each on its own jittered grid.
 *
 * One random pass over a single size range doesn't work: it decides how many
 * big craters there are by luck and drops them wherever they fall, so two of
 * the largest can land side by side while a quarter of the band holds nothing
 * but specks. A real surface reads as a hierarchy — a few basins you notice
 * first, a middle rank between them, fine pitting over everything — and that
 * has to be built, not sampled.
 *
 * `perRow` is what each row should show AT ONCE, not how many it holds. The
 * column count is derived from it per row, so a narrow row near a pole gets
 * more of them and every latitude ends up equally worked over.
 */
const CRATER_CLASSES = [
  // The big ones stop at 1.3 for a measured reason: at 1.5 the closest pair
  // comes within 9 units edge to edge, and big craters crowding each other is
  // the thing that reads as a mistake. 1.3 leaves 14, and it has to cover the
  // elongation too now — a squashed crater reaches maxR * maxSquash along its
  // long axis, not maxR.
  { rows: 2, perRow: 1.3, minR: 6.2, maxR: 9.4, seed: 1.7, tiny: false },
  { rows: 3, perRow: 1.6, minR: 3.2, maxR: 5.8, seed: 3.9, tiny: false },
  // Fine pitting is texture, and past a point more of it stops adding detail
  // and starts averaging into a grey fizz that flattens everything above it.
  // Kept dense: thinning this out to let the big craters read individually
  // just left bare ground between them, and a worked-over surface is most of
  // what makes the rock look old.
  { rows: 5, perRow: 1.8, minR: 1.4, maxR: 2.8, seed: 6.1, tiny: true },
]

/** How far a crater can be stretched along its long axis. Capped at 1.3
 *  because past that they stop reading as craters and start reading as
 *  scratches. */
const CRATER_MAX_SQUASH = 1.3

/** Keeps the outermost rows inside the part of the rock wide enough to hold a
 *  crater — right at the silhouette's edge they'd only ever be slivers. */
const ROW_SPAN = ROCK_R * 1.84

function buildCraterField(densityScale: number): Crater[] {
  const field: Crater[] = []
  CRATER_CLASSES.forEach((cls, classIndex) => {
    for (let row = 0; row < cls.rows; row++) {
      const y = ROCK_CY - ROW_SPAN / 2 + ((row + 0.5) / cls.rows) * ROW_SPAN
      // cols · (visible fraction of the band) = perRow.
      const cols = Math.max(1, Math.round((cls.perRow * densityScale * SURFACE_BAND) / (2 * halfWidthAt(y))))
      for (let col = 0; col < cols; col++) {
        const seed = classIndex * 1000 + row * 100 + col
        // Jittered grid, not free scatter: one per cell keeps coverage even,
        // and the offset inside the cell keeps it from reading as a lattice.
        // The jitter is wider than it was (nearly the whole cell across, and
        // most of a row's height vertically) so neighbouring rows interleave
        // instead of banding — with round craters the grid was doing enough
        // work unaided, but a field of varied blobs needs looser placement to
        // match, or the regular spacing is the only thing left to notice.
        const cx = ((col + 0.06 + hash01(seed * cls.seed + 0.3) * 0.88) / cols) * SURFACE_BAND
        const cy = y + (hash01(seed * 3.1 + 1.9) - 0.5) * (ROW_SPAN / cls.rows) * 0.95
        const r = cls.minR + hash01(seed * 5.3 + 4.1) * (cls.maxR - cls.minR)
        const squash = 1 + hash01(seed * 7.9 + 2.7) * (CRATER_MAX_SQUASH - 1)
        const rot = hash01(seed * 9.7 + 5.5) * Math.PI
        field.push({
          d: buildCraterPath(cx, cy, r, seed * 11.3, squash, rot),
          // The rim reuses the bowl's own seed, squash and angle, so it's a
          // band that follows the crater's shape rather than a circle sitting
          // around an oval.
          lip: cls.tiny ? null : buildCraterPath(cx, cy, r * 1.16, seed * 11.3, squash, rot),
        })
      }
    }
  })
  // Class order is also paint order, and that's the right way round: small
  // craters sit *on top of* big ones because they arrived later. Reversing it
  // would have young basins erasing old pitting, which never happens.
  return field
}

/** Fine surface grain, keeping the fill from looking swept clean between the
 *  craters. */
function buildSpeckleField(count: number): Speckle[] {
  return Array.from({ length: count }, (_, i) => ({
    cx: ((i + 0.14 + hash01(i * 2.3 + 7.7) * 0.72) / count) * SURFACE_BAND,
    cy: 10 + hash01(i * 4.7 + 2.2) * 80,
    // Left as circles on purpose. These are grain, under a unit and a half
    // across; a wobbled outline on something that small is invisible and the
    // path costs twenty times the markup of a <circle>.
    r: 0.7 + hash01(i * 6.1 + 9.4) * 0.8,
  }))
}

const FIELD_FULL = { craters: buildCraterField(1), speckles: buildSpeckleField(44) }
// Half the density and no scrolling copy. At 34px a crater is a third of a
// pixel across, so the full field would be several hundred shapes resolving
// into flat noise — the detail budget has to follow the size on screen.
const FIELD_COMPACT = { craters: buildCraterField(0.55), speckles: buildSpeckleField(22) }

export interface AsteroidColors {
  light: string
  fill: string
  dark: string
  speckleColor?: string
}

/**
 * Memoized, and not as a precaution.
 *
 * Home renders this from SpaceObject, which takes `pct` — the prestige
 * progress — because that drives the glow behind the rock. `pct` moves on
 * every tick, so SpaceObject legitimately re-renders about ten times a
 * second. The rock itself depends on none of that, and it is ~290 SVG nodes:
 * without memo React was rebuilding and re-diffing all of them at that rate,
 * forever, to arrive at exactly the same markup.
 *
 * The comparison holds because every prop is either a primitive or a stable
 * module-level object — Home and the Trayectoria list both pass an entry of
 * MATERIAL_TIER_COLORS, Battle a module constant, and Meteor one held in
 * state. Nothing here is built inline at the call site.
 */
export const Asteroid = memo(function Asteroid({
  idPrefix,
  size,
  colors,
  className,
  detail = 'full',
  spin = true,
  paused = false,
}: {
  idPrefix: string
  size: number
  colors: AsteroidColors
  className?: string
  /** 'compact' halves the crater density and skips the second surface copy.
   *  For anything small or short-lived on screen. */
  detail?: 'full' | 'compact'
  /** Surface rotation. Off for a rock that's already moving across the screen
   *  under its own steam, where a second motion just muddies it. */
  spin?: boolean
  /** Freezes the surface without unmounting it. For a rock that's still in the
   *  tree but covered — an opaque modal over Home leaves its asteroid turning
   *  behind it, which is a few hundred shapes being stepped every frame for
   *  something nobody can see. Cheaper than `spin={false}`, which would tear
   *  down the second band copy and rebuild it on close. */
  paused?: boolean
}) {
  const bodyId = `${idPrefix}RockBody`
  const limbId = `${idPrefix}RockLimb`
  const shadowId = `${idPrefix}RockShadow`
  const rimId = `${idPrefix}RockRim`
  const craterId = `${idPrefix}CraterBowl`
  const clipId = `${idPrefix}RockSilhouette`

  const field = detail === 'full' ? FIELD_FULL : FIELD_COMPACT
  const speckleColor = colors.speckleColor ?? 'rgba(0,0,0,0.22)'
  // A still rock needs only the copy that's on screen; a turning one needs the
  // second so the loop can close on itself.
  const copies = spin ? [0, SURFACE_BAND] : [0]

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
      <defs>
        {/* Body shading — brightest toward the upper-left "sun", falling off
            to a near-black shadow at the far rim. Same key light (33% / 28%)
            as the astronaut's helmet and the gunner's hull, so everything in
            the game reads as lit by one sun. */}
        <radialGradient id={bodyId} cx="33%" cy="28%" r="78%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="42%" stopColor={colors.fill} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
        {/* Limb darkening, and the single strongest sphere cue here.
            Transparent through the middle, ramping hard to dark in the last
            fifth — ALL the way round, not just on the shadow side. A real
            sphere's edge is surface curving away from you, so it dims
            everywhere; without this the rock reads as a lit disc stuck flat to
            the page no matter how good the body shading is. It's also what
            sells the craters: as one scrolls toward the edge it fades exactly
            the way a feature rotating out of view would, which is
            foreshortening for free. */}
        <radialGradient id={limbId} cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="86%" stopColor="#000000" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
        </radialGradient>
        {/* Terminator — the shadow core on the side facing away from the sun.
            Offset from centre, unlike the limb, because this one is about
            where the light isn't rather than about curvature. */}
        <radialGradient id={shadowId} cx="74%" cy="78%" r="66%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* Rim light on the sunlit limb only. A stroke painted with a gradient
            that fades out before it reaches the shadow side — lighting both
            edges would cancel the light source out. */}
        <linearGradient id={rimId} x1="12%" y1="2%" x2="72%" y2="88%">
          <stop offset="0%" stopColor={colors.light} stopOpacity="0.85" />
          <stop offset="48%" stopColor={colors.light} stopOpacity="0" />
        </linearGradient>
        {/* Crater bowl, and the lighting is deliberately the INVERSE of every
            other rounded thing in this app. A dome lit from the upper left is
            bright at the upper left. A crater is a hole, so the wall nearest
            the sun is the one turned away from it: the near rim shades the
            upper-left interior, and the light lands on the far wall at the
            lower right. One offset gradient does both. */}
        <radialGradient id={craterId} cx="30%" cy="26%" r="88%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.66)" />
          <stop offset="52%" stopColor="rgba(0,0,0,0.40)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.13)" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={ASTEROID_PATH} />
        </clipPath>
      </defs>

      <path d={ASTEROID_PATH} fill={`url(#${bodyId})`} />

      {/* Everything below is clipped to the rock's own silhouette so none of
          it ever pokes past the outline. */}
      <g clipPath={`url(#${clipId})`}>
        {/* The surface, drawn twice a band apart and slid one full width per
            cycle. When copy A reaches -SURFACE_BAND copy B is exactly where A
            started, so the loop is seamless and needs no fade. This is what
            replaced spinning the whole rock: features crossing a still outline
            is what rotation looks like on a sphere, where a turning silhouette
            is what it looks like on a disc. Anything entering or leaving does
            so under the darkest part of the limb gradient, so nothing pops. */}
        <g className={spin ? `rock-surface${paused ? ' rock-surface-paused' : ''}` : undefined}>
          {copies.map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              {field.craters.map((c, i) => (
                <g key={i}>
                  {/* Raised rim, drawn first and slightly wider than the bowl,
                      so all that survives is a thin lip around it. An impact
                      throws material outward and it piles up at the edge —
                      without the lip a crater is a stain, with it it's a hole
                      in something.
                      Only on the two coarse classes. On the fine ones the lip
                      works out between 0.09 and 0.18 device pixels wide at
                      every size this renders at, so it was 41 shapes per copy
                      buying something literally too small to see. */}
                  {c.lip && <path d={c.lip} fill="rgba(255,255,255,0.085)" />}
                  <path d={c.d} fill={`url(#${craterId})`} />
                </g>
              ))}
              {field.speckles.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={speckleColor} />
              ))}
            </g>
          ))}
        </g>

        {/* Sunlit patch — a soft highlight blob, same corner as the body
            gradient's own bright spot. Fixed, not scrolling: the sun doesn't
            travel with the surface. */}
        <ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />

        {/* Order matters from here down. Shadow and limb go OVER the surface so
            craters darken as they rotate away, which is the whole illusion;
            underneath, every feature would stay equally bright to the edge. */}
        <rect x="0" y="0" width="100" height="100" fill={`url(#${shadowId})`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${limbId})`} />
        {/* Rim light last, so nothing dims it. Stroked inside the clip, so only
            its inner half shows and it hugs the edge. */}
        <path d={ASTEROID_PATH} fill="none" stroke={`url(#${rimId})`} strokeWidth={3} />
      </g>
    </svg>
  )
})
