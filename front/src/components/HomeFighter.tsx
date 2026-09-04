import { memo } from 'react'

// Escort fighters holding station outside the drone swarm, noses permanently
// on the asteroid, firing from both cannons.
//
// PARKED. Home passes count={0}, so none of this mounts today. It's waiting on
// a tree node that doesn't exist yet; when it does, that node's owned level
// becomes the count and the escort grows with it. Nothing else needs touching
// — the fan, the firing stagger and the aiming all derive from that number.
//
// Self-contained on purpose: geometry, keyframes, radius and angles all live
// in this one file, so it can be dropped outright by deleting the file and the
// single line in Home.tsx that renders it.
//
// Olive drab (#5D6532) with sand wing flashes — military livery rather than
// a swarm colour, and that's the point. Violet is the autoclick drones and
// amber the scouts; both are *energy* colours, and those units read as
// projected power. This is hardware, so it wears paint.
//
// Deliberately not red, which was the obvious "combat" pick. Red is already
// spoken for in this UI — the legendary tree node, a lost duel's card, every
// error line — so a friendly craft fighting *for* you wearing it would work
// against language the rest of the game has already established. The tracer
// fire carries the aggression instead: white-hot with a pale blue halo, which
// is also what keeps the guns reading against a dark hull.
//
// The one cost of a hull this dark on a #08080c page is that it has very
// little to separate it from the background on its own. The sand carries that
// load, which is why it's a real mass and not a hairline.
//
// --- Drawn as a figurine, like the astronaut ------------------------------
// Volume, not line art: a material ramp under a radial key light in the upper
// left, a recessed dark well with glass in it, rim light on the lit edge only,
// and a rotated specular ellipse on the shoulder. Every one of those is
// lifted straight from AstronautAvatar, and the light sits at the same 32%/24%
// so a fighter and the astronaut read as lit by one sun.
//
// Gradients are affordable here in a way they are not in DroneIcon: these are
// 62px, in one fixed paint, and however many there are they're all identical —
// so the definitions live once at the top of this file and every craft
// references them. DroneIcon has the opposite constraints (per-swarm tint,
// 14-30px) and builds the same volume out of stacked solids instead; its own
// comment explains why.
//
// No coloured aura on it, and none on the drones any more either. A halo
// around a shaded object reads as neon and undoes the shading it sits on. It
// was also the single most expensive thing on screen: a `filter` has to trace
// and blur an element's entire alpha silhouette, and with bolts moving through
// this one that would have meant redoing it every frame.
//
// --- What it costs --------------------------------------------------------
// At count 0 it's one comparison and a null, so today the answer is nothing at
// all: no elements, no <style>, no gradient defs.
//
// Switched on, `memo` is what keeps it honest. Home re-renders about ten times
// a second off the autoclick tick alone with nothing on screen having changed,
// and the only prop here is a number — so this renders once and then only
// again when the count actually moves. OrbitingBots next door is wrapped for
// precisely this reason.
//
// After that there is no JavaScript here at all. Nothing runs per shot: the
// bolts, the recoil and the timing offsets are CSS keyframes on the
// compositor, fully decoupled from React's render cycle. Three animations per
// craft — one recoil, two bolts — every one animating `transform` and
// `opacity` only, so no frame ever costs a layout or a repaint. The bolts
// additionally sit at `visibility: hidden` for three quarters of each cycle,
// which is what stops a merely-transparent element from being stepped as a
// live layer — the same trick @keyframes drone-beam uses.
//
// That per-craft cost is worth knowing before the node's cap gets chosen: an
// escort of N costs 3N always-running animations, where the drone swarm costs
// 2 per drone. These are far bigger on screen, so a much smaller cap.
//
// --- How they aim ---------------------------------------------------------
// Same two-element trick the swarm uses: an anchor pinned at the ring's
// centre carries the *angle*, and a child carries the *radius* as a plain
// outward offset. Because the anchor is rotated, everything inside it already
// has "towards the asteroid" as its local +y — which is what lets a craft be
// aimed and its bolts travel inward without a single trigonometric term. The
// craft is drawn nose-up and flipped 180°, so a new angle aims it for free.

/** How far out they hold. Well beyond the fused drones' own wider ring
 *  (--drone-orbit-radius-big, clamp(122px, 37.4vmin, 193px)) — roughly half
 *  again — so the escort reads as a separate formation standing off from the
 *  swarm rather than as part of it.
 *  The ceiling is where it is because of the angle: parked at ±163deg the
 *  stations are almost straight down, so the radius spends nearly all of
 *  itself on vertical distance, and much past this the craft start sliding
 *  behind the tab bar. Which they do gracefully (they're z-0 against its
 *  z-40, so the chrome covers them rather than the other way round) — but
 *  hidden is hidden. */
const ORBIT_RADIUS = 'clamp(210px, 60vmin, 290px)'

/** Angular spacing between neighbouring craft. 34 is not arbitrary: with two
 *  fighters it reproduces the ±163deg pair this was originally hand-placed
 *  at, which is as low as they go before the two read as one cluster rather
 *  than a craft per flank. */
const FAN_STEP_DEG = 34
/** Ceiling on the total spread, so a large escort wraps into a wide arc
 *  instead of overlapping itself past the top of the screen. */
const MAX_FAN_DEG = 320
/** One firing cycle, matching @keyframes fighter-shot below. */
const CYCLE_S = 2.4

/**
 * Where `count` fighters hold station, as a fan centred on straight down.
 *
 * 0deg is straight up and CSS rotation is clockwise, so 180 is directly below
 * the asteroid — clear of the cockpit console at the top and of the tab bar.
 * The fan opens symmetrically from there, so one craft sits dead below, two
 * land on the flanks, and each pair after that steps further round. Mirrored
 * stations come out of the rotation on their own: no craft is drawn
 * differently from any other.
 *
 * Delays are NEGATIVE, and that is not a style choice — see the note above
 * .fighter-shot. A positive one would leave each new fighter's bolts parked
 * and opaque on its nose until its first turn came round.
 */
function stations(count: number): { angle: string; delay: number }[] {
  const fan = Math.min(MAX_FAN_DEG, count * FAN_STEP_DEG)
  return Array.from({ length: count }, (_, i) => ({
    angle: `${180 - fan / 2 + (fan * (i + 0.5)) / count}deg`,
    // Spread around the cycle rather than a flat step, so a big escort never
    // falls into a rhythm where several fire together.
    delay: -((i * 0.9) % CYCLE_S),
  }))
}

/** Olive drab as a ramp rather than a flat hex, because a single fill is
 *  what made the old version read as a paper cut-out. Same three-step shape
 *  every material in AstronautAvatar uses — lit face, the material's own mid
 *  tone, shadow side — plus the outline that sits under all of it.
 *  The mid tone is the colour that was here before; the other two are it
 *  opened up and closed down, so the aircraft is still the paint you picked. */
const HULL = {
  lit: '#8D9755',
  mid: '#5D6532',
  shade: '#333A19',
  stroke: '#242911',
}

/** Sand, the classic partner to olive drab, and the only bright colour on the
 *  craft — which is what stops a dark hull from disappearing into a #08080c
 *  page altogether. Two steps, since the stripes are flat panels catching the
 *  same light rather than curved surfaces. */
const BAND = {
  lit: '#E3D6A2',
  shade: '#A99A63',
}

/**
 * @param count How many fighters are on station. Currently always 0 — this is
 *   parked, waiting on a tree node that hasn't been built yet, at which point
 *   this becomes the node's owned level and the escort grows with it. Nothing
 *   else has to change: the fan, the firing stagger and the aiming all derive
 *   from the count.
 *
 * At 0 it returns null, so nothing at all mounts — no <style>, no gradient
 * defs, no elements. The whole feature costs exactly one comparison until the
 * day it's switched on.
 */
export const HomeFighter = memo(function HomeFighter({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <div className="pointer-events-none absolute inset-0 text-[#5D6532]">
      <style>{FIGHTER_CSS}</style>
      {/* Defined once for the whole escort rather than per instance. Every
          craft is the same aircraft in the same paint, so there is nothing to
          vary — and unlike DroneIcon, which is tinted per swarm, fixed ids
          here can't collide with anything or multiply with the count. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {/* Same upper-left key light (32% / 24%) every gradient in
              AstronautAvatar uses, so a fighter and the astronaut read as lit
              by one sun rather than as two unrelated drawings. */}
          <radialGradient id="fighterHull" cx="32%" cy="24%" r="88%">
            <stop offset="0%" stopColor={HULL.lit} />
            <stop offset="52%" stopColor={HULL.mid} />
            <stop offset="100%" stopColor={HULL.shade} />
          </radialGradient>
          <linearGradient id="fighterBand" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={BAND.lit} />
            <stop offset="100%" stopColor={BAND.shade} />
          </linearGradient>
          {/* The canopy, built exactly like the astronaut's visor: a tinted
              pane, then a depth wash that is white at the top-left and nearly
              black at the bottom-right. That second pass is what makes glass
              read as curved instead of as a flat coloured hole. */}
          <linearGradient id="fighterGlass" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#F3ECCB" />
            <stop offset="55%" stopColor={BAND.lit} />
            <stop offset="100%" stopColor="#9C8F5C" />
          </linearGradient>
          <radialGradient id="fighterGlassDepth" cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#12140A" stopOpacity="0.55" />
          </radialGradient>
        </defs>
      </svg>
      {stations(count).map((station) => (
        <Fighter key={station.angle} angle={station.angle} delay={station.delay} />
      ))}
    </div>
  )
})

function Fighter({ angle, delay }: { angle: string; delay: number }) {
  const vars: Record<string, string> = {
    '--fighter-radius': ORBIT_RADIUS,
    '--fighter-angle': angle,
  }
  return (
    <div className="fighter-anchor" style={vars}>
      <div className="fighter-offset">
        {/* Flipped so the nose — drawn pointing up — faces the ring centre. */}
        <div className="fighter-craft" style={{ animationDelay: `${delay}s` }}>
          <svg viewBox="-42 -40 84 80" width="62" height="62" className="overflow-visible" aria-hidden="true">
            {/* ONE delta, nose to tail. The previous version had a separate
                fuselage and two thin wing slivers bolted to its sides: the
                fuselage only tapered over its top half and then ran straight
                down on near-parallel sides, which read as a trunk, and wings
                five units deep at the root read as legs trailing backwards.
                Both problems go away by making body and wings the same
                arrowhead — widest at the very back, converging to a single
                point at the front, with nothing sticking out behind it. */}
            {/* Cannons and exhausts, under the hull so it sits proud of them.
                Each is a fat round-capped tube with a thinner light pass laid
                along its upper-left flank — the cheapest way to make a stroke
                read as a cylinder, and the reason they no longer look like
                drawn lines.
                The cannons root exactly ON the leading edge — at x=±14 that
                edge is at y=-5.5 — so they mount to the wing instead of
                floating beside it, and every bit of their length is clear of
                the hull and ahead of it. */}
            <g strokeLinecap="round">
              <g stroke={HULL.shade} strokeWidth={4.4}>
                <line x1="-14" y1="-4" x2="-14" y2="-21" />
                <line x1="14" y1="-4" x2="14" y2="-21" />
                <line x1="-7" y1="9" x2="-7" y2="15.5" />
                <line x1="7" y1="9" x2="7" y2="15.5" />
              </g>
              <g stroke={HULL.mid} strokeWidth={2.6}>
                <line x1="-14.5" y1="-5" x2="-14.5" y2="-20" />
                <line x1="13.5" y1="-5" x2="13.5" y2="-20" />
                <line x1="-7.5" y1="9.5" x2="-7.5" y2="15" />
                <line x1="6.5" y1="9.5" x2="6.5" y2="15" />
              </g>
            </g>
            {/* Muzzles, domed the way DroneIcon's pods are: a base plus a
                darker copy offset down-right, leaving a lit crescent. */}
            <g>
              <circle cx="-14" cy="-22.5" r="2.6" fill={HULL.lit} />
              <circle cx="-13.6" cy="-22.1" r="2.2" fill={HULL.shade} />
              <circle cx="14" cy="-22.5" r="2.6" fill={HULL.lit} />
              <circle cx="14.4" cy="-22.1" r="2.2" fill={HULL.shade} />
            </g>

            {/* The hull. One delta, nose to tail — body and wings are the same
                arrowhead, widest at the very back, converging to a single
                point at the front, with nothing sticking out behind it.
                Volume from a radial gradient rather than a flat fill, which is
                the whole point of this pass: it's the same trick that makes
                the astronaut's helmet a sphere instead of a circle. */}
            <path
              d="M0 -30 L28 19 L0 5 L-28 19 Z"
              fill="url(#fighterHull)"
              stroke={HULL.stroke}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Rim light down the lit leading edge only — a rim on both would
                cancel the light source out.
                It has to be exactly PARALLEL to that edge, which the first
                version wasn't: it ran at slope -1.878 against the edge's
                -1.75, so measured perpendicular it started 0.12 units off the
                edge and finished 1.68 off. At 1.6 wide that meant half the
                stroke hanging outside the hull at the nose and a visible gap
                opening behind it at the tail, which reads as a loose white
                line rather than as light catching a canted edge.
                These endpoints are solved on the edge instead: parameterise it
                as (0,-30) + s·(-28,49), take s from 0.12 to 0.88 so the nose
                and the wingtip stay clear, then push both points 0.9 units
                along the inward normal (0.868, 0.496). Constant inset the
                whole way, so the stroke sits flush inside the edge end to end. */}
            <path
              d="M-2.6 -23.7 L-23.9 13.6"
              stroke={HULL.lit}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity={0.75}
            />
            {/* Panel seam along the spine — the one interior line, and it runs
                with the airframe rather than across it. */}
            <path d="M0 -21 V3" stroke={HULL.shade} strokeWidth="1.2" strokeLinecap="round" opacity={0.55} />

            {/* Invasion stripe, one per wing. It crosses the wing chordwise —
                leading edge to trailing edge — which is what makes it look
                painted *around* the wing rather than drawn on top of it. A
                quad, not a stroke, because the chord shrinks as the wing
                sweeps out: its four corners are solved onto the two edges at
                x=17 (chord y -0.25→13.5) and x=21 (chord y 6.75→15.5), so it
                sits flush with both by construction and can't overhang. */}
            <g fill="url(#fighterBand)">
              <path d="M-17 -0.25 L-21 6.75 L-21 15.5 L-17 13.5 Z" />
              <path d="M17 -0.25 L21 6.75 L21 15.5 L17 13.5 Z" />
            </g>

            {/* Canopy, built like the astronaut's visor: a recessed dark well,
                the tinted pane, a depth wash over it, a thin bright rim, and a
                small hard glint riding the shoulder. Five shapes, and they're
                what make it read as glass rather than as a dot. */}
            <ellipse cx="0" cy="-11" rx="6.2" ry="8.4" fill="#12140A" />
            <ellipse cx="0" cy="-11" rx="5.2" ry="7.4" fill="url(#fighterGlass)" />
            <ellipse cx="0" cy="-11" rx="5.2" ry="7.4" fill="url(#fighterGlassDepth)" />
            <ellipse cx="0" cy="-11" rx="5.2" ry="7.4" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity={0.3} />
            <ellipse cx="-1.9" cy="-14.4" rx="2" ry="1" fill="#ffffff" opacity={0.6} transform="rotate(-28 -1.9 -14.4)" />

            {/* No hull specular. There was one here — the astronaut's own
                rotated white ellipse — and it was a mistake: on a compact
                helmet that streak is a small mark on a shoulder, but scaled
                onto a 49-unit delta it became a 10-unit near-vertical white
                smear sitting on the left wing alone, with nothing balancing
                it on the right. It read as a pale patch stuck behind the
                aircraft rather than as light on it.
                The hull doesn't need it anyway: it already gets its form from
                the radial ramp and the rim light along the lit leading edge,
                which are the two things a big flat panel actually wants. A
                specular belongs on a curved surface, and the one curved
                surface here is the canopy, which has one. */}
          </svg>
        </div>

        {/* The bolts sit outside the flipped craft, in the anchor's own frame,
            so +y is already "towards the asteroid" for them too. Same
            travelling-dot shape the swarm's beams use. */}
        <span className="fighter-shot fighter-shot-l" style={{ animationDelay: `${delay}s` }} />
        <span className="fighter-shot fighter-shot-r" style={{ animationDelay: `${delay - 0.14}s` }} />
      </div>
    </div>
  )
}

const FIGHTER_CSS = `
.fighter-anchor {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: rotate(var(--fighter-angle));
  /* Load-bearing, and the bug that made the first version miss. left/top:50%
     put this element's top-left exactly on the ring centre, but the default
     transform-origin is the centre of its *box* — and the box was 62x62,
     because .fighter-offset was in flow and sized it. Rotating about a pivot
     31px down-and-right of the ring centre threw the station off its radius
     and landed both bolts ~75px below the asteroid.
     .fighter-offset is out of flow now (see below), which alone makes this
     element zero-sized and the two origins identical — this line stays as the
     explicit statement of intent, so putting anything in flow here later
     can't quietly move the pivot again. */
  transform-origin: 0 0;
}

/* Absolute, exactly like .drone-radius-offset in index.css, and for a reason
   that isn't cosmetic: an out-of-flow child contributes no size to its
   parent, which is precisely what keeps the anchor above a zero-sized point
   pinned on the ring centre. That is why the swarm's own rings have always
   been correctly centred — this file drifted from their geometry by making
   this element position:relative, and that one word was the whole aiming
   error. (No backticks in here — this block is a template literal.) */
.fighter-offset {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%) translateY(calc(var(--fighter-radius) * -1));
}

/* Recoil. The craft kicks back on each burst and settles, on the same 2.4s
   clock as its own guns and offset by the same delay, so the kick lands with
   the shot rather than near it.

   The rotate has to be repeated inside every keyframe: a CSS animation
   touching the transform property wins it outright on its element, so the
   static declaration below would otherwise be dropped the moment this starts
   and the craft would snap round to face outwards.

   translateY is POSITIVE for backwards. Inside this element the 180deg flip
   has already reversed the axis, so local +y points away from the asteroid —
   the same flip that lets the nose be drawn pointing up.

   Chosen over sliding along the orbit arc because it animates only the craft.
   The arc version would have had to animate the anchor, which wraps the two
   bolts too, nesting their layers inside a parent that transforms every
   frame. Same visual budget, more compositor work. */
@keyframes fighter-recoil {
  0% {
    transform: rotate(180deg) translateY(0);
    animation-timing-function: ease-out;
  }
  3% {
    transform: rotate(180deg) translateY(3px);
    animation-timing-function: ease-out;
  }
  30% {
    transform: rotate(180deg) translateY(0);
  }
  100% {
    transform: rotate(180deg) translateY(0);
  }
}

.fighter-craft {
  transform: rotate(180deg);
  animation: fighter-recoil 2.4s infinite;
}

/* Fires, coasts, then genuinely idles. The bolt is visible for a quarter of
   the cycle and spends the other three quarters at visibility:hidden, which
   is the same thing @keyframes drone-beam does and for the same reason: an
   element that's merely transparent is still a live compositor layer being
   stepped every frame.

   The x term is what makes this aim. Both bolts leave their own barrel
   (--gun-x, the muzzle's offset from the craft's axis) and land on the axis
   itself, so they CONVERGE on the ring centre — the exact point the swarm's
   beams hit. Running straight down +y from each muzzle instead sent two
   parallel bolts either side of the asteroid, missing the centre by a
   muzzle's offset each and never reading as aimed at anything.

   The y term starts at the muzzle's own forward offset (16px past the craft's
   centre once flipped) so a bolt leaves the barrel rather than the middle of
   the hull, and ends at the full radius, which is dead centre. Both numbers
   are the muzzles' real position: at (±14, -22) in the drawing, and the SVG
   packs 84 units into 62px, so ±10px across and 16px forward. */
@keyframes fighter-shot {
  0% {
    transform: translate(calc(-50% + var(--gun-x)), 16px);
    opacity: 1;
    visibility: visible;
    animation-timing-function: ease-in;
  }
  26% {
    transform: translate(-50%, var(--fighter-radius));
    opacity: 0;
  }
  26.1% {
    transform: translate(calc(-50% + var(--gun-x)), 16px);
    opacity: 0;
    visibility: hidden;
  }
  100% {
    transform: translate(calc(-50% + var(--gun-x)), 16px);
    opacity: 0;
    visibility: hidden;
  }
}

/* The resting state is hidden, matching the animation's own idle frames
   rather than contradicting them. Without this the element's base styles are
   "full width, fully opaque, untransformed, parked at the craft's centre" —
   which is what any moment the animation isn't driving it will show: a stray
   bar sitting on the nose. Belt to the negative delays' braces. */
.fighter-shot {
  position: absolute;
  visibility: hidden;
  /* Both sit on the axis; --gun-x in the keyframes is what walks each one out
     to its own barrel at the start and brings it back to the axis at the end. */
  left: 50%;
  top: 50%;
  width: 3px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(to bottom, rgba(219, 234, 254, 0), #dbeafe, #ffffff);
  box-shadow: 0 0 7px 1px rgba(191, 219, 254, 0.85);
  animation: fighter-shot 2.4s infinite;
}

/* Both barrels, a beat apart — perfectly simultaneous reads as one wide bolt,
   and the stagger is what makes it a burst from two guns.

   Every stagger in this file is a NEGATIVE delay, and that's load-bearing
   rather than a preference. A positive one leaves an element showing its own
   base styles until its turn comes round, and it only ever applies once,
   ahead of the first iteration — so on a fresh load or a return to this tab
   the un-started bolts sat parked and opaque on the craft's nose for up to a
   second, then behaved correctly forever after. A negative delay starts the
   animation already that far in, so there is no pre-start state to leak.
   Exactly the bug, and exactly the fix, that @keyframes drone-beam and
   OrbitingBots' own orbitDelay document in Home.tsx. */
.fighter-shot-l { --gun-x: -10px; }
.fighter-shot-r { --gun-x: 10px; }

@media (prefers-reduced-motion: reduce) {
  .fighter-shot { animation: none; visibility: hidden; }
  .fighter-craft { animation: none; }
}
`
