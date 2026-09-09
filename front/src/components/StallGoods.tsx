import { useId } from 'react'
import { GemFaces } from './MaterialIcons'
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
type Contents = 'gems' | 'keys'

/** The gems' own colour, held here rather than inherited. The containers each
 *  have their own material, so `currentColor` is already spoken for by the
 *  glass, the canvas and the steel. */
const GEM_TINT = '#6E7EF0'

// A heap. Deterministic — a pile that reshuffled on every render would make
// the modal flicker every time React touched it.
function pile(
  count: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  s: number,
  /** Offset applied to the rightmost stone only. */
  nudge?: { dx: number; dy: number },
  /** Drops the leftmost piece. The pouch needs it: its neck is narrower
   *  than a crate's mouth, and the outermost stone on that side lands
   *  past the cloth and reads as sitting beside the bag. */
  dropLeftmost?: boolean,
) {
  const stones = Array.from({ length: count }, (_, i) => {
    const t = ((i * 2654435761) % 1000) / 1000
    const u = ((i * 40503 + 17) % 1000) / 1000
    return {
      x: cx + (t - 0.5) * w,
      y: cy - u * h,
      scale: (s * (0.78 + 0.44 * u)) / 100,
      rot: -26 + t * 52,
    }
  })
  if (dropLeftmost && stones.length > 1) {
    let k = 0
    for (let i = 1; i < stones.length; i++) if (stones[i].x < stones[k].x) k = i
    stones.splice(k, 1)
  }
  if (nudge && stones.length > 0) {
    let k = 0
    for (let i = 1; i < stones.length; i++) if (stones[i].x > stones[k].x) k = i
    stones[k] = { ...stones[k], x: stones[k].x + nudge.dx, y: stones[k].y + nudge.dy }
  }
  return stones.map((p, i) => <GemFaces key={i} x={p.x} y={p.y} scale={p.scale} rot={p.rot} />)
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

/** A heap of keys, same deterministic scatter the stones use. */
function keyPile(
  count: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  s: number,
  dropLeftmost?: boolean,
) {
  const keys = Array.from({ length: count }, (_, i) => {
    const t = ((i * 2654435761) % 1000) / 1000
    const u = ((i * 40503 + 17) % 1000) / 1000
    return { x: cx + (t - 0.5) * w, y: cy - u * h, size: s * (0.8 + 0.4 * u), rot: -70 + t * 140 }
  })
  if (dropLeftmost && keys.length > 1) {
    let k = 0
    for (let i = 1; i < keys.length; i++) if (keys[i].x < keys[k].x) k = i
    keys.splice(k, 1)
  }
  return keys.map((p, i) => keyAt(i, p.x, p.y, p.size, p.rot))
}

export function GemContainer({
  kind,
  contents = 'gems',
  size = 108,
}: {
  kind: Kind
  contents?: Contents
  size?: number
}) {
  const uid = useId()
  const g = (n: string) => `url(#${uid}-${n})`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
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
          <stop offset="0%" stopColor={contents === 'keys' ? '#F5C77E' : '#8E9DFF'} stopOpacity="0.75" />
          <stop offset="100%" stopColor={contents === 'keys' ? '#F5C77E' : '#8E9DFF'} stopOpacity="0" />
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
          {/* One stone, because this pack is one gem. Showing three in the
              jar you buy a single gem from is the kind of small lie that
              makes everything else on the shelf less believable.

              Resting in the bowl at the bottom, where a loose stone in a
              bottle actually ends up — floating in the middle of the tube
              is the giveaway that nothing here has weight. */}
          <g style={{ color: GEM_TINT }} clipPath={`url(#${uid}-inside)`}>
            <GemFaces x={50} y={73} scale={0.21} rot={-10} />
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
            keyPile(4, 50, 34, 26, 7, 36, true)
          ) : (
            <g style={{ color: GEM_TINT }}>{pile(4, 50, 36, 24, 7, 19, undefined, true)}</g>
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
            keyPile(6, 50, 43, 38, 8, 34)
          ) : (
            <g style={{ color: GEM_TINT }}>{pile(6, 50, 45, 38, 9, 20, { dx: 4, dy: 2 })}</g>
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
          <ellipse cx="50" cy="38" rx="33" ry="14" fill={g('glow')} />
          {contents === 'keys' ? (
            keyPile(8, 50, 37, 48, 10, 34)
          ) : (
            <g style={{ color: GEM_TINT }}>{pile(9, 50, 39, 48, 11, 20, { dx: 4.5, dy: 2 })}</g>
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
              a machine to fill it. */}
          <path d="M17 52 H83 L79 62 H21 Z" fill="#0F1216" opacity={0.55} />
          <g fill="#E8A33D" opacity={0.9}>
            <path d="M22 54 h7 l-4 6 h-7 z" />
            <path d="M34 54 h7 l-4 6 h-7 z" />
            <path d="M46 54 h7 l-4 6 h-7 z" />
            <path d="M58 54 h7 l-4 6 h-7 z" />
            <path d="M70 54 h7 l-4 6 h-7 z" />
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
