import { useId, type CSSProperties } from 'react'

// The gem and the mineral, modelled instead of drawn as line glyphs — same
// construction as VaultChest: a key light in the upper left, volume from
// value separation rather than from outlines.
//
// --- Everything is currentColor -----------------------------------------
// Both of these replace Lucide icons that inherited their colour from the
// text around them, and the mineral in particular MUST keep doing that: it
// is whatever material you are currently mining, and that colour changes
// every prestige. So the base of every face is `currentColor` and the whole
// value ramp is made by laying white or black over it at fixed opacities.
// One input colour, eight distinguishable planes, and a drop-in replacement
// that needs no props at all.
//
// --- Why faces, not gradients -------------------------------------------
// VaultChest builds its volume from smooth radial ramps because it is a
// machined object with curved surfaces. These two are faceted solids: what
// makes a faceted thing read as three-dimensional is that every plane holds
// ONE flat value and the steps between them are hard. A soft gradient across
// a facet is exactly what makes low-poly art look like a sticker.

type Props = {
  size?: number
  className?: string
  /** For callers that tint with a hex rather than a class — a prize's
   *  rarity colour, or the prestige tier's. Both models paint in
   *  currentColor, so setting `color` here is all it takes. */
  style?: CSSProperties
}

// The diamantón: wide, with a big table you can see well into, a deep crown
// and a short pavilion. Eight sides rather than six, because that much width
// needs more facets to carry it.
//
// Square on to the camera and symmetric left to right — it is not turned.
// What makes it read as a solid is that the camera sits slightly ABOVE it,
// which turns the table from an edge into a face. From dead level a brilliant
// is a rhombus with lines on it; from a little above it is an object with a
// top. That lift is one number here, RY_TABLE and RY_GIRDLE, and it is the
// only thing separating this from a flat gem glyph.
//
// The seams are LIGHT, unlike the mineral's. On an opaque solid a dark seam
// reads as a crease between planes; on something transparent the cut edges
// are exactly where light piles up, so a bright seam is what makes it read as
// stone you can see into rather than as painted rock.

const SIDES = 8
const YC_TABLE = 27
const YC_GIRDLE = 47
const RY_TABLE = 9
const RY_GIRDLE = 14
const CULET: Pt = [50, 84]

type Pt = [number, number]

const r1 = (v: number) => Math.round(v * 10) / 10

/** n points on an ellipse: index 0 at the left, running clockwise on screen
 *  through the back, the right and the front. */
const ring = (rx: number, ry: number, yc: number): Pt[] =>
  Array.from({ length: SIDES }, (_, i) => {
    const a = Math.PI - (i * 2 * Math.PI) / SIDES
    return [r1(50 + rx * Math.cos(a)), r1(yc - ry * Math.sin(a))] as Pt
  })

const T = ring(24, RY_TABLE, YC_TABLE)
const G = ring(40, RY_GIRDLE, YC_GIRDLE)

const path = (p: Pt[]) => `M${p.map(([x, y]) => `${x} ${y}`).join(' L')} Z`
/** Twice the signed area. Negative means the polygon winds clockwise on
 *  screen, which for a pavilion triangle means its face points at us. */
const area2 = (p: Pt[]) =>
  p.reduce((s, [x, y], i) => {
    const [nx, ny] = p[(i + 1) % p.length]
    return s + (x * ny - nx * y)
  }, 0)

// A facet's value comes from where it points — the direction from the stone's
// axis out to the middle of its girdle edge — so the whole ramp falls out of
// the geometry instead of being a table of opacities to keep in sync with it
// by hand. Light from the upper left, plus a lift because every crown facet
// also tilts up towards the camera.
const shade = (mid: Pt, k: number, lift: number): [string, number] => {
  const dx = mid[0] - 50
  const dy = YC_GIRDLE - mid[1]
  const len = Math.hypot(dx, dy) || 1
  const dot = (-0.707 * dx + 0.707 * dy) / len + lift
  return dot >= 0
    ? ['#ffffff', r1(Math.min(dot * k, 0.5) * 100) / 100]
    : ['#000000', r1(Math.min(-dot * k, 0.5) * 100) / 100]
}

const CROWN: { d: string; c: string; o: number }[] = []
const PAVILION: { d: string; c: string; o: number }[] = []
const CUT: string[] = []
for (let i = 0; i < SIDES; i++) {
  const j = (i + 1) % SIDES
  const mid: Pt = [(G[i][0] + G[j][0]) / 2, (G[i][1] + G[j][1]) / 2]
  const [cc, co] = shade(mid, 0.46, 0.18)
  CROWN.push({ d: path([T[i], T[j], G[j], G[i]]), c: cc, o: co })
  CUT.push(`M${T[i][0]} ${T[i][1]} L${G[i][0]} ${G[i][1]}`)
  const tri: Pt[] = [G[i], G[j], CULET]
  if (area2(tri) < 0) {
    const [pc, po] = shade(mid, 0.3, -0.34)
    PAVILION.push({ d: path(tri), c: pc, o: po })
    CUT.push(`M${G[i][0]} ${G[i][1]} L${CULET[0]} ${CULET[1]}`)
  }
}

// The silhouette is the convex hull of the table, the girdle and the culet.
// The table has to be in there: lifting the camera pushes its back edge above
// the girdle's, so a hull over the girdle alone leaves the top face outside
// the outline — with no base colour under it, painting as a dark hole.
const hull = (src: Pt[]) => {
  const pts = [...src].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const half = (list: Pt[]) => {
    const h: Pt[] = []
    for (const p of list) {
      while (
        h.length > 1 &&
        (h[h.length - 1][0] - h[h.length - 2][0]) * (p[1] - h[h.length - 2][1]) -
          (h[h.length - 1][1] - h[h.length - 2][1]) * (p[0] - h[h.length - 2][0]) <=
          0
      ) {
        h.pop()
      }
      h.push(p)
    }
    return h.slice(0, -1)
  }
  return [...half(pts), ...half([...pts].reverse())]
}
const OUTLINE = path(hull([...T, ...G, CULET]))

/** Diamante. */
export function GemIcon({ size = 40, className, style }: Props) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        {/* Light that has gone through the stone and come back out, pooled
            low in the pavilion where it actually lands. Not a sparkle on top
            of it — the difference is that this one is underneath the cut
            edges and moves with the body. */}
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-ao`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Contact occlusion rather than a flat ellipse: darkest right under the
          point and fading out, which is what says it is resting on something. */}
      <ellipse cx="50" cy="88" rx="24" ry="6" fill={`url(#${uid}-ao)`} />

      {/* Base colour once, then every facet is the same colour under a
          different amount of light. */}
      <path d={OUTLINE} fill="currentColor" />
      {CROWN.map((f, i) => (
        <path key={`c${i}`} d={f.d} fill={f.c} opacity={f.o} />
      ))}
      {PAVILION.map((f, i) => (
        <path key={`p${i}`} d={f.d} fill={f.c} opacity={f.o} />
      ))}
      <path d={path(T)} fill="#ffffff" opacity={0.34} />
      <ellipse cx="44.5" cy="60" rx="16" ry="14" fill={`url(#${uid}-core)`} />

      <g fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" opacity={0.45}>
        <path d={path(T)} />
        {CUT.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* One thin dark pass on the silhouette only. Without it the stone has
          no edge against a dark page; on every seam it would stop looking
          transparent. */}
      <path d={OUTLINE} fill="none" stroke="#000000" strokeWidth="1.4" strokeLinejoin="round" opacity={0.3} />
    </svg>
  )
}

/** The stone's faces as a plain group, centred on the origin, for drawing
 *  many small ones inside something else — a heap in a crate, say. Same
 *  geometry as the icon above, so a gem in the shop is literally the gem you
 *  are buying rather than a lookalike.
 *
 *  No gradients and no per-instance ids: at a few pixels across the caustic
 *  is invisible, and a <defs> block per stone in a pile of twenty is a real
 *  cost for nothing. Stroke widths are pre-multiplied because the whole group
 *  gets scaled down — a 1.4 stroke at scale 0.08 would vanish.
 */
export function GemFaces({
  x,
  y,
  scale,
  rot = 0,
}: {
  x: number
  y: number
  scale: number
  rot?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale}) translate(-50 -51)`}>
      <path d={OUTLINE} fill="currentColor" />
      {CROWN.map((f, i) => (
        <path key={`c${i}`} d={f.d} fill={f.c} opacity={f.o} />
      ))}
      {PAVILION.map((f, i) => (
        <path key={`p${i}`} d={f.d} fill={f.c} opacity={f.o} />
      ))}
      <path d={path(T)} fill="#ffffff" opacity={0.34} />
      <path d={path(T)} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round" opacity={0.4} />
      <path d={OUTLINE} fill="none" stroke="#0E0D2C" strokeWidth="3" strokeLinejoin="round" opacity={0.6} />
    </g>
  )
}

// Roca facetada. Seven planes that tile the silhouette exactly — every
// outline edge belongs to one face and every interior edge is shared by two,
// which is what stops the seams from showing as gaps when the whole thing is
// one flat colour underneath.
const ROCK_FACES: { d: string; c: string; o: number }[] = [
  // Top plateau, facing straight up.
  { d: 'M32 42 L52 32 L66 46 L54 60 L34 58 Z', c: '#ffffff', o: 0.34 },
  // Upper left, into the light.
  { d: 'M26 34 L48 20 L52 32 L32 42 Z', c: '#ffffff', o: 0.44 },
  // Upper right.
  { d: 'M48 20 L74 28 L66 46 L52 32 Z', c: '#ffffff', o: 0.12 },
  // Right.
  { d: 'M74 28 L84 52 L54 60 L66 46 Z', c: '#000000', o: 0.14 },
  // Lower right, the face turned furthest from the light.
  { d: 'M84 52 L74 78 L44 84 L54 60 Z', c: '#000000', o: 0.42 },
  // Bottom.
  { d: 'M44 84 L22 76 L34 58 L54 60 Z', c: '#000000', o: 0.3 },
  // Left, in shadow but picking up bounce off the ground.
  { d: 'M22 76 L18 60 L26 34 L32 42 L34 58 Z', c: '#000000', o: 0.06 },
]

const ROCK_OUTLINE = 'M18 60 L26 34 L48 20 L74 28 L84 52 L74 78 L44 84 L22 76 Z'

/** The rock's faces as a plain group, centred on the origin — the mineral's
 *  answer to GemFaces, and for the same reason: a heap of ore inside a crate
 *  has to be the ore you are buying, not a lookalike.
 *
 *  Same trims as GemFaces. No gradients and no per-instance ids, because at a
 *  few pixels across the grain is invisible and a <defs> block per rock in a
 *  heap of fifteen costs real work for nothing. Seam strokes are pre-multiplied
 *  since the whole group gets scaled down — a 1.1 stroke at scale 0.19 would
 *  disappear.
 *
 *  The outline is offset by (-52, -51) rather than (-50, -50): the silhouette
 *  is not centred in its own box, and pivoting on the box would make a heap of
 *  rotated rocks wobble off the pile.
 */
export function RockFaces({
  x,
  y,
  scale,
  rot = 0,
}: {
  x: number
  y: number
  scale: number
  rot?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale}) translate(-51 -52)`}>
      <path d={ROCK_OUTLINE} fill="currentColor" />
      {ROCK_FACES.map((f, i) => (
        <path key={i} d={f.d} fill={f.c} opacity={f.o} />
      ))}
      <g fill="none" stroke="#000000" strokeWidth="3.4" opacity={0.3} strokeLinejoin="round">
        <path d="M32 42 L52 32 L66 46 L54 60 L34 58 Z" />
        <path d="M54 60 L84 52" />
        <path d="M34 58 L22 76" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" opacity={0.45}>
        <path d="M26 34 L48 20" />
        <path d="M32 42 L52 32" />
      </g>
      <path d={ROCK_OUTLINE} fill="none" stroke="#000000" strokeWidth="3.4" strokeLinejoin="round" opacity={0.55} />
    </g>
  )
}

export function MineralIcon({ size = 40, className, style }: Props) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        {/* Contact occlusion: the ground is darkest right under the rock and
            fades out, which is the cue that it is resting on something rather
            than floating above it. */}
        <radialGradient id={`${uid}-ao`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="52" cy="86" rx="30" ry="7" fill={`url(#${uid}-ao)`} />

      <path d={ROCK_OUTLINE} fill="currentColor" />
      {ROCK_FACES.map((f, i) => (
        <path key={i} d={f.d} fill={f.c} opacity={f.o} />
      ))}

      {/* Seams dark, then the two ridges that face the light picked out
          bright. Without the bright pass the planes read as a flat map. */}
      <g fill="none" stroke="#000000" strokeWidth="1.1" opacity={0.32} strokeLinejoin="round">
        <path d="M32 42 L52 32 L66 46 L54 60 L34 58 Z" />
        <path d="M52 32 L48 20" />
        <path d="M66 46 L74 28" />
        <path d="M54 60 L84 52" />
        <path d="M54 60 L44 84" />
        <path d="M34 58 L22 76" />
        <path d="M32 42 L26 34" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}>
        <path d="M26 34 L48 20" />
        <path d="M32 42 L52 32" />
      </g>

      {/* Grain. Four specks on the lit faces only — scattered over the dark
          ones they read as dust on the screen rather than as mineral. */}
      <g fill="#ffffff" opacity={0.3}>
        <circle cx="40" cy="46" r="1.4" />
        <circle cx="47" cy="52" r="1" />
        <circle cx="36" cy="30" r="1.1" />
        <circle cx="58" cy="40" r="0.9" />
      </g>

      <path d={ROCK_OUTLINE} fill="none" stroke="#000000" strokeWidth="1.8" strokeLinejoin="round" opacity={0.5} />
    </svg>
  )
}
