import { useId } from 'react'

/**
 * The little objects on the screens' own chrome: the pills that switch
 * views (the ranking's two boards, the profile's two tabs) and the two
 * round buttons in the top corner (settings, duels). They are drawn the
 * way everything else in the game is — a shaded body, a dark outline, one
 * highlight from the upper left — rather than as line icons, because
 * beside the mineral and the astronaut a hairline glyph reads as a
 * placeholder.
 *
 * All of them take their colour from `color` (default: the text colour
 * they sit in), so a pill or a button can tint them per state.
 */

interface Props {
  size?: number
  color?: string
  className?: string
}

/** The ship's shot: the blaster bolt from Home, stood on its diagonal. */
export function BoltIcon({ size = 20, color = 'currentColor', className }: Props) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}-core`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <g transform="rotate(-40 50 50)">
        {/* the trail: two shorter bolts behind, the way a burst reads */}
        <rect x="4" y="20" width="34" height="11" rx="5.5" fill={color} opacity="0.3" />
        <rect x="8" y="70" width="40" height="11" rx="5.5" fill={color} opacity="0.22" />
        {/* the bolt itself, hot at the head */}
        <rect x="8" y="42" width="74" height="19" rx="9.5" fill={`url(#${uid}-core)`} />
        <rect x="8" y="42" width="74" height="19" rx="9.5" fill="none" stroke="#000000" strokeOpacity="0.4" strokeWidth="2.2" />
        <rect x="22" y="46" width="32" height="4.6" rx="2.3" fill="#ffffff" opacity="0.55" />
        <circle cx="82" cy="51.5" r="11" fill="#ffffff" />
        <circle cx="82" cy="51.5" r="11" fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="2" />
      </g>
    </svg>
  )
}

/** The station's own read-out: three bars climbing, on their baseline. */
export function ChartIcon({ size = 20, color = 'currentColor', className }: Props) {
  const uid = useId()
  const bar = (x: number, y: number, o: number) => (
    <g key={x}>
      <rect x={x} y={y} width="20" height={84 - y} rx="4" fill={color} opacity={o} />
      <rect x={x} y={y} width="20" height={84 - y} rx="4" fill="none" stroke="#000000" strokeOpacity="0.35" strokeWidth="1.6" />
      <rect x={x + 3.5} y={y + 5} width="4" height={Math.max(6, 84 - y - 12)} rx="2" fill="#ffffff" opacity="0.35" />
    </g>
  )
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}-ao`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="88" rx="38" ry="6" fill={`url(#${uid}-ao)`} />
      {bar(16, 54, 0.55)}
      {bar(40, 30, 0.8)}
      {bar(64, 14, 1)}
      <rect x="10" y="84" width="80" height="6" rx="3" fill={color} opacity="0.5" />
      <rect x="10" y="84" width="80" height="6" rx="3" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.4" />
    </svg>
  )
}

/**
 * The two round buttons in the top corner are drawn the way the bottom
 * nav's glyphs are (see BottomNavPill): one flat silhouette in
 * currentColor on a 24-unit box, no shading — they are chrome, not
 * objects, and they light up with the button they sit in.
 */

/** Settings: a cog. */
export function GearIcon({ size = 20, className }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true" focusable="false">
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x="10.4" y="1.4" width="3.2" height="21.2" rx="1.4" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="7.4" />
      <circle cx="12" cy="12" r="3.1" fill="#0d0d14" />
    </svg>
  )
}

/** Duels: two shots crossing. */
export function DuelIcon({ size = 20, className }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true" focusable="false">
      {/* each bolt is a capsule with a round head at its leading end */}
      <g transform="rotate(-38 12 12)">
        <rect x="2.6" y="10.3" width="16" height="3.4" rx="1.7" />
        <circle cx="19.4" cy="12" r="3" />
      </g>
      <g transform="rotate(38 12 12)">
        <rect x="5.4" y="10.3" width="16" height="3.4" rx="1.7" />
        <circle cx="4.6" cy="12" r="3" />
      </g>
    </svg>
  )
}

/**
 * The commander's head: the stock helmet, white shell and violet glass,
 * in the astronaut's own colours (see astronautStyles' STANDARD_SHELL and
 * the `estandar` visor) rather than in currentColor — it is a piece of
 * the game's art, like the mineral and the gem, so it reads the same on a
 * lit pill as on a dark one. Fixed artwork: the tab means "you", not
 * whatever you happen to be wearing.
 */
export function HelmetIcon({ size = 20, className }: Props) {
  const uid = useId()
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}-shell`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#efedf9" />
          <stop offset="100%" stopColor="#b9b3d3" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="45%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <radialGradient id={`${uid}-depth`} cx="34%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      {/* the aerial */}
      <path d="M74 28 L86 13" fill="none" stroke="#b6b0ce" strokeWidth="5" strokeLinecap="round" />
      <circle cx="87" cy="12" r="6" fill="#a855f7" stroke="#6d28d9" strokeWidth="1.6" />
      {/* the shell: round, the way the helmet on the character is — a flat
          bottom read as a cropped circle rather than as a collar */}
      <circle cx="50" cy="52" r="39" fill={`url(#${uid}-shell)`} stroke="#9a93b8" strokeWidth="3" />
      {/* the glass: the character's own — one ellipse, the colour ramp
          across it and a bloom/falloff over that, which is what makes flat
          glass read as a dome (see AstronautAvatar's visorDepth) */}
      <ellipse cx="50" cy="50" rx="27" ry="24" fill={`url(#${uid}-visor)`} />
      <ellipse cx="50" cy="50" rx="27" ry="24" fill={`url(#${uid}-depth)`} />
      <ellipse cx="50" cy="50" rx="27" ry="24" fill="none" stroke="#6d28d9" strokeOpacity="0.35" strokeWidth="1.6" />
      {/* the two gloss streaks the helmet carries */}
      <path d="M33 44 a22 20 0 0 1 14 -13" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" />
      <path d="M31 52 a22 20 0 0 1 4 -10" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
