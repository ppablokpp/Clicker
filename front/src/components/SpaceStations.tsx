// The stations outside the ship: the Nodo, a ring station that is the
// fleet's hangar (built, not placed yet), the Refinería, where the ore goes,
// the Tienda, the trading post that opens the store, the Podio, where the
// ranking is, and the Vivero, where the tree grows. They sit inside the same
// pannable stage as the ship, so the one gesture that moves the view brings
// them in.
//
// Same materials as everything else in the game: graphite hulls lit from the
// upper left, colour only where there's hardware — glass, lights, ore — and
// the current mineral wherever the station touches what you're mining.
//
// And the same rendering rule the rock and the ring settled on: each station
// is still SVG, and everything that moves (the ring's turn, the ore on the
// conveyor, smoke, lights) is a transform or opacity animation on an element
// of its own, so nothing here is painted per frame. Every station drifts
// like the berth does — the same slow lift and settle on its box, each on
// its own beat so they don't bob in step. Paused with the rest when
// a modal covers Home.

import { memo } from 'react'
import { useTap } from '../hooks/useTap'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { MineralIcon } from './MaterialIcons'

const HULL = { lit: '#5a5f6d', mid: '#2b2e38', shade: '#15171e', edge: '#7d8290' }
const GLASS = { lit: '#c4b5fd', mid: '#6d5bb5', deep: '#2a2050' }
/** The app's violet — Amatista's palette — for the parts of a station that
 *  are the station's own rather than the mineral's. */
const VIOLET = MATERIAL_TIER_COLORS[0]

export interface StationOffsets {
  node: { x: number; y: number }
  refinery: { x: number; y: number }
  market: { x: number; y: number }
  podium: { x: number; y: number }
  nursery: { x: number; y: number }
}

/** Where each station sits, in stage px from the stage's centre, unless the
 *  caller says otherwise: about a screen apart, each in its own direction,
 *  so the space reads as a map. */
export const STATION_OFFSETS: StationOffsets = {
  node: { x: 470, y: -250 },
  refinery: { x: -500, y: 230 },
  market: { x: 520, y: 260 },
  podium: { x: -520, y: -300 },
  nursery: { x: 560, y: -20 },
}

/* ── Nodo ──────────────────────────────────────────────────────────────── */

const NODE_W = 240
const NODE_H = 200
const RING_R = 92
const RING_SQUASH = 0.36
const WINDOWS = 28

/**
 * The torus and its windows, in the ring's own plane. Rendered twice under a
 * wrapper that squashes and clips it to one half — back behind the hub,
 * front over it — and the whole thing turns as one element, which is what
 * keeps the turn off the main thread. The torus's shading is radial (dark
 * inner rim, lit crown, dark outer rim) precisely so it can rotate without
 * the light appearing to move.
 */
const NodeRing = memo(function NodeRing({
  half,
  litWindows,
  windowColor,
  paused,
}: {
  half: 'back' | 'front'
  litWindows: number
  windowColor: string
  paused: boolean
}) {
  const cx = NODE_W / 2
  const cy = NODE_H / 2
  const id = `nodeRing-${half}`
  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: NODE_W,
        height: NODE_H,
        transform: `scaleY(${RING_SQUASH})`,
        clipPath: half === 'back' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
      }}
    >
      <svg
        width={NODE_W}
        height={NODE_H}
        viewBox={`0 0 ${NODE_W} ${NODE_H}`}
        className={`station-spin${paused ? ' station-paused' : ''}`}
      >
        <defs>
          <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={RING_R + 12}>
            <stop offset={(RING_R - 12) / (RING_R + 12)} stopColor={HULL.shade} />
            <stop offset={(RING_R - 4) / (RING_R + 12)} stopColor={HULL.lit} />
            <stop offset={(RING_R + 3) / (RING_R + 12)} stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </radialGradient>
        </defs>
        {/* spokes under the torus */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(a) * RING_R}
              y2={cy + Math.sin(a) * RING_R}
              stroke={HULL.lit}
              strokeWidth={6}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={RING_R} fill="none" stroke={`url(#${id})`} strokeWidth={24} />
        <circle cx={cx} cy={cy} r={RING_R + 12} fill="none" stroke={HULL.edge} strokeOpacity={0.5} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={RING_R - 12} fill="none" stroke={HULL.edge} strokeOpacity={0.5} strokeWidth={1} />
        {/* windows: one per fleet unit lit, the rest dark glass */}
        {Array.from({ length: WINDOWS }, (_, i) => {
          const a = (i / WINDOWS) * Math.PI * 2
          const x = cx + Math.cos(a) * RING_R
          const y = cy + Math.sin(a) * RING_R
          return (
            <rect
              key={i}
              x={-3.2}
              y={-5}
              width={6.4}
              height={10}
              rx={1.2}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})`}
              fill={i < litWindows ? windowColor : GLASS.deep}
              fillOpacity={0.92}
            />
          )
        })}
      </svg>
    </div>
  )
})

const NodeStation = memo(function NodeStation({
  tierIndex,
  fleet,
  paused,
  label,
  at,
  onTap,
}: {
  tierIndex: number
  fleet: number
  paused: boolean
  label: string
  at: { x: number; y: number }
  onTap: () => void
}) {
  const tier = MATERIAL_TIER_COLORS[tierIndex] ?? MATERIAL_TIER_COLORS[0]
  const tap = useTap(onTap)
  const cx = NODE_W / 2
  const cy = NODE_H / 2
  const litWindows = Math.min(WINDOWS, fleet)
  return (
    <div
      role="button"
      aria-label={label}
      className={`station-hover pointer-events-auto absolute cursor-pointer${paused ? ' station-paused' : ''}`}
      style={{
        width: NODE_W,
        height: NODE_H,
        left: `calc(50% + ${at.x - NODE_W / 2}px)`,
        top: `calc(50% + ${at.y - NODE_H / 2}px)`,
        animationDelay: '-0.9s',
      }}
      {...tap}
    >
      {/* the hangar's light spilling out of the base, in the mineral */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 translate-y-6 rounded-full"
        style={{ background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)`, opacity: 0.7 }}
      />
      <NodeRing half="back" litWindows={litWindows} windowColor={tier.light} paused={paused} />

      {/* the hub and its wings — still */}
      <svg
        width={NODE_W}
        height={NODE_H}
        viewBox={`0 0 ${NODE_W} ${NODE_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <linearGradient id="nodeHub" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.28" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="nodePanel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={GLASS.lit} />
            <stop offset="0.3" stopColor={GLASS.mid} />
            <stop offset="1" stopColor={GLASS.deep} />
          </linearGradient>
        </defs>
        {/* wings */}
        <line x1={cx - 26} y1={cy - 38} x2={cx + 26} y2={cy - 38} stroke={HULL.edge} strokeWidth={2} />
        {[cx - 78, cx + 26].map((x) => (
          <g key={x}>
            <rect
              x={x}
              y={cy - 46}
              width={52}
              height={16}
              fill="url(#nodePanel)"
              stroke={HULL.edge}
              strokeOpacity={0.7}
              strokeWidth={0.8}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <line
                key={i}
                x1={x + (52 * i) / 6}
                y1={cy - 46}
                x2={x + (52 * i) / 6}
                y2={cy - 30}
                stroke="#08080c"
                strokeOpacity={0.55}
                strokeWidth={0.8}
              />
            ))}
            <line
              x1={x}
              y1={cy - 38}
              x2={x + 52}
              y2={cy - 38}
              stroke="#08080c"
              strokeOpacity={0.55}
              strokeWidth={0.8}
            />
          </g>
        ))}
        {/* the hub: a cylinder, capped */}
        <rect x={cx - 14} y={cy - 54} width={28} height={108} fill="url(#nodeHub)" />
        <ellipse cx={cx} cy={cy - 54} rx={14} ry={3.2} fill={HULL.lit} />
        <ellipse cx={cx} cy={cy + 54} rx={14} ry={3.2} fill={HULL.shade} />
        <rect
          x={cx - 18}
          y={cy - 8}
          width={36}
          height={16}
          rx={3}
          fill={HULL.mid}
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={cx - 9 + i * 7}
            y={cy - 30}
            width={4}
            height={6}
            rx={1}
            fill={tier.light}
            fillOpacity={0.9}
          />
        ))}
      </svg>

      <NodeRing half="front" litWindows={litWindows} windowColor={tier.light} paused={paused} />

      {/* lights: the beacon on the mast, red and green on the wing tips */}
      <span
        className={`station-pulse pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full${paused ? ' station-paused' : ''}`}
        style={{ left: cx, top: cy - 58, background: tier.light, boxShadow: `0 0 10px 3px ${tier.glow}` }}
      />
      <span
        className={`station-blink pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6b6b] shadow-[0_0_8px_2px_rgba(255,107,107,0.8)]${paused ? ' station-paused' : ''}`}
        style={{ left: cx - 78, top: cy - 38 }}
      />
      <span
        className={`station-blink pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6bffb0] shadow-[0_0_8px_2px_rgba(107,255,176,0.8)]${paused ? ' station-paused' : ''}`}
        style={{ left: cx + 78, top: cy - 38, animationDelay: '-1.2s' }}
      />
    </div>
  )
})

/* ── Refinería ─────────────────────────────────────────────────────────── */

const REF_W = 500
const REF_H = 240
/** The intake pipe's span, in station px, and the ore travelling in it. */
const PIPE_W = 96
const ORE_SIZE = 18
/** The ore strip repeats every ORE_PERIOD px — the window it shows through
 *  is exactly that wide, so the loop never shows a gap. It runs from under
 *  the sphere's flange to under the port's ring, so the ore comes OUT of
 *  one thing and goes INTO another rather than appearing and vanishing. */
const ORE_PERIOD = PIPE_W + 8
const ORE_AT = [2, 30, 58, 84]
/** The glass sphere the ore is held in, at the pipe's near end. */
const SPHERE_R = 36
/** The ore packed inside it, in two layers laid over the sphere's whole box
 *  (the circle clip trims the corners): a back layer in the mineral's dark,
 *  which is what shows in any gap, and a front layer in its colour. Pieces
 *  of 22–28px on an 11px pitch, jittered, so every piece sits over its
 *  neighbours and no glass shows through to the inside. */
const SPHERE_ORE: [number, number, number][] = Array.from({ length: 7 }, (_, row) =>
  Array.from({ length: 7 }, (_, col): [number, number, number] => {
    const stagger = row % 2 ? 6 : 0
    const seed = row * 7 + col
    return [
      -14 + col * 11 + stagger + ((seed * 7) % 7) - 3,
      -14 + row * 11 + ((seed * 11) % 7) - 3,
      22 + ((seed * 3) % 4) * 2,
    ]
  }),
).flat()

/**
 * One building, not a row of parts. A glass sphere at the near end holds
 * the ore — you can see it heaped inside — and a flanged pipe carries it
 * into the plant: a long pressurised hull with windows, a block on top with
 * the reactor's porthole, and a chimney that lets out bubbles of the
 * mineral, which is what "producing" looks like from outside. Off the far
 * end, the station part: a lattice truss with two solar arrays.
 */
const RefineryStation = memo(function RefineryStation({
  tierIndex,
  level,
  paused,
  smelting,
  label,
  at,
  onTap,
}: {
  tierIndex: number
  /** 0–1, how bright the reactor runs. */
  level: number
  paused: boolean
  /** A core is being smelted: the ore moves and the chimney bubbles. Idle,
   *  the plant just sits there — which is what an idle plant does. */
  smelting: boolean
  label: string
  at: { x: number; y: number }
  onTap: () => void
}) {
  // The building is always violet — the app's own accent — whatever is
  // being mined: only the ore in the sphere and the pipe, and the bubbles
  // off the chimney, take the current mineral's colour.
  const ore = MATERIAL_TIER_COLORS[tierIndex] ?? MATERIAL_TIER_COLORS[0]
  const tier = VIOLET
  const tap = useTap(onTap)
  const cy = REF_H / 2 + 24
  // the station tutorial points at this one
  // the sphere, the pipe, the plant, the truss — left to right
  const sx = 52
  const sy = cy - 4
  const pipeX = sx + SPHERE_R - 8
  const pipeY = cy - 11
  const plantX = pipeX + PIPE_W + 14
  const plantW = 200
  const boxX = plantX + 46
  const boxW = 112
  const orbX = boxX + 54
  const orbY = cy - 62
  const stackX = boxX + boxW - 22
  const trussL = plantX + plantW
  const trussR = trussL + 96
  const bays = Array.from({ length: Math.floor((trussR - trussL) / 16) }, (_, i) => trussL + i * 16)
  const p = paused ? ' station-paused' : ''
  // The conveyor stands still unless a core is being smelted.
  const belt = paused || !smelting ? ' station-paused' : ''
  return (
    <div
      data-tutorial="station-refinery"
      role="button"
      aria-label={label}
      className={`station-hover pointer-events-auto absolute cursor-pointer${p}`}
      style={{
        width: REF_W,
        height: REF_H,
        left: `calc(50% + ${at.x - REF_W / 2}px)`,
        top: `calc(50% + ${at.y - REF_H / 2}px)`,
        animationDelay: '-2.1s',
      }}
      {...tap}
    >
      {/* the reactor's light, breathing behind its porthole */}
      <span
        className={`station-pulse pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
        style={{
          left: orbX,
          top: orbY,
          background: `radial-gradient(circle, ${tier.glow} 0%, transparent 65%)`,
          opacity: 0.5 + level * 0.5,
        }}
      />

      {/* ── the sphere: its dark inside first, then the ore, then the glass ── */}
      <svg
        width={REF_W}
        height={REF_H}
        viewBox={`0 0 ${REF_W} ${REF_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <linearGradient id="refHull" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.25" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <radialGradient id="refSphereIn" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={ore.dark} stopOpacity="0.35" />
            <stop offset="0.8" stopColor="#000" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          <linearGradient id="refPlate" x1="0" x2="0.4" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.35" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
        </defs>
        <circle cx={sx} cy={sy} r={SPHERE_R} fill="url(#refSphereIn)" />
      </svg>
      <div
        className="pointer-events-none absolute"
        style={{
          left: sx - SPHERE_R,
          top: sy - SPHERE_R,
          width: SPHERE_R * 2,
          height: SPHERE_R * 2,
          clipPath: 'circle(50%)',
        }}
      >
        {/* packed with ore: a staggered grid over the whole sphere, so it
            reads as full to the glass rather than as a few pieces adrift */}
        {SPHERE_ORE.map(([x, y, size], i) => (
          <MineralIcon
            key={'b' + i}
            size={size + 4}
            className="absolute"
            style={{ left: x + 5, top: y + 4, color: ore.dark }}
          />
        ))}
        {SPHERE_ORE.map(([x, y, size], i) => (
          <MineralIcon key={i} size={size} className="absolute" style={{ left: x, top: y, color: ore.fill }} />
        ))}
      </div>
      <svg
        width={REF_W}
        height={REF_H}
        viewBox={`0 0 ${REF_W} ${REF_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <radialGradient id="refGlass" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="0.85" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.14" />
          </radialGradient>
          <linearGradient id="refPipe" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.shade} />
            <stop offset="0.3" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="refStack" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.28" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="refPanel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={GLASS.lit} />
            <stop offset="0.3" stopColor={GLASS.mid} />
            <stop offset="1" stopColor={GLASS.deep} />
          </linearGradient>
          <radialGradient id="refOrb" cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor={tier.light} />
            <stop offset="0.4" stopColor={tier.fill} />
            <stop offset="1" stopColor={tier.dark} />
          </radialGradient>
        </defs>

        {/* the glass over the ore: a highlight, a faint rim, a bright edge */}
        <circle cx={sx} cy={sy} r={SPHERE_R} fill="url(#refGlass)" />
        <circle cx={sx} cy={sy} r={SPHERE_R} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
        <path
          d={`M${sx - 22} ${sy + 24} A${SPHERE_R - 6} ${SPHERE_R - 6} 0 0 0 ${sx + 26} ${sy + 16}`}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        {/* the sphere's steel: a polar cap top and bottom
            (it floats — nothing stands on anything here), a valve stack on
            the top one, and the cap where the pipe leaves */}
        <ellipse
          cx={sx}
          cy={sy - SPHERE_R + 3}
          rx={13}
          ry={4.5}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={1}
        />
        <ellipse
          cx={sx}
          cy={sy + SPHERE_R - 3}
          rx={13}
          ry={4.5}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={1}
        />
        <rect
          x={sx - 5}
          y={sy - SPHERE_R - 10}
          width={10}
          height={10}
          rx={2}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        <rect x={sx - 9} y={sy - SPHERE_R - 13} width={18} height={4} rx={2} fill={HULL.lit} />
        <line
          x1={sx + 9}
          y1={sy - SPHERE_R - 11}
          x2={sx + 16}
          y2={sy - SPHERE_R - 11}
          stroke={HULL.edge}
          strokeWidth={2}
        />
        <circle cx={sx + 17} cy={sy - SPHERE_R - 11} r={2.2} fill={HULL.lit} />
        <circle
          cx={sx}
          cy={sy + SPHERE_R + 4}
          r={3}
          fill={HULL.shade}
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={1}
        />
        <rect
          x={pipeX - 4}
          y={pipeY - 6}
          width={12}
          height={34}
          rx={3}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />

        {/* the block and its chimney go down before the hull, running well
            into it, and the hull's own top edge is what closes the join —
            one structure with a superstructure on it, not a box on a tube */}
        <rect x={stackX} y={cy - 138} width={14} height={60} fill="url(#refStack)" />
        <ellipse cx={stackX + 7} cy={cy - 138} rx={7} ry={2} fill={HULL.lit} />
        <rect x={stackX - 3} y={cy - 130} width={20} height={5} rx={1.5} fill={HULL.lit} />
        <path
          d={`M${boxX} ${cy - 89} a7 7 0 0 1 7 -7 h${boxW - 14} a7 7 0 0 1 7 7 v79 h-${boxW} z`}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />
        {/* the flared skirt where the block meets the hull */}
        <path
          d={`M${boxX - 14} ${cy - 22} l14 -18 h${boxW} l14 18 z`}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />
        {/* the hull: the pipe has to run INTO it, not stop at its face */}
        <rect x={plantX} y={cy - 30} width={plantW} height={60} fill="url(#refHull)" />
        <ellipse cx={plantX + plantW} cy={cy} rx={7} ry={30} fill={HULL.shade} />
        <ellipse cx={plantX} cy={cy} rx={7} ry={30} fill={HULL.lit} />
        {/* the pipe: an open channel between two flanges — one at the
            sphere, one at the hull, the same piece both ends — so the ore
            shows, ending under the hull's flange */}
        <rect
          x={pipeX}
          y={pipeY}
          width={PIPE_W + 14}
          height={22}
          rx={3}
          fill="url(#refPipe)"
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <rect
          x={pipeX + PIPE_W + 4}
          y={pipeY - 6}
          width={12}
          height={34}
          rx={3}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
      </svg>

      {/* the ore, in the pipe: the store's own mineral, in the mineral's colour,
          on a strip twice the pipe's length sliding by half of itself */}
      <div
        className="pointer-events-none absolute overflow-hidden"
        style={{ left: pipeX + 4, top: pipeY + 2, width: ORE_PERIOD, height: 18 }}
      >
        <div className={`station-conveyor absolute left-0 top-0 h-full${belt}`} style={{ width: ORE_PERIOD * 2 }}>
          {[0, ORE_PERIOD].map((dx) =>
            ORE_AT.map((x) => (
              <MineralIcon
                key={dx + x}
                size={ORE_SIZE}
                className="absolute top-0"
                style={{ left: dx + x, color: ore.fill }}
              />
            )),
          )}
        </div>
      </div>

      <svg
        width={REF_W}
        height={REF_H}
        viewBox={`0 0 ${REF_W} ${REF_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        {/* pipe's top edge, over the ore, so it reads as inside */}
        <line
          x1={pipeX + 4}
          y1={pipeY + 1}
          x2={pipeX + PIPE_W + 4}
          y2={pipeY + 1}
          stroke={HULL.edge}
          strokeOpacity={0.9}
          strokeWidth={1.2}
        />
        {/* two clamp bands, over the ore, so it passes behind them — inside
            the pipe, not on it */}
        {[pipeX + 32, pipeX + 76].map((x) => (
          <rect
            key={x}
            x={x}
            y={pipeY - 3}
            width={5}
            height={28}
            rx={1}
            fill={HULL.lit}
            stroke={HULL.shade}
            strokeWidth={0.6}
          />
        ))}
        {/* both flanges again, over the ore: it comes out from under the
            sphere's and goes in under the hull's */}
        <rect
          x={pipeX - 4}
          y={pipeY - 6}
          width={12}
          height={34}
          rx={3}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        <rect
          x={pipeX + PIPE_W + 4}
          y={pipeY - 6}
          width={12}
          height={34}
          rx={3}
          fill="url(#refPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />

        {/* ── the station part off the far end: a truss and two arrays ── */}
        <g stroke={HULL.edge} strokeOpacity={0.55} strokeWidth={0.8}>
          {bays.map((x) => (
            <g key={x}>
              <line x1={x} y1={cy - 5} x2={x + 16} y2={cy + 5} />
              <line x1={x} y1={cy + 5} x2={x + 16} y2={cy - 5} />
              <line x1={x} y1={cy - 5} x2={x} y2={cy + 5} />
            </g>
          ))}
        </g>
        <line x1={trussL} y1={cy - 5} x2={trussR} y2={cy - 5} stroke={HULL.lit} strokeWidth={2} />
        <line x1={trussL} y1={cy + 5} x2={trussR} y2={cy + 5} stroke={HULL.mid} strokeWidth={2} />
        {[cy - 52, cy + 14].map((y, i) => (
          <g key={i}>
            <line
              x1={trussR - 22}
              y1={cy}
              x2={trussR - 22}
              y2={i === 0 ? y + 26 : y}
              stroke={HULL.edge}
              strokeWidth={2}
            />
            <rect
              x={trussR - 42}
              y={y}
              width={40}
              height={26}
              fill="url(#refPanel)"
              stroke={HULL.edge}
              strokeOpacity={0.7}
              strokeWidth={0.8}
            />
            {[1, 2, 3].map((k) => (
              <line
                key={k}
                x1={trussR - 42 + 10 * k}
                y1={y}
                x2={trussR - 42 + 10 * k}
                y2={y + 26}
                stroke="#08080c"
                strokeOpacity={0.55}
                strokeWidth={0.8}
              />
            ))}
            <line
              x1={trussR - 42}
              y1={y + 13}
              x2={trussR - 2}
              y2={y + 13}
              stroke="#08080c"
              strokeOpacity={0.55}
              strokeWidth={0.8}
            />
          </g>
        ))}

        {/* ── the plant's face: what sits on the block and the hull ── */}
        {/* the block's shadow on the hull, and the seam between them */}
        <rect x={boxX - 16} y={cy - 30} width={boxW + 32} height={9} fill="#000" fillOpacity={0.22} />
        <line
          x1={boxX - 14}
          y1={cy - 29}
          x2={boxX + boxW + 14}
          y2={cy - 29}
          stroke={HULL.lit}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <line x1={boxX + 18} y1={cy - 96} x2={boxX + 18} y2={cy - 116} stroke={HULL.edge} strokeWidth={2} />
        <rect
          x={boxX + 28}
          y={cy - 108}
          width={30}
          height={12}
          fill="url(#refPanel)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        {[1, 2].map((k) => (
          <line
            key={k}
            x1={boxX + 28 + 10 * k}
            y1={cy - 108}
            x2={boxX + 28 + 10 * k}
            y2={cy - 96}
            stroke="#08080c"
            strokeOpacity={0.55}
            strokeWidth={0.8}
          />
        ))}
        <circle cx={orbX} cy={orbY} r={24} fill={HULL.shade} />
        <circle cx={orbX} cy={orbY} r={20} fill="url(#refOrb)" />
        <ellipse cx={orbX - 7} cy={orbY - 10} rx={6} ry={3.2} fill="#ffffff" fillOpacity={0.28} />
        <circle cx={orbX} cy={orbY} r={22} fill="none" stroke={HULL.edge} strokeOpacity={0.9} strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={orbX + Math.cos((i / 6) * Math.PI * 2 + 0.5) * 22}
            cy={orbY + Math.sin((i / 6) * Math.PI * 2 + 0.5) * 22}
            r={1.5}
            fill={HULL.lit}
          />
        ))}

        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={plantX + 50 + i * 50}
            y1={cy - 30}
            x2={plantX + 50 + i * 50}
            y2={cy + 30}
            stroke="#08080c"
            strokeOpacity={0.4}
            strokeWidth={1.2}
          />
        ))}
        <line
          x1={plantX + 10}
          y1={cy + 18}
          x2={plantX + plantW - 10}
          y2={cy + 18}
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={2}
        />
        <line
          x1={plantX + 4}
          y1={cy - 29}
          x2={plantX + plantW - 4}
          y2={cy - 29}
          stroke={HULL.lit}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <rect
            key={i}
            x={plantX + 20 + i * 19}
            y={cy - 12}
            width={8}
            height={11}
            rx={1.5}
            fill={tier.light}
            fillOpacity={i === 5 ? 0.35 : 0.9}
          />
        ))}
      </svg>

      {/* bubbles out of the chimney, in the mineral — only while smelting */}
      {smelting &&
        [0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`station-bubble pointer-events-none absolute rounded-full${p}`}
            style={{
              left: stackX + 2 + (i % 3) * 3,
              top: cy - 148,
              width: 9 + (i % 2) * 4,
              height: 9 + (i % 2) * 4,
              background: `radial-gradient(circle at 35% 35%, ${ore.light} 0%, ${ore.fill} 45%, transparent 72%)`,
              boxShadow: `inset 0 0 0 1px ${ore.light}, 0 0 6px ${ore.glow}`,
              animationDelay: `-${i * 0.7}s`,
            }}
          />
        ))}
      {/* the beacon on the mast */}
      <span
        className={`station-pulse pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
        style={{ left: boxX + 18, top: cy - 118, background: tier.light, boxShadow: `0 0 10px 3px ${tier.glow}` }}
      />
    </div>
  )
})

/* ── both, placed ──────────────────────────────────────────────────────── */

/* ── Podio ─────────────────────────────────────────────────────────────── */

const POD_W = 240
const POD_H = 250

/**
 * The Podio: where the ranking is. Three pedestals on a floating platform,
 * the tallest in the middle, each lit on top — and over the tallest a
 * hologram of the cup, thrown up from a projector in the pedestal, that
 * flickers the way holograms do. A broadcast mast behind with a radar
 * sweeping round it and floodlights on posts either side, the way a
 * stadium is lit. Tapping it opens the ranking.
 */
const PodiumStation = memo(function PodiumStation({
  paused,
  label,
  at,
  onTap,
}: {
  paused: boolean
  label: string
  at: { x: number; y: number }
  onTap: () => void
}) {
  const tier = VIOLET
  const tap = useTap(onTap)
  const p = paused ? ' station-paused' : ''
  const cx = POD_W / 2
  // the platform's top face is where the pedestals stand
  const floorY = POD_H - 52
  const platL = cx - 92
  const platR = cx + 92
  const bays = Array.from({ length: Math.floor((platR - platL) / 16) }, (_, i) => platL + i * 16)
  // second, first, third — left to right, as a podium is
  const steps = [
    { x: cx - 62, w: 40, h: 46, dots: 2 },
    { x: cx - 20, w: 40, h: 70, dots: 1 },
    { x: cx + 22, w: 40, h: 32, dots: 3 },
  ]
  const mastX = cx + 70
  const mastTop = 26
  const holoX = cx
  const holoY = floorY - 70 - 44
  return (
    <div
      role="button"
      aria-label={label}
      className={`station-hover pointer-events-auto absolute cursor-pointer${p}`}
      style={{
        width: POD_W,
        height: POD_H,
        left: `calc(50% + ${at.x - POD_W / 2}px)`,
        top: `calc(50% + ${at.y - POD_H / 2}px)`,
        animationDelay: '-3.3s',
      }}
      {...tap}
    >
      {/* the projector's cone, under the hologram: a span so its flicker
          and the hologram's are the same breath */}
      <span
        className={`station-flicker pointer-events-none absolute${p}`}
        style={{
          left: holoX - 26,
          top: holoY - 2,
          width: 52,
          height: floorY - 70 - holoY + 2,
          clipPath: 'polygon(50% 0, 62% 100%, 38% 100%)',
          background: `linear-gradient(to top, ${tier.fill}, transparent)`,
          opacity: 0.5,
        }}
      />

      <svg
        width={POD_W}
        height={POD_H}
        viewBox={`0 0 ${POD_W} ${POD_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <linearGradient id="podPlate" x1="0" x2="0.4" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.35" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="podStep" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.3" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="podTop" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={tier.fill} />
            <stop offset="0.5" stopColor={tier.light} />
            <stop offset="1" stopColor={tier.fill} />
          </linearGradient>
          <linearGradient id="podBeam" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={tier.light} stopOpacity="0.28" />
            <stop offset="1" stopColor={tier.light} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the mast behind, with its array and the radar's pivot */}
        <rect
          x={mastX - 3}
          y={mastTop}
          width={6}
          height={floorY - mastTop}
          fill="url(#podStep)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        {[0, 1, 2].map((k) => (
          <line
            key={k}
            x1={mastX - 14 + k * 2}
            y1={mastTop + 26 + k * 14}
            x2={mastX + 14 - k * 2}
            y2={mastTop + 26 + k * 14}
            stroke={HULL.edge}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        <circle
          cx={mastX}
          cy={mastTop}
          r={5}
          fill={HULL.shade}
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={1}
        />

        {/* the floodlights, on posts either side, and what they throw */}
        {[platL + 2, platR - 2].map((x, i) => {
          const dir = i === 0 ? 1 : -1
          return (
            <g key={x}>
              <path d={`M${x} ${floorY - 96} L${x + dir * 96} ${floorY} L${x} ${floorY} z`} fill="url(#podBeam)" />
              <rect
                x={x - 3}
                y={floorY - 92}
                width={6}
                height={92}
                fill="url(#podStep)"
                stroke={HULL.edge}
                strokeOpacity={0.5}
                strokeWidth={0.6}
              />
              <rect
                x={x - 9}
                y={floorY - 104}
                width={18}
                height={14}
                rx={3}
                fill="url(#podPlate)"
                stroke={HULL.edge}
                strokeOpacity={0.7}
                strokeWidth={0.8}
                transform={`rotate(${dir * 28} ${x} ${floorY - 97})`}
              />
              <rect
                x={x - 6}
                y={floorY - 101}
                width={12}
                height={8}
                rx={1.5}
                fill={tier.light}
                fillOpacity={0.85}
                transform={`rotate(${dir * 28} ${x} ${floorY - 97})`}
              />
            </g>
          )
        })}

        {/* the platform: a lattice between two rails, floating */}
        <g stroke={HULL.edge} strokeOpacity={0.55} strokeWidth={0.8}>
          {bays.map((x) => (
            <g key={x}>
              <line x1={x} y1={floorY} x2={x + 16} y2={floorY + 14} />
              <line x1={x} y1={floorY + 14} x2={x + 16} y2={floorY} />
              <line x1={x} y1={floorY} x2={x} y2={floorY + 14} />
            </g>
          ))}
        </g>
        <rect x={platL - 4} y={floorY - 4} width={platR - platL + 8} height={5} rx={1.5} fill={HULL.lit} />
        <rect x={platL - 4} y={floorY + 13} width={platR - platL + 8} height={4} rx={1.5} fill={HULL.mid} />
        {[platL - 8, platR + 2].map((x) => (
          <rect
            key={x}
            x={x}
            y={floorY - 6}
            width={6}
            height={25}
            rx={1.5}
            fill={HULL.lit}
            stroke={HULL.shade}
            strokeWidth={0.8}
          />
        ))}
        {/* thrusters under it, so it holds its place */}
        {[platL + 30, platR - 30].map((x) => (
          <g key={x}>
            <rect
              x={x - 7}
              y={floorY + 17}
              width={14}
              height={8}
              rx={2}
              fill="url(#podPlate)"
              stroke={HULL.edge}
              strokeOpacity={0.6}
              strokeWidth={0.8}
            />
            <rect x={x - 4} y={floorY + 25} width={8} height={3} rx={1} fill={tier.fill} fillOpacity={0.8} />
          </g>
        ))}

        {/* the pedestals: graphite columns, a lit top, their place in dots */}
        {steps.map((s, i) => (
          <g key={i}>
            <rect
              x={s.x}
              y={floorY - s.h}
              width={s.w}
              height={s.h}
              rx={2}
              fill="url(#podStep)"
              stroke={HULL.edge}
              strokeOpacity={0.5}
              strokeWidth={0.8}
            />
            <line
              x1={s.x + 4}
              y1={floorY - s.h + 8}
              x2={s.x + s.w - 4}
              y2={floorY - s.h + 8}
              stroke={HULL.lit}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <rect x={s.x - 2} y={floorY - s.h - 5} width={s.w + 4} height={6} rx={1.5} fill="url(#podTop)" />
            <rect
              x={s.x - 2}
              y={floorY - s.h - 5}
              width={s.w + 4}
              height={2}
              rx={1}
              fill="#ffffff"
              fillOpacity={0.35}
            />
            {Array.from({ length: s.dots }, (_, k) => (
              <circle
                key={k}
                cx={s.x + s.w / 2 + (k - (s.dots - 1) / 2) * 8}
                cy={floorY - s.h / 2 + 2}
                r={2.4}
                fill={tier.light}
                fillOpacity={0.9}
              />
            ))}
          </g>
        ))}
        {/* the projector in the tallest one's top */}
        <rect x={holoX - 6} y={floorY - 70 - 8} width={12} height={4} rx={1} fill={HULL.shade} />
      </svg>

      {/* the hologram of the cup, thrown up over the first place: a steady
          haze of its light, and the cup itself flickering in it */}
      <span
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: holoX,
          top: holoY - 12,
          width: 64,
          height: 64,
          background: `radial-gradient(circle, ${tier.glow} 0%, transparent 65%)`,
          opacity: 0.7,
        }}
      />
      <span
        className={`station-flicker pointer-events-none absolute -translate-x-1/2 -translate-y-1/2${p}`}
        style={{
          left: holoX,
          top: holoY - 12,
          width: 44,
          height: 44,
          color: tier.light,
          filter: `drop-shadow(0 0 6px ${tier.glow})`,
        }}
      >
        <svg width={44} height={44} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M5.5 4h13v2.4h2.5v2.2a4.4 4.4 0 0 1-3.2 4.2A6.5 6.5 0 0 1 12 15a6.5 6.5 0 0 1-5.8-2.2A4.4 4.4 0 0 1 3 8.6V6.4h2.5z M5.5 8.6v1.6a2.6 2.6 0 0 0 .3 1.2A6.5 6.5 0 0 1 5.5 9.5z M18.5 8.6a6.5 6.5 0 0 1-.3 2.8 2.6 2.6 0 0 0 .3-1.2z"
            fillRule="evenodd"
            fillOpacity={0.85}
          />
          <path d="M10.5 15.5h3v2.5h2.5V20H8v-2h2.5z" fillOpacity={0.85} />
        </svg>
      </span>
      {/* the radar on the mast, sweeping */}
      <span
        className={`station-sweep pointer-events-none absolute -translate-x-1/2 -translate-y-1/2${p}`}
        style={{ left: mastX, top: mastTop, width: 44, height: 44 }}
      >
        <svg width={44} height={44} viewBox="0 0 44 44" aria-hidden="true">
          <path d="M22 22 L22 2 A20 20 0 0 1 36 8 z" fill={tier.fill} fillOpacity={0.35} />
          <line x1={22} y1={22} x2={22} y2={2} stroke={tier.light} strokeWidth={1.5} strokeOpacity={0.9} />
        </svg>
      </span>
      {/* the beacon at the mast's top */}
      <span
        className={`station-pulse pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
        style={{ left: mastX, top: mastTop, background: tier.light, boxShadow: `0 0 10px 3px ${tier.glow}` }}
      />
    </div>
  )
})

/* ── Vivero ────────────────────────────────────────────────────────────── */

const VIV_W = 260
const VIV_H = 270
/** The dome's radius, and how far below its centre the foot ring cuts it —
 *  most of a sphere, the way a greenhouse in space would be. */
const DOME_R = 84
const DOME_FOOT = 44
/** The tree under the dome: a root, two branches, four leaves, two buds —
 *  as the tree page's own is. Each node (x, y) in station px from the
 *  dome's centre, which node it hangs from, and its size. */
const TREE_NODES: { x: number; y: number; from: number | null; r: number }[] = [
  { x: 0, y: 30, from: null, r: 8 },
  { x: -32, y: 2, from: 0, r: 6 },
  { x: 32, y: 2, from: 0, r: 6 },
  { x: -56, y: -26, from: 1, r: 5 },
  { x: -20, y: -34, from: 1, r: 5 },
  { x: 20, y: -34, from: 2, r: 5 },
  { x: 56, y: -26, from: 2, r: 5 },
  { x: -14, y: -62, from: 4, r: 4 },
  { x: 14, y: -62, from: 5, r: 4 },
]

/**
 * The Vivero: the tree, grown. A glass sphere, nearly whole, with the
 * upgrade tree inside it as a thing — nodes of light on branches, the root
 * in its bed at the bottom, the leaves and buds up under the glass, each
 * one breathing on its own beat, and a haze of its own light round each
 * like foliage. The dome is the building; what holds it is small: a foot
 * ring with the grow lights set in it, a short drum under that with a few
 * windows and the thrusters that keep it in place, a tank of what the tree
 * drinks off one side and a radiator off the other. Tapping it opens the
 * tree.
 */
const NurseryStation = memo(function NurseryStation({
  paused,
  label,
  at,
  onTap,
}: {
  paused: boolean
  label: string
  at: { x: number; y: number }
  onTap: () => void
}) {
  const tier = VIOLET
  const tap = useTap(onTap)
  const p = paused ? ' station-paused' : ''
  const cx = VIV_W / 2
  // the dome's centre; the foot ring, the drum and the pods go down from it
  // the dome's centre sits so the whole drawing — cap to pods — is centred
  // in the box, since the box's centre is what's put on the orbit
  const dy = VIV_H / 2 + 2
  const footY = dy + DOME_FOOT
  const footHalf = Math.sqrt(DOME_R * DOME_R - DOME_FOOT * DOME_FOOT)
  const drumTop = footY + 6
  const drumH = 34
  const drumHalf = footHalf - 10
  const tankX = cx - drumHalf - 26
  const finsX = cx + drumHalf + 8
  // the dome as a path: the arc over the foot chord
  const dome = `M${cx - footHalf} ${footY} A${DOME_R} ${DOME_R} 0 1 1 ${cx + footHalf} ${footY} z`
  return (
    <div
      role="button"
      aria-label={label}
      className={`station-hover pointer-events-auto absolute cursor-pointer${p}`}
      style={{
        width: VIV_W,
        height: VIV_H,
        left: `calc(50% + ${at.x - VIV_W / 2}px)`,
        top: `calc(50% + ${at.y - VIV_H / 2}px)`,
        animationDelay: '-1.5s',
      }}
      {...tap}
    >
      <svg
        width={VIV_W}
        height={VIV_H}
        viewBox={`0 0 ${VIV_W} ${VIV_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <linearGradient id="vivHull" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.25" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="vivPlate" x1="0" x2="0.4" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.35" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <radialGradient id="vivDomeIn" cx="0.5" cy="0.8" r="0.75">
            <stop offset="0" stopColor={tier.dark} stopOpacity="0.6" />
            <stop offset="0.6" stopColor="#000" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" stopOpacity="0.72" />
          </radialGradient>
          <radialGradient id="vivGlass" cx="0.3" cy="0.26" r="0.78">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="0.85" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.16" />
          </radialGradient>
          <radialGradient id="vivLeaf">
            <stop offset="0" stopColor={tier.fill} stopOpacity="0.5" />
            <stop offset="1" stopColor={tier.fill} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vivTank" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={GLASS.deep} />
            <stop offset="0.4" stopColor={GLASS.mid} />
            <stop offset="1" stopColor={GLASS.deep} />
          </linearGradient>
          <radialGradient id="vivNode" cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor={tier.light} />
            <stop offset="0.5" stopColor={tier.fill} />
            <stop offset="1" stopColor={tier.dark} />
          </radialGradient>
          <clipPath id="vivDomeClip">
            <path d={dome} />
          </clipPath>
        </defs>

        {/* the radiator off the right: fins on a boom */}
        <line
          x1={cx + drumHalf}
          y1={drumTop + 14}
          x2={finsX + 34}
          y2={drumTop + 14}
          stroke={HULL.edge}
          strokeWidth={3}
        />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect
            key={k}
            x={finsX + 4 + k * 6}
            y={drumTop - 6}
            width={3.5}
            height={40}
            rx={1}
            fill={HULL.mid}
            stroke={HULL.edge}
            strokeOpacity={0.6}
            strokeWidth={0.6}
          />
        ))}
        {/* the tank off the left: what the tree drinks, in glass, piped up to the bed */}
        <rect
          x={tankX - 11}
          y={drumTop - 14}
          width={22}
          height={54}
          rx={6}
          fill="url(#vivTank)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
        <rect x={tankX - 7} y={drumTop - 8} width={4.5} height={34} rx={2} fill="#ffffff" fillOpacity={0.14} />
        <ellipse
          cx={tankX}
          cy={drumTop - 14}
          rx={11}
          ry={3.5}
          fill="url(#vivPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <ellipse
          cx={tankX}
          cy={drumTop + 40}
          rx={11}
          ry={3.5}
          fill="url(#vivPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={tankX + 9}
          y={drumTop + 10}
          width={cx - drumHalf - tankX - 7}
          height={7}
          rx={2}
          fill={HULL.mid}
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={0.8}
        />
        <path
          d={`M${tankX} ${drumTop - 14} v-10 h${cx - footHalf - tankX + 12} v${DOME_FOOT - 30 + 8}`}
          fill="none"
          stroke={HULL.edge}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* the drum under the dome: a short hull with windows, and the pods */}
        <rect x={cx - drumHalf} y={drumTop} width={drumHalf * 2} height={drumH} fill="url(#vivHull)" />
        <ellipse cx={cx + drumHalf} cy={drumTop + drumH / 2} rx={5} ry={drumH / 2} fill={HULL.shade} />
        <ellipse cx={cx - drumHalf} cy={drumTop + drumH / 2} rx={5} ry={drumH / 2} fill={HULL.lit} />
        <line
          x1={cx - drumHalf + 8}
          y1={drumTop + drumH - 8}
          x2={cx + drumHalf - 8}
          y2={drumTop + drumH - 8}
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={2}
        />
        {[-2, -1, 0, 1, 2].map((k) => (
          <rect
            key={k}
            x={cx + k * 19 - 4}
            y={drumTop + 9}
            width={8}
            height={11}
            rx={1.5}
            fill={tier.light}
            fillOpacity={k === 1 ? 0.35 : 0.9}
          />
        ))}
        {[cx - drumHalf + 16, cx, cx + drumHalf - 16].map((x) => (
          <g key={x}>
            <rect
              x={x - 8}
              y={drumTop + drumH}
              width={16}
              height={9}
              rx={2}
              fill="url(#vivPlate)"
              stroke={HULL.edge}
              strokeOpacity={0.6}
              strokeWidth={0.8}
            />
            <rect x={x - 5} y={drumTop + drumH + 9} width={10} height={3} rx={1} fill={tier.fill} fillOpacity={0.8} />
          </g>
        ))}

        {/* ── the dome: its dark inside, the bed, the tree, the glass ── */}
        <path d={dome} fill="url(#vivDomeIn)" />
        <g clipPath="url(#vivDomeClip)">
          {/* the bed the root stands in, and the soil's light */}
          <ellipse cx={cx} cy={footY} rx={footHalf} ry={16} fill={tier.dark} fillOpacity={0.7} />
          <ellipse cx={cx} cy={footY - 2} rx={footHalf - 10} ry={8} fill={tier.fill} fillOpacity={0.12} />
          {/* the foliage: a haze of light round every leaf and bud */}
          {TREE_NODES.slice(3).map((n, i) => (
            <circle key={i} cx={cx + n.x} cy={dy + n.y} r={n.r * 4.2} fill="url(#vivLeaf)" />
          ))}
          {/* the trunk and the branches, then the nodes over them */}
          <line
            x1={cx}
            y1={footY - 2}
            x2={cx + TREE_NODES[0].x}
            y2={dy + TREE_NODES[0].y}
            stroke={tier.fill}
            strokeOpacity={0.8}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {TREE_NODES.map((n, i) =>
            n.from === null ? null : (
              <line
                key={i}
                x1={cx + TREE_NODES[n.from].x}
                y1={dy + TREE_NODES[n.from].y}
                x2={cx + n.x}
                y2={dy + n.y}
                stroke={tier.fill}
                strokeOpacity={0.8}
                strokeWidth={i < 3 ? 3.2 : i < 7 ? 2.4 : 1.8}
                strokeLinecap="round"
              />
            ),
          )}
          {TREE_NODES.map((n, i) => (
            <g key={i}>
              <circle
                cx={cx + n.x}
                cy={dy + n.y}
                r={n.r + 2.5}
                fill={HULL.shade}
                stroke={HULL.edge}
                strokeOpacity={0.6}
                strokeWidth={0.8}
              />
              <circle cx={cx + n.x} cy={dy + n.y} r={n.r} fill="url(#vivNode)" />
              <ellipse
                cx={cx + n.x - n.r * 0.3}
                cy={dy + n.y - n.r * 0.4}
                rx={n.r * 0.45}
                ry={n.r * 0.25}
                fill="#ffffff"
                fillOpacity={0.35}
              />
            </g>
          ))}
        </g>
        {/* the glass over it all: highlight, rim, ribs, the cap */}
        <path d={dome} fill="url(#vivGlass)" />
        <path d={dome} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" />
        <g clipPath="url(#vivDomeClip)" fill="none" stroke={HULL.edge} strokeOpacity={0.5} strokeWidth={1.2}>
          {[-0.62, -0.3, 0.3, 0.62].map((k) => (
            <ellipse key={k} cx={cx} cy={dy} rx={DOME_R * Math.abs(k)} ry={DOME_R} />
          ))}
          <line x1={cx} y1={dy - DOME_R} x2={cx} y2={footY} />
          <ellipse cx={cx} cy={dy - DOME_R * 0.45} rx={DOME_R * 0.89} ry={DOME_R * 0.2} />
          <ellipse cx={cx} cy={dy + DOME_R * 0.1} rx={DOME_R * 0.995} ry={DOME_R * 0.2} />
        </g>
        <rect
          x={cx - 7}
          y={dy - DOME_R - 8}
          width={14}
          height={10}
          rx={2.5}
          fill="url(#vivPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        <line x1={cx} y1={dy - DOME_R - 8} x2={cx} y2={dy - DOME_R - 18} stroke={HULL.edge} strokeWidth={1.5} />
        {/* the foot ring, with the grow lights set in it */}
        <rect
          x={cx - footHalf - 8}
          y={footY - 5}
          width={footHalf * 2 + 16}
          height={11}
          rx={3.5}
          fill="url(#vivPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        {Array.from({ length: 9 }, (_, k) => (
          <rect
            key={k}
            x={cx - footHalf + 2 + k * ((footHalf * 2 - 4) / 8) - 3}
            y={footY - 2.5}
            width={6}
            height={5}
            rx={1}
            fill={tier.light}
            fillOpacity={0.9}
          />
        ))}
      </svg>

      {/* the nodes' glow, each on its own beat — the tree alive */}
      {TREE_NODES.map((n, i) => (
        <span
          key={i}
          className={`station-pulse pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
          style={{
            left: cx + n.x,
            top: dy + n.y,
            width: n.r * 2 + 2,
            height: n.r * 2 + 2,
            boxShadow: `0 0 ${n.r + 5}px ${n.r / 2 + 1}px ${tier.glow}`,
            animationDelay: `-${i * 0.4}s`,
          }}
        />
      ))}
      {/* the beacon on the dome's cap */}
      <span
        className={`station-blink pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
        style={{ left: cx, top: dy - DOME_R - 19, background: tier.light, boxShadow: `0 0 8px 2px ${tier.glow}` }}
      />
    </div>
  )
})

/* ── Tienda ────────────────────────────────────────────────────────────── */

const MKT_W = 360
const MKT_H = 250
/** The sign's lights: this many, chasing round its edge. */
const SIGN_LIGHTS = 14

/**
 * The Tienda: a trading post. The same pressurised hull as the Refinería,
 * with the shop built on top of it — a storefront with a striped awning
 * and a lit sign over it, the store tab's own silhouette made a place —
 * and the stock hanging under the hull in crates on cables. A dish on the
 * roof, a docking collar on the left where the goods come in. Tapping it
 * opens the store.
 */
const MarketStation = memo(function MarketStation({
  paused,
  label,
  at,
  onTap,
}: {
  paused: boolean
  label: string
  at: { x: number; y: number }
  onTap: () => void
}) {
  const tier = VIOLET
  const tap = useTap(onTap)
  const p = paused ? ' station-paused' : ''
  const cx = MKT_W / 2
  const cy = MKT_H / 2 + 20
  // the hull, the shop on it, the awning over the shop, the sign over that
  const hullX = 58
  const hullW = 244
  const shopX = cx - 66
  const shopW = 132
  const shopTop = cy - 96
  const awnY = shopTop - 4
  const awnL = shopX - 12
  const awnR = shopX + shopW + 12
  const signX = cx - 46
  const signY = awnY - 30
  const signW = 92
  const signH = 20
  const dishX = shopX + shopW + 32
  const dishY = cy - 78
  const scallops = Array.from({ length: 8 }, (_, i) => awnL + (i * (awnR - awnL)) / 8)
  const crates = [
    { x: hullX + 38, y: cy + 58, w: 30, h: 22 },
    { x: hullX + 108, y: cy + 66, w: 34, h: 26 },
    { x: hullX + 184, y: cy + 56, w: 28, h: 22 },
  ]
  // the sign's lights, round its edge, clockwise from the top left
  const signLights = Array.from({ length: SIGN_LIGHTS }, (_, i) => {
    const per = (signW + signH) * 2
    let d = (i / SIGN_LIGHTS) * per
    if (d < signW) return { x: signX + d, y: signY }
    d -= signW
    if (d < signH) return { x: signX + signW, y: signY + d }
    d -= signH
    if (d < signW) return { x: signX + signW - d, y: signY + signH }
    d -= signW
    return { x: signX, y: signY + signH - d }
  })
  return (
    <div
      role="button"
      aria-label={label}
      className={`station-hover pointer-events-auto absolute cursor-pointer${p}`}
      style={{
        width: MKT_W,
        height: MKT_H,
        left: `calc(50% + ${at.x - MKT_W / 2}px)`,
        top: `calc(50% + ${at.y - MKT_H / 2}px)`,
        animationDelay: '-2.7s',
      }}
      {...tap}
    >
      <svg
        width={MKT_W}
        height={MKT_H}
        viewBox={`0 0 ${MKT_W} ${MKT_H}`}
        className="pointer-events-none absolute left-0 top-0"
      >
        <defs>
          <linearGradient id="mktHull" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.mid} />
            <stop offset="0.25" stopColor={HULL.lit} />
            <stop offset="0.6" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="mktPlate" x1="0" x2="0.4" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.35" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="mktPanel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={GLASS.lit} />
            <stop offset="0.3" stopColor={GLASS.mid} />
            <stop offset="1" stopColor={GLASS.deep} />
          </linearGradient>
          <linearGradient id="mktAwning" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={tier.light} />
            <stop offset="0.5" stopColor={tier.fill} />
            <stop offset="1" stopColor={tier.dark} />
          </linearGradient>
          <linearGradient id="mktSign" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={tier.dark} />
            <stop offset="0.5" stopColor={tier.fill} />
            <stop offset="1" stopColor={tier.dark} />
          </linearGradient>
          <linearGradient id="mktCrate" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.5" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
        </defs>

        {/* the dish, on a mast off the hull to the right of the shop: the
            bowl open upward, its feed over it */}
        <line x1={dishX} y1={cy - 28} x2={dishX} y2={dishY} stroke={HULL.edge} strokeWidth={2.5} />
        <line
          x1={dishX - 8}
          y1={cy - 28}
          x2={dishX + 8}
          y2={cy - 28}
          stroke={HULL.edge}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path
          d={`M${dishX - 16} ${dishY} a16 9 0 0 0 32 0 z`}
          fill="url(#mktPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <ellipse cx={dishX} cy={dishY} rx={16} ry={2.5} fill={HULL.lit} />
        <line x1={dishX} y1={dishY} x2={dishX} y2={dishY - 14} stroke={HULL.edge} strokeWidth={1.5} />
        <circle cx={dishX} cy={dishY - 15} r={2} fill={HULL.lit} />

        {/* the cables the stock hangs on, and the crates */}
        {crates.map((c, i) => (
          <g key={i}>
            <line
              x1={c.x + 5}
              y1={cy + 30}
              x2={c.x + 5}
              y2={c.y}
              stroke={HULL.edge}
              strokeOpacity={0.7}
              strokeWidth={1}
            />
            <line
              x1={c.x + c.w - 5}
              y1={cy + 30}
              x2={c.x + c.w - 5}
              y2={c.y}
              stroke={HULL.edge}
              strokeOpacity={0.7}
              strokeWidth={1}
            />
            <rect
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              rx={2.5}
              fill="url(#mktCrate)"
              stroke={HULL.edge}
              strokeOpacity={0.6}
              strokeWidth={0.8}
            />
            <rect x={c.x} y={c.y + c.h / 2 - 2.5} width={c.w} height={5} fill={tier.fill} fillOpacity={0.85} />
            <line
              x1={c.x + c.w / 2}
              y1={c.y + 2}
              x2={c.x + c.w / 2}
              y2={c.y + c.h - 2}
              stroke="#08080c"
              strokeOpacity={0.45}
              strokeWidth={1}
            />
            {[c.x + 4, c.x + c.w - 4].map((bx) => (
              <g key={bx}>
                <circle cx={bx} cy={c.y + 4} r={1} fill={HULL.shade} />
                <circle cx={bx} cy={c.y + c.h - 4} r={1} fill={HULL.shade} />
              </g>
            ))}
          </g>
        ))}

        {/* the docking collar on the left, where the goods come in */}
        <rect
          x={hullX - 30}
          y={cy - 14}
          width={34}
          height={28}
          rx={3}
          fill="url(#mktPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.8}
        />
        <ellipse
          cx={hullX - 30}
          cy={cy}
          rx={5}
          ry={18}
          fill={HULL.shade}
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={1}
        />
        <ellipse cx={hullX - 30} cy={cy} rx={2.5} ry={11} fill={GLASS.deep} />
        <rect
          x={hullX - 18}
          y={cy - 20}
          width={6}
          height={40}
          rx={1.5}
          fill={HULL.lit}
          stroke={HULL.shade}
          strokeWidth={0.8}
        />

        {/* the shop, on the hull: a box with the storefront on its face */}
        <rect
          x={shopX}
          y={shopTop}
          width={shopW}
          height={cy - 30 - shopTop + 6}
          rx={5}
          fill="url(#mktPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.8}
        />
        {/* the shopfront glass, in two panes, lit from inside */}
        {[0, 1].map((k) => (
          <rect
            key={k}
            x={shopX + 14 + k * 58}
            y={shopTop + 26}
            width={46}
            height={30}
            rx={2.5}
            fill="url(#mktPanel)"
            stroke={HULL.edge}
            strokeOpacity={0.7}
            strokeWidth={0.8}
          />
        ))}
        {[0, 1].map((k) => (
          <rect
            key={k}
            x={shopX + 20 + k * 58}
            y={shopTop + 32}
            width={34}
            height={5}
            rx={1}
            fill="#ffffff"
            fillOpacity={0.14}
          />
        ))}
        {/* the goods in the window: three small shelves with lit blocks */}
        {[0, 1].map((k) =>
          [0, 1, 2].map((j) => (
            <rect
              key={k * 3 + j}
              x={shopX + 20 + k * 58 + j * 12}
              y={shopTop + 44}
              width={8}
              height={7}
              rx={1}
              fill={tier.light}
              fillOpacity={0.9 - j * 0.2}
            />
          )),
        )}
        {/* the door between the panes */}
        <rect
          x={shopX + shopW / 2 - 8}
          y={shopTop + 30}
          width={16}
          height={cy - 30 - shopTop - 24}
          rx={2}
          fill={HULL.shade}
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={0.8}
        />
        <rect
          x={shopX + shopW / 2 - 4}
          y={shopTop + 36}
          width={8}
          height={10}
          rx={1}
          fill={tier.fill}
          fillOpacity={0.7}
        />

        {/* the awning: a striped canopy with a scalloped edge, the store
            tab's own shape */}
        <path
          d={`M${awnL} ${awnY + 10} L${awnL + 10} ${awnY - 12} H${awnR - 10} L${awnR} ${awnY + 10} z`}
          fill="url(#mktAwning)"
        />
        {scallops.map((x, i) => (
          <path
            key={i}
            d={`M${x} ${awnY + 10} a${(awnR - awnL) / 16} 7 0 0 0 ${(awnR - awnL) / 8} 0 z`}
            fill={i % 2 ? tier.fill : tier.dark}
          />
        ))}
        {scallops.map((x, i) =>
          i % 2 ? (
            <rect
              key={i}
              x={x}
              y={awnY - 10}
              width={(awnR - awnL) / 8}
              height={20}
              fill={tier.dark}
              fillOpacity={0.55}
            />
          ) : null,
        )}
        <line
          x1={awnL + 10}
          y1={awnY - 12}
          x2={awnR - 10}
          y2={awnY - 12}
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={2}
        />
        {/* the sign over the awning: a lit panel on two posts */}
        {[signX + 12, signX + signW - 12].map((x) => (
          <line key={x} x1={x} y1={signY + signH} x2={x} y2={awnY - 12} stroke={HULL.edge} strokeWidth={2.5} />
        ))}
        <rect
          x={signX - 4}
          y={signY - 4}
          width={signW + 8}
          height={signH + 8}
          rx={4}
          fill={HULL.shade}
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
        <rect x={signX} y={signY} width={signW} height={signH} rx={2.5} fill="url(#mktSign)" />
        {/* the sign's mark: three bars, like a price tag's lines */}
        {[0, 1, 2].map((k) => (
          <rect
            key={k}
            x={signX + 22 + k * 18}
            y={signY + 5}
            width={12}
            height={signH - 10}
            rx={1.5}
            fill={tier.light}
            fillOpacity={0.9}
          />
        ))}

        {/* the hull under it all */}
        <rect x={hullX} y={cy - 30} width={hullW} height={60} fill="url(#mktHull)" />
        <ellipse cx={hullX + hullW} cy={cy} rx={7} ry={30} fill={HULL.shade} />
        <ellipse cx={hullX} cy={cy} rx={7} ry={30} fill={HULL.lit} />
        <rect x={shopX - 10} y={cy - 30} width={shopW + 20} height={9} fill="#000" fillOpacity={0.22} />
        <line
          x1={shopX - 8}
          y1={cy - 29}
          x2={shopX + shopW + 8}
          y2={cy - 29}
          stroke={HULL.lit}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={hullX + 48 + i * 50}
            y1={cy - 30}
            x2={hullX + 48 + i * 50}
            y2={cy + 30}
            stroke="#08080c"
            strokeOpacity={0.4}
            strokeWidth={1.2}
          />
        ))}
        <line
          x1={hullX + 10}
          y1={cy + 18}
          x2={hullX + hullW - 10}
          y2={cy + 18}
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={2}
        />
        {/* windows, the Refinería's kind */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <rect
            key={i}
            x={hullX + 18 + i * 19}
            y={cy - 12}
            width={8}
            height={11}
            rx={1.5}
            fill={tier.light}
            fillOpacity={i === 7 ? 0.35 : 0.9}
          />
        ))}
      </svg>

      {/* the sign's lights, chasing round its edge */}
      {signLights.map((l, i) => (
        <span
          key={i}
          className={`station-chase pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
          style={{
            left: l.x,
            top: l.y,
            background: tier.light,
            boxShadow: `0 0 6px 1px ${tier.glow}`,
            animationDelay: `-${(i / SIGN_LIGHTS) * 2.4}s`,
          }}
        />
      ))}
      {/* the beacon on the dish's feed */}
      <span
        className={`station-pulse pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
        style={{ left: dishX, top: dishY - 15, background: tier.light, boxShadow: `0 0 10px 3px ${tier.glow}` }}
      />
    </div>
  )
})

export const SpaceStations = memo(function SpaceStations({
  tierIndex,
  fleet,
  level,
  paused,
  labels,
  offsets = STATION_OFFSETS,
  showNode = false,
  showNursery = false,
  only,
  smelting = false,
  onOpenFleet,
  onOpenRefinery,
  onOpenMarket,
  onOpenPodium,
  onOpenNursery,
}: {
  tierIndex: number
  /** Units in the fleet — lights that many of the Nodo's windows. */
  fleet: number
  /** 0–1, how bright the Refinería's reactor runs. Quantize before passing. */
  level: number
  paused: boolean
  labels: { node: string; refinery: string; market: string; podium: string; nursery: string }
  /** Where they sit; pass a stable object so the memo holds. */
  offsets?: StationOffsets
  /** The Nodo is built but not placed yet — off until it has a job. */
  showNode?: boolean
  /** The Vivero likewise — drawn, and waiting for its place. */
  showNursery?: boolean
  /** Draw just these — the page draws the Refinería at one size and the
   *  rest at another, in two of these. */
  only?: Array<'refinery' | 'market' | 'podium' | 'nursery'>
  /** The Refinería has a core on the go. */
  smelting?: boolean
  onOpenFleet: () => void
  onOpenRefinery: () => void
  onOpenMarket: () => void
  onOpenPodium: () => void
  onOpenNursery: () => void
}) {
  return (
    <>
      {showNode && (
        <NodeStation
          tierIndex={tierIndex}
          fleet={fleet}
          paused={paused}
          label={labels.node}
          at={offsets.node}
          onTap={onOpenFleet}
        />
      )}
      {(!only || only.includes('refinery')) && (
        <RefineryStation
          tierIndex={tierIndex}
          level={level}
          paused={paused}
          smelting={smelting}
          label={labels.refinery}
          at={offsets.refinery}
          onTap={onOpenRefinery}
        />
      )}
      {(!only || only.includes('market')) && (
        <MarketStation paused={paused} label={labels.market} at={offsets.market} onTap={onOpenMarket} />
      )}
      {(!only || only.includes('podium')) && (
        <PodiumStation paused={paused} label={labels.podium} at={offsets.podium} onTap={onOpenPodium} />
      )}
      {showNursery && (!only || only.includes('nursery')) && (
        <NurseryStation paused={paused} label={labels.nursery} at={offsets.nursery} onTap={onOpenNursery} />
      )}
    </>
  )
})
