// The diary's drawings: pencil sketches, the way a commander would draw a
// thing in a notebook — one line, a little shaky, hatching for shade, a
// stray construction line left in. Each is a still SVG in graphite on the
// page's paper; the shake comes from one displacement filter shared by
// all of them, so the hand is the same across the book.

import { useId } from 'react'

const INK = '#3d3830'
const FAINT = '#8a8070'
const PAPER = '#efe6d2'
const ROCK = 'M18 12 l16 -4 l14 8 l4 16 l-8 14 l-16 4 l-14 -8 l-4 -14 z'

/** The hand: a fine noise nudging every line a pixel or two either way. */
export function PencilFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* the same hand, lighter: a slower noise that bends a line without
            doubling it or leaving flecks — for the small, tight drawings */}
        <filter id="pencil-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

const line = { fill: 'none', stroke: INK, strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ghost = { fill: 'none', stroke: INK, strokeOpacity: 0.28, strokeWidth: 1, strokeLinecap: 'round' } as const
const hatch = { stroke: INK, strokeOpacity: 0.35, strokeWidth: 0.8, strokeLinecap: 'round' } as const

/** Hatching: short parallel strokes across a box, for shade — clipped to
 *  the box, so the pencil doesn't run off what it is shading. */
function Hatch({
  x,
  y,
  w,
  h,
  gap = 4,
  angle = -45,
  rx = 0,
}: {
  x: number
  y: number
  w: number
  h: number
  gap?: number
  angle?: number
  /** Rounded corners on the box, for hatching right up to a rounded outline. */
  rx?: number
}) {
  const id = useId()
  const n = Math.ceil((w + h) / gap) + 2
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} rx={rx} />
      </clipPath>
      {/* the clip on its own group: a clip set on the rotated group would
          turn with it, and the strokes would spill out of the box as a
          tilted square */}
      <g clipPath={`url(#${id})`}>
        <g transform={`rotate(${angle} ${x + w / 2} ${y + h / 2})`}>
          {Array.from({ length: n }, (_, i) => {
            const yy = y - h / 2 + i * gap
            return <line key={i} x1={x - w} y1={yy} x2={x + w * 2} y2={yy} {...hatch} />
          })}
        </g>
      </g>
    </g>
  )
}

/**
 * The Refinería, from outside: the glass sphere of ore on the left, the
 * pipe into the hull, the plant on top with its reactor orb and chimney,
 * the truss and the solar arrays off the right. One outline, a couple of
 * ghost lines where the pencil went twice, hatching under the block.
 */
export function RefinerySketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 150" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      {/* the sphere and its caps */}
      <circle cx="42" cy="88" r="26" {...line} />
      <circle cx="42" cy="88" r="27" {...ghost} />
      <path d="M32 63 h20 M32 113 h20" {...line} />
      <path d="M38 55 h8 v6 M46 58 h6" {...line} />
      {/* the ore inside: a few rocks */}
      <path
        d="M30 92 l6 -8 l8 2 l3 8 l-9 4 z M46 82 l7 -3 l5 6 l-6 5 z M34 78 l5 -4 l5 3 l-4 5 z"
        {...ghost}
        strokeOpacity={0.5}
      />
      {/* the pipe into the hull, with two clamps */}
      <path d="M66 84 h56 M66 96 h56" {...line} />
      <path d="M78 80 v20 M108 80 v20" {...line} />
      {/* the hull */}
      <rect x="122" y="70" width="110" height="40" rx="4" {...line} />
      <path d="M122 76 h110" {...ghost} />
      {[136, 150, 164, 178, 192, 206].map((x) => (
        <rect key={x} x={x} y="84" width="6" height="8" {...line} strokeWidth={1} />
      ))}
      {/* the block on top, the orb, the chimney */}
      <path d="M150 70 v-38 a5 5 0 0 1 5 -5 h48 a5 5 0 0 1 5 5 v38" {...line} />
      <circle cx="176" cy="48" r="11" {...line} />
      <circle cx="176" cy="48" r="4" {...ghost} />
      <path d="M198 27 v-18 h9 v18" {...line} />
      <path d="M200 6 q3 -5 6 0 M201 2 q3 -4 6 0" {...ghost} />
      <Hatch x={152} y={54} w={54} h={14} gap={4} />
      {/* the truss and the arrays */}
      <path d="M232 86 h50 M232 94 h50" {...line} />
      {[240, 252, 264, 274].map((x) => (
        <path key={x} d={`M${x} 86 l8 8 M${x + 8} 86 l-8 8`} {...line} strokeWidth={0.9} />
      ))}
      <rect x="284" y="66" width="12" height="20" {...line} />
      <rect x="284" y="94" width="12" height="20" {...line} />
      <path d="M287 70 v12 M293 70 v12 M287 98 v12 M293 98 v12" {...ghost} />
    </svg>
  )
}

/**
 * The reactor: the sphere in its housing, eight sockets round it on
 * conduits, the ones that are whole filled in.
 */
export function ReactorSketch({ whole, className }: { whole: boolean[]; className?: string }) {
  const cx = 110
  const cy = 90
  return (
    <svg viewBox="0 0 220 180" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      <circle cx={cx} cy={cy} r="24" {...line} />
      <circle cx={cx} cy={cy} r="18" {...ghost} />
      <circle cx={cx} cy={cy} r="7" {...line} strokeWidth={1} />
      <Hatch x={cx - 10} y={cy - 10} w={20} h={20} gap={3} />
      {whole.map((on, i) => {
        const a = (i / whole.length) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * 66
        const y = cy + Math.sin(a) * 66
        return (
          <g key={i}>
            <path
              d={`M${cx + Math.cos(a) * 26} ${cy + Math.sin(a) * 26} L${x - Math.cos(a) * 14} ${y - Math.sin(a) * 14}`}
              {...line}
              strokeWidth={1}
            />
            <circle cx={x} cy={y} r="13" {...line} />
            {on ? (
              <Hatch x={x - 9} y={y - 9} w={18} h={18} gap={3} angle={45} />
            ) : (
              <path d={`M${x - 3} ${y} h6 M${x} ${y - 3} v6`} {...ghost} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** A little box drawn by hand: a rounded rect whose corners each land a
 *  hair off, differently per box — the wobble is in the geometry, so it
 *  needs no filter (a displacement on lines this small and close can
 *  double them or leave flecks). */
function handBox(x: number, y: number, w: number, h: number, r: number, seed: number) {
  // each corner lands a hair off, from a tiny fixed sequence
  const j = (k: number) => ((Math.abs(Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1) - 0.5) * 0.8
  const c = (cx: number, cy: number, k: number) => [cx + j(k), cy + j(k + 1)] as const
  const [tlx, tly] = c(x, y, 0)
  const [trx, try_] = c(x + w, y, 2)
  const [brx, bry] = c(x + w, y + h, 4)
  const [blx, bly] = c(x, y + h, 6)
  return [
    `M${tlx + r} ${tly}`,
    `L${trx - r} ${try_} Q${trx} ${try_} ${trx} ${try_ + r}`,
    `L${brx} ${bry - r} Q${brx} ${bry} ${brx - r} ${bry}`,
    `L${blx + r} ${bly} Q${blx} ${bly} ${blx} ${bly - r}`,
    `L${tlx} ${tly + r} Q${tlx} ${tly} ${tlx + r} ${tly}`,
    'Z',
  ].join(' ')
}

/** A capsule row: ten little cells, the loaded ones scribbled in. */
export function CapsulesSketch({ loaded, total, className }: { loaded: number; total: number; className?: string }) {
  return (
    <svg viewBox="0 0 240 30" className={className} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <g key={i}>
          {i < loaded && <Hatch x={4 + i * 23.5} y={5} w={18} h={20} rx={3} gap={3} />}
          <path d={handBox(4 + i * 23.5, 5, 18, 20, 3, i + 1)} {...line} />
        </g>
      ))}
    </svg>
  )
}

/** The ship, small, in the corner of a page. */
export function ShipSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      <ShipGlyph />
    </svg>
  )
}

/** The ship, as a glyph inside another drawing: the same lines as the
 *  corner sketch, on a 80×120 box, for a <g> to place and scale. */
function ShipGlyph() {
  return (
    <>
      <path d="M40 6 q-18 20 -18 60 v30 h36 v-30 q0 -40 -18 -60 z" {...line} />
      <path d="M22 70 l-12 26 v10 l12 -6 M58 70 l12 26 v10 l-12 -6" {...line} />
      <circle cx="40" cy="58" r="8" {...line} />
      <path d="M30 40 h20 M26 84 h28" {...ghost} />
      <path d="M32 100 v10 M40 100 v12 M48 100 v10" {...ghost} />
      <Hatch x={24} y={72} w={10} h={24} gap={3} />
    </>
  )
}

/** C0-PI, the ship's robot, as the commander draws it: the round head
 *  with its visor and the two lit eyes, the ear discs, the little bucket
 *  of a body floating over its own shadow, two stubby arms. */
export function RobotSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ filter: 'url(#pencil-soft)' }}>
      {/* the head */}
      <path d="M20 40 q0 -26 30 -26 q30 0 30 26 v4 q0 8 -8 8 h-44 q-8 0 -8 -8 z" {...line} />
      <path d="M26 22 q10 -6 24 -6" {...ghost} />
      {/* the ear discs */}
      <rect x="11" y="32" width="9" height="14" rx="4" {...line} strokeWidth={1.1} />
      <rect x="80" y="32" width="9" height="14" rx="4" {...line} strokeWidth={1.1} />
      {/* the visor, shaded, with the eyes left clear */}
      <rect x="28" y="29" width="44" height="15" rx="6" {...line} />
      <Hatch x={28} y={29} w={44} h={15} rx={6} gap={2.5} />
      <rect x="37" y="32" width="4" height="9" rx="2" fill={PAPER} stroke={INK} strokeWidth={1} />
      <rect x="59" y="32" width="4" height="9" rx="2" fill={PAPER} stroke={INK} strokeWidth={1} />
      {/* the body: a bucket, open at the top */}
      <ellipse cx="50" cy="60" rx="14" ry="3.5" {...line} />
      <path d="M36 60 q-3 24 14 24 q17 0 14 -24" {...line} />
      <Hatch x={55} y={63} w={8} h={18} gap={3} />
      {/* the arms */}
      <path d="M29 63 q-5 9 -1 18" {...line} />
      <path d="M72 55 q7 4 4 13" {...line} />
      {/* the shadow it floats over */}
      <ellipse cx="50" cy="92" rx="12" ry="2" {...ghost} />
    </svg>
  )
}

/** A rock: an asteroid outline with a few craters — the compendium's entry. */
export function RockSketch({ known, color, className }: { known: boolean; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      <RockGlyph known={known} color={color} />
    </svg>
  )
}

/** The rock's lines on a 60×60 box, for a <g> to place. */
function RockGlyph({ known, color }: { known: boolean; color?: string }) {
  return (
    <>
      {/* the paper under the rock, so a route line stops at its edge */}
      <path d={ROCK} fill={PAPER} stroke="none" />
      {known ? (
        <>
          {/* coloured in, badly: a few fat strokes of the mineral, crayon
              over the lines and short of them in places */}
          {color && (
            <g stroke={color} strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round">
              <path d="M22 16 L46 40" />
              <path d="M17 24 L42 47" />
              <path d="M28 12 L50 33" />
              <path d="M16 33 L32 48" />
            </g>
          )}
          <path d={ROCK} {...line} />
          <ellipse cx="26" cy="26" rx="5" ry="3.5" {...ghost} strokeOpacity={0.6} />
          <ellipse cx="38" cy="38" rx="4" ry="3" {...ghost} strokeOpacity={0.6} />
          <ellipse cx="22" cy="40" rx="3" ry="2" {...ghost} strokeOpacity={0.6} />
          <Hatch x={36} y={14} w={12} h={22} gap={3} />
        </>
      ) : (
        <>
          <path d={ROCK} {...ghost} strokeDasharray="3 3" />
          <text x="30" y="36" textAnchor="middle" fontSize="16" fill={FAINT} fontFamily="inherit">
            ?
          </text>
        </>
      )}
    </>
  )
}

/**
 * The route: the eight rocks scattered down the page in the order we
 * visit them, a dashed line from one to the next the way a course gets
 * plotted on a chart, and the ship, small, beside the rock we are at.
 * The rocks we have reached are coloured in; the rest are dotted
 * outlines with their names.
 */
// Each stop: where the rock is, and where the ship goes when we are at
// it — picked by hand so the ship never sits on the course or a name.
const ROUTE: ReadonlyArray<{ x: number; y: number; ship: readonly [number, number] }> = [
  { x: 48, y: 40, ship: [30, -38] },
  { x: 150, y: 66, ship: [28, -5] },
  { x: 248, y: 38, ship: [26, -18] },
  { x: 230, y: 146, ship: [26, -2] },
  { x: 122, y: 160, ship: [-52, -30] },
  { x: 50, y: 250, ship: [-12, -64] },
  { x: 160, y: 284, ship: [-12, -66] },
  { x: 246, y: 316, ship: [26, -40] },
]
const ROUTE_ROCK = 50

export function RouteSketch({
  names,
  colors,
  reached,
  className,
}: {
  names: readonly string[]
  colors: readonly (string | undefined)[]
  reached: number
  className?: string
}) {
  const at = (i: number) => ROUTE[Math.min(i, ROUTE.length - 1)]
  // The course: a gentle curve between each pair, bowing to the side the
  // hand would swing towards.
  const course = ROUTE.slice(1)
    .map(({ x, y }, i) => {
      const { x: px, y: py } = ROUTE[i]
      const mx = (px + x) / 2
      const my = (py + y) / 2
      const nx = -(y - py)
      const ny = x - px
      const len = Math.hypot(nx, ny) || 1
      const bow = (i % 2 ? -1 : 1) * 14
      return `Q${mx + (nx / len) * bow} ${my + (ny / len) * bow} ${x} ${y}`
    })
    .join(' ')
  const here = at(reached)
  return (
    <svg viewBox="0 0 300 364" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      <path d={`M${ROUTE[0].x} ${ROUTE[0].y} ${course}`} {...ghost} strokeOpacity={0.5} strokeDasharray="4 4" />
      {names.map((name, i) => {
        const { x, y } = at(i)
        const known = i <= reached
        const s = ROUTE_ROCK / 60
        return (
          <g key={name}>
            <g transform={`translate(${x - ROUTE_ROCK / 2} ${y - ROUTE_ROCK / 2}) scale(${s})`}>
              <RockGlyph known={known} color={colors[i]} />
            </g>
            <text
              x={x}
              y={y + ROUTE_ROCK / 2 + 13}
              textAnchor="middle"
              fontSize="15"
              fill={known ? INK : FAINT}
              fontFamily="inherit"
              stroke={PAPER}
              strokeWidth={5}
              paintOrder="stroke"
            >
              {name}
            </text>
          </g>
        )
      })}
      <g transform={`translate(${here.x + here.ship[0]} ${here.y + here.ship[1]}) scale(0.3)`}>
        <ShipGlyph />
      </g>
    </svg>
  )
}
