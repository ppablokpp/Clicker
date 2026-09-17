// Inside the Refinería: the smelting hall, kept spare. The core diagram
// (pages/Refinery) hangs in the middle; the controls under it are the
// furnace itself (see the page). Ore comes in along the ceiling in a glass
// pipe, down the
// right-hand wall and into the core's cradle. On the left wall the
// instruments read the job: a tank that fills with the whole core, and a
// gauge whose needle climbs with the capsule under way and drops back to
// zero when it is done. The room stays back and dim; the core is what
// shines.
//
// Still SVG; the ore that moves and the heat that rises are spans (see
// InteriorScene). The tank's fill and the needle are transforms with a
// transition, so a capsule finishing is a drop, not a jump.

import { memo } from 'react'
import { InteriorScene, RoomDefs, RoomWall, RoomDeck, SCENE_W, SCENE_H, HULL, ROOM_OPACITY, at } from './InteriorScene'
import { MineralIcon } from './MaterialIcons'
import type { MaterialTierColors } from '../lib/materialTiers'

/** Where the core is, in scene units, and its cradle's reach. */
const CX = SCENE_W / 2
const CY = 470
const CORE_R = 143
/** The ceiling's ore pipe, and the wall it comes down. */
const ORE_Y = 10
const ORE_H = 24
const DOWN_X = SCENE_W - 34
/** The pipe comes out of the wall here, clear of the corner the way back
 *  sits in, and runs right to the down-pipe. */
const ORE_X = 66
const ORE_W = DOWN_X + 12 - ORE_X
/** The instruments on the left wall. */
const GAUGE = { x: 40, y: 300, r: 30 }
const TANK = { x: 22, y: 350, w: 32, h: 180 }
/** The floor. */
const DECK_Y = 640
/** The ore in the pipe: pieces every ORE_STEP, the strip sliding one
 *  ORE_PERIOD (two steps) and snapping back to an identical frame. */
const ORE_STEP = 48
const ORE_PERIOD = ORE_STEP * 2
const ORE_COUNT = Math.ceil(SCENE_W / ORE_STEP) + 3
const STRIP_W = ORE_COUNT * ORE_STEP + ORE_PERIOD

export const RefineryInterior = memo(function RefineryInterior({
  material,
  repaired,
  total,
  progress,
  smelting,
}: {
  material: MaterialTierColors
  repaired: number
  total: number
  /** 0–1, how far the capsule under way is. */
  progress: number
  smelting: boolean
}) {
  const c = material
  const lit = total ? repaired / total : 0
  // The gauge reads the capsule under way and nothing else: at zero
  // between capsules, climbing with the smelt, dropping back when it's
  // done. The tank reads the whole core — the capsules loaded plus the one
  // under way — so it only ever rises. Rising is a short linear ease (the
  // progress ticks ten times a second); the needle's drop back to zero is
  // the same transition, seen all at once.
  const gauge = smelting ? progress : 0
  const needle = -120 + gauge * 240
  const level = Math.min(1, (repaired + gauge) / Math.max(1, total))
  const instrumentTransition = smelting ? 'transform 0.2s linear' : 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
  return (
    <InteriorScene>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
        style={{ opacity: ROOM_OPACITY }}
      >
        <defs>
          <RoomDefs />
          <radialGradient id="hallHaze">
            <stop offset="0" stopColor={c.fill} stopOpacity={0.08 + lit * 0.25} />
            <stop offset="1" stopColor={c.fill} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hallLevel" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={c.dark} />
            <stop offset="0.4" stopColor={c.fill} />
            <stop offset="1" stopColor={c.light} />
          </linearGradient>
        </defs>

        <RoomWall deckY={DECK_Y} />
        <circle cx={CX} cy={CY} r={250} fill="url(#hallHaze)" />

        {/* the ore pipe along the ceiling: its back wall and brackets (the
            glass goes over the ore, in the overlay below), the elbow, and
            the pipe down the wall into the cradle */}
        <rect
          x={ORE_X}
          y={ORE_Y}
          width={ORE_W}
          height={ORE_H}
          rx={4}
          fill="#0a0a10"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
        {/* the flange where it leaves the wall, then its brackets */}
        <rect
          x={ORE_X - 4}
          y={ORE_Y - 6}
          width={12}
          height={ORE_H + 12}
          rx={2}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        {[150, 250].map((x) => (
          <rect
            key={x}
            x={x - 6}
            y={ORE_Y - 6}
            width={12}
            height={ORE_H + 12}
            rx={2}
            fill="url(#roomPlate)"
            stroke={HULL.edge}
            strokeOpacity={0.7}
            strokeWidth={0.7}
          />
        ))}
        <rect
          x={DOWN_X - 12}
          y={ORE_Y - 4}
          width={24}
          height={ORE_H + 8}
          rx={4}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={DOWN_X - 8}
          y={ORE_Y + ORE_H}
          width={16}
          height={CY - ORE_Y - ORE_H}
          fill="url(#roomPipeV)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        {[180, 320].map((y) => (
          <rect
            key={y}
            x={DOWN_X - 12}
            y={y}
            width={24}
            height={10}
            rx={2}
            fill="url(#roomPlate)"
            stroke={HULL.edge}
            strokeOpacity={0.7}
            strokeWidth={0.7}
          />
        ))}
        <rect
          x={DOWN_X - 12}
          y={CY - 10}
          width={24}
          height={20}
          rx={4}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={CX + CORE_R - 4}
          y={CY - 7}
          width={DOWN_X - 12 - (CX + CORE_R - 4)}
          height={14}
          fill="url(#roomPipeH)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        <rect
          x={CX + CORE_R - 8}
          y={CY - 11}
          width={10}
          height={22}
          rx={2}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={CX + CORE_R + 4}
          y={CY - 2}
          width={DOWN_X - 16 - (CX + CORE_R + 4)}
          height={4}
          fill={c.fill}
          fillOpacity={0.3 + lit * 0.5}
        />

        {/* the left wall: the tank, the gauge mounted on its cap through a
            short stem, the pipe from the tank to the floor */}
        <rect
          x={GAUGE.x - 6}
          y={GAUGE.y + GAUGE.r - 6}
          width={12}
          height={TANK.y - 8 - (GAUGE.y + GAUGE.r - 6)}
          fill="url(#roomPipeV)"
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={0.7}
        />
        <rect
          x={GAUGE.x - 9}
          y={GAUGE.y + GAUGE.r + 1}
          width={18}
          height={6}
          rx={1.5}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={0.7}
        />
        <circle
          cx={GAUGE.x}
          cy={GAUGE.y}
          r={GAUGE.r}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
        <circle
          cx={GAUGE.x}
          cy={GAUGE.y}
          r={GAUGE.r - 6}
          fill="#0a0a10"
          stroke={HULL.edge}
          strokeOpacity={0.4}
          strokeWidth={0.6}
        />
        {Array.from({ length: 13 }, (_, i) => {
          const a = ((-120 + i * 20) * Math.PI) / 180
          const r0 = i % 3 === 0 ? 16 : 19
          return (
            <line
              key={i}
              x1={GAUGE.x + Math.sin(a) * r0}
              y1={GAUGE.y - Math.cos(a) * r0}
              x2={GAUGE.x + Math.sin(a) * 22}
              y2={GAUGE.y - Math.cos(a) * 22}
              stroke={i >= 9 ? c.fill : HULL.edge}
              strokeOpacity={0.8}
              strokeWidth={1}
            />
          )
        })}
        <line
          x1={GAUGE.x}
          y1={GAUGE.y}
          x2={GAUGE.x}
          y2={GAUGE.y - 18}
          stroke={c.light}
          strokeWidth={1.6}
          strokeLinecap="round"
          style={{
            transformOrigin: `${GAUGE.x}px ${GAUGE.y}px`,
            transform: `rotate(${needle}deg)`,
            transition: instrumentTransition,
          }}
        />
        <circle cx={GAUGE.x} cy={GAUGE.y} r={2.5} fill={HULL.lit} />
        <rect
          x={TANK.x}
          y={TANK.y}
          width={TANK.w}
          height={TANK.h}
          rx={8}
          fill="#0a0a10"
          stroke={HULL.edge}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
        {/* the graduations, on the inside of the glass: the melt covers
            them as it rises, so they only show where it hasn't reached */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <line
            key={i}
            x1={TANK.x + TANK.w - 4}
            y1={TANK.y + 4 + ((TANK.h - 8) * i) / 10}
            x2={TANK.x + TANK.w - (i % 5 === 0 ? 14 : 10)}
            y2={TANK.y + 4 + ((TANK.h - 8) * i) / 10}
            stroke={HULL.edge}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        ))}
        {/* the level: a full column scaled down from its foot */}
        <rect
          x={TANK.x + 4}
          y={TANK.y + 4}
          width={TANK.w - 8}
          height={TANK.h - 8}
          rx={5}
          fill="url(#hallLevel)"
          style={{
            transformOrigin: `${TANK.x + TANK.w / 2}px ${TANK.y + TANK.h - 4}px`,
            transform: `scaleY(${level})`,
            transition: instrumentTransition,
          }}
        />
        <rect x={TANK.x} y={TANK.y} width={TANK.w} height={TANK.h} rx={8} fill="url(#roomGlass)" />
        <rect
          x={TANK.x - 6}
          y={TANK.y - 8}
          width={TANK.w + 12}
          height={10}
          rx={3}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={TANK.x - 6}
          y={TANK.y + TANK.h - 2}
          width={TANK.w + 12}
          height={10}
          rx={3}
          fill="url(#roomPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.8}
          strokeWidth={0.8}
        />
        <rect
          x={TANK.x + TANK.w / 2 - 6}
          y={TANK.y + TANK.h + 8}
          width={12}
          height={DECK_Y - TANK.y - TANK.h - 8}
          fill="url(#roomPipeV)"
          stroke={HULL.edge}
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />

        {/* the floor */}
        <RoomDeck deckY={DECK_Y} />
      </svg>

      {/* the ore in the ceiling pipe, moving while a capsule smelts */}
      <span
        className="absolute overflow-hidden"
        style={{
          ...at(ORE_X, ORE_Y),
          width: `${(ORE_W / SCENE_W) * 100}%`,
          height: `${(ORE_H / SCENE_H) * 100}%`,
          opacity: ROOM_OPACITY + 0.2,
        }}
      >
        <span
          className={`hall-ore absolute left-0 top-0 h-full${smelting ? '' : ' station-paused'}`}
          style={
            {
              width: `${(STRIP_W / ORE_W) * 100}%`,
              '--ore-period': `${(ORE_PERIOD / STRIP_W) * 100}%`,
            } as React.CSSProperties
          }
        >
          {Array.from({ length: ORE_COUNT + 2 }, (_, i) => (
            <MineralIcon
              key={i}
              size={16}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${((i * ORE_STEP) / STRIP_W) * 100}%`, color: i % 2 ? c.fill : c.light }}
            />
          ))}
        </span>
      </span>
      {/* the glass over the ore */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
        style={{ opacity: ROOM_OPACITY }}
      >
        <rect x={ORE_X} y={ORE_Y} width={ORE_W} height={ORE_H} rx={4} fill="url(#roomGlass)" />
        <rect x={ORE_X + 8} y={ORE_Y + 3} width={ORE_W - 16} height={4} rx={2} fill="#ffffff" fillOpacity={0.12} />
      </svg>
    </InteriorScene>
  )
})
