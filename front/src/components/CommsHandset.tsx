import { playCommsOn } from '../lib/caseSound'

/**
 * The intercom handset — the console's switch for the command centre. A
 * radio handset on its wall plate beside the platino screen: the plate is
 * a purple panel screwed to the console at its four corners, with a
 * recessed bay the handset hangs in; the handset has its antenna with a
 * brass tip, the little glass display with a trace across it, the speaker
 * grille, the brass talk button on the side, the volume knob. The plate
 * fills the same box as the diary across the screen, so the two sides of
 * the console weigh the same, and is painted like it — the cover's
 * purple, the leaves' cream, a violet LED.
 *
 * `lit` turns the LED on (something new in the hangar or the hold). Still
 * otherwise: one SVG with gradients and no filters, so the console stays
 * cheap to paint (see Home's header comment on what runs up there).
 */
export function CommsHandset({ onClick, ariaLabel, lit }: { onClick: () => void; ariaLabel: string; lit: boolean }) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        playCommsOn()
        onClick()
      }}
      aria-label={ariaLabel}
      className="group relative flex h-full w-[58px] shrink-0 items-center justify-center transition-transform active:translate-y-px active:scale-[0.97]"
      style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))' }}
    >
      <svg viewBox="0 0 64 80" className="h-full max-h-[72px] w-auto overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="comms-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1a1426" />
            <stop offset="0.35" stopColor="#2f2346" />
            <stop offset="0.7" stopColor="#221a35" />
            <stop offset="1" stopColor="#170f22" />
          </linearGradient>
          <linearGradient id="comms-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="comms-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0dca0" />
            <stop offset="0.5" stopColor="#e5cf8a" />
            <stop offset="1" stopColor="#b99a4e" />
          </linearGradient>
          <linearGradient id="comms-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#17122a" />
            <stop offset="1" stopColor="#0b0912" />
          </linearGradient>
          <linearGradient id="comms-bracket" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0d0a14" />
            <stop offset="1" stopColor="#1c1529" />
          </linearGradient>
          <linearGradient id="comms-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f2346" />
            <stop offset="0.45" stopColor="#1f1830" />
            <stop offset="1" stopColor="#191423" />
          </linearGradient>
          <linearGradient id="comms-plate-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the wall plate: the diary's box (x 4..60, y 2..78), screwed on
            at the corners, with the bay the handset hangs in recessed into
            it */}
        <rect x="4" y="2" width="56" height="76" rx="4" fill="url(#comms-plate)" />
        <rect x="4" y="2" width="56" height="76" rx="4" fill="url(#comms-plate-sheen)" />
        <rect x="4.5" y="2.5" width="55" height="75" rx="3.5" fill="none" stroke="#fff" strokeOpacity="0.09" />
        <rect x="9" y="8" width="46" height="64" rx="3" fill="#0d0a14" fillOpacity="0.55" />
        <rect x="9.5" y="8.5" width="45" height="63" rx="2.5" fill="none" stroke="#000" strokeOpacity="0.5" />
        <rect x="9.5" y="8.5" width="45" height="63" rx="2.5" fill="none" stroke="#c9b8ff" strokeOpacity="0.12" />
        {[
          [8, 6],
          [56, 6],
          [8, 74],
          [56, 74],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="1.9" fill="#3a3050" />
            <circle cx={x} cy={y} r="1.9" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="0.6" />
            <path
              d={`M${x - 1.2} ${y - 0.6} L${x + 1.2} ${y + 0.6}`}
              stroke="#0d0a14"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
            <circle cx={x - 0.5} cy={y - 0.5} r="0.5" fill="#fff" opacity="0.25" />
          </g>
        ))}

        {/* the handset, hung in the bay */}
        <g transform="translate(32 40) scale(0.78) translate(-32 -40)">
          {/* the bracket it hangs on, behind the body */}
          <rect x="18" y="8" width="28" height="12" rx="2" fill="url(#comms-bracket)" />
          <rect x="18.5" y="8.5" width="27" height="11" rx="1.5" fill="none" stroke="#fff" strokeOpacity="0.06" />
          <circle cx="22" cy="14" r="1" fill="#000" opacity="0.5" />
          <circle cx="42" cy="14" r="1" fill="#000" opacity="0.5" />

          {/* the antenna, brass-tipped */}
          <rect x="44" y="3" width="3" height="16" rx="1.5" fill="#120d1c" />
          <rect x="44.6" y="3.6" width="1" height="14" rx="0.5" fill="#fff" opacity="0.12" />
          <circle cx="45.5" cy="3.8" r="2" fill="url(#comms-brass)" />

          {/* the body */}
          <rect x="14" y="14" width="36" height="64" rx="7" fill="url(#comms-body)" />
          <rect x="14" y="14" width="36" height="64" rx="7" fill="url(#comms-sheen)" />
          <rect x="14.5" y="14.5" width="35" height="63" rx="6.5" fill="none" stroke="#fff" strokeOpacity="0.1" />
          <rect x="15.5" y="15.5" width="33" height="61" rx="5.5" fill="none" stroke="#000" strokeOpacity="0.35" />

          {/* the display: glass, a trace across it, the LED in the corner */}
          <rect x="19" y="19" width="26" height="12" rx="1.5" fill="url(#comms-glass)" />
          <rect x="19.5" y="19.5" width="25" height="11" rx="1" fill="none" stroke="#a78bfa" strokeOpacity="0.3" />
          <path
            d="M21 26 h4 l1.5 -3 l2 6 l2 -5 l1.5 2 h4 l1 -1.5 l1.5 1.5 h3"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {lit ? (
            <>
              <circle cx="41.5" cy="22" r="2.4" fill="#c4b5fd" opacity="0.35" />
              <circle cx="41.5" cy="22" r="1.2" fill="#e9e3ff" />
            </>
          ) : (
            <circle cx="41.5" cy="22" r="1.2" fill="#3b2f5c" />
          )}

          {/* the speaker grille */}
          <g stroke="#e5cf8a" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round">
            <path d="M22 38 h20 M22 42 h20 M22 46 h20 M22 50 h20 M22 54 h20 M22 58 h20" />
          </g>
          <g stroke="#000" strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round">
            <path d="M22 39.2 h20 M22 43.2 h20 M22 47.2 h20 M22 51.2 h20 M22 55.2 h20 M22 59.2 h20" />
          </g>

          {/* the talk button, brass, on the side */}
          <rect x="10.5" y="30" width="5" height="16" rx="2.5" fill="url(#comms-brass)" />
          <rect x="10.5" y="30" width="5" height="16" rx="2.5" fill="none" stroke="#000" strokeOpacity="0.3" />
          <rect x="12" y="33" width="1" height="10" rx="0.5" fill="#fff" opacity="0.35" />

          {/* the volume knob */}
          <circle cx="32" cy="69" r="3.6" fill="#120d1c" />
          <circle cx="32" cy="69" r="3.6" fill="none" stroke="#e5cf8a" strokeOpacity="0.6" strokeWidth="1.1" />
          <path d="M32 66.4 v2" stroke="#e5cf8a" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </svg>
    </button>
  )
}
