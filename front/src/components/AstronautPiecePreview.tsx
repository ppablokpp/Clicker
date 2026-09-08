import { useId } from 'react'
import {
  ACCENT_STYLES,
  BELT_STYLES,
  BOOT_STYLES,
  BRACELET_STYLES,
  HELMET_STYLES,
  SUIT_STYLES,
} from '../lib/astronautStyles'
import type {
  AccentStyle,
  AstronautStyleIds,
  BeltStyle,
  BootStyle,
  BraceletStyle,
  HelmetStyle,
  ShapeOption,
  SuitStyle,
} from '../lib/astronautStyles'

// One equipment piece drawn on its own, the way a shop shows an item off a
// mannequin — not a crop of the avatar. That distinction is the whole point
// of this file: a colour swatch says "this recolours something", a rendered
// helmet says "this IS a helmet, and this is the one you'd be wearing".
//
// Each piece is redrawn here rather than reusing AstronautAvatar's own
// geometry, because a standalone product shot wants different framing than
// a figure does: the suit gains sleeves it doesn't need on the body (where
// real arms cover them), the boots are a pair posed side by side, and the
// accents become a bracelet you could pick up. Same palettes, different
// composition.
//
// Gradient ids are namespaced per instance (useId) — a grid of these renders
// six at once in six colourways, and SVG ids are document-global.

type PiecePreviewProps = { size?: number } & (
  | { slot: 'helmet'; style: HelmetStyle }
  | { slot: 'suit'; style: SuitStyle }
  | { slot: 'boots'; style: BootStyle }
  | { slot: 'bracelet'; style: BraceletStyle }
  | { slot: 'belt'; style: BeltStyle }
  | { slot: 'accent'; style: AccentStyle }
  // Shape-only slots: the option carries no colour, so the preview picks a
  // neutral one. What's being sold here is the silhouette.
  | {
      slot: 'antenna' | 'pack' | 'trail' | 'badge' | 'pet' | 'pet2' | 'visor' | 'background'
      style: ShapeOption
    }
)

const SHAPE_INK = '#cfc8e4'
const SHAPE_GLOW = '#a855f7'

export function AstronautPiecePreview({ size = 62, ...props }: PiecePreviewProps) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {props.slot === 'helmet' && <HelmetPiece uid={uid} style={props.style} />}
      {props.slot === 'suit' && <SuitPiece uid={uid} style={props.style} />}
      {props.slot === 'boots' && <BootsPiece uid={uid} style={props.style} />}
      {props.slot === 'bracelet' && <BraceletPiece uid={uid} style={props.style} />}
      {props.slot === 'belt' && <BeltPiece uid={uid} style={props.style} />}
      {props.slot === 'accent' && <AccentPiece uid={uid} style={props.style} />}
      {(props.slot === 'antenna' ||
        props.slot === 'pack' ||
        props.slot === 'trail' ||
        props.slot === 'badge' ||
        props.slot === 'pet' ||
        props.slot === 'pet2' ||
        props.slot === 'visor' ||
        props.slot === 'background') && <ShapePiece slot={props.slot} id={props.style.id} />}
    </svg>
  )
}

export type AstronautSlot = keyof AstronautStyleIds

// The same piece, addressed by slot + id instead of by an already-looked-up
// style object. Every slot's options carry their own style type, so the
// lookup has to be per-slot to stay strictly typed — collapsing the
// catalogues into one list would lose that.
//
// This lives here, next to the drawings, because more than one screen now
// shows an item off the character: the customization grid and the cosmetic
// chest. Both going through this one function is what makes "it looks the
// same in the chest as in its card" a fact rather than a thing to remember.
export function AstronautPieceById({
  slot,
  id,
  size,
}: {
  slot: AstronautSlot
  id: string
  size?: number
}) {
  switch (slot) {
    case 'helmet': {
      const style = HELMET_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="helmet" style={style} size={size} /> : null
    }
    case 'suit': {
      const style = SUIT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="suit" style={style} size={size} /> : null
    }
    case 'boots': {
      const style = BOOT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="boots" style={style} size={size} /> : null
    }
    case 'bracelet': {
      const style = BRACELET_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="bracelet" style={style} size={size} /> : null
    }
    case 'belt': {
      const style = BELT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="belt" style={style} size={size} /> : null
    }
    case 'accent': {
      const style = ACCENT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="accent" style={style} size={size} /> : null
    }
    // Shape-only slots all take the same `{ id }` shape, so they share one
    // branch instead of six identical lookups.
    default:
      return <AstronautPiecePreview slot={slot} style={{ id }} size={size} />
  }
}

// Every shape-only option in one place. They share a neutral ink so the
// card sells the outline rather than a colour the piece won't actually
// have — these all inherit their real palette from the slot they attach to
// once worn.
/** Card-scale starfield (100x100 space). Fixed, same reasoning as STARS. */
const CARD_STARS: [number, number, number, number][] = [
  [26, 28, 1.4, 0.9], [66, 24, 1, 0.6], [78, 46, 1.2, 0.7], [22, 60, 1, 0.55],
  [46, 76, 1.3, 0.75], [70, 72, 0.9, 0.5], [38, 40, 1, 0.5], [58, 58, 1.1, 0.6],
  [30, 46, 0.8, 0.4], [74, 62, 1, 0.55],
]

function ShapePiece({ slot, id }: { slot: string; id: string }) {
  const cid = useId()
  // The empty option — only the two pet slots have one. An outline where it
  // would go, so the card still reads as a choice with a shape to it rather
  // than as a card that failed to draw. Keyed off the id, not the slot, so
  // any future slot that gains a "none" gets the same placeholder for free.
  if (id === 'ninguna') {
    return (
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        stroke={SHAPE_INK}
        strokeWidth="3"
        strokeDasharray="7 8"
        strokeLinecap="round"
        opacity="0.4"
      />
    )
  }

  // Visor decals sell themselves on the glass they're printed on, so the
  // card draws the dome and the glass too — the mark alone would be four
  // loose lines nobody could place.
  if (slot === 'visor') {
    // The helmet under the decal is the SAME drawing the helmet cards use —
    // HelmetPiece's own geometry (r=37 shell at 50,52; glass at 48.5,54;
    // neck ring), in the stock colourway. A simplified stand-in helmet made
    // the visor row look like it belonged to a different game than the row
    // above it.
    const { shell, visor } = HELMET_STYLES[0]
    return (
      <g>
        <defs>
          {volumeGradient(`${cid}-shell`, shell.from, shell.mid, shell.to)}
          <linearGradient id={`${cid}-visor`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor={visor.from} />
            <stop offset="45%" stopColor={visor.via} />
            <stop offset="100%" stopColor={visor.to} />
          </linearGradient>
          <radialGradient id={`${cid}-depth`} cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
          </radialGradient>
          <clipPath id={`${cid}-glass`}>
            <ellipse cx="48.5" cy="54" rx="26" ry="22.5" />
          </clipPath>
        </defs>

        <circle cx="50" cy="52" r="37" fill={`url(#${cid}-shell)`} stroke={shell.stroke} strokeWidth="2.2" />
        <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill={`url(#${cid}-visor)`} />
        <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill={`url(#${cid}-depth)`} />

        {/* The decal, clipped to the glass and drawn under the gloss — same
            stacking order as the worn version, so a card can't promise a look
            the astronaut won't give. */}
        <g clipPath={`url(#${cid}-glass)`}>
          {id === 'reticula' && (
            <g stroke="#7dd3fc" fill="none" opacity="0.95">
              <circle cx="48.5" cy="54" r="11" strokeWidth="1.7" />
              <circle cx="48.5" cy="54" r="2.4" strokeWidth="1.7" />
              <path
                d="M48.5 36v6.5M48.5 65.5v6.5M25 54h6.5M65.5 54h6.5"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path d="M25 39h11M25 42.5h6" strokeWidth="1.2" opacity="0.6" />
              <path d="M61 68h11M55 71.5h6" strokeWidth="1.2" opacity="0.45" />
            </g>
          )}
          {id === 'grieta' && (
            <g stroke="#fff" fill="none" strokeLinecap="round">
              <g strokeWidth="2" opacity="0.9">
                <path d="M25 36 L45 50 L37 62 L51 73" />
                <path d="M45 50 L68 43" />
                <path d="M45 50 L54 30" />
                <path d="M37 62 L22 68" />
              </g>
              <g strokeWidth="0.9" opacity="0.45">
                <path d="M68 43 L78 37M54 30 L58 21" />
              </g>
            </g>
          )}
          {id === 'agujero' && (
            <>
              <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill="#05050a" />
              <g fill="none" stroke={SHAPE_GLOW}>
                <ellipse cx="48.5" cy="54" rx="19" ry="5.8" strokeWidth="3" opacity="0.95" />
                <ellipse cx="48.5" cy="54" rx="22" ry="8.2" strokeWidth="1.1" opacity="0.45" />
              </g>
              <circle cx="48.5" cy="54" r="9" fill="#000" />
              <circle cx="48.5" cy="54" r="9.6" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.75" />
            </>
          )}
        </g>

        <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.25" />
        <ellipse
          cx="37"
          cy="43"
          rx="9"
          ry="4.5"
          fill="#ffffff"
          opacity={id === 'agujero' ? 0.12 : 0.6}
          transform="rotate(-25 37 43)"
        />
        <rect x="36" y="84" width="28" height="9" rx="4.5" fill={shell.stroke} />
      </g>
    )
  }

  // Backdrops are the only slot whose card is the whole thing rather than a
  // piece of it, so the card is simply the disc at card scale.
  if (slot === 'background') {
    return (
      <g>
        <clipPath id={`${cid}-bg`}>
          <circle cx="50" cy="50" r="33" />
        </clipPath>
        <g clipPath={`url(#${cid}-bg)`}>
          <circle cx="50" cy="50" r="33" fill="#0b0b14" />
          {id === 'estrellas' && (
            <g fill="#fff">
              {CARD_STARS.map(([x, y, r, o], i) => (
                <circle key={i} cx={x} cy={y} r={r} opacity={o} />
              ))}
            </g>
          )}
          {id === 'rejilla' && (
            <>
              <rect x="17" y="17" width="66" height="66" fill="#0d1117" />
              <g stroke="#a855f7" strokeWidth="0.8" opacity="0.45" fill="none">
                {[-60, -26, 0, 26, 60, 110].map((x, i) => (
                  <path key={i} d={`M50 46 L${x} 90`} />
                ))}
                {[52, 60, 72, 88].map((y, i) => (
                  <path key={`h${i}`} d={`M17 ${y} H83`} />
                ))}
              </g>
              <path d="M17 40 H83" stroke="#a855f7" strokeWidth="1.2" opacity="0.6" />
            </>
          )}
          {/* Same sky as the Estrellas card with the shower over it — that
              relationship is the item, so the card has to show both. */}
          {id === 'meteoros' && (
            <>
              <g fill="#fff">
                {CARD_STARS.map(([x, y, r, o], i) => (
                  <circle key={i} cx={x} cy={y} r={r} opacity={o} />
                ))}
              </g>
              <defs>
                <linearGradient id={`${cid}-tail`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              {/* Frozen mid-shower. The worn version animates; a thumbnail
                  that did too would be motion in a scrolling grid of forty. */}
              {[
                [20, 16, 14],
                [54, 38, 11],
                [30, 56, 12],
              ].map(([x, y, len], i) => (
                <g key={i}>
                  <path
                    d={`M${x} ${y} L${x + len} ${y + len}`}
                    stroke={`url(#${cid}-tail)`}
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                  <circle cx={x + len} cy={y + len} r="1.3" fill="#fff" />
                </g>
              ))}
            </>
          )}
        </g>
        <circle cx="50" cy="50" r="33" fill="none" stroke={SHAPE_INK} strokeWidth="1.6" opacity="0.5" />
      </g>
    )
  }

  if (slot === 'pet' || slot === 'pet2') {
    // The same companions AstronautAvatar flies, redrawn at the card's scale
    // and centred. Each is scaled to its own extents rather than sharing one
    // transform: the droid is tall and narrow, the satellite is wide and
    // short, and one shared scale would leave whichever lost the coin toss
    // either cramped against the frame or floating in it.
    if (id === 'chispa') {
      // The smallest companion, so it gets the largest scale of the four —
      // a card sells the piece, and at its worn size this would be a dot in
      // the middle of an empty frame.
      return (
        <g transform="translate(50 50) scale(2.6)">
          <circle cx="0" cy="0" r="13" fill={SHAPE_GLOW} opacity="0.12" />
          <circle cx="0" cy="0" r="8" fill={SHAPE_GLOW} opacity="0.22" />
          <circle cx="0" cy="-11" r="1.7" fill={SHAPE_INK} />
          <circle cx="9.5" cy="5.5" r="1.4" fill={SHAPE_INK} opacity="0.8" />
          <circle cx="-9.5" cy="5.5" r="1.2" fill={SHAPE_INK} opacity="0.6" />
          <circle cx="0" cy="0" r="4.6" fill={SHAPE_GLOW} />
          <circle cx="-1.4" cy="-1.6" r="1.5" fill="#ffffff" opacity="0.9" />
        </g>
      )
    }
    if (id === 'satelite') {
      // Widest of the three (±30 with the panels), so it's the width that
      // sets the scale here, not the height.
      return (
        <g transform="translate(50 42.2) scale(1.3)">
          <path d="M0 14 C7 20 8 27 0 36 C-8 27 -7 20 0 14 Z" fill={SHAPE_GLOW} opacity="0.5" />
          {/* Dish. */}
          <path d="M0 -12 L0 -19" stroke={SHAPE_INK} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M-9 -20 A9.5 9.5 0 0 1 9 -20 Z" fill={SHAPE_INK} />
          <circle cx="0" cy="-21.5" r="2.4" fill={SHAPE_GLOW} />
          {/* Panels on their struts. */}
          {[-1, 1].map((dir) => {
            const outer = dir < 0 ? -30 : 14
            return (
              <g key={dir}>
                <rect x={dir < 0 ? -16 : 13} y="-1.6" width="3" height="3.2" fill={SHAPE_INK} />
                <rect x={outer} y="-8" width="16" height="16" rx="2" fill={SHAPE_INK} opacity="0.6" />
                <g stroke="#1b2029" strokeWidth="1.2" opacity="0.5">
                  <path d={`M${outer + 5.33} -8 V8`} />
                  <path d={`M${outer + 10.67} -8 V8`} />
                  <path d={`M${outer} 0 H${outer + 16}`} />
                </g>
              </g>
            )
          })}
          {/* Chassis and visor slit. */}
          <rect x="-13" y="-12" width="26" height="24" rx="7" fill={SHAPE_INK} />
          <rect x="-9.5" y="-4.5" width="19" height="9" rx="4.5" fill="#1b2029" />
          <rect x="-7" y="-2" width="14" height="4" rx="2" fill={SHAPE_GLOW} />
        </g>
      )
    }
    if (id === 'orbe') {
      // Rings out to ±26 and nothing above or below them, so this one sits
      // dead centre and scales off its width too.
      return (
        <g transform="translate(50 50) scale(1.55)">
          <ellipse cx="0" cy="0" rx="26" ry="8.5" fill="none" stroke={SHAPE_GLOW} strokeWidth="2.6" opacity="0.6" />
          <ellipse
            cx="0"
            cy="0"
            rx="22"
            ry="7"
            fill="none"
            stroke={SHAPE_GLOW}
            strokeWidth="2"
            opacity="0.35"
            transform="rotate(62)"
          />
          <circle cx="0" cy="0" r="15" fill={SHAPE_INK} />
          <circle cx="0" cy="0" r="10.5" fill="#1b2029" />
          <circle cx="0" cy="0" r="9" fill={SHAPE_GLOW} opacity="0.25" />
          <circle cx="0" cy="0" r="6.5" fill={SHAPE_GLOW} />
          <ellipse cx="-2.2" cy="-2.6" rx="2.4" ry="1.8" fill="#ffffff" opacity="0.85" />
        </g>
      )
    }
    // The droid. Its geometry spans y -25…36 around an origin at the chassis,
    // so it needs recentring to sit in a square frame.
    return (
      <g transform="translate(50 43.1) scale(1.25)">
        {/* Thruster plume. */}
        <path d="M0 14 C7 20 8 27 0 36 C-8 27 -7 20 0 14 Z" fill={SHAPE_GLOW} opacity="0.5" />
        {/* Antenna. */}
        <path d="M0 -14 L0 -23" stroke={SHAPE_INK} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="0" cy="-25" r="3.2" fill={SHAPE_GLOW} />
        {/* Side fins. */}
        <rect x="-21" y="-7" width="7" height="14" rx="3.5" fill={SHAPE_INK} opacity="0.7" />
        <rect x="14" y="-7" width="7" height="14" rx="3.5" fill={SHAPE_INK} opacity="0.7" />
        {/* Chassis, face plate and eye. */}
        <rect x="-15" y="-14" width="30" height="28" rx="13" fill={SHAPE_INK} />
        <ellipse cx="0" cy="-1" rx="10.5" ry="9" fill="#1b2029" />
        <ellipse cx="0" cy="-1" rx="6" ry="6" fill={SHAPE_GLOW} />
        <ellipse cx="-2" cy="-3.4" rx="2.2" ry="1.7" fill="#ffffff" opacity="0.85" />
      </g>
    )
  }

  if (slot === 'antenna') {
    // Drawn over a hint of helmet crown so the piece has something to sit
    // on — an antenna floating alone doesn't read as headgear.
    const crown = <path d="M18 84 A32 32 0 0 1 82 84 Z" fill={SHAPE_INK} opacity="0.18" />
    return (
      <>
        {crown}
        {id === 'estandar' && (
          <>
            <path d="M62 56 L80 32" stroke={SHAPE_INK} strokeWidth="5" strokeLinecap="round" />
            <circle cx="82" cy="28" r="8" fill={SHAPE_GLOW} />
          </>
        )}
        {id === 'doble' && (
          <>
            <path d="M62 56 L80 32" stroke={SHAPE_INK} strokeWidth="5" strokeLinecap="round" />
            <circle cx="82" cy="28" r="7" fill={SHAPE_GLOW} />
            <path d="M38 56 L20 32" stroke={SHAPE_INK} strokeWidth="5" strokeLinecap="round" />
            <circle cx="18" cy="28" r="7" fill={SHAPE_GLOW} />
          </>
        )}
        {id === 'halo' && (
          <ellipse cx="50" cy="30" rx="34" ry="10" fill="none" stroke={SHAPE_GLOW} strokeWidth="7" />
        )}
      </>
    )
  }

  if (slot === 'pack') {
    return (
      <>
        {id === 'estandar' && (
          <>
            <rect x="24" y="24" width="20" height="52" rx="10" fill={SHAPE_INK} />
            <rect x="56" y="24" width="20" height="52" rx="10" fill={SHAPE_INK} />
          </>
        )}
        {id === 'carga' && (
          <>
            <rect x="18" y="16" width="28" height="68" rx="13" fill={SHAPE_INK} />
            <rect x="54" y="16" width="28" height="68" rx="13" fill={SHAPE_INK} />
            <rect x="18" y="34" width="28" height="6" fill={SHAPE_GLOW} />
            <rect x="54" y="34" width="28" height="6" fill={SHAPE_GLOW} />
          </>
        )}
        {id === 'aletas' && (
          <>
            <path d="M44 18 L8 52 L44 82 Z" fill={SHAPE_INK} />
            <path d="M56 18 L92 52 L56 82 Z" fill={SHAPE_INK} />
          </>
        )}
        {id === 'cilindros' && (
          <>
            <rect x="10" y="26" width="80" height="17" rx="8.5" fill={SHAPE_INK} />
            <rect x="10" y="49" width="80" height="17" rx="8.5" fill={SHAPE_INK} />
          </>
        )}
        {id === 'reactor' && (
          <>
            <rect x="22" y="30" width="56" height="40" rx="16" fill={SHAPE_INK} />
            <circle cx="18" cy="50" r="14" fill={SHAPE_INK} />
            <circle cx="82" cy="50" r="14" fill={SHAPE_INK} />
            <circle cx="18" cy="50" r="6.5" fill={SHAPE_GLOW} />
            <circle cx="82" cy="50" r="6.5" fill={SHAPE_GLOW} />
          </>
        )}
        {/* The rotors are the item, so the card gives them the room the
            worn version can't: two housings side by side, blades out. */}
        {id === 'turbinas' && (
          <>
            <rect x="4" y="28" width="44" height="44" rx="14" fill={SHAPE_INK} />
            <rect x="52" y="28" width="44" height="44" rx="14" fill={SHAPE_INK} />
            <circle cx="26" cy="50" r="16" fill="#1b2029" opacity="0.85" />
            <circle cx="74" cy="50" r="16" fill="#1b2029" opacity="0.85" />
            <g stroke={SHAPE_GLOW} strokeWidth="3.4" strokeLinecap="round">
              <path d="M13 50h26M26 37v26" />
              <path d="M61 50h26M74 37v26" />
            </g>
            <circle cx="26" cy="50" r="5" fill={SHAPE_GLOW} />
            <circle cx="74" cy="50" r="5" fill={SHAPE_GLOW} />
          </>
        )}
        {id === 'alas' && (
          <>
            <path d="M46 24 C22 27 4 44 2 68 C24 60 36 56 48 74 Z" fill={SHAPE_INK} />
            <path d="M54 24 C78 27 96 44 98 68 C76 60 64 56 52 74 Z" fill={SHAPE_INK} />
          </>
        )}
      </>
    )
  }

  if (slot === 'trail') {
    return (
      <>
        {/* Narrow at the nozzle, bulging as it expands, then drawn to a
            point. Deliberately NOT the worn shape: on the character the
            flame is read in context, tucked under the boots with only its
            lower half showing, so a wide top works there. Alone on a card
            that same shape is widest right at the top and reads as a leaf. */}
        {id === 'llama' && (
          <path d="M36 12 C18 32 16 58 50 92 C84 58 82 32 64 12 Z" fill={SHAPE_GLOW} opacity="0.85" />
        )}
        {id === 'ionico' && (
          <>
            <circle cx="50" cy="24" r="13" fill={SHAPE_GLOW} opacity="0.9" />
            <circle cx="50" cy="48" r="10" fill={SHAPE_GLOW} opacity="0.65" />
            <circle cx="50" cy="68" r="7" fill={SHAPE_GLOW} opacity="0.45" />
            <circle cx="50" cy="83" r="4.5" fill={SHAPE_GLOW} opacity="0.28" />
          </>
        )}
        {id === 'anillos' && (
          <g fill="none" stroke={SHAPE_GLOW}>
            <ellipse cx="50" cy="26" rx="16" ry="6" strokeWidth="5" opacity="0.9" />
            <ellipse cx="50" cy="52" rx="26" ry="9" strokeWidth="4" opacity="0.6" />
            <ellipse cx="50" cy="78" rx="35" ry="11" strokeWidth="3.2" opacity="0.35" />
          </g>
        )}
      </>
    )
  }

  // Badge symbols, shown on a disc so the card reads as the finished badge
  // rather than as a floating glyph — the disc is what you'd actually wear.
  return (
    <>
      <circle cx="50" cy="50" r="32" fill={SHAPE_GLOW} opacity="0.85" />
      <g fill="#ffffff">
        {id === 'planeta' && (
          <>
            <ellipse
              cx="50"
              cy="50"
              rx="25"
              ry="7"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              transform="rotate(-20 50 50)"
            />
            <circle cx="50" cy="50" r="12.5" />
          </>
        )}
        {id === 'estrella' && (
          <path d="M50 30 l4.7 13.5 14.3 .3 -11.4 8.7 4.2 13.7 -11.8 -8 -11.8 8 4.2 -13.7 -11.4 -8.7 14.3 -.3 z" />
        )}
        {id === 'rayo' && <path d="M57 28 l-15 24 h10 l-6 20 17 -25 h-10 z" />}
      </g>
    </>
  )
}

// Same upper-left key light as the avatar's own gradients, so a piece
// previewed here and the same piece worn on the character read as lit by
// one sun rather than as two unrelated drawings.
function volumeGradient(id: string, from: string, mid: string, to: string) {
  return (
    <radialGradient id={id} cx="32%" cy="24%" r="84%">
      <stop offset="0%" stopColor={from} />
      <stop offset="54%" stopColor={mid} />
      <stop offset="100%" stopColor={to} />
    </radialGradient>
  )
}

function HelmetPiece({ uid, style }: { uid: string; style: HelmetStyle }) {
  const { shell, visor } = style
  return (
    <>
      <defs>
        {volumeGradient(`${uid}-shell`, shell.from, shell.mid, shell.to)}
        <linearGradient id={`${uid}-visor`} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={visor.from} />
          <stop offset="45%" stopColor={visor.via} />
          <stop offset="100%" stopColor={visor.to} />
        </linearGradient>
        <radialGradient id={`${uid}-depth`} cx="34%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="37" fill={`url(#${uid}-shell)`} stroke={shell.stroke} strokeWidth="2.2" />
      <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill={`url(#${uid}-visor)`} />
      <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill={`url(#${uid}-depth)`} />
      <ellipse cx="48.5" cy="54" rx="26" ry="22.5" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.25" />
      <ellipse cx="37" cy="43" rx="9" ry="4.5" fill="#ffffff" opacity="0.6" transform="rotate(-25 37 43)" />
      {/* Neck ring — the seam that makes it read as a helmet you put on
          rather than a sphere. */}
      <rect x="36" y="84" width="28" height="9" rx="4.5" fill={shell.stroke} />
    </>
  )
}

function SuitPiece({ uid, style }: { uid: string; style: SuitStyle }) {
  const { body, limb } = style
  return (
    <>
      <defs>
        {volumeGradient(`${uid}-body`, body.from, body.mid, body.to)}
        {volumeGradient(`${uid}-limb`, limb.from, limb.mid, limb.to)}
      </defs>
      {/* Sleeves — the character's own arms hide these, but a garment on
          its own needs them to read as clothing instead of a pill. */}
      <path
        d="M32 34 C22 42 18 54 19 64"
        stroke={`url(#${uid}-limb)`}
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M68 34 C78 42 82 54 81 64"
        stroke={`url(#${uid}-limb)`}
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />
      {/* Torso. */}
      <rect x="27" y="22" width="46" height="60" rx="17" fill={`url(#${uid}-body)`} />
      {/* Collar. */}
      <rect x="39" y="16" width="22" height="11" rx="5.5" fill={body.stroke} />
      {/* Shoulder caps. */}
      <rect x="22" y="24" width="20" height="15" rx="7.5" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.3" />
      <rect x="58" y="24" width="20" height="15" rx="7.5" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.3" />
      {/* Zip and quilting, same language as the worn version. */}
      <path d="M50 32 V64" stroke={body.stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 41 H45" stroke={body.seam} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M55 41 H66" stroke={body.seam} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M34 56 H45" stroke={body.seam} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M55 56 H66" stroke={body.seam} strokeWidth="1.7" strokeLinecap="round" />
      {/* No belt here on purpose — it's its own slot now (BeltStyle), so
          drawing one would show a piece this card doesn't sell. */}
    </>
  )
}

function BeltPiece({ uid, style }: { uid: string; style: BeltStyle }) {
  const { band } = style
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-band`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={band.from} />
          <stop offset="38%" stopColor={band.mid} />
          <stop offset="100%" stopColor={band.to} />
        </linearGradient>
        {/* The band's own outline, so the sheen below can be cut by it. */}
        <clipPath id={`${uid}-bandClip`}>
          <rect x="6" y="40" width="88" height="20" rx="10" />
        </clipPath>
      </defs>
      {/* Laid out flat and tilted, the way a belt is photographed rather
          than the way it sits on a waist. */}
      <g transform="rotate(-9 50 50)">
        <rect x="6" y="40" width="88" height="20" rx="10" fill={`url(#${uid}-band)`} />
        {/* Top sheen, clipped to the band. Unclipped it was a straight strip
            over a round-ended shape, so at both ends it ran past the band's
            curve and read as a stray line floating above the belt. */}
        <rect
          x="6"
          y="40"
          width="88"
          height="2.6"
          fill="#ffffff"
          opacity="0.35"
          clipPath={`url(#${uid}-bandClip)`}
        />
        {/* Buckle. */}
        <rect x="38" y="36" width="24" height="28" rx="6" fill={band.mid} stroke={band.to} strokeWidth="2.2" />
        <rect x="45" y="43" width="10" height="14" rx="3" fill={band.from} opacity="0.85" />
        {/* Punch holes, so the band reads as a strap with a free end. */}
        <circle cx="80" cy="50" r="2.2" fill={band.to} opacity="0.8" />
        <circle cx="88" cy="50" r="2.2" fill={band.to} opacity="0.8" />
      </g>
    </>
  )
}

function BootsPiece({ uid, style }: { uid: string; style: BootStyle }) {
  const { ramp } = style
  return (
    <>
      <defs>{volumeGradient(`${uid}-boot`, ramp.from, ramp.mid, ramp.to)}</defs>
      {/* A posed pair, angled slightly apart — a product shot rather than
          the straight-on stance they take on the character. */}
      <g transform="rotate(-7 32 55)">
        <rect x="14" y="34" width="30" height="42" rx="13" fill={`url(#${uid}-boot)`} stroke={ramp.stroke} strokeWidth="2" />
        <path d="M18 62 h22" stroke={ramp.seam} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <path d="M19 46 h20" stroke={ramp.seam} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      </g>
      <g transform="rotate(7 68 55)">
        <rect x="56" y="34" width="30" height="42" rx="13" fill={`url(#${uid}-boot)`} stroke={ramp.stroke} strokeWidth="2" />
        <path d="M60 62 h22" stroke={ramp.seam} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <path d="M61 46 h20" stroke={ramp.seam} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      </g>
    </>
  )
}

// The trim slot has no single object to photograph — it's spread across the
// zip pull, the name tag, the jetpack and the thruster at once. So this one
// stays a colour sphere rather than a product shot: an honest "this is a
// palette" instead of a picture that would imply you're buying one part.
function AccentPiece({ uid, style }: { uid: string; style: AccentStyle }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-ball`} cx="32%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor={style.color} />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="31" fill={`url(#${uid}-ball)`} />
      <ellipse cx="38" cy="34" rx="10" ry="5" fill="#ffffff" opacity="0.5" transform="rotate(-25 38 34)" />
    </>
  )
}

// Just the pair of bands, nothing else — this slot owns exactly one thing,
// so the card shows exactly that thing.
function BraceletPiece({ uid, style }: { uid: string; style: BraceletStyle }) {
  // Lighting is a second pass over the *same* ellipse rather than a
  // separately drawn highlight arc. The arc that used to be here had to
  // have its endpoints solved onto the ellipse by hand, and they weren't:
  // they sat outside it, so instead of tracing the band's top edge the
  // highlight cut straight across the middle of the ring. Re-stroking the
  // identical path can't drift — top edge lit, bottom edge shaded, no
  // coordinates to keep in sync.
  const sheen = `url(#${uid}-sheen)`
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sheen`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {/* Back band, dimmed so the pair reads as one in front of the other. */}
      <g opacity="0.55" transform="rotate(-14 36 38)">
        <ellipse cx="36" cy="38" rx="22" ry="9.5" fill="none" stroke={style.color} strokeWidth="9" />
        <ellipse cx="36" cy="38" rx="22" ry="9.5" fill="none" stroke={sheen} strokeWidth="9" />
      </g>
      {/* Front band. */}
      <g transform="rotate(-14 52 62)">
        <ellipse cx="52" cy="62" rx="25" ry="11" fill="none" stroke={style.color} strokeWidth="10.5" />
        <ellipse cx="52" cy="62" rx="25" ry="11" fill="none" stroke={sheen} strokeWidth="10.5" />
      </g>
    </>
  )
}
