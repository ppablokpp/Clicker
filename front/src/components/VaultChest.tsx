import { useId } from 'react'
import type { ChestId } from '../store/chestBench'

// The chest and its key, drawn as objects rather than as line icons — the
// same construction the astronaut, the gunners and the asteroid use: a
// material ramp under a key light in the upper left, volume from gradients
// instead of from outlines, and a recessed dark well with something bright
// sitting in it.
//
// An armoured slab with a circular hatch and eight radial bolts. The bolts
// are the reason the key looks like this vault's key and not a generic one:
// its bit is a disc with eight teeth, one per bolt.
//
// --- Why the gem is a prop --------------------------------------------
// Everything here is grey except the core, so ONE model covers all four
// chests and the colour alone tells them apart — which is exactly what the
// flat Lucide icons were already doing with `text-indigo-300` and friends.
// The tones below are those same four colours, so nothing about the bench's
// colour language changes; only the shape wearing it does.
//
// --- Why ids are namespaced -------------------------------------------
// SVG ids are global to the document, so two instances declaring the same
// gradient id would have every one of them resolve to whichever mounted
// first. Harmless while the metal is identical, silently wrong the moment
// the core differs — which is the whole point of this component. useId()
// per instance is what AstronautAvatar does, and for the same reason.

type ChestTone = { lit: string; mid: string; deep: string; edge: string }

// Keys are a currency shared by every chest, not a property of one, so they
// get their own tone rather than borrowing the colour of whichever chest
// they happen to be priced against — tinting a key indigo beside the gems
// chest would say it only opens that one.
type VaultTone = ChestId | 'key'

// Keyed by chest, holding each one's CURRENT icon colour as the gem's mid
// tone, with a lighter and a darker step either side of it to make a ramp.
const VAULT_TONES: Record<VaultTone, ChestTone> = {
  // neutral-300 — reads as clear quartz rather than as a colourless mistake,
  // which is why its deep step is a cold grey and not a neutral one.
  material: { lit: '#FBFBFC', mid: '#D4D4D8', deep: '#494952', edge: '#5E5E6B' },
  gems: { lit: '#E8ECFF', mid: '#A5B4FC', deep: '#312E81', edge: '#3730A3' },
  style: { lit: '#F1ECFF', mid: '#C4B5FD', deep: '#3B0F76', edge: '#4C1D95' },
  styleRare: { lit: '#FDECFF', mid: '#F0ABFC', deep: '#6B1063', edge: '#701A75' },
  // The amber the bench already prices everything in.
  key: { lit: '#FFF6DE', mid: '#FCD34D', deep: '#6B3A08', edge: '#92400E' },
}

const SLAB_LIT = '#767D8E'
const SLAB_MID = '#3F4453'
const SLAB_DEEP = '#1A1C25'
const HATCH_LIT = '#A6ACBD'
const HATCH_MID = '#565C6E'
const HATCH_DEEP = '#23262F'
const OUTLINE = '#111319'
const RIM = '#D7DBE6'

type Props = {
  tone: VaultTone
  /** Overrides the tone lookup. The material chest passes the current
   *  prestige material here, since that colour is not fixed. */
  gem?: ChestTone
  size?: number
  className?: string
}

export function VaultChest({ tone, gem, size = 88, className }: Props) {
  const uid = useId()
  const t = gem ?? VAULT_TONES[tone]
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* 32% / 24% is the same sun every other figure in this game is lit
            by, so a chest sitting beside the astronaut reads as being in the
            same room as him. */}
        <radialGradient id={`${uid}-slab`} cx="32%" cy="22%" r="92%">
          <stop offset="0%" stopColor={SLAB_LIT} />
          <stop offset="52%" stopColor={SLAB_MID} />
          <stop offset="100%" stopColor={SLAB_DEEP} />
        </radialGradient>
        <radialGradient id={`${uid}-hatch`} cx="34%" cy="26%" r="86%">
          <stop offset="0%" stopColor={HATCH_LIT} />
          <stop offset="50%" stopColor={HATCH_MID} />
          <stop offset="100%" stopColor={HATCH_DEEP} />
        </radialGradient>
        <radialGradient id={`${uid}-core`} cx="40%" cy="32%" r="72%">
          <stop offset="0%" stopColor={t.lit} />
          <stop offset="48%" stopColor={t.mid} />
          <stop offset="100%" stopColor={t.deep} />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="88" rx="32" ry="4" fill="#000" opacity={0.5} />
      <rect x="13" y="20" width="74" height="66" rx="9" fill={`url(#${uid}-slab)`} stroke={OUTLINE} strokeWidth="1.8" />
      <rect x="17.5" y="24.5" width="65" height="57" rx="6" fill="none" stroke={OUTLINE} strokeWidth="1.3" opacity={0.65} />
      <g fill="#8E94A3" opacity={0.35}>
        <circle cx="21" cy="28" r="1.8" />
        <circle cx="79" cy="28" r="1.8" />
        <circle cx="21" cy="78" r="1.8" />
        <circle cx="79" cy="78" r="1.8" />
      </g>

      {/* Eight bolts, drawn twice: a fat dark pass for the socket, then a
          thinner lit pass on top. Two strokes is the cheapest way to make a
          line read as a rod sunk into a hole rather than as a line. */}
      <g stroke={OUTLINE} strokeWidth="7" strokeLinecap="round" opacity={0.9}>
        <path d="M50 30 V38" />
        <path d="M50 72 V64" />
        <path d="M28 53 H36" />
        <path d="M72 53 H64" />
        <path d="M34.5 37.5 L39.8 42.8" />
        <path d="M65.5 68.5 L60.2 63.2" />
        <path d="M65.5 37.5 L60.2 42.8" />
        <path d="M34.5 68.5 L39.8 63.2" />
      </g>
      <g stroke={`url(#${uid}-hatch)`} strokeWidth="4.4" strokeLinecap="round">
        <path d="M50 31 V38" />
        <path d="M50 71 V64" />
        <path d="M29 53 H36" />
        <path d="M71 53 H64" />
        <path d="M35.2 38.2 L39.8 42.8" />
        <path d="M64.8 67.8 L60.2 63.2" />
        <path d="M64.8 38.2 L60.2 42.8" />
        <path d="M35.2 67.8 L39.8 63.2" />
      </g>

      <circle cx="50" cy="53" r="22" fill={OUTLINE} />
      <circle cx="50" cy="53" r="20" fill={`url(#${uid}-hatch)`} stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="50" cy="53" r="15" fill="none" stroke={OUTLINE} strokeWidth="1.4" opacity={0.7} />
      <circle cx="50" cy="53" r="12.5" fill="#171A21" />
      <circle cx="50" cy="53" r="18" fill={t.mid} opacity={0.32} />
      <path
        d="M50 43 L58.6 48 V58 L50 63 L41.4 58 V48 Z"
        fill={`url(#${uid}-core)`}
        stroke={t.edge}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M50 47.5 L54.8 50.3 V55.7 L50 58.5 L45.2 55.7 V50.3 Z" fill="#FFFFFF" opacity={0.3} />

      {/* Rim light on the lit edge only — a rim on both cancels the light
          source out and the object goes flat. */}
      <path d="M36.6 40.4 A19 19 0 0 1 49 34.2" fill="none" stroke={RIM} strokeWidth="1.7" strokeLinecap="round" opacity={0.4} />
      <path d="M14.6 29 A8 8 0 0 1 22 21.6 H50" fill="none" stroke={RIM} strokeWidth="1.7" strokeLinecap="round" opacity={0.35} />
    </svg>
  )
}

export function KeyIcon({ size, className }: { size?: number; className?: string }) {
  return <VaultKey tone="key" size={size} className={className} />
}

// The key. Drawn straight up the y axis and then tilted as a whole, because
// the moment the shaft is diagonal every tooth, groove and collar on it has
// to be too — solving that once in a transform beats solving it eight times
// in path data. The tilt is what makes it read as a key at a glance: a
// vertical shaft with a disc on the end is a lollipop, the same shape at 34
// degrees is a key, and it is the angle Lucide's own Key icon sits at, which
// is the shape players already know from this screen.
export function VaultKey({ tone, gem, size = 30, className }: Props) {
  const uid = useId()
  const t = gem ?? VAULT_TONES[tone]
  return (
    <svg
      /* Tight to the artwork, not to a round 62x100. The tilt throws the
         key down and to the left, so a 0 0 62 100 box left the top third
         empty and every rendered key came out a third smaller than the size
         it was asked for. These numbers are that rotation solved: the corners
         of the untilted extents put through the same transform the group
         carries. */
      viewBox="4 28 62 71"
      width={size * 0.873}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${uid}-hatch`} cx="34%" cy="26%" r="86%">
          <stop offset="0%" stopColor={HATCH_LIT} />
          <stop offset="50%" stopColor={HATCH_MID} />
          <stop offset="100%" stopColor={HATCH_DEEP} />
        </radialGradient>
        <radialGradient id={`${uid}-core`} cx="40%" cy="32%" r="72%">
          <stop offset="0%" stopColor={t.lit} />
          <stop offset="48%" stopColor={t.mid} />
          <stop offset="100%" stopColor={t.deep} />
        </radialGradient>
      </defs>

      <ellipse cx="26" cy="93" rx="16" ry="3.2" fill="#000" opacity={0.5} />
      <g transform="translate(31 50) scale(1.1) translate(-31 -50) rotate(34 24 76)">
        <path d="M24 78 V30" stroke={OUTLINE} strokeWidth="10" strokeLinecap="round" />
        <path d="M24 78 V30" stroke={`url(#${uid}-hatch)`} strokeWidth="7" strokeLinecap="round" />
        <path d="M21.6 34 V74" stroke={OUTLINE} strokeWidth="1.1" opacity={0.45} />
        <path d="M26.6 34 V74" stroke={RIM} strokeWidth="1" opacity={0.22} />
        <g fill={`url(#${uid}-hatch)`} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M27 34 h11 v7 h-11 z" />
          <path d="M27 45 h7.5 v7 h-7.5 z" />
        </g>
        <g stroke={RIM} strokeWidth="0.9" opacity={0.28}>
          <path d="M27.8 35 H37.2" />
          <path d="M27.8 46 H33.7" />
        </g>
        <rect x="17" y="57" width="14" height="5" rx="1.8" fill={`url(#${uid}-hatch)`} stroke={OUTLINE} strokeWidth="1.3" />

        {/* The bit: eight teeth on a disc, one per bolt on the hatch. */}
        <g stroke={OUTLINE} strokeWidth="5.6" strokeLinecap="round">
          <path d="M31.5 76 L36 76" />
          <path d="M29.4 70.7 L32.6 67.5" />
          <path d="M24 68.5 L24 64" />
          <path d="M18.6 70.7 L15.4 67.5" />
          <path d="M16.5 76 L12 76" />
          <path d="M18.6 81.3 L15.4 84.5" />
          <path d="M24 83.5 L24 88" />
          <path d="M29.4 81.3 L32.6 84.5" />
        </g>
        <g stroke={`url(#${uid}-hatch)`} strokeWidth="3.9" strokeLinecap="round">
          <path d="M31.5 76 L35.6 76" />
          <path d="M29.4 70.7 L32.3 67.8" />
          <path d="M24 68.5 L24 64.4" />
          <path d="M18.6 70.7 L15.7 67.8" />
          <path d="M16.5 76 L12.4 76" />
          <path d="M18.6 81.3 L15.7 84.2" />
          <path d="M24 83.5 L24 87.6" />
          <path d="M29.4 81.3 L32.3 84.2" />
        </g>
        <circle cx="24" cy="76" r="9.2" fill={OUTLINE} />
        <circle cx="24" cy="76" r="7.8" fill={`url(#${uid}-hatch)`} stroke={OUTLINE} strokeWidth="1.3" />
        <circle cx="24" cy="76" r="8.4" fill={t.mid} opacity={0.24} />
        <circle cx="24" cy="76" r="4.6" fill="#171A21" />
        <path
          d="M24 72.4 L26.9 74.1 V77.5 L24 79.2 L21.1 77.5 V74.1 Z"
          fill={`url(#${uid}-core)`}
          stroke={t.edge}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d="M18.4 71 A7.8 7.8 0 0 1 23 69" fill="none" stroke={RIM} strokeWidth="1.4" strokeLinecap="round" opacity={0.4} />
        <path d="M20.6 32 V70" stroke={RIM} strokeWidth="1.5" strokeLinecap="round" opacity={0.3} />
      </g>
    </svg>
  )
}
