import { useId } from 'react'

// A small circular "profile photo" built from the same astronaut character
// AstronautAvatar draws — head *and* shoulders in frame, the way an actual
// portrait photo is cropped, rather than just a floating helmet. That's the
// difference between "an icon of a helmet" and something that reads as a
// profile picture at a glance. Reused anywhere a Clerk photo used to go
// (the leaderboard rows, first). Built from the identical helmet/pauldron/
// suit geometry AstronautAvatar uses so the two always match, just
// re-declared standalone rather than shared via props: at this size the
// antenna and glass reflections read as noise more than detail, so this
// keeps only shell + visor + dome shading.
//
// Every gradient/clip id is namespaced with a per-instance `uid` (React's
// useId()). SVG ids are global to the whole page, and a leaderboard renders
// many of these side by side — without the suffix every instance would
// silently share (and fight over) the same gradient definitions.
export function AstronautHeadshot({ size = 32 }: { size?: number }) {
  const uid = useId()
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#0d0d14]"
      style={{ width: size, height: size }}
    >
      {/* Square viewBox, centered on the helmet's own x-center (90) — a
          non-square one would letterbox inside the square <svg> below
          rather than fill it, since nothing here overrides the default
          "meet" scaling. Bottom edge (136) lands mid-pauldron on purpose:
          shoulders cut off by the frame is exactly how a real headshot
          crops, not a mistake to fix by shrinking further. */}
      <svg viewBox="20 0 140 140" width={size} height={size}>
        <defs>
          <radialGradient id={`${uid}-shell`} cx="32%" cy="24%" r="82%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#efedf9" />
            <stop offset="100%" stopColor="#b9b3d3" />
          </radialGradient>
          <linearGradient id={`${uid}-visor`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
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
        <rect x="34" y="100" width="34" height="42" rx="15" fill={`url(#${uid}-shell)`} stroke="#c9c4e0" strokeWidth="1.5" />
        <rect x="112" y="100" width="34" height="42" rx="15" fill={`url(#${uid}-shell)`} stroke="#c9c4e0" strokeWidth="1.5" />
        <rect x="44" y="104" width="96" height="90" rx="34" fill={`url(#${uid}-shell)`} />
        <rect x="68" y="96" width="44" height="16" rx="8" fill="#b9b3d6" />

        <circle cx="90" cy="66" r="54" fill={`url(#${uid}-shell)`} stroke="#b6b0ce" strokeWidth="2" />
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="36" y="90" width="108" height="32" fill={`url(#${uid}-floor)`} />
          <path
            d="M46 42 A54 54 0 0 1 106 15"
            stroke="#ffffff"
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
