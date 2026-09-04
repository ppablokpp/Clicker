import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DEFAULT_STYLE_IDS,
  resolveStyle,
  type AccentStyle,
  type AstronautStyleIds,
  type Ramp,
} from '../lib/astronautStyles'

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
// left) plus rim light rather than by outlines.
//
// Every colour comes from `styleIds` (see lib/astronautStyles.ts) rather
// than being baked in, which is what makes the customization screen a
// matter of passing different ids instead of a second copy of this file.
// The helmet is still its own <g>, and the slots line up with it: helmet,
// suit (torso + arms + gloves + pauldrons), boots, and accents (cuffs, zip
// pull, name tag, antenna light, chest badge, thruster).
//
// The arms are single unbroken puffy tubes ending in mitten gloves — no
// elbow, no wrist, nothing that hinges. That's the specific difference
// from the jointed-limb version that got thrown out for reading as a
// robot: a figurine's limbs are one soft shape, an articulated model's
// are a chain of segments. Still no legs, for the same reason — the boots
// hang straight off the suit and a thruster burns between them.
//
// Gradient ids are namespaced per instance with useId(). SVG ids are global
// to the document, so two avatars in different colourways on one screen
// (a profile beside a preview, say) would otherwise silently share — and
// fight over — the same definitions.
export function AstronautAvatar({
  size = 168,
  styleIds = DEFAULT_STYLE_IDS,
  showSky = true,
}: {
  size?: number
  styleIds?: AstronautStyleIds
  /** The starfield porthole behind the character. Off on the customization
   *  screen, where a background circle would compete with the pickers. */
  showSky?: boolean
}) {
  const uid = useId()
  const svgHeight = size * (VIEWBOX_H / VIEWBOX_W)
  // Same footprint the old glow halo used (1.5x the character's width) — a
  // porthole of Home's own night sky instead of a soft violet aura.
  const skySize = size * 1.5
  const starsDim = useMemo(() => generateStars(130, skySize, 0.5), [skySize])
  const starsBright = useMemo(() => generateStars(36, skySize, 0.9), [skySize])
  const s = useMemo(() => resolveStyle(styleIds), [styleIds])

  const shell = s.helmet.shell
  const body = s.suit.body
  const limb = s.suit.limb
  const boot = s.boots.ramp
  const accent = s.accent
  const bracelet = s.bracelet
  const belt = s.belt

  return (
    <div className="relative" style={{ width: size, height: svgHeight }}>
      {/* Starfield porthole — clipped to a circle via overflow-hidden, with
          a thin rim so it reads as a distinct window rather than blending
          into the page's own identical background. Positioned explicitly
          on the helmet rather than flex-centered against the container,
          since the flame's extra height below would otherwise drag a
          centered porthole down off the head. */}
      {showSky && (
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
      )}
      <motion.svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width={size}
        height={svgHeight}
        // SVG clips to its viewBox by default, and cosmetics are exactly the
        // things that don't respect it — the halo sits above the crown, the
        // shock rings spread past the boots, the wings reach the side edges.
        // Letting the drawing overflow is the right fix rather than growing
        // the viewBox: a bigger box would scale the whole character down to
        // reserve room that almost every combination leaves empty. The
        // starfield porthole is a separate element painted underneath, so it
        // keeps its own circular clip regardless of what spills out here.
        className="relative overflow-visible"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Every volume gradient is a radial lit from the same upper-left
              point (~32% / 24%) — a single consistent light source across
              helmet, suit and gloves is most of what separates a figurine
              from flat vector shapes. */}
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
          <radialGradient id={`${uid}-boot`} cx="34%" cy="22%" r="85%">
            <stop offset="0%" stopColor={boot.from} />
            <stop offset="55%" stopColor={boot.mid} />
            <stop offset="100%" stopColor={boot.to} />
          </radialGradient>
          <linearGradient id={`${uid}-visor`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor={s.helmet.visor.from} />
            <stop offset="45%" stopColor={s.helmet.visor.via} />
            <stop offset="100%" stopColor={s.helmet.visor.to} />
          </linearGradient>
          {/* Laid over the visor: a bright bloom where the light hits and a
              deep falloff at the far edge, which is what makes flat glass
              read as a curved dome. */}
          <radialGradient id={`${uid}-visorDepth`} cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#1b0b33" stopOpacity="0.5" />
          </radialGradient>
          {/* The droid is built from the same shell as the helmet — same
              stops, same outline, same shadow tone on its fins. It's part
              of the astronaut's kit, so it should look like it came out of
              the same factory; in its own fixed colour it read as a prop
              that happened to be flying nearby. Graphite helmets therefore
              keep the dark droid they already had, and every other helmet
              shares the standard shell. */}
          <radialGradient id={`${uid}-petBody`} cx="32%" cy="24%" r="84%">
            <stop offset="0%" stopColor={shell.from} />
            <stop offset="55%" stopColor={shell.mid} />
            <stop offset="100%" stopColor={shell.to} />
          </radialGradient>
          <linearGradient id={`${uid}-pack`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent.pack.from} />
            <stop offset="100%" stopColor={accent.pack.to} />
          </linearGradient>
          <linearGradient id={`${uid}-badge`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent.badge.from} />
            <stop offset="100%" stopColor={accent.badge.to} />
          </linearGradient>
          <linearGradient id={`${uid}-flameOuter`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={accent.flame.outer} />
            <stop offset="100%" stopColor={accent.flame.innerTo} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-flameInner`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor={accent.flame.innerMid} />
            <stop offset="100%" stopColor={accent.flame.innerTo} stopOpacity="0.15" />
          </linearGradient>
          {/* Shading for the bottom of the helmet dome, below the visor.
              A vertical fade rather than a solid-filled ellipse: an ellipse
              at a flat opacity has a visible edge partway up the shell, so
              it read as a dark patch stuck on the helmet instead of as the
              shell curving away from the light. */}
          <linearGradient id={`${uid}-helmetFloor`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3260" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a3260" stopOpacity="0.32" />
          </linearGradient>
          {/* A shallow cylindrical roll across the belt's height, so it has
              thickness instead of being a flat strip. */}
          <linearGradient id={`${uid}-belt`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={belt.band.from} />
            <stop offset="38%" stopColor={belt.band.mid} />
            <stop offset="100%" stopColor={belt.band.to} />
          </linearGradient>
          {/* Keeps the helmet's inner shading inside the dome instead of
              spilling past its edge. */}
          <clipPath id={`${uid}-helmetClip`}>
            <circle cx="90" cy="66" r="54" />
          </clipPath>
          {/* Same idea for the belt: the torso's own silhouette is what
              cuts its ends, so it wraps the body instead of overhanging it. */}
          <clipPath id={`${uid}-torsoClip`}>
            <rect x="44" y="104" width="92" height="90" rx="34" />
          </clipPath>
        </defs>

        {/* Thruster flame — wide enough to show from behind both boots (not
            just glowing in the gap between them) and tucked under the suit
            body, which is drawn after it so the torso's own rounded bottom
            overlaps the flame's top instead of leaving a seam. Animated in
            CSS, not Framer: see .astro-flame in index.css for why the old
            group-opacity version flickered. */}
        {/* Thruster exhaust — the shape is its own slot, the colour comes
            from the trim. Everything here is drawn before the torso so the
            body's rounded bottom overlaps its top instead of leaving a
            seam. */}
        {s.trail.id === 'llama' && (
          <g className="astro-flame">
            <path
              d="M90 178 C120 190 132 206 90 232 C48 206 60 190 90 178 Z"
              fill={`url(#${uid}-flameOuter)`}
              opacity="0.55"
            />
            <path
              className="astro-flame-core"
              d="M90 184 C109 193 116 204 90 221 C64 204 71 193 90 184 Z"
              fill={`url(#${uid}-flameInner)`}
            />
          </g>
        )}
        {/* Ion trail: discrete pulses falling away instead of a plume. */}
        {s.trail.id === 'ionico' && (
          <g className="astro-flame">
            {[
              { cy: 190, r: 11, o: 0.75 },
              { cy: 206, r: 8.5, o: 0.55 },
              { cy: 219, r: 6, o: 0.38 },
              { cy: 229, r: 3.6, o: 0.22 },
            ].map((d) => (
              <circle key={d.cy} cx="90" cy={d.cy} r={d.r} fill={accent.flame.innerTo} opacity={d.o} />
            ))}
          </g>
        )}
        {/* Shock rings: widening as they fall, like pressure waves. */}
        {s.trail.id === 'anillos' && (
          <g className="astro-flame" fill="none" stroke={accent.flame.outer}>
            <ellipse cx="90" cy="192" rx="13" ry="4.5" strokeWidth="4" opacity="0.8" />
            <ellipse cx="90" cy="208" rx="19" ry="6" strokeWidth="3.4" opacity="0.5" />
            <ellipse cx="90" cy="224" rx="25" ry="7.5" strokeWidth="2.8" opacity="0.28" />
          </g>
        )}

        {/* Companions — one per shoulder, each its own slot, and the only
            slots that can be empty (see PET_SHAPES). Everyone starts with
            neither.
            They fly in the two upper corners, the pockets of space the
            character never occupies — far enough out from the helmet's edge
            that no combination of head furniture reaches them. Drawn before
            the body so they can never cover the astronaut.
            The right-hand one is placed at the mirror of the left's x
            (VIEWBOX_W - 8) but is *not* flipped: mirroring would put every
            specular highlight and eye glint on the shadow side and break the
            single key light everything else in this file shares. */}
        <Companion id={s.pet.id} uid={uid} shell={shell} accent={accent} x={8} />
        <Companion id={s.pet2.id} uid={uid} shell={shell} accent={accent} x={VIEWBOX_W - 8} phase={-1.7} />

        {/* Life-support pack — only its shoulders peek out from behind the
            torso, the rest reading as depth behind the arms. Its silhouette
            is a slot; its colour follows the trim, since the pack is what
            the thruster feeds. */}
        {s.pack.id === 'estandar' && (
          <>
            <rect x="30" y="104" width="19" height="46" rx="9" fill={`url(#${uid}-pack)`} />
            <rect x="131" y="104" width="19" height="46" rx="9" fill={`url(#${uid}-pack)`} />
          </>
        )}
        {/* Taller, fatter tanks with visible caps: the heavy-duty kit. */}
        {s.pack.id === 'carga' && (
          <>
            <rect x="22" y="98" width="28" height="60" rx="13" fill={`url(#${uid}-pack)`} />
            <rect x="130" y="98" width="28" height="60" rx="13" fill={`url(#${uid}-pack)`} />
            <rect x="22" y="110" width="28" height="5" fill={accent.color} opacity="0.75" />
            <rect x="130" y="110" width="28" height="5" fill={accent.color} opacity="0.75" />
          </>
        )}
        {/* Swept fins instead of tanks — the only pack that reads as speed. */}
        {s.pack.id === 'aletas' && (
          <>
            <path d="M46 104 L20 132 L46 154 Z" fill={`url(#${uid}-pack)`} />
            <path d="M134 104 L160 132 L134 154 Z" fill={`url(#${uid}-pack)`} />
          </>
        )}
        {/* Horizontal canisters — stacked crosswise, so the outline is
            steps rather than the vertical columns every other pack uses. */}
        {s.pack.id === 'cilindros' && (
          <>
            <rect x="20" y="106" width="42" height="15" rx="7.5" fill={`url(#${uid}-pack)`} />
            <rect x="20" y="126" width="42" height="15" rx="7.5" fill={`url(#${uid}-pack)`} />
            <rect x="118" y="106" width="42" height="15" rx="7.5" fill={`url(#${uid}-pack)`} />
            <rect x="118" y="126" width="42" height="15" rx="7.5" fill={`url(#${uid}-pack)`} />
          </>
        )}
        {/* A single glowing core behind the shoulders — the one pack that
            reads as power rather than as storage. */}
        {s.pack.id === 'reactor' && (
          <>
            <rect x="38" y="102" width="104" height="46" rx="20" fill={`url(#${uid}-pack)`} />
            <circle cx="34" cy="125" r="15" fill={`url(#${uid}-pack)`} />
            <circle cx="146" cy="125" r="15" fill={`url(#${uid}-pack)`} />
            <circle cx="34" cy="125" r="7" fill={accent.color} className="animate-pulse-glow" />
            <circle cx="146" cy="125" r="7" fill={accent.color} className="animate-pulse-glow" />
          </>
        )}
        {/* Full wings — the widest silhouette in the slot by a distance,
            and the only one visible from across a leaderboard row. */}
        {s.pack.id === 'alas' && (
          <>
            <path d="M50 104 C22 106 4 122 2 144 C24 138 40 132 52 148 Z" fill={`url(#${uid}-pack)`} />
            <path d="M130 104 C158 106 176 122 178 144 C156 138 140 132 128 148 Z" fill={`url(#${uid}-pack)`} />
          </>
        )}

        {/* Arms — one continuous round-capped stroke each, no joint
            anywhere along it. Drawn before the pauldrons so the shoulder
            caps overlap where they meet the body. */}
        <g strokeLinecap="round" fill="none">
          <path d="M58 122 C46 136 40 152 41 166" stroke={`url(#${uid}-limb)`} strokeWidth="23" />
          <path d="M122 122 C134 136 140 152 139 166" stroke={`url(#${uid}-limb)`} strokeWidth="23" />
        </g>
        {/* Cuff bands — their own slot (see BraceletStyle), not the suit
            trim, then the mitten gloves they end in. */}
        <ellipse cx="41" cy="163" rx="11.5" ry="4.2" fill={bracelet.color} transform="rotate(-6 41 163)" />
        <ellipse cx="139" cy="163" rx="11.5" ry="4.2" fill={bracelet.color} transform="rotate(6 139 163)" />
        <circle cx="39" cy="177" r="12.5" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />
        <circle cx="141" cy="177" r="12.5" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />
        <path d="M33 180 q6 4 12 0" stroke={limb.stroke} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M135 180 q6 4 12 0" stroke={limb.stroke} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />

        {/* Suit body. */}
        <rect x="44" y="104" width="92" height="90" rx="34" fill={`url(#${uid}-suit)`} />
        {/* Rim light: a bright edge where the key light grazes the left of
            the torso, a cool violet bounce on the right. Two strokes, and
            most of what makes the body read as round rather than as a
            rounded rectangle.
            The key edge takes the suit's own lit face, not a hardcoded
            white — same reason as the helmet's sheen: on a dark suit
            (navy, charcoal) pure white stops reading as light on the
            material and becomes a white line drawn over it. */}
        <path d="M52 128 C46 142 46 160 50 176" stroke={body.from} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M130 132 C134 146 134 162 131 174" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

        {/* Boots — peeking straight out from under the suit's own rounded
            bottom, no leg segment in between. That's the difference from
            the jointed-limb version that read as a robot: there's nothing
            here to hinge, just feet the suit tapers directly into, with the
            thruster flame glowing out from between them. */}
        <rect x="57" y="182" width="28" height="20" rx="9" fill={`url(#${uid}-boot)`} stroke={boot.stroke} strokeWidth="1.5" />
        <rect x="95" y="182" width="28" height="20" rx="9" fill={`url(#${uid}-boot)`} stroke={boot.stroke} strokeWidth="1.5" />
        <path d="M60 196 h22" stroke={boot.seam} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M98 196 h22" stroke={boot.seam} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

        {/* Quilting seams — both pairs, back at the rows they originally
            sat on. They're drawn *before* the pauldrons so the shoulder
            caps sit on top of them the way a real shoulder piece would,
            instead of a seam running across the cap. */}
        <path d="M62 128 H84" stroke={body.seam} strokeWidth="2" strokeLinecap="round" />
        <path d="M96 128 H118" stroke={body.seam} strokeWidth="2" strokeLinecap="round" />
        <path d="M62 155 H84" stroke={body.seam} strokeWidth="2" strokeLinecap="round" />
        <path d="M96 155 H118" stroke={body.seam} strokeWidth="2" strokeLinecap="round" />

        {/* Shoulder pauldrons — thin caps ending at y=122, not the tall
            plates that ran down to 140. They're shoulder pieces, so they
            have to stop above the chest band entirely; the tall version
            overlapped both the badge and the name tag, which is what made
            the shoulders read as wrong. They're free to be this small
            because the arm/torso join is covered by the torso itself, not
            by them — these are decoration, not a seam cover. */}
        <rect x="43" y="98" width="30" height="24" rx="12" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />
        <rect x="107" y="98" width="30" height="24" rx="12" fill={`url(#${uid}-limb)`} stroke={limb.stroke} strokeWidth="1.5" />

        {/* Suit detailing — a centre zip with an accent pull and a belt.
            Enough to read as a puffy pressure suit; any more and it turns
            back into panel-lined machinery.
            The chest reads as stacked bands, none of them colliding: caps
            to 122, seam row at 128, badge + name tag across 129–151, seam
            row at 155, belt from 167. */}
        <path d="M90 116 V164" stroke={body.stroke} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="90" cy="159.5" r="3.4" fill={accent.color} />
        {/* Belt — deliberately drawn wider than the body and clipped to the
            torso, rather than sized to fit inside it. A straight pill that
            stops short of the edge always reads as a strip laid on top,
            because down at this height the torso is already curving inward
            and the belt's flat ends hang past it; letting the body's own
            outline do the cutting is what makes it wrap instead. The two
            thin bands above and below are the contact shadows that sell it:
            the puffy suit overhangs onto the belt's top edge, and the belt
            casts back onto the suit underneath. */}
        <g clipPath={`url(#${uid}-torsoClip)`}>
          <rect x="38" y="166.5" width="104" height="14" fill={`url(#${uid}-belt)`} />
          <rect x="38" y="166.5" width="104" height="2.2" fill="#a9a2c8" opacity="0.45" />
          <rect x="38" y="180.5" width="104" height="3" fill="#a9a2c8" opacity="0.3" />
        </g>
        {/* Buckle, on top of the belt and centred, so it never reaches the
            clip edge. */}
        <rect x="81" y="167.5" width="18" height="12" rx="3.5" fill={belt.band.mid} stroke={belt.band.to} strokeWidth="1.2" />
        <rect x="86" y="170.5" width="8" height="6" rx="1.5" fill={belt.band.from} opacity="0.85" />

        {/* Chest badge — worn the way a mission patch is rather than centred
            like a logo. The disc takes the trim colour and the symbol on it
            is its own slot; the symbol is drawn in white so it stays legible
            whatever the disc underneath is doing. */}
        <circle cx="68" cy="137" r="11" fill={`url(#${uid}-badge)`} />
        <g fill="#fff">
          {/* Ring first, sphere on top: the sphere's own circle covers the
              ring's "behind the planet" arc, which is what sells the ringed
              planet at this size rather than a flat ellipse floating in
              front of a ball. */}
          {s.badge.id === 'planeta' && (
            <>
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
              <circle cx="68" cy="137" r="4.4" opacity="0.95" />
            </>
          )}
          {s.badge.id === 'estrella' && (
            <path
              d="M68 130 L69.65 134.73 L74.66 134.84 L70.66 137.87 L72.12 142.66 L68 139.8 L63.88 142.66 L65.34 137.87 L61.34 134.84 L66.35 134.73 Z"
              opacity="0.95"
            />
          )}
          {s.badge.id === 'rayo' && <path d="M70.5 130 l-5.5 8.4 h3.6 l-2 6.6 6 -8.6 h-3.6 z" opacity="0.95" />}
        </g>
        {/* Name tag on the opposite chest, on the badge's own centre line so
            the two read as a matched pair rather than as two unrelated
            stickers. Fixed, not a slot: it's the counterweight that keeps
            the chest from looking lopsided. */}
        <rect x="101" y="132.5" width="24" height="9" rx="4.5" fill={accent.color} opacity="0.85" />

        {/* Neck seal, sitting right at the helmet/suit join. */}
        <rect x="68" y="96" width="44" height="16" rx="8" fill={body.stroke} />

        {/* --- Helmet group — the customizable part. --- */}
        <g>
          <circle cx="90" cy="66" r="54" fill={`url(#${uid}-shell)`} stroke={shell.stroke} strokeWidth="2" />
          {/* Shading inside the dome, clipped to it: a soft fade along the
              bottom rim, and a sheen along the top-left where the key light
              lands.
              The sheen takes the shell's own lit face rather than a
              hardcoded white — on the light shells those are the same
              colour, but on a dark shell (graphite) pure white stopped
              reading as a highlight and became a white bar stuck across the
              top of the helmet. A specular is the material catching light,
              so it has to come from the material. */}
          <g clipPath={`url(#${uid}-helmetClip)`}>
            <rect x="36" y="90" width="108" height="32" fill={`url(#${uid}-helmetFloor)`} />
            <path
              d="M46 42 A54 54 0 0 1 106 15"
              stroke={shell.from}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </g>
          {/* Visor. */}
          <ellipse cx="88" cy="68" rx="38" ry="33" fill={`url(#${uid}-visor)`} />
          <ellipse cx="88" cy="68" rx="38" ry="33" fill={`url(#${uid}-visorDepth)`} />
          <ellipse cx="88" cy="68" rx="38" ry="33" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.25" />
          {/* Glossy reflection streak. */}
          <ellipse cx="72" cy="52" rx="13" ry="6.5" fill="#ffffff" opacity="0.6" transform="rotate(-25 72 52)" />
          <ellipse cx="100" cy="86" rx="16" ry="5" fill="#ffffff" opacity="0.12" />
          {/* Two stars from the porthole behind, caught in the glass. */}
          <circle cx="104" cy="60" r="1.6" fill="#ffffff" opacity="0.75" />
          <circle cx="97" cy="72" r="1.1" fill="#ffffff" opacity="0.5" />

          {/* Head furniture. The bulb takes the visor's colour so the head
              reads as one piece. */}
          {s.antenna.id === 'estandar' && (
            <>
              <path d="M124 30 L138 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
              <circle cx="138" cy="12" r="5" fill={accent.color} className="animate-pulse-glow" />
            </>
          )}
          {s.antenna.id === 'doble' && (
            <>
              <path d="M124 30 L138 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
              <circle cx="138" cy="12" r="4.6" fill={accent.color} className="animate-pulse-glow" />
              <path d="M56 30 L42 12" stroke={shell.stroke} strokeWidth="3" strokeLinecap="round" />
              <circle cx="42" cy="12" r="4.6" fill={accent.color} className="animate-pulse-glow" />
            </>
          )}
          {s.antenna.id === 'halo' && (
            <ellipse
              cx="90"
              cy="8"
              rx="33"
              ry="8.5"
              fill="none"
              stroke={accent.color}
              strokeWidth="4.5"
              className="animate-pulse-glow"
            />
          )}
        </g>

      </motion.svg>
    </div>
  )
}

// --- Companions ----------------------------------------------------------
// Three of them, and the family resemblance is deliberate: same chassis
// material as the helmet, same trim colour on whatever glows, same
// place → float → tilt rig. What separates them is the outline, because at
// avatar scale that is the only thing left — the droid is a compact box, the
// satellite is wide with panels, the orb is a circle inside two rings.
//
// Each is drawn around its own origin so the only thing that changes between
// the two shoulders is where it's placed.
//
// `phase` shifts the animations with a negative delay, which starts them
// mid-cycle instead of pausing them. Two companions on the same clock bob
// and tilt in perfect lockstep, which reads as one mechanism rather than two
// creatures — the whole illusion depends on them being out of step.

type CompanionProps = { uid: string; shell: Ramp; accent: AccentStyle }

function Companion({
  id,
  uid,
  shell,
  accent,
  x,
  phase = 0,
}: CompanionProps & { id: string; x: number; phase?: number }) {
  if (id === 'ninguna') return null
  const delay = phase ? { animationDelay: `${phase}s` } : undefined
  return (
    <g transform={`translate(${x} 58) scale(0.86)`}>
      <g className="animate-pet-float" style={delay}>
        <g className="animate-pet-tilt" style={delay}>
          {id === 'satelite' && <SatelliteBody uid={uid} shell={shell} accent={accent} delay={delay} />}
          {id === 'orbe' && <OrbBody uid={uid} shell={shell} accent={accent} delay={delay} />}
          {id === 'mascota1' && <DroidBody uid={uid} shell={shell} accent={accent} delay={delay} />}
        </g>
      </g>
    </g>
  )
}

type BodyProps = CompanionProps & { delay: { animationDelay: string } | undefined }

/** The thruster the droid and the satellite share. The orb doesn't get one —
 *  a thing that hovers inside its own rings has no business burning fuel. */
function CompanionThruster({ accent }: { accent: AccentStyle }) {
  return (
    <g className="astro-flame">
      <path d="M0 14 C7 20 8 27 0 36 C-8 27 -7 20 0 14 Z" fill={accent.flame.outer} opacity="0.55" />
      <path className="astro-flame-core" d="M0 17 C4 22 5 27 0 32 C-5 27 -4 22 0 17 Z" fill={accent.flame.innerMid} />
    </g>
  )
}

// The original. It's the one thing on this character with a face, which is
// deliberate: the astronaut's visor stays opaque (its colour is the
// character's signature), so a single big expressive eye puts the
// personality on the piece that can carry it without costing anything.
function DroidBody({ uid, shell, accent, delay }: BodyProps) {
  return (
    <>
      {/* Thruster, drawn first so the chassis overlaps its top. */}
      <CompanionThruster accent={accent} />

      {/* Antenna. */}
      <path d="M0 -14 L0 -23" stroke={shell.stroke} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="0" cy="-25" r="3.2" fill={accent.color} className="animate-pulse-glow" />

      {/* Side fins — the only thing giving it a width beyond the chassis, so
          it doesn't read as a floating ball. */}
      <rect x="-21" y="-7" width="7" height="14" rx="3.5" fill={shell.to} />
      <rect x="14" y="-7" width="7" height="14" rx="3.5" fill={shell.to} />

      {/* Chassis. */}
      <rect
        x="-15"
        y="-14"
        width="30"
        height="28"
        rx="13"
        fill={`url(#${uid}-petBody)`}
        stroke={shell.stroke}
        strokeWidth="1.6"
      />
      {/* Face plate, recessed so the eye sits *in* the droid rather than
          being painted on its front. */}
      <ellipse cx="0" cy="-1" rx="10.5" ry="9" fill="#1b2029" />
      {/* Eye. The blink scales this group, not the plate. */}
      <g className="animate-pet-blink" style={delay}>
        <ellipse cx="0" cy="-1" rx="6" ry="6" fill={accent.color} />
        <ellipse cx="-2" cy="-3.4" rx="2.2" ry="1.7" fill="#ffffff" opacity="0.85" />
      </g>
      {/* Specular streak across the top of the shell. */}
      <ellipse cx="-4" cy="-10" rx="6.5" ry="2.2" fill="#ffffff" opacity="0.35" transform="rotate(-18 -4 -10)" />
    </>
  )
}

// The wide one. Solar panels on struts take it out to ±30 against the droid's
// ±21, which is the whole point — with one on each shoulder, the pair has to
// be tellable apart from across a leaderboard row. It stops there rather than
// going wider: past about ±30 the outer panel clears the helmet's edge and
// starts reaching for whatever container the avatar happens to sit in.
//
// It trades the droid's round eye for a scanning visor slit, and its bulb
// antenna for a dish. Both changes say the same thing: this one is equipment,
// where the droid is a creature.
function SatelliteBody({ uid, shell, accent, delay }: BodyProps) {
  // One panel, mirrored. `dir` is -1 for the left wing, 1 for the right.
  const panel = (dir: number) => {
    const inner = dir < 0 ? -16 : 13
    const outer = dir < 0 ? -30 : 14
    return (
      <g key={dir}>
        {/* Strut out to the panel. */}
        <rect x={inner} y="-1.6" width="4" height="3.2" fill={shell.stroke} />
        <rect
          x={outer}
          y="-8"
          width="16"
          height="16"
          rx="2"
          fill={accent.pack.to}
          stroke={shell.stroke}
          strokeWidth="1.4"
        />
        {/* Cell divisions — three narrow strips read as a panel where a flat
            rectangle just reads as a flag. */}
        <g stroke={shell.stroke} strokeWidth="1" opacity="0.55">
          <path d={`M${outer + 5.33} -8 V8`} />
          <path d={`M${outer + 10.67} -8 V8`} />
          <path d={`M${outer} 0 H${outer + 16}`} />
        </g>
        {/* Panel glare — a single raking highlight, same upper-left light. */}
        <path
          d={`M${outer + 1} 7 L${outer + 8} -7`}
          stroke="#ffffff"
          strokeWidth="2.2"
          opacity="0.16"
          strokeLinecap="round"
        />
      </g>
    )
  }

  return (
    <>
      <CompanionThruster accent={accent} />

      {/* Dish antenna. A bowl seen from below, with its feed horn as the
          trim-coloured point — the one bright spot up top, the same job the
          droid's antenna bulb does. */}
      <path d="M0 -12 L0 -19" stroke={shell.stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M-9 -20 A9.5 9.5 0 0 1 9 -20 Z"
        fill={shell.to}
        stroke={shell.stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="-21.5" r="2.4" fill={accent.color} className="animate-pulse-glow" />

      {panel(-1)}
      {panel(1)}

      {/* Chassis — boxier and squatter than the droid's, so even with the
          panels hidden it wouldn't be mistaken for it. */}
      <rect
        x="-13"
        y="-12"
        width="26"
        height="24"
        rx="7"
        fill={`url(#${uid}-petBody)`}
        stroke={shell.stroke}
        strokeWidth="1.6"
      />
      {/* Visor slit. A dim full-width bar underneath keeps the slit legible
          at every frame; the bright segment on top is what sweeps. Its travel
          (±4.5) plus its half-width (3) stays inside the plate's own half-
          width (9.5), so the bar never needs clipping. */}
      <rect x="-9.5" y="-4.5" width="19" height="9" rx="4.5" fill="#1b2029" />
      <rect x="-7" y="-2" width="14" height="4" rx="2" fill={accent.color} opacity="0.28" />
      <g className="animate-pet-scan" style={delay}>
        <rect x="-3" y="-2.2" width="6" height="4.4" rx="2.2" fill={accent.color} />
      </g>
      {/* Specular streak across the top of the chassis. */}
      <ellipse cx="-3.5" cy="-8.5" rx="5.5" ry="2" fill="#ffffff" opacity="0.35" transform="rotate(-18 -3.5 -8.5)" />
    </>
  )
}

// The round one. No fins, no thruster, no face plate — a core inside two
// crossed rings that keep turning at different speeds, which is what makes it
// read as a gyroscope rather than as a ball.
//
// It still blinks. That's what keeps it a pet: the rings are the machine, the
// core is the animal, and without the blink it would just be a prop orbiting
// the astronaut's shoulder.
function OrbBody({ uid, shell, accent, delay }: BodyProps) {
  return (
    <>
      {/* Rings, behind the core. Struck in the trim colour and translucent so
          the half passing behind the sphere still reads as one continuous
          ring rather than as two unrelated arcs. */}
      <g className="animate-pet-orbit" style={delay}>
        <ellipse cx="0" cy="0" rx="26" ry="8.5" fill="none" stroke={accent.color} strokeWidth="2.6" opacity="0.55" />
      </g>
      <g className="animate-pet-orbit-alt" style={delay}>
        <ellipse
          cx="0"
          cy="0"
          rx="22"
          ry="7"
          fill="none"
          stroke={accent.color}
          strokeWidth="2"
          opacity="0.32"
          transform="rotate(62)"
        />
      </g>

      {/* Shell. */}
      <circle cx="0" cy="0" r="15" fill={`url(#${uid}-petBody)`} stroke={shell.stroke} strokeWidth="1.6" />
      {/* Recessed well, so the core sits *in* the sphere. */}
      <circle cx="0" cy="0" r="10.5" fill="#1b2029" />
      {/* Core — the eye, and the reason this thing is alive. */}
      <g className="animate-pet-blink" style={delay}>
        <circle cx="0" cy="0" r="9" fill={accent.color} opacity="0.22" />
        <circle cx="0" cy="0" r="6.5" fill={accent.color} />
        <ellipse cx="-2.2" cy="-2.6" rx="2.4" ry="1.8" fill="#ffffff" opacity="0.85" />
      </g>
      {/* Specular streak across the top of the sphere. */}
      <ellipse cx="-4.5" cy="-10.5" rx="6" ry="2.1" fill="#ffffff" opacity="0.35" transform="rotate(-24 -4.5 -10.5)" />
    </>
  )
}
