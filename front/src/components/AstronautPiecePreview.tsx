import { useId } from 'react'
import type { AccentStyle, BeltStyle, BootStyle, BraceletStyle, HelmetStyle, SuitStyle } from '../lib/astronautStyles'

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
)

export function AstronautPiecePreview({ size = 62, ...props }: PiecePreviewProps) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {props.slot === 'helmet' && <HelmetPiece uid={uid} style={props.style} />}
      {props.slot === 'suit' && <SuitPiece uid={uid} style={props.style} />}
      {props.slot === 'boots' && <BootsPiece uid={uid} style={props.style} />}
      {props.slot === 'bracelet' && <BraceletPiece style={props.style} />}
      {props.slot === 'belt' && <BeltPiece uid={uid} style={props.style} />}
      {props.slot === 'accent' && <AccentPiece uid={uid} style={props.style} />}
    </svg>
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
      {/* Antenna first, so the dome overlaps its base. */}
      <path d="M74 24 L86 10" stroke={shell.stroke} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="87" cy="9" r="4.4" fill={visor.via} />
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
      </defs>
      {/* Laid out flat and tilted, the way a belt is photographed rather
          than the way it sits on a waist. */}
      <g transform="rotate(-9 50 50)">
        <rect x="6" y="40" width="88" height="20" rx="10" fill={`url(#${uid}-band)`} />
        <rect x="6" y="40" width="88" height="2.6" rx="1.3" fill="#ffffff" opacity="0.35" />
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
function BraceletPiece({ style }: { style: BraceletStyle }) {
  return (
    <>
      <ellipse
        cx="36"
        cy="38"
        rx="22"
        ry="9.5"
        fill="none"
        stroke={style.color}
        strokeWidth="9"
        transform="rotate(-14 36 38)"
        opacity="0.55"
      />
      <ellipse
        cx="52"
        cy="62"
        rx="25"
        ry="11"
        fill="none"
        stroke={style.color}
        strokeWidth="10.5"
        transform="rotate(-14 52 62)"
      />
      {/* Specular arc so the band reads as a rounded metal ring rather than
          a flat outlined oval. */}
      <path
        d="M31 55 A25 11 -14 0 1 58 52"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </>
  )
}
