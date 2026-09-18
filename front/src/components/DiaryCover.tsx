import { playBookOpen } from '../lib/caseSound'

/**
 * The diary, shut — the console's switch for it. A closed notebook in the
 * purple of the open book's cover, the cream of its leaves showing along
 * the fore-edge and the foot, the ship stamped on the front, the elastic
 * band holding it closed with the pencil tucked under. It stands as tall
 * as the two switches it replaced (Diario + Trayectoria), a little wider
 * than one.
 *
 * Still: one SVG with gradients and no filters, so the console stays
 * cheap to paint (see Home's header comment on what runs up there).
 */
export function DiaryCover({ onClick, ariaLabel }: { onClick: () => void; ariaLabel: string }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        playBookOpen()
        onClick()
      }}
      aria-label={ariaLabel}
      className="group relative flex h-full w-[58px] shrink-0 items-center justify-center transition-transform active:translate-y-px active:scale-[0.97]"
      style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))' }}
    >
      <svg viewBox="0 0 64 80" className="h-full max-h-[72px] w-auto overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="diary-cover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f2346" />
            <stop offset="0.45" stopColor="#1f1830" />
            <stop offset="1" stopColor="#191423" />
          </linearGradient>
          <linearGradient id="diary-spine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#120d1c" />
            <stop offset="0.6" stopColor="#1c1529" />
            <stop offset="1" stopColor="#2a1f3d" />
          </linearGradient>
          <linearGradient id="diary-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <pattern id="diary-leaves" width="1" height="2.2" patternUnits="userSpaceOnUse">
            <rect width="1" height="2.2" fill="#e9dfc8" />
            <rect width="1" height="0.7" y="1.5" fill="#cfc4aa" />
          </pattern>
          <linearGradient id="diary-pencil" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d9a63a" />
            <stop offset="0.5" stopColor="#f0c35b" />
            <stop offset="1" stopColor="#c9952e" />
          </linearGradient>
        </defs>
        {/* the leaves, and the front cover pushed up-left off them so the
            cream shows along the right and the bottom */}
        <rect x="9" y="8" width="49" height="68" rx="2.5" fill="#d9cfb8" />
        <rect x="9" y="8" width="49" height="68" rx="2.5" fill="url(#diary-leaves)" opacity="0.9" />
        <rect x="5" y="4" width="50" height="69" rx="3" fill="url(#diary-cover)" />
        <rect x="5" y="4" width="50" height="69" rx="3" fill="url(#diary-sheen)" />
        <rect x="5" y="4" width="9" height="69" rx="3" fill="url(#diary-spine)" />
        <rect x="13" y="4" width="1" height="69" fill="#000" opacity="0.35" />
        <rect x="5.5" y="4.5" width="49" height="68" rx="2.5" fill="none" stroke="#fff" strokeOpacity="0.08" />
        {/* the debossed frame and the ship, stamped on the cover — the same
            ship the commander draws on the first page */}
        <rect x="20" y="12" width="29" height="53" rx="1.5" fill="none" stroke="#000" strokeOpacity="0.35" />
        <rect x="20.5" y="12.5" width="29" height="53" rx="1.5" fill="none" stroke="#c9b8ff" strokeOpacity="0.22" />
        <g
          transform="translate(26 26) scale(0.22)"
          fill="none"
          stroke="#e5cf8a"
          strokeOpacity="0.85"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40 6 q-18 20 -18 60 v30 h36 v-30 q0 -40 -18 -60 z" />
          <path d="M22 70 l-12 26 v10 l12 -6 M58 70 l12 26 v10 l-12 -6" />
          <circle cx="40" cy="58" r="8" />
        </g>
        {/* the elastic band */}
        <rect x="43" y="2" width="3.2" height="76" rx="1" fill="#6e5f9a" />
        <rect x="43" y="2" width="1.2" height="76" rx="0.6" fill="#8f80bf" />
        {/* the pencil, under the band, point down */}
        <g transform="rotate(-7 46 40)">
          <rect x="44.6" y="6" width="4.4" height="52" fill="url(#diary-pencil)" />
          <rect x="44.6" y="6" width="4.4" height="6" fill="#c9c2d6" />
          <rect x="44.6" y="2" width="4.4" height="4.5" rx="1" fill="#f0a0a8" />
          <path d="M44.6 58 L46.8 66 L49 58 Z" fill="#e7d3b0" />
          <path d="M46.1 63.5 L46.8 66 L47.5 63.5 Z" fill="#3d3830" />
          <rect x="46.2" y="12" width="1" height="46" fill="#fff" opacity="0.25" />
        </g>
      </svg>
    </button>
  )
}
