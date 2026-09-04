// The swarm's quadcopter, built as a figurine rather than a glyph — same
// language as the astronaut and the fighter: chunky forms, one light source
// in the upper left, a recessed dark well with glass in it, and a specular
// streak on the shell's shoulder.
//
// Shared between Home's orbiting swarm, the tree's Drones node, Home's "Auto"
// pill and the fleet-away modal.
//
// --- Tinted airframe, neutral lens -----------------------------------------
// The airframe — shell, struts, motors — is `currentColor`, so the swarm tints
// it: violet for the autoclick drones, amber for the scouts. The rotor blur
// and the camera glass stay neutral grey, so the colour lands on the machine
// and nowhere else. Four tinted hazes around four motors would just be four
// more accent masses, and the accent already has the whole airframe.
//
// What stops that being neon is that the tint is never laid down at full
// strength. Every surface is knocked back over the near-black page first, so
// what you get is *paint under light* rather than light itself: lit rims at
// 70%, bodies at 49%, struts at 50%. A solid accent fill was the whole
// problem, not the hue.
//
// The lens is the one thing that does NOT take the colour, and that's a
// reversal from an earlier pass. When the airframe was grey the lens carried
// the swarm's identity; now that the airframe carries it, a tinted lens
// landed between the shell's rim and its body — in amber, exactly on the body
// tone — and simply vanished. Neutral dark glass against a coloured shell is
// the higher-contrast arrangement and the more honest one: real lenses aren't
// the colour of the airframe.
//
// --- Why the volume is stacked solids and not a gradient -------------------
// The fighter gets real radial gradients because there are exactly two of it.
// This can't:
//
//   1. It renders between 14px and 30px, where gradient subtlety doesn't
//      resolve anyway.
//   2. The swarm is uncapped. Gradients live in <defs>, and putting a set
//      inside each instance's own <svg> would mean hundreds of duplicate
//      definitions sharing ids. A gradient stop written `currentColor` also
//      resolves against the gradient element rather than whoever references
//      it, so one shared definition couldn't be tinted per swarm anyway.
//
// The stand-in is the same idea at lower resolution, and it tints itself: lay
// the tint down once at the lit strength, then cover the shape *offset
// down-right and shrunk by the same amount* with a near-black at low alpha, so
// its far edge lands exactly on the base's. What survives is a lit rim along
// the top-left and a darker body — two shapes, no gradients, no ids.
//
// --- What it costs ---------------------------------------------------------
// 23 shapes, paid once per drone at mount — not per frame, because nothing in
// here animates. Cheaper overall than the flat version it replaced: the swarm
// no longer wraps this in a drop-shadow aura, so nobody traces and blurs its
// alpha silhouette any more, and the scale pulse that used to run on every
// member of an uncapped swarm is gone too.
//
// Three things deliberately left out, all for that budget and all for the same
// reason: at 20px a motor pod is barely 2px across, so anything drawn *inside*
// one is smaller than a pixel.
//   - No highlight pass along the struts.
//   - No specular on the pods.
//   - No rotor flicker. It was cut back when this sat inside a
//     `filter: drop-shadow`, where anything moving forced a re-trace of the
//     whole alpha silhouette. That filter is gone now, but the flicker stays
//     gone regardless: it was six opacity changes a second, per drone, on an
//     uncapped swarm.

/** Motor positions, shared by the wash, the struts and the pods. */
const PODS: [number, number][] = [
  [6.5, 6.5],
  [25.5, 6.5],
  [6.5, 25.5],
  [25.5, 25.5],
]

/** The shading pass. Near-black rather than pure black so it cools the tint
 *  toward the page instead of just greying it out. */
const SHADE = '#05070b'

/** Rotor blur — the grey the airframe itself used to be, before the swarm's
 *  tint moved onto it. Kept neutral on purpose: the haze is the one thing on
 *  the drone that shouldn't compete for attention. At 0.14 over the page it
 *  lands around #1c1d20, which is barely off the background. */
const ROTOR = '#9AA1AE'

/** Camera glass. Deliberately neutral — the one part of the drone that isn't
 *  the swarm's colour, so it reads against the shell whatever that shell is. */
const GLASS = {
  well: '#0F1218',
  pane: '#28303C',
  pupil: '#0B0E13',
}

export function DroneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Rotor blur. Grey, not the swarm's colour, and barely there: spinning
          blades are a haze you look straight through, so this is the one part
          of the drone that should never draw the eye. It's also the reason
          nothing here is tinted — a coloured haze around every motor is four
          more accent masses, and the accent already has the whole airframe. */}
      <g fill={ROTOR} opacity={0.14}>
        {PODS.map(([x, y]) => (
          <circle key={`w${x}-${y}`} cx={x} cy={y} r={5.2} />
        ))}
      </g>

      {/* Struts. Fat round-capped tubes instead of the hairlines they were —
          at this size that thickness alone is most of what turns a schematic
          into an object. Group opacity rather than a second dark pass: it
          composites the four as one, so where they meet in the middle they
          can't double-darken, and it costs four shapes instead of eight. */}
      <g stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" opacity={0.5}>
        {PODS.map(([x, y]) => (
          <line key={`a${x}-${y}`} x1={16} y1={16} x2={x} y2={y} />
        ))}
      </g>

      {/* Motor pods, domed by the offset-and-shrink trick: the shading disc's
          lower-right edge lands on the base's, so what's left of the base is a
          lit crescent along the top-left. 0.7 tint on the rim, 0.49 in the
          body — the same two steps the shell uses. */}
      {PODS.map(([x, y]) => (
        <g key={`p${x}-${y}`}>
          <circle cx={x} cy={y} r={3.2} fill="currentColor" opacity={0.7} />
          <circle cx={x + 0.45} cy={y + 0.45} r={2.75} fill={SHADE} opacity={0.3} />
        </g>
      ))}

      {/* Shell, same two-shape dome at rounded-square scale.
          Its width has a hard ceiling, and it is not a matter of taste. A
          motor reaches 8.76 inward along the diagonal; the shell's own corner
          reaches (x + rx) - rx/sqrt(2) outward. When those crossed — which
          they did at 13.6 wide — the strut between them vanished completely
          and the motors read as stuck to the corners of a box. Measured
          leftovers: 10 wide leaves 3.35 units of clear strut, 11.6 leaves
          2.73, 12 leaves 2.56, 13.6 leaves 1.90 and looks welded. 11.6 is as
          big as this goes while a strut still reads. */}
      <rect x="10.2" y="10.2" width="11.6" height="11.6" rx="4.4" fill="currentColor" opacity={0.7} />
      <rect x="10.9" y="10.9" width="10.9" height="10.9" rx="3.9" fill={SHADE} opacity={0.3} />

      {/* Camera. A recessed well, the glass, a pupil offset down-right away
          from the light — a lens is a well, not a disc — and one small hard
          glint. At r=3.5 inside an 11.6-wide shell it leaves 2.3 units of body
          around it, enough that the drone still reads as a machine carrying a
          camera rather than as a camera with struts. */}
      <circle cx="16" cy="16" r="3.5" fill={GLASS.well} />
      <circle cx="16" cy="16" r="2.45" fill={GLASS.pane} />
      <circle cx="16.35" cy="16.35" r="1.35" fill={GLASS.pupil} opacity={0.7} />
      <circle cx="15.2" cy="15.2" r="0.8" fill="#ffffff" opacity={0.85} />

      {/* Specular on the shell's shoulder, the same rotated ellipse the
          astronaut, the companions and the fighter all wear. */}
      <ellipse cx="13.2" cy="12.6" rx="1.9" ry="0.75" fill="#ffffff" opacity={0.45} transform="rotate(-26 13.2 12.6)" />
    </svg>
  )
}
