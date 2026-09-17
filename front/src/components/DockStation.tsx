// The berth: a cradle floating in space with the ship set down in it, and
// the astronaut outside.
//
// No ground out here — the ship stands on a lattice beam with two pylons
// rising either side of it, clamp arms locked onto the hull's belts, a
// lamp on each pylon, approach lights along the beam. A rounded rocket in
// the station's own graphite, nose up, with the astronaut's violet where the
// astronaut has violet (belts, portholes, the planet badge) and a stripe of
// sand. The reactor hatch is open amidships with the core flickering weakly
// behind it — that is what's broken, and what the ship modal opens onto. The
// ship is berthed on purpose: a broken reactor doesn't fly. The ladder comes
// down from the hatch to the beam and the player's own astronaut (their
// AstronautAvatar, their outfit) floats out on a tether from it.
//
// The whole berth drifts — nothing holds it — a slow lift and settle on the
// outer box, so the ship, the cradle and the astronaut ride together.
//
// Same rendering rule as every building: still SVG; whatever moves is a
// span with its own transform/opacity animation.

import { memo } from 'react'
import { useTap } from '../hooks/useTap'
import { AstronautAvatar } from './AstronautAvatar'
import type { AstronautStyleIds } from '../lib/astronautStyles'

const HULL = { lit: '#5a5f6d', mid: '#2b2e38', shade: '#15171e', edge: '#7d8290' }
const VIOLET = { light: '#ede9fe', fill: '#a78bfa', dark: '#3b0764', glow: 'rgba(168,85,247,0.6)' }
const SAND = '#e5cf8a'

const BASE_W = 440
const BASE_H = 380
/** Drawn at BASE size and scaled up as one, avatar included, so every ratio
 *  holds — the ship, the cradle, the astronaut against the ship. */
const SCALE = 1.6
export const DOCK_W = BASE_W * SCALE
export const DOCK_H = BASE_H * SCALE
/** Where the ship itself is, from the box's centre, in stage px: the box
 *  is bigger than the drawing (the astronaut and the tether need the
 *  room) and the ship sits right and low in it. Whoever places the berth
 *  subtracts this, so `at` is where the ship is, not where the box is. */
export const DOCK_SHIP_CENTER = { x: 20 * SCALE, y: 25 * SCALE }
const BEAM_LIGHTS = 12

export const DockStation = memo(function DockStation({
  paused,
  label,
  at,
  styleIds,
  repair,
  onTap,
  astronautLabel,
  onTapAstronaut,
}: {
  paused: boolean
  label: string
  at: { x: number; y: number }
  /** The player's outfit — the same ids the profile draws. */
  styleIds: AstronautStyleIds
  /** 0–1, how far the reactor is repaired: the hatch glows that much. */
  repair: number
  onTap: () => void
  /** The astronaut is the player: tapping them opens the profile. */
  astronautLabel: string
  onTapAstronaut: () => void
}) {
  const tap = useTap(onTap)
  const astronautTap = useTap(onTapAstronaut)
  const p = paused ? ' station-paused' : ''
  const cx = BASE_W / 2 + 20
  // the beam's top face is where the legs stand
  const beamY = BASE_H - 60
  const base = beamY - 2
  const W = 64
  const H = 210
  const top = base - H
  const hatchY = top + 124
  const beamL = cx - 130
  const beamR = cx + 130
  const bays = Array.from({ length: Math.floor((beamR - beamL) / 20) }, (_, i) => beamL + i * 20)
  // The box is far bigger than the drawing (the astronaut and the tether
  // need the room), so the tap target is only the cradle and the ship: a
  // press outside them belongs to whatever is behind — another station,
  // the stage.
  const hit = {
    x: (beamL - 10) * SCALE,
    y: (top - 30) * SCALE,
    w: (beamR - beamL + 20) * SCALE,
    h: (beamY + 24 - top + 30) * SCALE,
  }
  return (
    <div
      className={`station-hover pointer-events-none absolute${p}`}
      style={{
        width: DOCK_W,
        height: DOCK_H,
        left: `calc(50% + ${at.x - DOCK_W / 2}px)`,
        top: `calc(50% + ${at.y - DOCK_H / 2}px)`,
      }}
    >
      <div
        role="button"
        aria-label={label}
        className="pointer-events-auto absolute z-10 cursor-pointer"
        style={{ left: hit.x, top: hit.y, width: hit.w, height: hit.h }}
        {...tap}
      />
      <div
        className="absolute left-0 top-0 z-20 origin-top-left"
        style={{ width: BASE_W, height: BASE_H, transform: `scale(${SCALE})` }}
      >
        {/* the engines' idle light under the bell */}
        <span
          className={`station-pulse pointer-events-none absolute h-16 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
          style={{
            left: cx,
            top: base - 8,
            background: `radial-gradient(ellipse, ${VIOLET.glow} 0%, transparent 65%)`,
          }}
        />

        <svg
          width={BASE_W}
          height={BASE_H}
          viewBox={`0 0 ${BASE_W} ${BASE_H}`}
          className="pointer-events-none absolute left-0 top-0"
        >
          <defs>
            <linearGradient id="shipHull" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={HULL.mid} />
              <stop offset="0.28" stopColor={HULL.lit} />
              <stop offset="0.6" stopColor={HULL.mid} />
              <stop offset="1" stopColor={HULL.shade} />
            </linearGradient>
            <linearGradient id="shipFin" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={VIOLET.light} />
              <stop offset="0.5" stopColor={VIOLET.fill} />
              <stop offset="1" stopColor={VIOLET.dark} />
            </linearGradient>
            <linearGradient id="shipBell" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={HULL.shade} />
              <stop offset="0.35" stopColor={HULL.lit} />
              <stop offset="1" stopColor={HULL.shade} />
            </linearGradient>
            <linearGradient id="shipPlate" x1="0" x2="0.4" y1="0" y2="1">
              <stop offset="0" stopColor={HULL.lit} />
              <stop offset="0.35" stopColor={HULL.mid} />
              <stop offset="1" stopColor={HULL.shade} />
            </linearGradient>
            <linearGradient id="dockPylon" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={HULL.mid} />
              <stop offset="0.3" stopColor={HULL.lit} />
              <stop offset="0.6" stopColor={HULL.mid} />
              <stop offset="1" stopColor={HULL.shade} />
            </linearGradient>
            <radialGradient id="shipCore">
              <stop offset="0" stopColor={VIOLET.light} stopOpacity={0.4 + repair * 0.6} />
              <stop offset="0.4" stopColor={VIOLET.fill} stopOpacity={0.3 + repair * 0.6} />
              <stop offset="1" stopColor={VIOLET.fill} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── the cradle ── */}
          {/* the beam the ship stands on: a lattice between two rails */}
          <g stroke={HULL.edge} strokeOpacity={0.55} strokeWidth={0.8}>
            {bays.map((x) => (
              <g key={x}>
                <line x1={x} y1={beamY} x2={x + 20} y2={beamY + 16} />
                <line x1={x} y1={beamY + 16} x2={x + 20} y2={beamY} />
                <line x1={x} y1={beamY} x2={x} y2={beamY + 16} />
              </g>
            ))}
          </g>
          <rect x={beamL - 4} y={beamY - 4} width={beamR - beamL + 8} height={5} rx={1.5} fill={HULL.lit} />
          <rect x={beamL - 4} y={beamY + 15} width={beamR - beamL + 8} height={4} rx={1.5} fill={HULL.mid} />
          {/* the pylons, one each side, and their caps */}
          {[beamL + 6, beamR - 22].map((x, i) => (
            <g key={i}>
              <rect
                x={x}
                y={hatchY - 30}
                width={16}
                height={beamY - hatchY + 30}
                rx={3}
                fill="url(#dockPylon)"
                stroke={HULL.edge}
                strokeOpacity={0.5}
                strokeWidth={0.8}
              />
              <rect x={x - 5} y={hatchY - 36} width={26} height={8} rx={2} fill={HULL.lit} />
              {/* where the pylon meets the beam: a bolted foot plate and a brace */}
              <rect
                x={x - 6}
                y={beamY - 8}
                width={28}
                height={6}
                rx={1.5}
                fill={HULL.lit}
                stroke={HULL.shade}
                strokeWidth={0.8}
              />
              {[x - 3, x + 19].map((bx) => (
                <circle key={bx} cx={bx} cy={beamY - 5} r={1.3} fill={HULL.shade} />
              ))}
              <line
                x1={i === 0 ? x + 16 : x}
                y1={beamY - 40}
                x2={i === 0 ? x + 44 : x - 28}
                y2={beamY - 4}
                stroke={HULL.edge}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* clamp arms locking onto the hull's lower belt and its waist:
                each one leaves the pylon through a bolted bracket, and ends
                in a padded jaw on the skin */}
              {[base - 92, hatchY + 30].map((y) => {
                const from = i === 0 ? x + 16 : x
                const to = i === 0 ? cx - W / 2 - 2 : cx + W / 2 + 2
                return (
                  <g key={y}>
                    <rect
                      x={from - (i === 0 ? 2 : 8)}
                      y={y - 9}
                      width={10}
                      height={18}
                      rx={2}
                      fill={HULL.lit}
                      stroke={HULL.shade}
                      strokeWidth={0.8}
                    />
                    <circle cx={from + (i === 0 ? 3 : -3)} cy={y - 5} r={1.2} fill={HULL.shade} />
                    <circle cx={from + (i === 0 ? 3 : -3)} cy={y + 5} r={1.2} fill={HULL.shade} />
                    <line x1={from} y1={y} x2={to} y2={y} stroke={HULL.edge} strokeWidth={5} strokeLinecap="round" />
                    <line x1={from} y1={y - 1.2} x2={to} y2={y - 1.2} stroke={HULL.lit} strokeWidth={1} />
                    <rect
                      x={i === 0 ? cx - W / 2 - 8 : cx + W / 2 + 2}
                      y={y - 8}
                      width={6}
                      height={16}
                      rx={2}
                      fill={HULL.lit}
                      stroke={HULL.shade}
                      strokeWidth={0.8}
                    />
                    <rect
                      x={i === 0 ? cx - W / 2 - 3 : cx + W / 2}
                      y={y - 6}
                      width={3}
                      height={12}
                      rx={1}
                      fill={VIOLET.dark}
                    />
                  </g>
                )
              })}
            </g>
          ))}
          {/* the beam's end caps */}
          {[beamL - 8, beamR + 2].map((x) => (
            <rect
              key={x}
              x={x}
              y={beamY - 6}
              width={6}
              height={27}
              rx={1.5}
              fill={HULL.lit}
              stroke={HULL.shade}
              strokeWidth={0.8}
            />
          ))}

          {/* ── the ship ── */}
          {/* the back leg, the fin behind */}
          <line x1={cx} y1={base - 46} x2={cx} y2={base - 6} stroke={HULL.mid} strokeWidth={5} strokeLinecap="round" />
          <path
            d={`M${cx - 6} ${base - 80} L${cx + 6} ${base - 80} L${cx + 9} ${base - 24} L${cx - 9} ${base - 24} Z`}
            fill={VIOLET.dark}
          />
          {/* the side fins */}
          <path
            d={`M${cx - W / 2 + 4} ${base - 84} L${cx - W / 2 - 30} ${base - 22} L${cx - W / 2 - 24} ${base - 14} L${cx - W / 2 + 6} ${base - 30} Z`}
            fill="url(#shipFin)"
          />
          <path
            d={`M${cx + W / 2 - 4} ${base - 84} L${cx + W / 2 + 30} ${base - 22} L${cx + W / 2 + 24} ${base - 14} L${cx + W / 2 - 6} ${base - 30} Z`}
            fill="url(#shipFin)"
          />
          {/* the front legs and their feet, on the beam */}
          {[-1, 1].map((d) => (
            <g key={d}>
              <line
                x1={cx + d * 16}
                y1={base - 46}
                x2={cx + d * 34}
                y2={base - 6}
                stroke={HULL.lit}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <rect x={cx + d * 34 - 9} y={base - 8} width={18} height={6} rx={2} fill={HULL.lit} />
            </g>
          ))}
          {/* the engine bell */}
          <path
            d={`M${cx - 14} ${base - 42} L${cx + 14} ${base - 42} L${cx + 22} ${base - 18} L${cx - 22} ${base - 18} Z`}
            fill="url(#shipBell)"
          />
          <ellipse cx={cx} cy={base - 18} rx={22} ry={5} fill={VIOLET.fill} />
          <ellipse cx={cx} cy={base - 18} rx={14} ry={3} fill={VIOLET.light} fillOpacity={0.7} />
          {/* the body: a capsule in graphite */}
          <path
            d={`M${cx - W / 2} ${base - 44} L${cx - W / 2} ${top + 70}
              C${cx - W / 2} ${top + 20}, ${cx - 10} ${top}, ${cx} ${top}
              C${cx + 10} ${top}, ${cx + W / 2} ${top + 20}, ${cx + W / 2} ${top + 70}
              L${cx + W / 2} ${base - 44} Q${cx} ${base - 36}, ${cx - W / 2} ${base - 44} Z`}
            fill="url(#shipHull)"
            stroke={HULL.edge}
            strokeOpacity={0.55}
            strokeWidth={1.2}
          />
          {/* panel seams */}
          {[top + 100, base - 110].map((y) => (
            <line
              key={y}
              x1={cx - W / 2 + 2}
              y1={y}
              x2={cx + W / 2 - 2}
              y2={y}
              stroke="#08080c"
              strokeOpacity={0.45}
              strokeWidth={1.2}
            />
          ))}
          {/* the antenna, like the helmet's */}
          <line x1={cx} y1={top + 2} x2={cx} y2={top - 14} stroke={HULL.edge} strokeWidth={2} />
          {/* the belts */}
          {[top + 46, base - 96].map((y) => (
            <g key={y}>
              <rect x={cx - W / 2 - 1} y={y} width={W + 2} height={7} rx={2} fill={VIOLET.fill} />
              <rect x={cx - W / 2 - 1} y={y} width={W + 2} height={2} rx={1} fill="#ffffff" fillOpacity={0.3} />
            </g>
          ))}
          {/* cooling vents just above the bell */}
          {[-16, -8, 8, 16].map((dx) => (
            <rect key={dx} x={cx + dx - 2} y={base - 58} width={4} height={9} rx={1} fill="#08080c" fillOpacity={0.5} />
          ))}
          {/* windows, the Refinería's kind: a row of lit panes under the belt */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={cx - 24 + i * 11}
              y={top + 64}
              width={6}
              height={9}
              rx={1.5}
              fill={VIOLET.light}
              fillOpacity={i === 3 ? 0.35 : 0.9}
            />
          ))}
          {/* one plate on the skin: the registry tag */}
          <rect x={cx - 14} y={top + 84} width={28} height={9} rx={1.5} fill={SAND} fillOpacity={0.9} />
          {[0, 1].map((k) => (
            <rect
              key={k}
              x={cx - 10}
              y={top + 86.5 + k * 3}
              width={20 - k * 8}
              height={1.4}
              rx={0.7}
              fill={HULL.shade}
              fillOpacity={0.6}
            />
          ))}
          {/* the name stripe */}
          <rect x={cx - W / 2 + 6} y={base - 88} width={W - 12} height={3} rx={1.5} fill={SAND} />
          {/* the reactor hatch: the bay, the door swung open, the core */}
          <rect
            x={cx - 18}
            y={hatchY - 16}
            width={36}
            height={32}
            rx={5}
            fill={HULL.shade}
            stroke={HULL.edge}
            strokeWidth={2}
          />
          <rect
            x={cx + 20}
            y={hatchY - 18}
            width={10}
            height={36}
            rx={3}
            fill="url(#shipPlate)"
            stroke={HULL.edge}
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <circle cx={cx} cy={hatchY} r={16} fill="url(#shipCore)" />
          <circle cx={cx} cy={hatchY} r={7} fill={HULL.mid} />
          <circle
            cx={cx}
            cy={hatchY}
            r={9.5}
            fill="none"
            stroke={VIOLET.light}
            strokeOpacity={0.4 + repair * 0.6}
            strokeWidth={1.2}
          />
          {/* the ladder: hung from the hatch's sill, straight down the middle
            of the hull to the beam — two rails, rungs, standing a little
            proud of the skin on brackets */}
          {[hatchY + 30, base - 60].map((y) => (
            <rect key={y} x={cx - 8} y={y} width={16} height={3} rx={1} fill={HULL.mid} />
          ))}
          <line
            x1={cx - 6}
            y1={hatchY + 17}
            x2={cx - 6}
            y2={base - 4}
            stroke={HULL.edge}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <line
            x1={cx + 6}
            y1={hatchY + 17}
            x2={cx + 6}
            y2={base - 4}
            stroke={HULL.edge}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <line
            x1={cx - 6}
            y1={hatchY + 17}
            x2={cx - 6}
            y2={base - 4}
            stroke={HULL.lit}
            strokeOpacity={0.6}
            strokeWidth={0.8}
          />
          {Array.from({ length: 8 }, (_, i) => hatchY + 24 + i * ((base - 12 - hatchY - 24) / 7)).map((y) => (
            <line
              key={y}
              x1={cx - 6}
              y1={y}
              x2={cx + 6}
              y2={y}
              stroke={HULL.edge}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* the approach lights along the beam, chasing */}
        {Array.from({ length: BEAM_LIGHTS }, (_, i) => {
          const x = beamL + 6 + (i / (BEAM_LIGHTS - 1)) * (beamR - beamL - 12)
          const color = i % 2 ? SAND : VIOLET.fill
          return (
            <span
              key={i}
              className={`station-chase pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
              style={{
                left: x,
                top: beamY - 2,
                background: color,
                boxShadow: `0 0 6px 1px ${color}`,
                animationDelay: `-${(i / BEAM_LIGHTS) * 4}s`,
              }}
            />
          )
        })}
        {/* the lamps on the pylons' caps */}
        {[beamL + 14, beamR - 14].map((x) => (
          <span
            key={x}
            className="pointer-events-none absolute h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: x,
              top: hatchY - 38,
              background: SAND,
              boxShadow: `0 0 10px 2px rgba(229,207,138,0.6)`,
            }}
          />
        ))}
        {/* the antenna's tip */}
        <span
          className={`station-pulse pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
          style={{ left: cx, top: top - 16, background: VIOLET.fill, boxShadow: `0 0 10px 3px ${VIOLET.glow}` }}
        />
        {/* the core's flicker in the hatch: broken, so it breathes uneven */}
        <span
          className={`station-flicker pointer-events-none absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full${p}`}
          style={{
            left: cx,
            top: hatchY,
            background: `radial-gradient(circle, ${VIOLET.glow} 0%, transparent 65%)`,
            opacity: 0.4 + repair * 0.6,
          }}
        />
        {/* nav lights on the hull */}
        <span
          className={`station-blink pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6b6b] shadow-[0_0_8px_2px_rgba(255,107,107,0.8)]${p}`}
          style={{ left: cx - W / 2 + 1, top: top + 100 }}
        />
        <span
          className={`station-blink pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6bffb0] shadow-[0_0_8px_2px_rgba(107,255,176,0.8)]${p}`}
          style={{ left: cx + W / 2 - 1, top: top + 100, animationDelay: '-1.2s' }}
        />

        {/* the player, out on a tether from the hatch: their own avatar,
          hovering on its thruster the way it does everywhere else, up
          beside the ship */}
        <svg
          width={BASE_W}
          height={BASE_H}
          viewBox={`0 0 ${BASE_W} ${BASE_H}`}
          className="pointer-events-none absolute left-0 top-0"
        >
          <path
            d={`M${cx + 18} ${hatchY - 8} C${cx + 50} ${hatchY - 26}, ${cx + 84} ${hatchY - 68}, ${cx + 102} ${hatchY - 114}`}
            fill="none"
            stroke={SAND}
            strokeOpacity={0.85}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <circle cx={cx + 18} cy={hatchY - 8} r={2.2} fill={SAND} />
          <circle cx={cx + 102} cy={hatchY - 114} r={1.8} fill={SAND} />
        </svg>
        <div className="pointer-events-none absolute -translate-x-1/2" style={{ left: cx + 102, top: hatchY - 150 }}>
          {/* the astronaut's own tap target, over the figure */}
          <div
            role="button"
            aria-label={astronautLabel}
            className="pointer-events-auto absolute -inset-1 z-10 cursor-pointer rounded-full"
            {...astronautTap}
          />
          <AstronautAvatar size={62} styleIds={styleIds} showSky={false} />
        </div>
      </div>
    </div>
  )
})
