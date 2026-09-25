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

const line = {
  fill: 'none',
  stroke: INK,
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const
const ghost = {
  fill: 'none',
  stroke: INK,
  strokeOpacity: 0.28,
  strokeWidth: 1,
  strokeLinecap: 'round',
} as const
const hatch = {
  stroke: INK,
  strokeWidth: 0.6,
  strokeLinecap: 'round',
} as const

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
  color,
}: {
  x: number
  y: number
  w: number
  h: number
  gap?: number
  angle?: number
  /** Rounded corners on the box, for hatching right up to a rounded outline. */
  rx?: number
  /** Strokes in a colour — crayon, a little bolder — instead of graphite. */
  color?: string
}) {
  const id = useId()
  // the strokes span the box's full turned extent, centred on it
  const span = w + h
  const n = Math.ceil(span / gap) + 1
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
            const yy = y + h / 2 - span / 2 + i * gap
            // graphite: light at the first stroke, pressing harder toward
            // the last — shade, not a grid; crayon is coloured in flat
            const t = n > 1 ? i / (n - 1) : 1
            return (
              <line
                key={i}
                x1={x - w}
                y1={yy}
                x2={x + w * 2}
                y2={yy}
                {...hatch}
                {...(color ? { stroke: color, strokeOpacity: 0.75, strokeWidth: 1.2 } : { strokeOpacity: 0.12 + 0.3 * t })}
              />
            )
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
 * conduits. A socket whose core is whole is hatched in, in that core's
 * mineral — the same thin strokes as before, coloured, and boxed a little
 * wider than the socket so they run over its line here and there, the
 * way the rocks on the route are coloured.
 */
export function ReactorSketch({
  whole,
  colors,
  className,
}: {
  whole: boolean[]
  colors: readonly (string | undefined)[]
  className?: string
}) {
  const cx = 110
  const cy = 90
  return (
    <svg viewBox="0 0 220 180" className={className} aria-hidden="true" style={{ filter: 'url(#pencil)' }}>
      <circle cx={cx} cy={cy} r="24" {...line} />
      <circle cx={cx} cy={cy} r="18" {...ghost} />
      <circle cx={cx} cy={cy} r="7" {...line} strokeWidth={1} />
      {whole.map((on, i) => {
        const a = (i / whole.length) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * 66
        const y = cy + Math.sin(a) * 66
        const x0 = cx + Math.cos(a) * 26
        const y0 = cy + Math.sin(a) * 26
        const x1 = x - Math.cos(a) * 14
        const y1 = y - Math.sin(a) * 14
        const color = on ? colors[i] : undefined
        return (
          <g key={i}>
            {color && <Hatch x={x - 11} y={y - 11} w={22} h={22} gap={3} angle={45} color={color} />}
            <path d={`M${x0} ${y0} L${x1} ${y1}`} {...line} strokeWidth={1} />
            <circle cx={x} cy={y} r="13" {...line} />
            {!on && <path d={`M${x - 3} ${y} h6 M${x} ${y - 3} v6`} {...ghost} />}
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
    <svg viewBox="-6 -6 92 132" className={className} aria-hidden="true" style={{ filter: 'url(#pencil-soft)' }}>
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
      <RockGlyph known={known} color={color} shade={false} />
    </svg>
  )
}

/** The rock's shade: pencil strokes that curve round the lit corner
 *  (upper left), spaced closer and pressed harder toward the far edge, and
 *  a few short cross-strokes right at the rim where it is darkest. Clipped
 *  to the rock, so the pencil stops at its outline. */
function RockShade() {
  const id = useId()
  const LX = 21
  const LY = 19
  const arc = (r: number, from: number, to: number) => {
    const a0 = (from * Math.PI) / 180
    const a1 = (to * Math.PI) / 180
    return `M${LX + r * Math.cos(a0)} ${LY + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${LX + r * Math.cos(a1)} ${LY + r * Math.sin(a1)}`
  }
  const rings = [15, 18, 20.5, 23, 25, 27, 28.8, 30.5, 32, 33.5, 35]
  return (
    <g>
      <clipPath id={id}>
        <path d={ROCK} />
      </clipPath>
      <g clipPath={`url(#${id})`} fill="none" stroke={INK} strokeLinecap="round" strokeWidth={0.6}>
        {rings.map((r, i) => {
          const t = i / (rings.length - 1)
          // the strokes reach further round the rock the deeper the shade
          return <path key={r} d={arc(r, -30 + 40 * (1 - t), 105 + 10 * t)} strokeOpacity={0.08 + 0.34 * t} />
        })}
        {/* the rim: short strokes across the rings, only at the very edge */}
        {[10, 25, 40, 55, 70, 85].map((deg) => {
          const a = (deg * Math.PI) / 180
          const r0 = 30
          const r1 = 37
          return (
            <path
              key={deg}
              d={`M${LX + r0 * Math.cos(a)} ${LY + r0 * Math.sin(a)} L${LX + r1 * Math.cos(a)} ${LY + r1 * Math.sin(a)}`}
              strokeOpacity={0.3}
            />
          )
        })}
      </g>
    </g>
  )
}

/** The rock's lines on a 60×60 box, for a <g> to place. Shaded by default;
 *  the big portrait goes without. */
function RockGlyph({ known, color, shade = true }: { known: boolean; color?: string; shade?: boolean }) {
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
          {shade && <RockShade />}
          <path d={ROCK} {...line} />
          <ellipse cx="26" cy="26" rx="5" ry="3.5" {...ghost} strokeOpacity={0.6} />
          <ellipse cx="38" cy="38" rx="4" ry="3" {...ghost} strokeOpacity={0.6} />
          <ellipse cx="22" cy="40" rx="3" ry="2" {...ghost} strokeOpacity={0.6} />
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
const ROUTE: ReadonlyArray<{
  x: number
  y: number
  ship: readonly [number, number]
}> = [
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

/**
 * The ledger of goals: one line per asteroid, the rock small at the left,
 * its name, a hand-ruled bar for how much of that rock's ore we have to
 * pull before the next one is worth flying to, and the figures at the
 * right in the margin's grey. The rocks behind us have their bars filled
 * in their own crayon; the one we are on has its bar part-coloured; the
 * ones ahead are dotted outlines with their figures still unknown.
 */
export function GoalsSketch({
  names,
  colors,
  reached,
  progress,
  labels,
  className,
}: {
  names: readonly string[]
  colors: readonly (string | undefined)[]
  reached: number
  /** 0..1 of the current rock's goal; only read for `reached`. */
  progress: number
  /** The figures beside each bar, already formatted. */
  labels: readonly string[]
  className?: string
}) {
  const ROW = 26
  const BAR_X = 108
  const BAR_W = 96
  const BAR_H = 11
  return (
    <svg viewBox={`0 0 296 ${names.length * ROW}`} className={className} aria-hidden="true">
      {names.map((name, i) => {
        const y = i * ROW
        const cy = y + ROW / 2
        const known = i <= reached
        const done = i < reached
        const here = i === reached
        const color = colors[i]
        const fill = done ? 1 : here ? Math.max(0, Math.min(1, progress)) : 0
        return (
          <g key={name}>
            <g transform={`translate(2 ${cy - 10}) scale(${20 / 60})`} style={{ filter: 'url(#pencil-soft)' }}>
              <RockGlyph known={known} color={color} />
            </g>
            <text x={30} y={cy + 5} fontSize="14" fill={known ? INK : FAINT} fontFamily="inherit">
              {name}
            </text>
            {/* the bar: ruled by hand, and coloured in as far as we are */}
            {known ? (
              <>
                {fill > 0 && color && (
                  <Hatch x={BAR_X + 1} y={cy - BAR_H / 2 + 1} w={Math.max(3, (BAR_W - 2) * fill)} h={BAR_H - 2} gap={3} color={color} />
                )}
                <path d={handBox(BAR_X, cy - BAR_H / 2, BAR_W, BAR_H, 2, i + 11)} {...line} strokeWidth={1.1} />
              </>
            ) : (
              <path d={handBox(BAR_X, cy - BAR_H / 2, BAR_W, BAR_H, 2, i + 11)} {...ghost} strokeDasharray="3 3" />
            )}
            <text x={294} y={cy + 4} textAnchor="end" fontSize="11" fill={FAINT} fontFamily="inherit">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The month, ruled off by hand: a seven-column grid drawn a little
 * crooked, the weekdays along the top, every day numbered. The days gone
 * by are crossed out in graphite, except the ones the commander went out
 * to mine, which get a tick in the mineral's crayon; today is ringed. Nothing to
 * touch; it's a page of the notebook.
 */
export function CalendarSketch({
  year,
  month,
  today,
  played,
  color,
  weekdays,
  className,
}: {
  year: number
  /** 0-based, like Date's. */
  month: number
  /** Day of the month, or null when the month shown isn't this one. */
  today: number | null
  played: ReadonlySet<number>
  color?: string
  weekdays: readonly string[]
  className?: string
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday first: Date's Sunday=0 becomes 6
  const firstCol = (new Date(year, month, 1).getDay() + 6) % 7
  const rows = Math.ceil((firstCol + daysInMonth) / 7)
  // Seven columns with a margin either side: at the full 296 the grid ran
  // flush to both edges of the text column, and on a phone the last one lost
  // its outer line to rounding.
  const COL = 39
  const ROW = 26
  const X0 = (296 - COL * 7) / 2
  // The page's rules fall 19px into every 26px block (see DiaryBook), and
  // this drawing starts on a block: the grid's lines land on the rules, so
  // the month is ruled straight onto the notebook's own lines.
  const Y0 = 19
  const W = COL * 7
  const H = ROW * rows
  // a hair of wobble on every line, fixed per line
  const j = (k: number) => ((Math.abs(Math.sin(k * 12.9898 + 4.1) * 43758.5453) % 1) - 0.5) * 1.6
  const cellAt = (day: number) => {
    const i = firstCol + day - 1
    return { cx: X0 + (i % 7) * COL + COL / 2, cy: Y0 + Math.floor(i / 7) * ROW + ROW / 2 }
  }
  return (
    <svg viewBox="0 0 296 208" className={className} aria-hidden="true" style={{ filter: 'url(#pencil-soft)' }}>
      {/* the weekdays */}
      {weekdays.map((w, i) => (
        <text
          key={i}
          x={X0 + i * COL + COL / 2}
          y={Y0 - 9}
          textAnchor="middle"
          fontSize="11"
          fill={FAINT}
          fontFamily="inherit"
        >
          {w}
        </text>
      ))}
      {/* the grid, ruled by hand */}
      <g {...line} strokeWidth={1}>
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={'v' + i}
            d={`M${X0 + i * COL + j(i)} ${Y0 + j(i + 20)} L${X0 + i * COL + j(i + 40)} ${Y0 + H + j(i + 60)}`}
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <path
            key={'h' + i}
            d={`M${X0 + j(i + 80)} ${Y0 + i * ROW + j(i + 100)} L${X0 + W + j(i + 120)} ${Y0 + i * ROW + j(i + 140)}`}
          />
        ))}
      </g>
      {/* the days */}
      {Array.from({ length: daysInMonth }, (_, k) => {
        const day = k + 1
        const { cx, cy } = cellAt(day)
        const past = today !== null && day < today
        const isToday = today !== null && day === today
        const out = played.has(day)
        const crayon = out && color
        return (
          <g key={day}>
            {past &&
              (crayon ? (
                <path
                  d={`M${cx - 10} ${cy + 1} L${cx - 3} ${cy + 8} L${cx + 11} ${cy - 8}`}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.65}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <g {...line} strokeWidth={1.1} strokeOpacity={0.7}>
                  <path d={`M${cx - 9} ${cy - 7} L${cx + 9} ${cy + 7}`} />
                  <path d={`M${cx + 8} ${cy - 8} L${cx - 8} ${cy + 8}`} />
                </g>
              ))}
            {isToday && (
              <ellipse
                cx={cx}
                cy={cy}
                rx={14}
                ry={10}
                fill="none"
                stroke={crayon ? color : INK}
                strokeOpacity={crayon ? 0.7 : 1}
                strokeWidth={crayon ? 3 : 1.4}
                strokeLinecap="round"
                strokeDasharray={crayon ? undefined : '60 4'}
              />
            )}
            <text
              x={cx}
              y={cy + 4.5}
              textAnchor="middle"
              fontSize="13"
              fill={today !== null && day > today ? FAINT : INK}
              fontFamily="inherit"
            >
              {day}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

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
