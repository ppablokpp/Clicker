import { useId } from 'react'
import { GemFaces, RockFaces } from './MaterialIcons'
import { VaultKey } from './VaultChest'

// The things a pack is sold in. The whole point is that they get physically
// bigger as the price goes up, because the size of the object is the price
// before you read any number. The old modals drew the same rectangle four
// times with a different figure typed inside, which asks the reader to do
// all the work.
//
// What is inside is the real icon in both cases — GemIcon's own geometry for
// stones, and VaultKey itself for keys. Not a lookalike drawn small: what
// you see in the container is literally what lands in your balance.
//
// The crate and the hopper are shared between the two shops on purpose. A
// trader does not buy different crates for different stock; what changes is
// what is in them. The small goods are the ones that have to differ, and
// they do — a vial and a pouch for stones, a ring and a bundle for keys.

type Kind = 'vial' | 'pouch' | 'crate' | 'hopper' | 'ring'
type Contents = 'gems' | 'keys' | 'mineral'

// Where each container's contact shadow sits in its own drawing. They were
// each drawn to their own eyeline, so lined up on a shelf every one of them
// stood at a different height above the plank — the crate four units clear of
// it, the ring six.
const GROUND_BY_KIND: Record<Kind, number> = { vial: 90, pouch: 88, crate: 86, hopper: 90, ring: 84 }

/** The one line they are all shifted onto, so a single shelf offset fits all. */
const GROUND = 90

/** The size the stalls draw their goods at. */
export const GOODS_SIZE = 104

/** How much of the drawing sits below that line, in px at GOODS_SIZE — what a
 *  shelf has to be pulled up by to meet the goods instead of floating under
 *  them. */
export const GOODS_SHELF_LIFT = (GOODS_SIZE * (100 - GROUND)) / 100

/** The gems' own colour, held here rather than inherited. The containers each
 *  have their own material, so `currentColor` is already spoken for by the
 *  glass, the canvas and the steel. */
const GEM_TINT = '#6E7EF0'

/** Fallback for a mineral container asked for without a tint — Amatista, the
 *  first asteroid, so a missing prop reads as a mistake rather than as black
 *  rocks in a crate. */
const MINERAL_FALLBACK_TINT = '#a78bfa'

// --- Scattering a heap ---------------------------------------------------
// Deterministic: a pile that reshuffled on every render would make the modal
// flicker every time React touched it.
//
// The two coordinates come from the R2 low-discrepancy sequence rather than
// from two multiplications of the index. The old pair stepped by -0.239 and
// +0.241 per piece — almost exactly the same step in opposite directions, so
// x and y were anti-correlated and every heap came out as one or two diagonal
// bands with the rest of the container empty. That is the whole reason a full
// crate read as a clump on one side. R2 exists to avoid precisely that, and
// for the six to ten pieces a container holds it covers the area far more
// evenly than random numbers would.
const R3_X = 0.8191725133961644
const R3_Y = 0.6710436067037893
const R3_A = 0.5497004779019702
const frac = (n: number) => n - Math.floor(n)

/** Independent of position, so size and angle stop tracking where a piece
 *  landed. They used to share the coordinates' own numbers, which is why the
 *  biggest stones were always on the same side of the heap. */
function jitter(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

interface Placed {
  x: number
  y: number
  /** 0 at the base of the heap, 1 at its peak — also how far back it sits. */
  v: number
  /** Spread 0..1 for the angle, on its own axis of the sequence. */
  a: number
  /** An independent 0..1 for size. */
  j: number
}

interface HeapOptions {
  /** How much the heap narrows towards the top: 0 is a slab, 1 a cone. */
  taper?: number
  /** A continuous course laid along the base before the mound goes on it.
   *
   *  A heap built only from the scatter leaves V-shaped notches between
   *  neighbours, and in a container those notches go all the way down to the
   *  rim: you see the background through the load. Real stock cannot do that,
   *  because the layer the mound is riding on is a full one. Evenly spaced
   *  rather than scattered, since the whole job of this row is to have no
   *  gaps in it — the wobble is only enough to stop it reading as a row. */
  base?: number
  /** Offset applied to the rightmost piece only. */
  nudge?: { dx: number; dy: number }
  /** Drops the leftmost piece. The pouch needs it: its neck is narrower than
   *  a crate's mouth, and the outermost piece on that side lands past the
   *  cloth and reads as sitting beside the bag. */
  dropLeftmost?: boolean
  /** Drops the topmost piece. A heap's peak is the one place a piece can end
   *  up with nothing under it, and over the hopper's sloped mouth there is no
   *  rim to catch it — it reads as floating above the load. */
  dropHighest?: boolean
  /** Moves the topmost pieces — one entry per piece, counting down from the
   *  peak. The rock draws a narrower silhouette than the gem at the same
   *  nominal size, so where a gem heap closes over itself a rock heap can
   *  leave a piece or two perched on the skyline instead of filling it.
   *
   *  Ranked on the heights the pieces landed at, before any of them moves, so
   *  the second entry always means the same piece however far the first one
   *  travels. Applied after any drop, so rank one is whatever is really at the
   *  peak of the heap that ships. */
  nudgeHighest?: { dx: number; dy: number }[]
}

/** Where each piece of a heap sits. `w` is the width at the base, `h` how high
 *  it stacks above it. */
function heap(
  count: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  taper: number,
  base = 0,
): Placed[] {
  const placed: Placed[] = []
  for (let i = 0; i < base; i++) {
    placed.push({
      x: cx + ((i + 0.5) / base - 0.5) * w,
      y: cy + (jitter(i + 4001) - 0.5) * 3,
      v: 0,
      a: frac(0.5 + R3_A * (i + 1)),
      j: jitter(i + 8009),
    })
  }
  for (let i = 1; i <= count; i++) {
    // Biased towards the base: a mound has more pieces holding it up than
    // riding on top of it. Uniform height put as many at the peak as at the
    // bottom, which is a wall, not a heap.
    const v = Math.pow(frac(0.5 + R3_Y * i), 1.35)
    // Then a little wobble off the sequence. R3 is beautifully even, which is
    // exactly what it is for and exactly what a heap is not: dead-even spacing
    // reads as a row of goods laid out by hand. The independent hash breaks
    // the lattice without bringing the clumping back.
    const wobble = jitter(i)
    placed.push({
      x: cx + (frac(0.5 + R3_X * i) - 0.5 + (wobble - 0.5) * 0.24) * w * (1 - taper * v),
      y: cy - v * h + (jitter(i + 977) - 0.5) * h * 0.26,
      v,
      a: frac(0.5 + R3_A * i),
      j: wobble,
    })
  }
  // Painter's order: the pieces at the back of the heap are laid down first so
  // the front row overlaps them instead of being cut by them. Drawing in index
  // order let a piece behind cover one in front, which is most of the reason a
  // full container read as a tangle rather than as stock.
  placed.sort((a, b) => a.y - b.y)
  return placed
}

/** Removes the leftmost piece / nudges the rightmost, after placement. */
function trim(placed: Placed[], { nudge, dropLeftmost, dropHighest, nudgeHighest }: HeapOptions): Placed[] {
  const out = placed.slice()
  if (dropLeftmost && out.length > 1) {
    let k = 0
    for (let i = 1; i < out.length; i++) if (out[i].x < out[k].x) k = i
    out.splice(k, 1)
  }
  if (dropHighest && out.length > 1) {
    let k = 0
    for (let i = 1; i < out.length; i++) if (out[i].y < out[k].y) k = i
    out.splice(k, 1)
  }
  if (nudgeHighest?.length) {
    const byHeight = out.map((_, i) => i).sort((a, b) => out[a].y - out[b].y)
    nudgeHighest.forEach((move, rank) => {
      const k = byHeight[rank]
      if (k === undefined) return
      out[k] = { ...out[k], x: out[k].x + move.dx, y: out[k].y + move.dy }
    })
  }
  if (nudge && out.length > 0) {
    let k = 0
    for (let i = 1; i < out.length; i++) if (out[i].x > out[k].x) k = i
    out[k] = { ...out[k], x: out[k].x + nudge.dx, y: out[k].y + nudge.dy }
  }
  // Back into painter's order. heap() sorted on the way out, but a nudge moves
  // a piece without moving its place in the list — so a piece pushed down into
  // the pile kept drawing behind everything it had just landed in front of,
  // and disappeared instead of filling the hole it was aimed at.
  out.sort((a, b) => a.y - b.y)
  return out
}

/** A heap of stones. */
function pile(
  count: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  s: number,
  opts: HeapOptions & { rock?: boolean } = {},
) {
  const Piece = opts.rock ? RockFaces : GemFaces
  return trim(heap(count, cx, cy, w, h, opts.taper ?? 0, opts.base), opts).map((p, i) => (
    <Piece
      key={i}
      x={p.x}
      y={p.y}
      // Smaller towards the peak, because up is also back. It used to be the
      // other way round — the pieces furthest away were the largest, which is
      // the single detail that stopped a heap reading as one.
      scale={(s * (1.1 - 0.3 * p.v + 0.14 * (p.j - 0.5))) / 100}
      rot={-26 + p.a * 52}
    />
  ))
}

// One real VaultKey, positioned. It renders its own <svg>, which nests
// inside this one perfectly well — and nesting it whole is the only way to
// keep it EXACTLY the key that is already in the game, gradients included.
// A flattened copy would drift from the original the first time either
// changed.
function keyAt(i: number, x: number, y: number, size: number, rot: number) {
  const w = size * 0.873
  return (
    <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) translate(${-w / 2} ${-size / 2})`}>
      <VaultKey tone="key" size={size} />
    </g>
  )
}

// --- Where a key actually is inside its own box ------------------------
// VaultKey draws its shaft straight up and then turns the whole thing 34
// degrees, so a key pointing along some bearing has to be rotated by that
// bearing MINUS 34. And its bow — the toothed disc the ring threads
// through — ends up at 31.1% across and 71.3% down the rendered box, not
// at its centre. Both numbers come from VaultKey itself: the disc is drawn
// at (24, 76) and the group's transform carries it to (23.3, 78.6) inside
// a viewBox of "4 28 62 71".
//
// Pinning the BOW rather than the box centre is the whole trick. Placing
// keys by their centres puts them near the ring; placing them by their
// bows puts them ON it.
const KEY_TILT = 34
const BOW_FX = 0.3113
const BOW_FY = 0.7127
const KEY_ASPECT = 0.873

/** One key, positioned by its bow rather than by its middle. */
function keyByBow(i: number, bx: number, by: number, size: number, rot: number) {
  const dx = -BOW_FX * KEY_ASPECT * size
  const dy = -BOW_FY * size
  return (
    <g key={i} transform={`translate(${bx} ${by}) rotate(${rot}) translate(${dx} ${dy})`}>
      <VaultKey tone="key" size={size} />
    </g>
  )
}

interface KeyHeapOptions extends HeapOptions {
  /** Bearing the keys point along, in degrees clockwise from straight up.
   *  90 lays them across. Loose keys in a crate settle flat; only the ones
   *  crammed into a pouch neck stand up. */
  bearing?: number
  /** Total spread of that bearing, in degrees. */
  spread?: number
}

/** A heap of keys, on the same scatter the stones use. */
function keyPile(
  count: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  s: number,
  opts: KeyHeapOptions = {},
) {
  const { bearing = 0, spread = 140 } = opts
  return trim(heap(count, cx, cy, w, h, opts.taper ?? 0, opts.base), opts).map((p, i) =>
    keyAt(i, p.x, p.y, s * (1.06 - 0.24 * p.v + 0.12 * (p.j - 0.5)), bearing - KEY_TILT + (p.a - 0.5) * spread),
  )
}

export function GemContainer({
  kind,
  contents = 'gems',
  tint,
  size = 108,
}: {
  kind: Kind
  contents?: Contents
  /** Only read for mineral, whose colour is whichever asteroid you are on. */
  tint?: string
  size?: number
}) {
  const uid = useId()
  const g = (n: string) => `url(#${uid}-${n})`
  // The mineral ships in the same vessels as the gems, holds the same counts
  // and heaps the same way — what changes between the three shops is the
  // stock, not the crate it travels in.
  const isRock = contents === 'mineral'
  const StockPiece = isRock ? RockFaces : GemFaces
  const stockTint = isRock ? (tint ?? MINERAL_FALLBACK_TINT) : GEM_TINT
  return (
    <svg
      viewBox={`0 ${GROUND_BY_KIND[kind] - GROUND} 100 100`}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* One key light in the upper left for every material, so the four
            goods read as sitting on the same counter under the same lamp. */}
        <radialGradient id={`${uid}-steel`} cx="32%" cy="22%" r="92%">
          <stop offset="0%" stopColor="#98A0AC" />
          <stop offset="52%" stopColor="#4C525C" />
          <stop offset="100%" stopColor="#22262C" />
        </radialGradient>
        <radialGradient id={`${uid}-brass`} cx="32%" cy="24%" r="92%">
          <stop offset="0%" stopColor="#F2CE92" />
          <stop offset="52%" stopColor="#B0863F" />
          <stop offset="100%" stopColor="#553C14" />
        </radialGradient>
        <radialGradient id={`${uid}-canvas`} cx="32%" cy="24%" r="92%">
          <stop offset="0%" stopColor="#8A8272" />
          <stop offset="52%" stopColor="#544D40" />
          <stop offset="100%" stopColor="#2A251C" />
        </radialGradient>
        {/* Light the stock throws back into whatever is holding it, in the
            stock's own colour. Keys are grey steel: an indigo pool behind
            them did nothing, and a heap inside a steel crate came out as
            one dark mass. */}
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={contents === 'keys' ? '#F5C77E' : stockTint} stopOpacity="0.75" />
          <stop offset="100%" stopColor={contents === 'keys' ? '#F5C77E' : stockTint} stopOpacity="0" />
        </radialGradient>
        {/* Glass: bright on the lit edge, near-black on the far one, nothing
            in between. Two hard steps read as a curved transparent wall where
            an even wash reads as a flat grey tube. */}
        <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id={`${uid}-inside`}>
          <path d="M40 34 H60 V72 A10 10 0 0 1 40 72 Z" />
        </clipPath>
        {/* The hopper's own silhouette. The band is paint ON the body, so it
            has to be bounded by it — the stripes are parallelograms and the
            outermost one hung a good five units past the tapered left edge,
            floating in space beside the machine. Cut off at the silhouette
            each end stripe reads as carrying on around the side. */}
        <clipPath id={`${uid}-hopper`}>
          <path d="M12 42 H88 L70 82 H30 Z" />
        </clipPath>
        {/* And the band itself curves round: dark at both ends, open in the
            middle, which is the whole of what tells you a flat trapezoid is
            the front of something with a back. */}
        <linearGradient id={`${uid}-round`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="22%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="44%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="68%" stopColor="#000000" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`${uid}-ao`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {kind === 'vial' && (
        <>
          <ellipse cx="50" cy="90" rx="17" ry="5" fill={g('ao')} />
          <ellipse cx="50" cy="66" rx="19" ry="19" fill={g('glow')} />
          <path d="M40 34 H60 V72 A10 10 0 0 1 40 72 Z" fill="#1B1E33" opacity={0.92} />
          {/* One stone, because the smallest gem pack IS one gem. Showing
              three in the jar you buy a single gem from is the kind of small
              lie that makes everything else on the shelf less believable.

              Ore is sold by the thousand, so that reasoning does not carry
              over: a lone rock in the smallest sample vial would read as
              "one rock", which is the very lie the single gem avoids. It
              gets a few instead.

              Either way they rest in the bowl at the bottom, where loose
              stock in a bottle actually ends up — floating in the middle of
              the tube is the giveaway that nothing here has weight. */}
          <g style={{ color: stockTint }} clipPath={`url(#${uid}-inside)`}>
            {isRock ? (
              pile(22, 50, 78, 9, 31, 16, { rock: true })
            ) : (
              <StockPiece x={50} y={73} scale={0.21} rot={-10} />
            )}
          </g>
          <path d="M40 34 H60 V72 A10 10 0 0 1 40 72 Z" fill={g('glass')} />
          <path
            d="M40 34 H60 V72 A10 10 0 0 1 40 72 Z"
            fill="none"
            stroke="#0B0D12"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M43.6 40 C42.3 47, 42.2 57, 43.2 64"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity={0.2}
          />
          <path
            d="M43.6 42 C42.8 48, 42.8 55, 43.3 60"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={0.45}
          />

          <rect x="37" y="24" width="26" height="12" rx="3" fill={g('brass')} stroke="#241804" strokeWidth="1.5" />
          <path d="M38.5 26.5 H61.5" stroke="#FFE9BE" strokeWidth="1.4" strokeLinecap="round" opacity={0.55} />
          <rect x="41" y="17" width="18" height="8" rx="2.4" fill={g('brass')} stroke="#241804" strokeWidth="1.4" />
        </>
      )}

      {kind === 'pouch' && (
        <>
          <ellipse cx="50" cy="88" rx="26" ry="6" fill={g('ao')} />
          <ellipse cx="50" cy="36" rx="21" ry="13" fill={g('glow')} />
          {contents === 'keys' ? (
            keyPile(4, 50, 34, 24, 7, 34, { bearing: KEY_TILT, spread: 155 })
          ) : (
            <g style={{ color: stockTint }}>{pile(5, 50, 36, 15, 7, 18, { taper: 0.3, rock: isRock })}</g>
          )}
          {/* Cloth, so it gets folds and a drawstring instead of bevels. If
              all four were the same material they would be one object at four
              sizes, which is exactly what this is trying not to be. */}
          <path
            d="M38 40 C26 48, 22 66, 32 78 C42 89, 58 89, 68 78 C78 66, 74 48, 62 40 Z"
            fill={g('canvas')}
            stroke="#17140E"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <g fill="none" stroke="#1E1A12" strokeWidth="1.6" strokeLinecap="round" opacity={0.5}>
            <path d="M42 50 C39 60, 40 70, 45 79" />
            <path d="M56 49 C60 60, 60 70, 56 80" />
          </g>
          <path
            d="M35 52 C32 62, 33 72, 39 80"
            fill="none"
            stroke="#A9A292"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.4}
          />
          <path
            d="M36 42 C44 46, 56 46, 64 42 L62 34 C56 37, 44 37, 38 34 Z"
            fill={g('brass')}
            stroke="#241804"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M37.5 36 C44 39, 56 39, 62.5 36"
            fill="none"
            stroke="#FFE9BE"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={0.5}
          />
          <path d="M64 40 C70 38, 72 44, 68 47" fill="none" stroke="#B0863F" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}

      {kind === 'crate' && (
        <>
          <ellipse cx="50" cy="86" rx="32" ry="7" fill={g('ao')} />
          <ellipse cx="50" cy="44" rx="29" ry="13" fill={g('glow')} />
          {contents === 'keys' ? (
            keyPile(6, 50, 44, 42, 7, 30, { taper: 0.3, bearing: 40, spread: 190 })
          ) : (
            <g style={{ color: stockTint }}>{pile(isRock ? 13 : 11, 50, 45, 62, 9, isRock ? 16 : 19, { taper: 0.34, base: 6, rock: isRock, nudgeHighest: isRock ? [{ dx: -14, dy: 1 }] : undefined })}</g>
          )}
          <path
            d="M18 48 H82 L78 82 H22 Z"
            fill={g('steel')}
            stroke="#0F1216"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <g fill="none" stroke="#0F1216" strokeWidth="1.4" opacity={0.55}>
            <path d="M19 58 H81" />
            <path d="M20 70 H80" />
            <path d="M36 48 L34 82" />
            <path d="M64 48 L66 82" />
          </g>
          {/* The lit side of each plank. Dark seams alone read as a drawing of
              a crate; the pair reads as boards with thickness. */}
          <g fill="none" stroke="#B9C1CB" strokeWidth="1" opacity={0.28}>
            <path d="M19 59.4 H81" />
            <path d="M20 71.4 H80" />
          </g>
          <path d="M16 44 H84 V50 H16 Z" fill={g('brass')} stroke="#241804" strokeWidth="1.5" />
          <path d="M17 45.4 H83" stroke="#FFE9BE" strokeWidth="1.3" strokeLinecap="round" opacity={0.5} />
          <g fill="#F2CE92" opacity={0.5}>
            <circle cx="22" cy="47" r="1.5" />
            <circle cx="38" cy="47" r="1.5" />
            <circle cx="62" cy="47" r="1.5" />
            <circle cx="78" cy="47" r="1.5" />
          </g>
          <path d="M19 50 L21 80" stroke="#C9D1DB" strokeWidth="1.6" strokeLinecap="round" opacity={0.3} />
        </>
      )}

      {kind === 'hopper' && (
        <>
          <ellipse cx="50" cy="90" rx="34" ry="7" fill={g('ao')} />
          <ellipse cx="50" cy="37" rx="35" ry="16" fill={g('glow')} />
          {contents === 'keys' ? (
            keyPile(10, 50, 42, 46, 9, 30, { taper: 0.28, bearing: 40, spread: 200 })
          ) : (
            <g style={{ color: stockTint }}>{pile(isRock ? 20 : 16, 50, 39, 74, 10, isRock ? 16 : 19, { taper: 0.32, base: 7, rock: isRock, dropHighest: isRock, nudgeHighest: isRock
                        ? [
                            { dx: 0, dy: 7 },
                            { dx: -6, dy: 5 },
                            { dx: -30, dy: 5 },
                            { dx: 0, dy: 0 },
                            { dx: -5, dy: 4 },
                          ]
                        : undefined })}</g>
          )}
          <g fill="#1A1D23" stroke="#0F1216" strokeWidth="1.3">
            <path d="M24 78 l-4 12 h9 l3 -12 z" />
            <path d="M76 78 l4 12 h-9 l-3 -12 z" />
          </g>
          <path
            d="M12 42 H88 L70 82 H30 Z"
            fill={g('steel')}
            stroke="#0F1216"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 42 H88 L83 52 H17 Z" fill="#000000" opacity={0.16} />
          <g fill="none" stroke="#0F1216" strokeWidth="1.4" opacity={0.5}>
            <path d="M30 42 L38 82" />
            <path d="M50 42 V82" />
            <path d="M70 42 L62 82" />
          </g>
          {/* Hazard band. The only good on the shelf that looks like it needed
              a machine to fill it.

              Everything here is clipped to the body and runs wider than it, so
              both ends are cut by the silhouette rather than stopping neatly
              short of it. A band that ends before the edge is a sticker; one
              that runs off it goes round the back. */}
          <g clipPath={g('hopper')}>
            <path d="M8 51 Q50 55 92 51 L92 63 Q50 67 8 63 Z" fill="#0F1216" opacity={0.6} />
            <g fill="#E8A33D" opacity={0.92}>
              <path d="M10 53 h7 l-5 8 h-7 z" />
              <path d="M22 53 h7 l-5 8 h-7 z" />
              <path d="M34 53 h7 l-5 8 h-7 z" />
              <path d="M46 53 h7 l-5 8 h-7 z" />
              <path d="M58 53 h7 l-5 8 h-7 z" />
              <path d="M70 53 h7 l-5 8 h-7 z" />
              <path d="M82 53 h7 l-5 8 h-7 z" />
            </g>
            {/* The curve, laid over stripes and backing alike so the whole band
                turns together. */}
            <path d="M8 51 Q50 55 92 51 L92 63 Q50 67 8 63 Z" fill={g('round')} />
          </g>
          <path d="M10 38 H90 V44 H10 Z" fill={g('brass')} stroke="#241804" strokeWidth="1.5" />
          <path d="M11 39.4 H89" stroke="#FFE9BE" strokeWidth="1.3" strokeLinecap="round" opacity={0.5} />
          <path d="M14 44 L31 80" stroke="#C9D1DB" strokeWidth="1.8" strokeLinecap="round" opacity={0.28} />
        </>
      )}
      {kind === 'ring' && (
        <>
          <ellipse cx="50" cy="84" rx="26" ry="6" fill={g('ao')} />
          <ellipse cx="50" cy="54" rx="30" ry="22" fill={g('glow')} opacity={0.5} />
          {/* Five keys on a ring, fanned. Every angle is computed rather
              than typed: the bearings are spread evenly either side of
              straight down, each bow is placed at that same bearing on the
              ring, and each key is turned to point along it. Change the
              count or the spread and the whole fan re-solves — which is the
              point, because eyeballing five rotations by hand is exactly how
              the first two attempts at this ended up looking wrong. */}
          {Array.from({ length: 5 }, (_, i) => {
            const bearing = 180 + (i - 2) * 25
            const rad = (bearing * Math.PI) / 180
            return keyByBow(
              i,
              50 + 10 * Math.sin(rad),
              36 - 10 * Math.cos(rad),
              44,
              bearing - KEY_TILT,
            )
          })}
          {/* The ring goes on last so it reads as passing in front of the
              bows it is threaded through. */}
          <circle cx="50" cy="36" r="10" fill="none" stroke="#241804" strokeWidth="7" />
          <circle cx="50" cy="36" r="10" fill="none" stroke={g('brass')} strokeWidth="4.6" />
          <path
            d="M42.4 29.4 A10 10 0 0 1 50 26"
            fill="none"
            stroke="#FFE9BE"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={0.6}
          />
        </>
      )}
    </svg>
  )
}

/** Index in the catalogue → what it is sold in. Clamped, so a fifth pack
 *  would ship in a hopper rather than crashing. */
export function gemContainerFor(index: number): Kind {
  return (['vial', 'pouch', 'crate', 'hopper'] as const)[Math.min(index, 3)]
}

export function keyContainerFor(index: number): Kind {
  return (['ring', 'pouch', 'crate', 'hopper'] as const)[Math.min(index, 3)]
}
