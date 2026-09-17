// The ship's own screen: the reactor, and the eight material cores round
// it. Full screen, reached from the station outside the ship.
//
// Each core is one asteroid's, drawn exactly as the Refinería draws it —
// the sphere, the ten capsule rods, the cradle ring — only small: its
// loaded capsules lit in the material, the one under way filling. A whole
// core feeds the reactor; the reactor's own glow is the share of capsules
// loaded across all eight. When every core is whole, the reactor runs.
//
// Laid out as a bulkhead, like the Refinería: the name at the
// top, the reactor big in the middle, and under it the tally — each
// material's core by name, and the whole job as one bar.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCoreRepair, useRefineryContext } from '../context/RefineryContext'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { CORES_PER_TIER } from '../lib/refinery'
import { getPlace } from '../lib/place'
import { CoreDiagram } from '../components/CoreDiagram'
import { OutsideBackButton } from '../components/OutsideBackButton'

const HULL = { lit: '#5a5f6d', mid: '#2b2e38', shade: '#15171e', edge: '#7d8290' }
const VIOLET = { light: '#ede9fe', fill: '#a78bfa', glow: 'rgba(168,85,247,0.6)' }

const SIZE = 320
const RING_R = 112
/** Each core is the Refinería's own diagram, drawn at this size. */
const CORE_PX = 78

function ReactorDiagram({
  cores,
  activeTier,
  progress,
}: {
  cores: number[]
  activeTier: number | null
  progress: number
}) {
  const cx = SIZE / 2
  const cy = SIZE / 2
  const loaded = cores.reduce((a, b) => a + b, 0)
  const total = cores.length * CORES_PER_TIER
  const share = total ? loaded / total : 0
  const at = (i: number) => {
    const a = (i / cores.length) * Math.PI * 2 - Math.PI / 2
    return { a, x: cx + Math.cos(a) * RING_R, y: cy + Math.sin(a) * RING_R }
  }
  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }} aria-hidden="true">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute left-0 top-0 block">
        <defs>
          <radialGradient id="reactorGlow">
            <stop offset="0" stopColor={VIOLET.fill} stopOpacity={0.1 + share * 0.6} />
            <stop offset="1" stopColor={VIOLET.fill} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="reactorSphere" cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor={VIOLET.light} stopOpacity={0.3 + share * 0.7} />
            <stop offset="0.45" stopColor={VIOLET.fill} stopOpacity={0.2 + share * 0.8} />
            <stop offset="1" stopColor="#3b0764" />
          </radialGradient>
          <linearGradient id="reactorPlate" x1="0" x2="0.4" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.lit} />
            <stop offset="0.35" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <linearGradient id="reactorPipe" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={HULL.shade} />
            <stop offset="0.3" stopColor={HULL.lit} />
            <stop offset="0.65" stopColor={HULL.mid} />
            <stop offset="1" stopColor={HULL.shade} />
          </linearGradient>
          <radialGradient id="reactorCore">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.5 + share * 0.5} />
            <stop offset="0.4" stopColor={VIOLET.light} stopOpacity={0.4 + share * 0.6} />
            <stop offset="1" stopColor={VIOLET.fill} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the reactor's light, as much as it has */}
        <circle cx={cx} cy={cy} r={RING_R - 24} fill="url(#reactorGlow)" />

        {/* the conduits from each core to the reactor: a pipe with a collar
            at the core and a flange at the housing, and the material running
            down its middle once the core is whole */}
        {cores.map((repaired, i) => {
          const c = MATERIAL_TIER_COLORS[i] ?? MATERIAL_TIER_COLORS[0]
          const whole = repaired >= CORES_PER_TIER
          const { a } = at(i)
          const deg = (a * 180) / Math.PI
          const r0 = RING_R - CORE_PX / 2 + 2
          const r1 = 52
          return (
            <g key={i} transform={`rotate(${deg} ${cx} ${cy})`}>
              <rect
                x={cx + r1}
                y={cy - 4}
                width={r0 - r1}
                height={8}
                fill="url(#reactorPipe)"
                stroke={HULL.edge}
                strokeOpacity={0.45}
                strokeWidth={0.6}
              />
              <rect
                x={cx + r1}
                y={cy - 1.2}
                width={r0 - r1}
                height={2.4}
                fill={whole ? c.fill : HULL.shade}
                fillOpacity={whole ? 0.95 : 0.9}
              />
              <rect
                x={cx + r1 - 2}
                y={cy - 7}
                width={6}
                height={14}
                rx={1.5}
                fill="url(#reactorPlate)"
                stroke={HULL.edge}
                strokeOpacity={0.7}
                strokeWidth={0.7}
              />
              <rect
                x={cx + r0 - 8}
                y={cy - 6}
                width={7}
                height={12}
                rx={1.5}
                fill="url(#reactorPlate)"
                stroke={HULL.edge}
                strokeOpacity={0.7}
                strokeWidth={0.7}
              />
              {whole && <circle cx={cx + r1 + 10} cy={cy} r={1.6} fill={c.light} />}
            </g>
          )
        })}

        {/* the reactor: a housing with the sphere in it — the flange with
            its bolts, a ring of vents, the sphere's glass under a
            containment cage, and inside it the core burning */}
        <circle
          cx={cx}
          cy={cy}
          r={54}
          fill="url(#reactorPlate)"
          stroke={HULL.edge}
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle
            key={i}
            cx={cx + Math.cos((i / 8) * Math.PI * 2 + 0.2) * 49.5}
            cy={cy + Math.sin((i / 8) * Math.PI * 2 + 0.2) * 49.5}
            r={2}
            fill={HULL.shade}
            stroke={HULL.edge}
            strokeOpacity={0.7}
            strokeWidth={0.6}
          />
        ))}
        <circle cx={cx} cy={cy} r={45} fill={HULL.shade} stroke={HULL.edge} strokeOpacity={0.5} strokeWidth={0.8} />
        {Array.from({ length: 24 }, (_, i) => {
          const va = (i / 24) * Math.PI * 2
          return (
            <line
              key={i}
              x1={cx + Math.cos(va) * 41.5}
              y1={cy + Math.sin(va) * 41.5}
              x2={cx + Math.cos(va) * 44.5}
              y2={cy + Math.sin(va) * 44.5}
              stroke="#000"
              strokeOpacity={0.6}
              strokeWidth={1.6}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={40} fill="#0a0a10" />
        <circle cx={cx} cy={cy} r={36} fill="url(#reactorSphere)" />
        {/* inside the glass: the containment — two rings of the cage
            tilted about the core like a gyroscope — and the core itself in
            layers: a dark heart, the burn, and a white-hot point */}
        {[-34, 34].map((deg) => (
          <ellipse
            key={deg}
            cx={cx}
            cy={cy}
            rx={27}
            ry={9}
            transform={`rotate(${deg} ${cx} ${cy})`}
            fill="none"
            stroke={VIOLET.light}
            strokeOpacity={0.22 + share * 0.3}
            strokeWidth={1.2}
          />
        ))}
        <ellipse
          cx={cx}
          cy={cy}
          rx={30}
          ry={7}
          fill="none"
          stroke={VIOLET.light}
          strokeOpacity={0.14 + share * 0.2}
          strokeWidth={1}
        />
        <circle cx={cx} cy={cy} r={15} fill="#1a0b33" fillOpacity={0.8} />
        <circle cx={cx} cy={cy} r={13} fill="url(#reactorCore)" />
        <circle cx={cx} cy={cy} r={4} fill="#ffffff" fillOpacity={0.55 + share * 0.45} />
        <circle cx={cx} cy={cy} r={40} fill="none" stroke={HULL.edge} strokeOpacity={0.8} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={36} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1} />
      </svg>

      {/* the reactor's breath: its glow, swelling and settling, as much as
          it has — and a slow turn of light round the sphere */}
      <span
        className="station-pulse pointer-events-none absolute rounded-full"
        style={{
          left: cx - 46,
          top: cy - 46,
          width: 92,
          height: 92,
          background: `radial-gradient(circle, ${VIOLET.glow} 0%, transparent 65%)`,
          opacity: 0.15 + share * 0.7,
        }}
      />
      <span
        className="reactor-turn pointer-events-none absolute"
        style={{ left: cx - 30, top: cy - 30, width: 60, height: 60 }}
      >
        {[0, 1, 2].map((k) => (
          <span
            key={k}
            className="absolute h-[3px] w-[3px] rounded-full"
            style={{
              left: 30 + Math.cos((k / 3) * Math.PI * 2) * 22 - 1.5,
              top: 30 + Math.sin((k / 3) * Math.PI * 2) * 22 - 1.5,
              background: VIOLET.light,
              boxShadow: `0 0 5px 1px ${VIOLET.glow}`,
              opacity: 0.35 + share * 0.6,
            }}
          />
        ))}
      </span>
      <span
        className="reactor-turn pointer-events-none absolute rounded-full"
        style={{
          left: cx - 38,
          top: cy - 38,
          width: 76,
          height: 76,
          background: `conic-gradient(from 0deg, transparent 0 62%, ${VIOLET.light} 78%, transparent 92%)`,
          opacity: 0.12 + share * 0.45,
          maskImage: 'radial-gradient(circle, transparent 78%, #000 80%, #000 96%, transparent 98%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 78%, #000 80%, #000 96%, transparent 98%)',
        }}
      />

      {/* the cores: the Refinería's diagram, one per material, small */}
      {cores.map((repaired, i) => {
        const { x, y } = at(i)
        return (
          <div
            key={i}
            className="absolute"
            style={{ left: x - CORE_PX / 2, top: y - CORE_PX / 2, width: CORE_PX, height: CORE_PX }}
          >
            <CoreDiagram
              tierIndex={i}
              repaired={Math.min(repaired, CORES_PER_TIER)}
              total={CORES_PER_TIER}
              active={activeTier === i}
              progress={activeTier === i ? progress : 0}
              size={CORE_PX}
              idPrefix={`shipCore${i}`}
            />
          </div>
        )
      })}
    </div>
  )
}

export function Ship() {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const { core } = useRefineryContext()
  const { active, progress } = useCoreRepair()
  const s = strings.ship
  const cores = core?.cores ?? Array.from({ length: MATERIAL_TIER_COLORS.length }, () => 0)
  const loaded = cores.reduce((a, b) => a + b, 0)
  const total = cores.length * CORES_PER_TIER
  const pct = Math.round((loaded / total) * 100)
  const whole = cores.filter((n) => n >= CORES_PER_TIER).length
  const c = VIOLET

  // Only reachable from outside — a fresh load here has no station behind
  // it, and the app always opens on the rock.
  useEffect(() => {
    if (getPlace() !== 'station') navigate('/', { replace: true })
  }, [navigate])

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#08080c] px-5 pb-24 pt-4 sm:px-6">
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 30% at 50% -4%, ${c.fill}33, transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)`,
        }}
      />
      <OutsideBackButton always />

      <div className="relative mt-8 flex flex-col items-center">
        <p
          className="border-y-2 px-7 py-1 text-3xl font-extrabold uppercase tracking-wider text-[#F7F3EA]"
          style={{ borderColor: `${c.fill}80`, textShadow: `0 2px 0 rgba(0,0,0,.5), 0 0 26px ${c.fill}59` }}
        >
          {s.title}
        </p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: `${c.fill}a6` }}>
          {s.reactor} · {s.coresWhole(whole, cores.length)}
        </p>
        <p className="mt-3 max-w-[32ch] text-center text-[13px] leading-relaxed text-neutral-400">{s.intro}</p>
      </div>

      {/* the reactor, with the middle of the screen to itself */}
      <div className="relative flex flex-1 items-center justify-center py-3">
        <ReactorDiagram cores={cores} activeTier={active && core ? core.tier : null} progress={progress} />
      </div>

      {/* the tally: how far the reactor is repaired, as one bar */}
      <div className="relative mx-auto w-full max-w-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{s.repairedPct(pct)}</div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(loaded / total) * 100}%`,
              background: `linear-gradient(90deg, ${c.fill}, ${c.light})`,
              boxShadow: loaded ? `0 0 10px ${c.glow}` : undefined,
            }}
          />
        </div>
      </div>
    </div>
  )
}
