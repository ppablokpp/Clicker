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

// Taller than the original bust so the thruster flame below has somewhere
// to go — everything else keeps its exact original coordinates.
const VIEWBOX_W = 180
const VIEWBOX_H = 236
// Where the starfield porthole centers, as a fraction of the full height —
// the head/shoulders area, not the container's own vertical middle (which
// the added flame height below would otherwise pull the center down past).
// A bit below the helmet's own center (66) rather than right on it: dead
// center on the helmet read as sitting too high once the body below it
// got taller (boots, flame) — this frames the head *and* the shoulder line.
const PORTHOLE_CENTER_Y = 106 / VIEWBOX_H

// Stands in for a profile photo — this game has no camera roll, it has a
// character. Built as a vinyl-figurine: chunky, oversized helmet on a small
// puffy body, volume carried by radial gradients (light from the upper
// left) plus rim light rather than by outlines, in ClankUp's own
// violet/fuchsia language with amber trim borrowed from the scout drones.
//
// The helmet is its own <g>, separate from the suit, on purpose: it's the
// piece we've talked about making genuinely customizable later (different
// shells, visor tints, decals) — keeping it visually and structurally
// distinct now is what makes that a swap-the-group change later instead of
// a rewrite. Everything else (suit, pack, badge) is the "standard issue"
// body underneath.
//
// The arms are single unbroken puffy tubes ending in mitten gloves — no
// elbow, no wrist, nothing that hinges. That's the specific difference
// from the jointed-limb version that got thrown out for reading as a
// robot: a figurine's limbs are one soft shape, an articulated model's
// are a chain of segments. Still no legs, for the same reason — the boots
// hang straight off the suit and a thruster burns between them.
//
// A single instance, not a swarm — unlike OrbitingBots' hundred-drone
// scaling concerns, one Framer Motion element floating on one screen costs
// nothing, so there's no reason to hand-roll this in CSS keyframes instead.
export function AstronautAvatar({ size = 168 }: { size?: number }) {
  const svgHeight = size * (VIEWBOX_H / VIEWBOX_W)
  // Same footprint the old glow halo used (1.5x the character's width) — a
  // porthole of Home's own night sky instead of a soft violet aura.
  const skySize = size * 1.5
  const starsDim = useMemo(() => generateStars(130, skySize, 0.5), [skySize])
  const starsBright = useMemo(() => generateStars(36, skySize, 0.9), [skySize])

  return (
    <div className="relative" style={{ width: size, height: svgHeight }}>
      {/* Starfield porthole — clipped to a circle via overflow-hidden, with
          a thin rim so it reads as a distinct window rather than blending
          into the page's own identical background. Positioned explicitly
          on the helmet rather than flex-centered against the container,
          since the flame's extra height below would otherwise drag a
          centered porthole down off the head. */}
      <div
        className="pointer-events-none absolute overflow-hidden rounded-full border border-white/10 bg-[#08080c]"
        style={{
          width: skySize,
          height: skySize,
          left: size / 2 - skySize / 2,
          top: svgHeight * PORTHOLE_CENTER_Y - skySize / 2,
        }}
      >
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>
      <motion.svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width={size}
        height={svgHeight}
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Every volume gradient is a radial lit from the same upper-left
              point (~32% / 24%) — a single consistent light source across
              helmet, suit and gloves is most of what separates a figurine
              from flat vector shapes. */}
          <radialGradient id="astroShell" cx="32%" cy="24%" r="82%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#efedf9" />
            <stop offset="100%" stopColor="#b9b3d3" />
          </radialGradient>
          <radialGradient id="astroSuit" cx="34%" cy="20%" r="88%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f1eff9" />
            <stop offset="100%" stopColor="#c6c0dc" />
          </radialGradient>
          <radialGradient id="astroLimb" cx="34%" cy="22%" r="85%">
            <stop offset="0%" stopColor="#fdfdff" />
            <stop offset="55%" stopColor="#eeecf7" />
            <stop offset="100%" stopColor="#bfb9d6" />
          </radialGradient>
          <linearGradient id="astroVisor" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          {/* Laid over the visor: a bright bloom where the light hits and a
              deep falloff at the far edge, which is what makes flat glass
              read as a curved dome. */}
          <radialGradient id="astroVisorDepth" cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
          </radialGradient>
          <linearGradient id="astroPack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9b8cc7" />
            <stop offset="100%" stopColor="#7a6aa8" />
          </linearGradient>
          <linearGradient id="astroBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
          <linearGradient id="astroFlameOuter" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="astroFlameInner" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.15" />
          </linearGradient>
          {/* Shading for the bottom of the helmet dome, below the visor.
              A vertical fade rather than a solid-filled ellipse: an ellipse
              at a flat opacity has a visible edge partway up the shell, so
              it read as a dark patch stuck on the helmet instead of as the
              shell curving away from the light. */}
          <linearGradient id="astroHelmetFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3260" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a3260" stopOpacity="0.32" />
          </linearGradient>
          {/* A shallow cylindrical roll across the belt's height, so it has
              thickness instead of being a flat strip. */}
          <linearGradient id="astroBelt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e4e0f1" />
            <stop offset="38%" stopColor="#fbfaff" />
            <stop offset="100%" stopColor="#cbc6de" />
          </linearGradient>
          {/* Keeps the helmet's inner shading inside the dome instead of
              spilling past its edge. */}
          <clipPath id="astroHelmetClip">
            <circle cx="90" cy="66" r="54" />
          </clipPath>
          {/* Same idea for the belt: the torso's own silhouette is what
              cuts its ends, so it wraps the body instead of overhanging it. */}
          <clipPath id="astroTorsoClip">
            <rect x="44" y="104" width="92" height="90" rx="34" />
          </clipPath>
        </defs>

        {/* Thruster flame — wide enough to show from behind both boots (not
            just glowing in the gap between them) and tucked under the suit
            body, which is drawn after it so the torso's own rounded bottom
            overlaps the flame's top instead of leaving a seam. Animated in
            CSS, not Framer: see .astro-flame in index.css for why the old
            group-opacity version flickered. */}
        <g className="astro-flame">
          <path d="M90 178 C120 190 132 206 90 232 C48 206 60 190 90 178 Z" fill="url(#astroFlameOuter)" opacity="0.55" />
          <path
            className="astro-flame-core"
            d="M90 184 C109 193 116 204 90 221 C64 204 71 193 90 184 Z"
            fill="url(#astroFlameInner)"
          />
        </g>

        {/* Life-support pack — only its shoulders peek out from behind the
            torso, the rest reading as depth behind the arms. */}
        <rect x="30" y="104" width="19" height="46" rx="9" fill="url(#astroPack)" />
        <rect x="131" y="104" width="19" height="46" rx="9" fill="url(#astroPack)" />

        {/* Arms — one continuous round-capped stroke each, no joint
            anywhere along it. Drawn before the pauldrons so the shoulder
            caps overlap where they meet the body. */}
        <g strokeLinecap="round" fill="none">
          <path d="M58 122 C46 136 40 152 41 166" stroke="url(#astroLimb)" strokeWidth="23" />
          <path d="M122 122 C134 136 140 152 139 166" stroke="url(#astroLimb)" strokeWidth="23" />
        </g>
        {/* Amber cuff bands, then the mitten gloves they end in. */}
        <ellipse cx="41" cy="163" rx="11.5" ry="4.2" fill="#fbbf24" transform="rotate(-6 41 163)" />
        <ellipse cx="139" cy="163" rx="11.5" ry="4.2" fill="#fbbf24" transform="rotate(6 139 163)" />
        <circle cx="39" cy="177" r="12.5" fill="url(#astroLimb)" stroke="#c1bbd8" strokeWidth="1.5" />
        <circle cx="141" cy="177" r="12.5" fill="url(#astroLimb)" stroke="#c1bbd8" strokeWidth="1.5" />
        <path d="M33 180 q6 4 12 0" stroke="#c1bbd8" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M135 180 q6 4 12 0" stroke="#c1bbd8" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />

        {/* Suit body. */}
        <rect x="44" y="104" width="92" height="90" rx="34" fill="url(#astroSuit)" />
        {/* Rim light: a bright edge where the key light grazes the left of
            the torso, a cool violet bounce on the right. Two strokes, and
            most of what makes the body read as round rather than as a
            rounded rectangle. */}
        <path d="M52 128 C46 142 46 160 50 176" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M130 132 C134 146 134 162 131 174" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

        {/* Boots — peeking straight out from under the suit's own rounded
            bottom, no leg segment in between. That's the difference from
            the jointed-limb version that read as a robot: there's nothing
            here to hinge, just feet the suit tapers directly into, with the
            thruster flame glowing out from between them. */}
        {/* Deliberately the plainest piece on the character: same suit
            gradient, same outline weight and same crease treatment as the
            gloves, so the default kit reads as one material throughout.
            The dark, amber-trimmed, overhanging-sole version that was here
            broke that — it was the most detailed thing on a figure whose
            whole language is soft light-lilac volumes. These are the slot
            bought outfits will replace, so the stock pair is where colour
            and hard detail *shouldn't* live; anything that stands out on
            the default leaves a purchased boot nothing to be. */}
        <rect x="57" y="182" width="28" height="20" rx="9" fill="url(#astroLimb)" stroke="#c1bbd8" strokeWidth="1.5" />
        <rect x="95" y="182" width="28" height="20" rx="9" fill="url(#astroLimb)" stroke="#c1bbd8" strokeWidth="1.5" />
        <path d="M60 196 h22" stroke="#c1bbd8" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M98 196 h22" stroke="#c1bbd8" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

        {/* Quilting seams — both pairs, back at the rows they originally
            sat on. They're drawn *before* the pauldrons so the shoulder
            caps sit on top of them the way a real shoulder piece would,
            instead of a seam running across the cap. */}
        <path d="M62 128 H84" stroke="#cbc6e2" strokeWidth="2" strokeLinecap="round" />
        <path d="M96 128 H118" stroke="#cbc6e2" strokeWidth="2" strokeLinecap="round" />
        <path d="M62 155 H84" stroke="#cbc6e2" strokeWidth="2" strokeLinecap="round" />
        <path d="M96 155 H118" stroke="#cbc6e2" strokeWidth="2" strokeLinecap="round" />

        {/* Shoulder pauldrons — thin caps ending at y=122, not the tall
            plates that ran down to 140. They're shoulder pieces, so they
            have to stop above the chest band entirely; the tall version
            overlapped both the badge and the name tag, which is what made
            the shoulders read as wrong. They're free to be this small
            because the arm/torso join is covered by the torso itself, not
            by them — these are decoration, not a seam cover. */}
        <rect x="38" y="98" width="30" height="24" rx="12" fill="url(#astroLimb)" stroke="#c9c4e0" strokeWidth="1.5" />
        <rect x="112" y="98" width="30" height="24" rx="12" fill="url(#astroLimb)" stroke="#c9c4e0" strokeWidth="1.5" />

        {/* Suit detailing — a centre zip with an amber pull and a belt.
            Enough to read as a puffy pressure suit; any more and it turns
            back into panel-lined machinery.
            The chest reads as stacked bands, none of them colliding: caps
            to 122, seam row at 128, badge + name tag across 129–151, seam
            row at 155, belt from 167. */}
        <path d="M90 116 V164" stroke="#b9b3d6" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="90" cy="159.5" r="3.4" fill="#fbbf24" />
        {/* Belt — deliberately drawn wider than the body and clipped to the
            torso, rather than sized to fit inside it. A straight pill that
            stops short of the edge always reads as a strip laid on top,
            because down at this height the torso is already curving inward
            and the belt's flat ends hang past it; letting the body's own
            outline do the cutting is what makes it wrap instead. The two
            thin bands above and below are the contact shadows that sell it:
            the puffy suit overhangs onto the belt's top edge, and the belt
            casts back onto the suit underneath. */}
        <g clipPath="url(#astroTorsoClip)">
          <rect x="38" y="166.5" width="104" height="14" fill="url(#astroBelt)" />
          <rect x="38" y="166.5" width="104" height="2.2" fill="#a9a2c8" opacity="0.45" />
          <rect x="38" y="180.5" width="104" height="3" fill="#a9a2c8" opacity="0.3" />
        </g>
        {/* Buckle, on top of the belt and centred, so it never reaches the
            clip edge. */}
        <rect x="81" y="167.5" width="18" height="12" rx="3.5" fill="#e9e6f4" stroke="#b0aacc" strokeWidth="1.2" />
        <rect x="86" y="170.5" width="8" height="6" rx="1.5" fill="#c5bfda" opacity="0.8" />

        {/* Chest badge — a placeholder rank/level slot, not just decoration,
            worn on the chest the way a mission patch is rather than
            centred like a logo. A tiny ringed planet ties it to the game's
            own asteroid-mining theme more directly than a generic
            star/diamond would, and leaves room to later tint the circle
            itself by the player's real prestige tier without fighting the
            icon inside it. Ring drawn first, sphere on top: the sphere's
            own circle naturally covers the ring's "behind the planet" arc,
            which is what actually sells the ringed-planet look at this size
            rather than a flat ellipse floating in front of a ball. */}
        <circle cx="68" cy="137" r="11" fill="url(#astroBadge)" />
        <ellipse
          cx="68"
          cy="137"
          rx="8.8"
          ry="2.4"
          fill="none"
          stroke="#fff"
          strokeWidth="1.4"
          opacity="0.9"
          transform="rotate(-20 68 137)"
        />
        <circle cx="68" cy="137" r="4.4" fill="#fff" opacity="0.95" />
        {/* Blank name tag on the opposite chest, on the badge's own centre
            line so the two read as a matched pair rather than as two
            unrelated stickers. */}
        <rect x="101" y="132.5" width="24" height="9" rx="4.5" fill="#fbbf24" opacity="0.85" />

        {/* Neck seal, sitting right at the helmet/suit join. */}
        <rect x="68" y="96" width="44" height="16" rx="8" fill="#b9b3d6" />

        {/* --- Helmet group — the customizable part. --- */}
        <g>
          <circle cx="90" cy="66" r="54" fill="url(#astroShell)" stroke="#b6b0ce" strokeWidth="2" />
          {/* Shading inside the dome, clipped to it: a soft fade along the
              bottom rim, and a bright crescent along the top-left where the
              key light lands. */}
          <g clipPath="url(#astroHelmetClip)">
            <rect x="36" y="90" width="108" height="32" fill="url(#astroHelmetFloor)" />
            <path
              d="M46 42 A54 54 0 0 1 106 15"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </g>
          {/* Visor. */}
          <ellipse cx="88" cy="68" rx="38" ry="33" fill="url(#astroVisor)" />
          <ellipse cx="88" cy="68" rx="38" ry="33" fill="url(#astroVisorDepth)" />
          <ellipse cx="88" cy="68" rx="38" ry="33" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.25" />
          {/* Glossy reflection streak. */}
          <ellipse cx="72" cy="52" rx="13" ry="6.5" fill="#ffffff" opacity="0.6" transform="rotate(-25 72 52)" />
          <ellipse cx="100" cy="86" rx="16" ry="5" fill="#ffffff" opacity="0.12" />
          {/* Two stars from the porthole behind, caught in the glass. */}
          <circle cx="104" cy="60" r="1.6" fill="#ffffff" opacity="0.75" />
          <circle cx="97" cy="72" r="1.1" fill="#ffffff" opacity="0.5" />
          {/* Antenna. */}
          <path d="M124 30 L138 12" stroke="#c9c4e0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="138" cy="12" r="5" fill="#f472b6" className="animate-pulse-glow" />
        </g>
      </motion.svg>
    </div>
  )
}
