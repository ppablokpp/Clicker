// The swarm's quadcopter, built as a figurine rather than a glyph — same
// language as the astronaut and the gunner: chunky forms, one light source
// in the upper left, a recessed dark well with glass in it, and a specular
// streak on the shell's shoulder.
//
// Shared between Home's orbiting swarm, the tree's Drones node, Home's "Auto"
// pill and the fleet-away modal.
//
// --- Neutral airframe, colour only where hardware is -------------------------
// The whole machine is graphite. No tint on the shell, the struts or the pod
// bodies — the swarm's colour appears only on the parts that on a real drone
// are a different component: the camera lens (plus the halo its light throws
// on the shell) and the anodised hub capping each of the four motors.
//
// Five points of colour, spread from the centre to the four corners. The lens
// alone was tried first and it's a single point in the middle, which is easy
// to lose in an orbit full of moving drones; the hubs put the same colour out
// at the extremes of the silhouette, so the swarm reads before the drone does.
//
// That's how two drones of different roles actually differ in real life. They
// come off the same line in the same matte plastic, and what tells them apart
// is a light. Painting the airframe was what made these read as toys; painting
// a stripe on it read better but still read as livery on a prop. One lit lens
// on identical hardware reads as equipment.
//
// The lens being the tinted part is a REVERSAL of what this file used to say,
// and the reversal is the point. The old rule — "the lens must never take the
// swarm's colour" — was correct while the airframe was tinted: an amber lens
// on an amber body landed on the same tone and vanished. With a graphite body
// that argument inverts completely. The lens is now the single
// highest-contrast spot on the drone, dead centre, which is exactly where the
// one piece of colour should go.
//
// It also happens to be the only spot with enough area. At 22px the scale
// factor is 0.69, and every smaller accent was tried across earlier passes and
// lost: a 0.55-wide guard ring is 0.38 of a pixel, an r=1 nav light is 0.69.
// The lens pane at r=2.45 is a 3.4px disc of solid colour. It survives.
//
// Which is also why the pupil is gone. It used to be a near-black disc offset
// down-right, and on a tinted pane it ate the middle and left a 0.75px ring of
// actual colour. The dimming is done with a translucent shade instead, so the
// centre stays hued and the whole disc reads as one lit lens.
//
// --- Why the volume is stacked solids and not a gradient -------------------
// The gunner gets real radial gradients because there are exactly two of it.
// This can't:
//
//   1. It renders between 14px and 30px, where gradient subtlety doesn't
//      resolve anyway.
//   2. The swarm is uncapped, and this icon is mounted from four different
//      places (Home's swarm, the tree node, the "Auto" pill, the fleet-away
//      modal). A shared <defs> would have to live above all four — and one
//      inside each instance would mean hundreds of duplicate ids.
//
// The stand-in is the same idea at lower resolution: lay a shape down in its
// lit tone, then cover it *offset down-right and shrunk by the same amount*
// with the shadow tone, so its far edge lands exactly on the base's. What
// survives is a lit rim along the top-left and a darker body — two shapes, no
// gradients, no ids. The struts get the two-stroke cylinder instead: a fat
// dark tube with a thinner light pass along its upper-left flank, which is
// exactly what HomeGunner does to its cannons.
//
// --- What it costs ---------------------------------------------------------
// 34 shapes, paid once per drone at mount — not per frame, because nothing in
// here animates. Cheaper overall than the flat version this line replaced: the
// swarm no longer wraps it in a drop-shadow aura, so nobody traces and blurs
// its alpha silhouette any more, and the scale pulse that used to run on every
// member of an uncapped swarm is gone too.
//
// Deliberately left out, all for that budget and all for the same reason —
// at 20px a motor pod is barely 2px across, so anything drawn *inside* one is
// smaller than a pixel:
//   - No glint on the motor hubs.
//   - No nav lights, guard rings or livery stripes.
//   - No rotor flicker. It was six opacity changes a second, per drone, on an
//     uncapped swarm.

/** Motor positions, shared by the wash, the struts and the pods. */
const PODS: [number, number][] = [
  [6.5, 6.5],
  [25.5, 6.5],
  [6.5, 25.5],
  [25.5, 25.5],
]

/** The airframe. Matte graphite, and deliberately not near-black: on a
 *  #08080c page a truly black drone has nothing separating it from the
 *  background and the whole thing reads as a smudge. Warm-neutral rather than
 *  blue-grey, so it reads as plastic instead of steel. */
const FRAME = {
  lit: '#454A54',
  body: '#22262D',
  tube: '#171A20',
}

/** The shading pass. Near-black rather than pure black so it cools a surface
 *  toward the page instead of just greying it out — and, on the lens, dims the
 *  centre without draining the hue out of it. */
const SHADE = '#05070b'

/** Rotor blur — kept neutral on purpose: the haze is the one thing on the
 *  drone that shouldn't compete for attention. At 0.13 over the page it lands
 *  around #1b1c1f, barely off the background. */
const ROTOR = '#9AA1AE'

export function DroneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Rotor blur. Grey, and barely there: spinning blades are a haze you
          look straight through. */}
      <g fill={ROTOR} opacity={0.13}>
        {PODS.map(([x, y]) => (
          <circle key={`w${x}-${y}`} cx={x} cy={y} r={5.2} />
        ))}
      </g>

      {/* Struts, as cylinders rather than flat bars: a fat dark tube with a
          thinner light pass along its upper-left flank. Only the two arms
          facing the light get the pass, and the right one at half strength —
          lighting all four would cancel the light source out. */}
      <g strokeLinecap="round">
        <g stroke={FRAME.tube} strokeWidth={3.5}>
          {PODS.map(([x, y]) => (
            <line key={`a${x}-${y}`} x1={16} y1={16} x2={x} y2={y} />
          ))}
        </g>
        <g stroke={FRAME.lit} strokeWidth={1.5}>
          <line x1={15.3} y1={15.3} x2={6.2} y2={6.2} opacity={0.9} />
          <line x1={16.7} y1={15.3} x2={25.8} y2={6.2} opacity={0.45} />
        </g>
      </g>

      {/* Motor pods, domed by the offset-and-shrink trick: the shading disc's
          lower-right edge lands on the base's, so what's left of the base is a
          lit crescent along the top-left.
          The whole pod is the anodised part, hub and housing both — on real
          hardware the motor bell is very often exactly that. Four of them
          sitting at the corners of the silhouette is what makes the swarm
          readable at a glance: the lens alone is a single point in the middle,
          and in an orbit full of moving drones one point is easy to lose. Each
          cap is only about a pixel across at size, but the eye integrates four
          of them across the whole shape rather than resolving any one. */}
      {PODS.map(([x, y]) => (
        <g key={`p${x}-${y}`}>
          <circle cx={x} cy={y} r={3.2} fill="currentColor" />
          <circle cx={x + 0.5} cy={y + 0.5} r={2.7} fill={SHADE} opacity={0.55} />
          <circle cx={x} cy={y} r={1.6} fill="currentColor" />
          <circle cx={x + 0.3} cy={y + 0.3} r={1.3} fill={SHADE} opacity={0.3} />
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
      <rect x="10.2" y="10.2" width="11.6" height="11.6" rx="4.4" fill={FRAME.lit} />
      <rect x="10.9" y="10.9" width="10.9" height="10.9" rx="3.9" fill={FRAME.body} />

      {/* The eye, and the only colour on the machine.
          A recessed well, then the lens itself at full strength, then a
          translucent shade offset down-right away from the light so the glass
          still reads as a curved well rather than a flat sticker — dimmed but
          never drained, which is why this is a wash and not the opaque pupil
          that used to sit here. The bright ring is the housing catching the
          lens's own light; the halo outside it is that light spilling onto the
          shell, which is what sells it as lit rather than painted. */}
      <circle cx="16" cy="16" r="4.6" fill="currentColor" opacity={0.24} />
      <circle cx="16" cy="16" r="3.5" fill="#07090C" />
      <circle cx="16" cy="16" r="2.45" fill="currentColor" />
      <circle cx="16.4" cy="16.4" r="1.95" fill={SHADE} opacity={0.42} />
      <circle cx="16" cy="16" r="2.45" fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.9} />
      <circle cx="15.25" cy="15.25" r="0.85" fill="#ffffff" opacity={0.9} />

      {/* Specular on the shell's shoulder, the same rotated ellipse the
          astronaut, the companions and the gunner all wear. */}
      <ellipse cx="13.2" cy="12.6" rx="1.9" ry="0.75" fill="#ffffff" opacity={0.4} transform="rotate(-26 13.2 12.6)" />
    </svg>
  )
}
