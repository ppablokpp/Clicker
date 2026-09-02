import { useMemo } from 'react'
import { motion } from 'framer-motion'

// A whole starfield from one 1x1px element — every star is just another
// point in a single giant box-shadow list, so there's no per-star DOM cost.
// Same trick Home's own background starfield uses, just in absolute pixels
// scoped to `size` instead of vw/vh scoped to the viewport, since this one
// has to stay inside a small circle instead of covering the screen.
function generateStars(count: number, size: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * size).toFixed(1)
    const y = (Math.random() * size).toFixed(1)
    stars.push(`${x}px ${y}px 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

// Stands in for a profile photo — this game has no camera roll, it has a
// character. Drawn as flat, chunky, sticker-style shapes (no photoreal
// shading) to match ClankUp's own violet/fuchsia gradient language, already
// used everywhere from the leaderboard's "you" badge to ShipModal's glow.
//
// The helmet is its own <g>, separate from the suit, on purpose: it's the
// piece we've talked about making genuinely customizable later (different
// shells, visor tints, decals) — keeping it visually and structurally
// distinct now is what makes that a swap-the-group change later instead of
// a rewrite. Everything else (suit, pack, badge) is the "standard issue"
// body underneath.
//
// A single instance, not a swarm — unlike OrbitingBots' hundred-drone
// scaling concerns, one Framer Motion element floating on one screen costs
// nothing, so there's no reason to hand-roll this in CSS keyframes instead.
export function AstronautAvatar({ size = 168 }: { size?: number }) {
  // Same footprint the old glow halo used (1.5x the character) — a porthole
  // of Home's own night sky instead of a soft violet aura.
  const skySize = size * 1.5
  const starsDim = useMemo(() => generateStars(70, skySize, 0.5), [skySize])
  const starsBright = useMemo(() => generateStars(20, skySize, 0.9), [skySize])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Starfield porthole — clipped to a circle via overflow-hidden, with
          a thin rim so it reads as a distinct window rather than blending
          into the page's own identical background. */}
      <div
        className="pointer-events-none absolute overflow-hidden rounded-full border border-white/10 bg-[#08080c]"
        style={{ width: skySize, height: skySize }}
      >
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>
      <motion.svg
        viewBox="0 0 180 200"
        width={size}
        height={size * (200 / 180)}
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="astroSuit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5f4fa" />
            <stop offset="100%" stopColor="#d8d6e6" />
          </linearGradient>
          <linearGradient id="astroHelmet" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fbfbff" />
            <stop offset="100%" stopColor="#dedceb" />
          </linearGradient>
          <linearGradient id="astroVisor" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="astroBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>

        {/* Backpack lungs — peek out from behind the shoulders. */}
        <rect x="24" y="108" width="20" height="52" rx="8" fill="#8b7bb8" />
        <rect x="136" y="108" width="20" height="52" rx="8" fill="#8b7bb8" />

        {/* Suit body. */}
        <rect x="42" y="106" width="96" height="86" rx="34" fill="url(#astroSuit)" />
        {/* Shoulder pauldrons. */}
        <rect x="34" y="100" width="34" height="42" rx="15" fill="#eceafb" stroke="#c9c4e0" strokeWidth="1.5" />
        <rect x="112" y="100" width="34" height="42" rx="15" fill="#eceafb" stroke="#c9c4e0" strokeWidth="1.5" />
        {/* Panel lines — the only "detail" the suit needs to read as a suit
            and not a blob. */}
        <path d="M62 150 h56" stroke="#c9c4e0" strokeWidth="2" strokeLinecap="round" />
        <path d="M90 150 v34" stroke="#c9c4e0" strokeWidth="2" strokeLinecap="round" />
        {/* Chest badge — a placeholder rank/level slot, not just decoration. */}
        <circle cx="90" cy="150" r="15" fill="url(#astroBadge)" />
        <path d="M90 142 l4.5 9 -4.5 9 -4.5 -9 z" fill="#fff" opacity="0.9" />

        {/* Neck seal, sitting right at the helmet/suit join. */}
        <rect x="68" y="98" width="44" height="16" rx="8" fill="#b9b3d6" />

        {/* --- Helmet group — the customizable part. --- */}
        <g>
          <circle cx="90" cy="66" r="54" fill="url(#astroHelmet)" stroke="#c9c4e0" strokeWidth="2" />
          {/* Visor. */}
          <ellipse cx="88" cy="68" rx="38" ry="33" fill="url(#astroVisor)" />
          {/* Glossy reflection streak. */}
          <ellipse cx="74" cy="52" rx="12" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-25 74 52)" />
          <ellipse cx="100" cy="86" rx="16" ry="5" fill="#ffffff" opacity="0.12" />
          {/* Antenna. */}
          <path d="M124 30 L138 12" stroke="#c9c4e0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="138" cy="12" r="5" fill="#f472b6" className="animate-pulse-glow" />
        </g>
      </motion.svg>
    </div>
  )
}
