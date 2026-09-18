// The Refinería's own screen: one material's core, loaded one capsule at a
// time. Full screen, reached from the station outside the ship.
//
// Each asteroid's material has a core in the ship's reactor, and each core
// is ten capsules. Loading one costs mineral and takes time; both climb as
// you go, so the tenth is a real job. When all ten are in, that material's
// core is whole — and the reactor itself (the ship's screen) is repaired
// when every material's core is.
//
// The state is the server's (RefineryContext): it spends the mineral, keeps
// the clock and finishes a capsule when its time is up. This screen only
// draws it and asks to start the next one.
//
// Laid out as a room rather than a card (RefineryInterior): the name at the
// top, the core big in the middle with the room to itself, and the one
// thing to do pinned to the bottom where the thumb is.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Clock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useGemsContext } from '../context/GemsContext'
import { useCoreRepair, useRefineryContext } from '../context/RefineryContext'
import { MATERIAL_BUTTON_THEMES, MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { formatPlatino } from '../lib/formatPlatino'
import { finishGemCost } from '../lib/refinery'
import { getPlace } from '../lib/place'
import { CoreDiagram } from '../components/CoreDiagram'
import { GemIcon, MineralIcon } from '../components/MaterialIcons'
import { OutsideBackButton } from '../components/OutsideBackButton'
import { RefineryInterior } from '../components/RefineryInterior'

/** The furnace's box, in px: the electrodes' yoke at the top, its foot
 *  at the bottom. */
const FURNACE_H = 226

/** The heat off the crucible: where each bubble rises, how big, how long
 *  its rise takes and where in it it starts. The starts don't follow the
 *  positions and the rises differ in length, so the pattern never lines
 *  up into a sweep. */
const HEAT = [
  { left: 14, size: 9, duration: 3.1, delay: 2.4 },
  { left: 26, size: 10, duration: 3.6, delay: 0.3 },
  { left: 38, size: 8, duration: 2.9, delay: 1.7 },
  { left: 55, size: 11, duration: 3.4, delay: 3.0 },
  { left: 64, size: 8, duration: 3.2, delay: 0.9 },
  { left: 72, size: 12, duration: 3.8, delay: 2.1 },
  { left: 86, size: 10, duration: 3.0, delay: 1.2 },
]

export function Refinery() {
  const navigate = useNavigate()
  const { language, strings } = useLanguage()
  const { totalClicks, prestigeTier } = useClickCounterContext()
  const { gems } = useGemsContext()
  const { core, starting, finishing, start, finish } = useRefineryContext()
  const { active, progress: rawProgress, secondsLeft } = useCoreRepair()
  // The tick is 100 ms; the drawing only needs to change when it would
  // show — 1/200 of the rod is under a pixel — so between steps neither
  // the core nor the hall re-renders.
  const progress = Math.round(rawProgress * 200) / 200
  const [error, setError] = useState<string | null>(null)
  const s = strings.refinery
  const tierIndex = prestigeTier
  const c = MATERIAL_TIER_COLORS[tierIndex] ?? MATERIAL_TIER_COLORS[0]
  const theme = MATERIAL_BUTTON_THEMES[tierIndex] ?? MATERIAL_BUTTON_THEMES[0]
  const materialName = strings.home.trajectoryTierNames[tierIndex]

  // Only reachable from outside — a fresh load here has no station behind
  // it, and the app always opens on the rock.
  useEffect(() => {
    if (getPlace() !== 'station') navigate('/', { replace: true })
  }, [navigate])

  // Until the first read lands, an empty core: nothing loaded, nothing
  // running. The read is quick and the drawing is the same either way.
  const repaired = core?.repaired ?? 0
  const total = core?.total ?? 10
  const done = repaired >= total
  const free = core?.nextFree ?? false
  const cost = free ? 0 : (core?.nextCost ?? 0)
  const seconds = core?.nextSeconds ?? 0
  const canAfford = free || totalClicks >= cost
  const gemCost = finishGemCost(secondsLeft)
  const canFinish = gems >= gemCost

  const onStart = async () => {
    setError(null)
    const result = await start()
    if (!result.ok && result.error && result.error !== 'not-signed-in') {
      setError(result.error === 'not-enough-clicks' ? s.notEnough(materialName) : s.error)
    }
  }
  const onFinish = async () => {
    setError(null)
    const result = await finish()
    if (!result.ok && result.error && result.error !== 'not-signed-in') {
      setError(result.error === 'not-enough-gems' ? strings.store.notEnoughGems : s.error)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#08080c] px-5 pb-10 pt-4 sm:px-6">
      {/* the smelting hall, round everything */}
      <RefineryInterior material={c} repaired={repaired} total={total} progress={progress} smelting={active} />
      <OutsideBackButton always />

      {/* the name */}
      <div className="relative mt-8 flex flex-col items-center">
        <p
          className="border-y-2 px-7 py-1 text-3xl font-extrabold uppercase tracking-wider text-[#F7F3EA]"
          style={{ borderColor: `${c.fill}80`, textShadow: `0 2px 0 rgba(0,0,0,.5), 0 0 26px ${c.fill}4d` }}
        >
          {s.title}
        </p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: `${c.fill}a6` }}>
          {s.coreOf(materialName)} · {done ? s.repaired : `${repaired}/${total}`}
        </p>
        <p className="mt-3 max-w-[32ch] text-center text-[13px] leading-relaxed text-neutral-400">
          {s.intro(materialName)}
        </p>
      </div>

      {/* the core, with the middle of the screen to itself */}
      <div className="relative flex flex-1 items-center justify-center py-4">
        <CoreDiagram
          tierIndex={tierIndex}
          repaired={repaired}
          total={total}
          active={active}
          progress={progress}
          size={264}
        />
      </div>

      {/* the one thing to do, on the furnace. An arc furnace, drawn here as a
          thing: a riveted steel vessel with a lidded mouth, three graphite
          electrodes coming down into the melt through the lid — the arcs at
          their tips flicker while a capsule smelts, and heat comes off the
          melt — a tap on its flank, and on the wall between its two bands,
          under a hazard stripe, the bar and the button. The vessel is a
          fixed size, whatever the wall holds. */}
      <div className="relative mx-auto mt-2 w-full max-w-[20rem]" style={{ height: FURNACE_H }}>
        <svg
          viewBox={`0 0 360 ${FURNACE_H}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fnBody" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#0d0e13" />
              <stop offset="0.18" stopColor="#262833" />
              <stop offset="0.5" stopColor="#1a1c24" />
              <stop offset="0.85" stopColor="#111219" />
              <stop offset="1" stopColor="#0a0b0f" />
            </linearGradient>
            <linearGradient id="fnBand" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#1b1d25" />
              <stop offset="0.2" stopColor="#5a5f6d" />
              <stop offset="0.5" stopColor="#3a3e4a" />
              <stop offset="0.85" stopColor="#2b2e38" />
              <stop offset="1" stopColor="#15171e" />
            </linearGradient>
            <linearGradient id="fnLid" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#5a5f6d" />
              <stop offset="0.5" stopColor="#2b2e38" />
              <stop offset="1" stopColor="#15171e" />
            </linearGradient>
            <linearGradient id="fnRod" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#0b0b0f" />
              <stop offset="0.35" stopColor="#3a3d47" />
              <stop offset="0.7" stopColor="#1c1e26" />
              <stop offset="1" stopColor="#08080c" />
            </linearGradient>
            <radialGradient id="fnMelt" cx="0.5" cy="0.5" r="0.6">
              <stop offset="0" stopColor={c.light} />
              <stop offset="0.45" stopColor={c.fill} />
              <stop offset="1" stopColor={c.dark} />
            </radialGradient>
          </defs>

          {/* the shadow it stands in */}
          <ellipse cx="180" cy={FURNACE_H - 6} rx="150" ry="9" fill="#000" fillOpacity="0.55" />
          {/* the vessel: a drum, slightly wider at the shoulder */}
          <path
            d={`M28 50 A152 20 0 0 0 332 50 L322 ${FURNACE_H - 12} A142 12 0 0 1 38 ${FURNACE_H - 12} Z`}
            fill="url(#fnBody)"
          />
          {/* the steel bands, riveted */}
          {[
            { y: 72, w: 300, x: 30 },
            { y: FURNACE_H - 40, w: 288, x: 36 },
          ].map((b) => (
            <g key={b.y}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height="12"
                fill="url(#fnBand)"
                stroke="#000"
                strokeOpacity="0.5"
                strokeWidth="0.8"
              />
              {Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={b.x + 16 + i * ((b.w - 32) / 8)}
                  cy={b.y + 6}
                  r="1.8"
                  fill="#0a0a10"
                  stroke="#7d8290"
                  strokeOpacity="0.5"
                  strokeWidth="0.6"
                />
              ))}
            </g>
          ))}
          {/* the tap on the flank: a short flanged spout out of the wall, the
              melt showing at its lip */}
          <rect
            x="316"
            y="132"
            width="10"
            height="22"
            rx="2"
            fill="url(#fnBand)"
            stroke="#000"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          <path
            d="M324 137 h22 a4 4 0 0 1 4 4 v5 h-26 z"
            fill="url(#fnLid)"
            stroke="#000"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          <rect
            x="340"
            y="146"
            width="8"
            height="2.5"
            rx="1"
            fill={c.fill}
            fillOpacity={0.4 + (repaired / total) * 0.6}
          />

          {/* the lid: a heavy ring on the mouth, the melt showing in the middle */}
          <ellipse
            cx="180"
            cy="50"
            rx="152"
            ry="20"
            fill="url(#fnLid)"
            stroke="#7d8290"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <ellipse
            cx="180"
            cy="48"
            rx="152"
            ry="20"
            fill="none"
            stroke="#8b909e"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />
          <ellipse cx="180" cy="50" rx="108" ry="12" fill="#050508" />
          <ellipse cx="180" cy="50" rx="104" ry="10.5" fill="url(#fnMelt)" opacity={0.55 + (repaired / total) * 0.45} />
          <ellipse cx="180" cy="50" rx="108" ry="12" fill="none" stroke="#000" strokeOpacity="0.7" strokeWidth="2" />

          {/* the electrodes: three graphite rods down through the lid, held in
              a yoke across the top, a bus bar over it */}
          <rect
            x="96"
            y="6"
            width="168"
            height="8"
            rx="2"
            fill="url(#fnBand)"
            stroke="#000"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          {[122, 180, 238].map((x) => (
            <g key={x}>
              <rect
                x={x - 12}
                y="10"
                width="24"
                height="14"
                rx="3"
                fill="url(#fnLid)"
                stroke="#7d8290"
                strokeOpacity="0.6"
                strokeWidth="0.8"
              />
              <rect
                x={x - 6}
                y="22"
                width="12"
                height="34"
                rx="1.5"
                fill="url(#fnRod)"
                stroke="#000"
                strokeOpacity="0.6"
                strokeWidth="0.6"
              />
              <rect
                x={x - 8}
                y="40"
                width="16"
                height="6"
                rx="1.5"
                fill="#2b2e38"
                stroke="#7d8290"
                strokeOpacity="0.5"
                strokeWidth="0.6"
              />
            </g>
          ))}
        </svg>

        {/* heat off the melt, and the arcs at the electrodes' tips, while a capsule smelts */}
        {active &&
          HEAT.map((h, i) => (
            <span
              key={i}
              className="station-bubble pointer-events-none absolute rounded-full"
              style={{
                left: `${22 + h.left * 0.56}%`,
                top: 40,
                width: h.size,
                height: h.size,
                background: `radial-gradient(circle at 35% 35%, ${c.light} 0%, ${c.fill} 45%, transparent 72%)`,
                boxShadow: `0 0 6px ${c.glow}`,
                animationDuration: `${h.duration}s`,
                animationDelay: `-${h.delay}s`,
              }}
            />
          ))}
        {active &&
          [122, 180, 238].map((x, i) => (
            <span
              key={x}
              className="station-flicker pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${(x / 360) * 100}%`,
                top: 49,
                background: `radial-gradient(circle, #ffffff 0%, ${c.light} 35%, transparent 70%)`,
                boxShadow: `0 0 10px 3px ${c.glow}`,
                animationDuration: `${0.9 + i * 0.35}s`,
                animationDelay: `-${i * 0.4}s`,
              }}
            />
          ))}

        {/* the controls, on the panel */}
        <div
          className="absolute flex flex-col justify-center"
          style={{ left: '19%', right: '19%', top: 86, bottom: 38 }}
        >
          {done ? (
            /* whole: the same row and bar as the job, full, and nothing to
             press — the count says it all */
            <>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
                <span className="text-neutral-500">
                  {total}/{total}
                </span>
                <span className="flex items-center gap-1" style={{ color: c.light }}>
                  <Check size={12} strokeWidth={3} />
                  {s.complete}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${c.fill}, ${c.light})`,
                    boxShadow: `0 0 10px ${c.glow}`,
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* The time bar: what the next capsule will take, or how the one
                under way is doing. Same bar either way, so paying turns the
                quote into the countdown rather than swapping the panel. */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                <span>{active ? s.refining : `${repaired}/${total}`}</span>
                <span className="flex items-center gap-1 tabular-nums" style={active ? { color: c.light } : undefined}>
                  <Clock size={11} />
                  {s.seconds(active ? secondsLeft : seconds)}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-[width] duration-100"
                  style={{
                    width: `${active ? progress * 100 : 0}%`,
                    background: `linear-gradient(90deg, ${c.fill}, ${c.light})`,
                    boxShadow: active ? `0 0 10px ${c.glow}` : undefined,
                  }}
                />
              </div>

              {/* One button, three faces, same size throughout: the mineral
                price to start (the store's own buy button, in the material);
                "Preparando…" while the server is answering; and, once the
                smelt is running, the gem shortcut to finish it. */}
              {starting || finishing ? (
                <button
                  disabled
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-neutral-500"
                >
                  {s.preparing}
                </button>
              ) : active ? (
                <button
                  data-tutorial="refinery-smelting"
                  onClick={() => void onFinish()}
                  disabled={!canFinish}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    canFinish
                      ? 'border-indigo-400/30 bg-indigo-500/[0.12] text-indigo-100 hover:bg-indigo-500/[0.2]'
                      : 'border-white/5 bg-white/[0.03] text-neutral-500'
                  }`}
                >
                  {s.finishNow}
                  <span className="flex items-center gap-1 tabular-nums">
                    <GemIcon size={18} />
                    {gemCost}
                  </span>
                </button>
              ) : (
                <button
                  data-tutorial="refinery-start"
                  onClick={() => void onStart()}
                  disabled={!canAfford || !core}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    canAfford ? theme.button : 'border border-white/5 bg-white/[0.03] text-neutral-500'
                  }`}
                >
                  {free ? (
                    <span>{strings.tutorial.freeLabel}</span>
                  ) : (
                    <>
                      <MineralIcon size={20} style={{ color: canAfford ? c.fill : '#6b7280' }} />
                      <span className="tabular-nums">{formatPlatino(cost, language)}</span>
                    </>
                  )}
                  <span className="opacity-70">· {s.start}</span>
                </button>
              )}
              {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
