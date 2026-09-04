import { useId, useMemo } from 'react'
import { DEFAULT_STYLE_IDS, resolveStyle, type AstronautStyleIds } from '../lib/astronautStyles'

// A small circular "profile photo" built from the same astronaut character
// AstronautAvatar draws — head *and* shoulders in frame, the way an actual
// portrait photo is cropped, rather than just a floating helmet. That's the
// difference between "an icon of a helmet" and something that reads as a
// profile picture at a glance. Reused anywhere a Clerk photo used to go
// (the leaderboard rows, first).
//
// It wears the player's own cosmetics, which is the whole reason those are
// stored on the account: the leaderboard is where most people will ever see
// someone else's character.
//
// Only the four slots that survive this crop are drawn — helmet, suit,
// antenna, and the trim colour the antenna bulb takes. Boots, belt,
// bracelets, badge and thruster are all outside the frame; the backpack is
// technically inside it, but it sits exactly behind the shoulders, so at
// 28px it adds colour noise where the silhouette already is rather than
// anything anyone could identify.
//
// Every gradient/clip id is namespaced with a per-instance `uid` (React's
// useId()). SVG ids are global to the whole page, and a leaderboard renders
// many of these side by side in different colourways — without the suffix
// every instance would silently share (and fight over) the same gradients.
export function AstronautHeadshot({
  size = 32,
  styleIds = DEFAULT_STYLE_IDS,
}: {
  size?: number
  styleIds?: AstronautStyleIds
}) {
  const uid = useId()
  const s = useMemo(() => resolveStyle(styleIds), [styleIds])
  const shell = s.helmet.shell
  const body = s.suit.body
  const limb = s.suit.limb

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#0d0d14]"
      style={{ width: size, height: size }}
    >
      {/* Square viewBox, centered on the helmet's own x-center (90) — a
          non-square one would letterbox inside the square <svg> below
          rather than fill it, since nothing here overrides the default
          "meet" scaling.
          Pulled back from a 140-unit box to 160: the character grew head
          furniture, and a halo or a second antenna sat right on the old top
          edge. The extra margin also means the frame no longer crops the
          shoulders quite so tightly — still cut off, which is how a real
          headshot crops, just with room to read what's being worn. */}
      <svg viewBox="10 -10 160 160" width={size} height={size}>
        <defs>
          <radialGradient id={`${uid}-shell`} cx="32%" cy="24%" r="82%">
            <stop offset="0%" stopColor={shell.from} />
            <stop offset="52%" stopColor={shell.mid} />
            <stop offset="100%" stopColor={shell.to} />
          </radialGradient>
          <radialGradient id={`${uid}-suit`} cx="34%" cy="20%" r="88%">
            <stop offset="0%" stopColor={body.from} />
            <stop offset="55%" stopColor={body.mid} />
            <stop offset="100%" stopColor={body.to} />
          </radialGradient>
          <radialGradient id={`${uid}-limb`} cx="34%" cy="22%" r="85%">
            <stop offset="0%" stopColor={limb.from} />
            <stop offset="55%" stopColor={limb.mid} />
            <stop offset="100%" stopColor={limb.to} />
          </radialGradient>
          <linearGradient id={`${uid}-visor`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor={s.helmet.visor.from} />
            <stop offset="45%" stopColor={s.helmet.visor.via} />
            <stop offset="100%" stopColor={s.helmet.visor.to} />
          </linearGradient>
          <radialGradient id={`${uid}-visorDepth`} cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
          </radialGradient>
          <linearGradient id={`${uid}-floor`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3260" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a3260" stopOpacity="0.32" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx="90" cy="66" r="54" />
          </clipPath>
        </defs>

        {/* Shoulders + chest — drawn first so the helmet overlaps the neck
            seam, same paint order AstronautAvatar itself uses. */}
        <rect x="43" y="98" width="30" height="24" rx="12" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />
        <rect x="107" y="98" width="30" height="24" rx="12" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />
        <rect x="44" y="104" width="92" height="90" rx="34" fill={`url(#${uid}-suit)`} />
        <rect x="68" y="96" width="44" height="16" rx="8" fill={body.stroke} />

        {/* Antenna, behind the dome so the helmet covers where it mounts. */}
        {s.antenna.id === 'estandar' && (
          <>
            <path d="M124 30 L138 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
            <circle cx="138" cy="12" r="5" fill={s.accent.color} />
          </>
        )}
        {s.antenna.id === 'doble' && (
          <>
            <path d="M124 30 L138 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
            <circle cx="138" cy="12" r="4.6" fill={s.accent.color} />
            <path d="M56 30 L42 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
            <circle cx="42" cy="12" r="4.6" fill={s.accent.color} />
          </>
        )}
        {s.antenna.id === 'halo' && (
          <ellipse cx="90" cy="9" rx="33" ry="8.5" fill="none" stroke={s.accent.color} strokeWidth="4.5" />
        )}

        <circle cx="90" cy="66" r="54" fill={`url(#${uid}-shell)`} stroke={shell.stroke} strokeWidth="2" />
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="36" y="90" width="108" height="32" fill={`url(#${uid}-floor)`} />
          <path
            d="M46 42 A54 54 0 0 1 106 15"
            stroke={shell.from}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </g>
        <ellipse cx="88" cy="68" rx="38" ry="33" fill={`url(#${uid}-visor)`} />
        <ellipse cx="88" cy="68" rx="38" ry="33" fill={`url(#${uid}-visorDepth)`} />
        <ellipse cx="88" cy="68" rx="38" ry="33" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.25" />
        <ellipse cx="72" cy="52" rx="13" ry="6.5" fill="#ffffff" opacity="0.6" transform="rotate(-25 72 52)" />
      </svg>
    </div>
  )
}
