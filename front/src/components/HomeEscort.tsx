import { memo } from 'react'

// Escolta — first pass. Nothing renders it yet: no tree node, no station, no
// behaviour. This file exists to be looked at and argued with.
//
// It wears the Artillero's exact paint (same HULL ramp, same sand BAND, same
// 32%/24% key light) on purpose — same air force, same sun. Everything that
// distinguishes it is FORM, which is the harder discipline and the one that
// survives at 60px:
//
//   Artillero: one sharp delta, narrow, nose-forward. Reads as a weapon.
//   Escolta:   a broad slab with outriggers bolted to it. Reads as a hull you
//              stand behind.
//
// Silhouette decisions, each against the fighter:
//   - Blunt chamfered bow instead of a point. A support ship doesn't need to
//     get anywhere first.
//   - Parallel-sided midsection where the fighter tapers the whole way, so the
//     two are told apart by their outline alone with no detail resolved.
//   - Notched stern. The fighter's tail is a clean straight trailing edge; the
//     notch is the one place this outline is busier than its.
//   - Outrigger pods on stub booms, standing where the fighter's cannons are.
//     Same "fat tube plus a thinner light pass along its upper-left flank"
//     cylinder trick, so the family read holds even though the parts differ.
//   - A bridge STRIP rather than a single-seat bubble — the same five-shape
//     glass build (well, pane, depth wash, rim, glint), just long instead of
//     round. Crewed vessel versus one pilot, stated in one shape.
//   - An open belly bay. The tell for what this thing is FOR, and the only
//     place the hull is broken.
//
// It carries more sand than the fighter does (bow chevron, pod bands, bay
// lip). That's deliberate and historically right — tenders and support craft
// wear high-visibility markings where combat aircraft don't — and it earns
// its keep on a #08080c page, where the olive alone is nearly invisible.
//
// Static by design for this pass: no animation, no bolts, no engine glow. It
// holds station and it doesn't shoot. Anything moving can be added once we
// know where it lives and what it's for.
//
// Drawn nose-up, so whatever ends up positioning it can aim it by rotating a
// parent, exactly as HomeGunner does.

/** Same ramp as HomeGunner's HULL — lit face, mid tone, shadow side, outline. */
const HULL = {
  lit: '#8D9755',
  mid: '#5D6532',
  shade: '#333A19',
  stroke: '#242911',
}

/** Same sand as HomeGunner's BAND. */
const BAND = {
  lit: '#E3D6A2',
  shade: '#A99A63',
}

/** Bigger than the fighter's 62 — it should read as the larger vessel before
 *  any detail resolves. */
const DEFAULT_SIZE = 78

export const HomeEscort = memo(function HomeEscort({ size = DEFAULT_SIZE }: { size?: number }) {
  return (
    <svg
      viewBox="-46 -44 92 88"
      width={size}
      height={size}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Same upper-left key light every gradient in AstronautAvatar and
            HomeGunner uses. Ids are namespaced so this can sit on the same
            page as a gunner without either stealing the other's defs. */}
        <radialGradient id="escortHull" cx="32%" cy="24%" r="88%">
          <stop offset="0%" stopColor={HULL.lit} />
          <stop offset="52%" stopColor={HULL.mid} />
          <stop offset="100%" stopColor={HULL.shade} />
        </radialGradient>
        <linearGradient id="escortBand" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor={BAND.lit} />
          <stop offset="100%" stopColor={BAND.shade} />
        </linearGradient>
        <linearGradient id="escortGlass" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#F3ECCB" />
          <stop offset="55%" stopColor={BAND.lit} />
          <stop offset="100%" stopColor="#9C8F5C" />
        </linearGradient>
        <radialGradient id="escortGlassDepth" cx="34%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#12140A" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* --- Outriggers, under the hull so it sits proud of them ---------- */}
      {/* Stub booms. Fat dark tube, thinner light pass along the upper-left
          flank — the same two-stroke cylinder the fighter's cannons use. */}
      <g strokeLinecap="round">
        <g stroke={HULL.shade} strokeWidth={5.2}>
          <line x1="-26" y1="-6" x2="-36" y2="-6" />
          <line x1="26" y1="-6" x2="36" y2="-6" />
        </g>
        <g stroke={HULL.mid} strokeWidth={3} strokeOpacity={0.9}>
          <line x1="-26" y1="-7" x2="-36" y2="-7" />
          <line x1="26" y1="-7" x2="36" y2="-7" />
        </g>
      </g>

      {/* Pods. Tall rounded slabs, so the craft's widest points are blunt
          verticals — the opposite of the fighter, whose widest points are two
          swept tips. */}
      {[-1, 1].map((dir) => (
        <g key={dir}>
          <rect
            x={dir < 0 ? -45 : 36}
            y="-17"
            width="9"
            height="22"
            rx="4.5"
            fill="url(#escortHull)"
            stroke={HULL.stroke}
            strokeWidth="1.2"
          />
          {/* Band across the pod — the echo of the fighter's wing stripes on
              this craft's most wing-like part. */}
          <rect x={dir < 0 ? -45 : 36} y="-6" width="9" height="4.6" fill="url(#escortBand)" />
          {/* Nav light on the tip, domed the way DroneIcon's pods are: a base
              plus a darker copy offset down-right, leaving a lit crescent. */}
          <circle cx={dir * 40.5} cy="-14" r="2.1" fill={BAND.lit} />
          <circle cx={dir * 40.5 + 0.4} cy="-13.6" r="1.7" fill={BAND.shade} />
        </g>
      ))}

      {/* --- Hull ---------------------------------------------------------- */}
      {/* Blunt bow, chamfered shoulders, near-parallel sides, notched stern.
          Nine points where the fighter has four, and every one of them is
          working to make the outline read as mass rather than as an edge. */}
      <path
        d="M-13 -32 L13 -32 L26 -14 L30 12 L18 24 L0 18 L-18 24 L-30 12 L-26 -14 Z"
        fill="url(#escortHull)"
        stroke={HULL.stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Rim light on the two lit edges only — the top of the bow and the
          left chamfer. Both inset a constant 0.9 along their own inward
          normal, so neither drifts off its edge the way the fighter's first
          rim did. A rim on the shadow side would cancel the light source. */}
      <path d="M-11.5 -31.1 L11.5 -31.1" stroke={HULL.lit} strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
      <path d="M-13.83 -29.31 L-23.71 -15.63" stroke={HULL.lit} strokeWidth="1.5" strokeLinecap="round" opacity={0.75} />

      {/* Transverse panel lines. The fighter has one seam running WITH its
          airframe, down the spine; a slab wants the opposite, banding across
          the beam, which is also the cheapest way to say "this is wide". */}
      <g stroke={HULL.shade} strokeWidth="1.1" strokeLinecap="round" opacity={0.5}>
        <path d="M-24 0 H24" />
        <path d="M-25 8 H25" />
      </g>

      {/* Bow chevron. The fighter's sand is two wing chords; this is one band
          wrapping the nose, pointing back — same paint, opposite gesture. */}
      <path
        d="M-17.3 -26 L0 -21 L17.3 -26 L20.2 -22 L0 -17 L-20.2 -22 Z"
        fill="url(#escortBand)"
      />

      {/* --- Bridge -------------------------------------------------------- */}
      {/* The astronaut's visor build, stretched: recessed well, tinted pane,
          depth wash, bright rim, hard glint on the shoulder. Long instead of
          round is the whole difference between a crew and a pilot. */}
      <rect x="-13" y="-16.5" width="26" height="9" rx="4.5" fill="#12140A" />
      <rect x="-11" y="-15.4" width="22" height="6.8" rx="3.4" fill="url(#escortGlass)" />
      <rect x="-11" y="-15.4" width="22" height="6.8" rx="3.4" fill="url(#escortGlassDepth)" />
      <rect
        x="-11"
        y="-15.4"
        width="22"
        height="6.8"
        rx="3.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.85"
        opacity={0.3}
      />
      {/* Mullions — what turns one long pane into a row of windows. */}
      <g stroke="#12140A" strokeWidth="0.9" opacity={0.55}>
        <path d="M-3.7 -15.4 V-8.6" />
        <path d="M3.7 -15.4 V-8.6" />
      </g>
      <ellipse cx="-6.5" cy="-13.8" rx="2.4" ry="0.9" fill="#ffffff" opacity={0.55} transform="rotate(-14 -6.5 -13.8)" />

      {/* --- Belly bay ------------------------------------------------------ */}
      {/* Open, and the only break in the hull. This is the tell: the fighter
          is solid all the way through, and this one has somewhere to put
          things. The sand lip is what stops it reading as a hole. */}
      <rect x="-11.5" y="4" width="23" height="12" rx="2.5" fill="#12140A" />
      <rect x="-11.5" y="13.6" width="23" height="2.4" rx="1.2" fill="url(#escortBand)" />
      {/* Clamps inside the bay, catching a little light. */}
      <g fill={HULL.mid} opacity={0.9}>
        <rect x="-8.5" y="6" width="3" height="6" rx="1.5" />
        <rect x="5.5" y="6" width="3" height="6" rx="1.5" />
      </g>

      {/* Stern nozzles, unlit — it holds station, it isn't burning. Same
          domed-pod trick, dark on dark, so they read as depth not as glow. */}
      <g>
        <circle cx="-9" cy="20.5" r="2.8" fill={HULL.shade} />
        <circle cx="-9.4" cy="20.1" r="2.2" fill="#12140A" />
        <circle cx="9" cy="20.5" r="2.8" fill={HULL.shade} />
        <circle cx="8.6" cy="20.1" r="2.2" fill="#12140A" />
      </g>
    </svg>
  )
})
