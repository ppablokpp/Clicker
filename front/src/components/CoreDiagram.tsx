import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'

/**
 * A material's core as a thing: a glass sphere in the middle, ten rods
 * radiating from it in a cradle, each one a capsule. Loaded rods are lit in
 * the material and feed a conduit to the sphere; the one being loaded
 * fills up along its length; the rest are dark sockets waiting.
 *
 * The Refinería draws one big; the ship's reactor draws all eight small.
 */

export const CORE_SIZE = 260
const RING_R = 88
const ROD_LEN = 46
const ROD_W = 22

export function CoreDiagram({
  tierIndex,
  repaired,
  total,
  active,
  progress,
  size = CORE_SIZE,
  idPrefix = 'core',
}: {
  tierIndex: number
  repaired: number
  total: number
  active: boolean
  progress: number
  /** Drawn at CORE_SIZE and scaled to this — the ship modal draws it small. */
  size?: number
  /** Gradient ids, so several on one page don't share them. */
  idPrefix?: string
}) {
  const c = MATERIAL_TIER_COLORS[tierIndex] ?? MATERIAL_TIER_COLORS[0]
  const id = (name: string) => `${idPrefix}-${name}`
  const cx = CORE_SIZE / 2
  const cy = CORE_SIZE / 2
  const lit = repaired / total
  // The cradle ring fills with the whole job: every core done plus the
  // part of the one under way. Drawn as a dash on a circle that starts at
  // the top and runs clockwise, like the goal ring on Home.
  const cradleR = RING_R + ROD_LEN / 2 + 8
  const cradleFill = (repaired + (active ? progress : 0)) / total
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${CORE_SIZE} ${CORE_SIZE}`}
      className="mx-auto block max-w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id('sphere')} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.light} stopOpacity={0.35 + lit * 0.65} />
          <stop offset="0.45" stopColor={c.fill} stopOpacity={0.25 + lit * 0.75} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor={c.fill} stopOpacity={0.55 * lit + 0.08} />
          <stop offset="1" stopColor={c.fill} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('rodLit')} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={c.dark} />
          <stop offset="0.35" stopColor={c.fill} />
          <stop offset="1" stopColor={c.light} />
        </linearGradient>
        <linearGradient id={id('rodSocket')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2b2e38" />
          <stop offset="0.5" stopColor="#15171e" />
          <stop offset="1" stopColor="#2b2e38" />
        </linearGradient>
      </defs>

      {/* the cradle: an outer ring the rods are seated in */}
      <circle cx={cx} cy={cy} r={cradleR} fill="none" stroke="#2b2e38" strokeWidth={10} />
      {cradleFill > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={cradleR}
          fill="none"
          stroke={c.fill}
          strokeWidth={10}
          strokeLinecap={cradleFill < 1 ? 'round' : 'butt'}
          pathLength={100}
          strokeDasharray={cradleFill >= 1 ? undefined : `${cradleFill * 100} 100`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.2s linear' }}
        />
      )}
      <circle cx={cx} cy={cy} r={cradleR} fill="none" stroke="#7d8290" strokeOpacity={0.35} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={cradleR - 5} fill="none" stroke="#7d8290" strokeOpacity={0.25} strokeWidth={1} />

      {/* the glow behind the sphere, as bright as the core is whole */}
      <circle cx={cx} cy={cy} r={RING_R - 10} fill={`url(#${id('glow')})`} />

      {/* the rods, from the ring's edge in towards the sphere */}
      {Array.from({ length: total }, (_, i) => {
        const a = (i / total) * Math.PI * 2 - Math.PI / 2
        const deg = (a * 180) / Math.PI
        const isRepaired = i < repaired
        const isActive = active && i === repaired
        const x0 = cx + Math.cos(a) * (RING_R - ROD_LEN / 2)
        const y0 = cy + Math.sin(a) * (RING_R - ROD_LEN / 2)
        return (
          <g key={i} transform={`translate(${x0.toFixed(2)} ${y0.toFixed(2)}) rotate(${deg.toFixed(2)})`}>
            {/* conduit into the sphere, lit once the rod is */}
            <line
              x1={-ROD_LEN / 2}
              y1={0}
              x2={-(RING_R - ROD_LEN / 2) + 34}
              y2={0}
              stroke={isRepaired ? c.fill : '#2b2e38'}
              strokeOpacity={isRepaired ? 0.8 : 0.9}
              strokeWidth={isRepaired ? 2.5 : 2}
            />
            {/* the socket */}
            <rect
              x={-ROD_LEN / 2}
              y={-ROD_W / 2}
              width={ROD_LEN}
              height={ROD_W}
              rx={5}
              fill={`url(#${id('rodSocket')})`}
              stroke="#7d8290"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            {/* the rod: whole, filling, or absent */}
            {isRepaired && (
              <>
                <rect
                  x={-ROD_LEN / 2 + 3}
                  y={-ROD_W / 2 + 3}
                  width={ROD_LEN - 6}
                  height={ROD_W - 6}
                  rx={3.5}
                  fill={`url(#${id('rodLit')})`}
                />
                <rect
                  x={-ROD_LEN / 2 + 3}
                  y={-ROD_W / 2 + 3}
                  width={ROD_LEN - 6}
                  height={4}
                  rx={2}
                  fill="#ffffff"
                  fillOpacity={0.28}
                />
              </>
            )}
            {isActive && (
              <>
                <rect
                  x={-ROD_LEN / 2 + 3}
                  y={-ROD_W / 2 + 3}
                  width={ROD_LEN - 6}
                  height={ROD_W - 6}
                  rx={3.5}
                  fill={c.dark}
                  fillOpacity={0.6}
                />
                <rect
                  x={-ROD_LEN / 2 + 3}
                  y={-ROD_W / 2 + 3}
                  width={Math.max(0, (ROD_LEN - 6) * progress)}
                  height={ROD_W - 6}
                  rx={3.5}
                  fill={`url(#${id('rodLit')})`}
                />
                <rect
                  x={-ROD_LEN / 2 + 1.5}
                  y={-ROD_W / 2 + 1.5}
                  width={ROD_LEN - 3}
                  height={ROD_W - 3}
                  rx={4}
                  fill="none"
                  stroke={c.light}
                  strokeWidth={1.2}
                  className="core-rod-active"
                />
              </>
            )}
            {!isRepaired && !isActive && (
              <rect
                x={-ROD_LEN / 2 + 5}
                y={-ROD_W / 2 + 5}
                width={ROD_LEN - 10}
                height={ROD_W - 10}
                rx={3}
                fill="none"
                stroke="#7d8290"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </g>
        )
      })}

      {/* the sphere in the middle, and its glass */}
      <circle cx={cx} cy={cy} r={34} fill="#0a0a10" />
      <circle cx={cx} cy={cy} r={31} fill={`url(#${id('sphere')})`} />
      <ellipse cx={cx - 10} cy={cy - 13} rx={10} ry={5.5} fill="#ffffff" fillOpacity={0.22} />
      <circle cx={cx} cy={cy} r={34} fill="none" stroke="#7d8290" strokeOpacity={0.6} strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={cx + Math.cos((i / 4) * Math.PI * 2 + 0.4) * 34}
          cy={cy + Math.sin((i / 4) * Math.PI * 2 + 0.4) * 34}
          r={1.8}
          fill="#5a5f6d"
        />
      ))}
    </svg>
  )
}
