import { useCallback, useMemo, useRef, useState, type PointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Rocket, Clover, Gem, TrendingUp } from 'lucide-react'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext } from '../context/PowerupContext'
import { useUpgradesContext } from '../context/UpgradesContext'
import { useMoneyUpgradesContext } from '../context/MoneyUpgradesContext'
import { useMilestonesContext } from '../context/MilestonesContext'

interface ClickEffect {
  id: number
  x: number
  y: number
  ripple: string
  amount: number
  isLucky: boolean
}

let effectId = 0

// Escalates the whole screen's feel with click speed — a free "combo meter"
// with no server round trip, purely derived from clicksPerSecond. Legendario
// also doubles the value of each click (registerClick(multiplier)). `key` is
// resolved against strings.home.heat inside the component for translation.
const HEAT_LEVELS = [
  { min: 0, key: null, badge: 'text-neutral-300', icon: 'text-neutral-600', ripple: 'bg-violet-400/40', glow: 'rgba(168,85,247,0.25)', multiplier: 1 },
  { min: 6, key: 'onFire', badge: 'text-amber-300', icon: 'text-amber-400', ripple: 'bg-amber-400/50', glow: 'rgba(251,191,36,0.35)', multiplier: 1 },
  { min: 10, key: 'unstoppable', badge: 'text-orange-300', icon: 'text-orange-400', ripple: 'bg-orange-500/55', glow: 'rgba(249,115,22,0.4)', multiplier: 1 },
  { min: 20, key: 'legendary', badge: 'text-red-300', icon: 'text-red-400', ripple: 'bg-red-500/60', glow: 'rgba(239,68,68,0.45)', multiplier: 2 },
] as const satisfies readonly {
  min: number
  key: 'onFire' | 'unstoppable' | 'legendary' | null
  badge: string
  icon: string
  ripple: string
  glow: string
  multiplier: number
}[]

function getHeatLevel(cps: number): (typeof HEAT_LEVELS)[number] {
  let level: (typeof HEAT_LEVELS)[number] = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (cps >= l.min) level = l
  }
  return level
}

export function Home() {
  const { totalClicks, clicksPerSecond, registerClick } = useClickCounterContext()
  const { language, strings } = useLanguage()
  const { active: activePowerup, secondsLeft } = usePowerupContext()
  const { bestOwned, rollLuckMultiplier } = useUpgradesContext()
  const { bestOwned: bestMoneyOwned } = useMoneyUpgradesContext()
  const { bonusMultiplier } = useMilestonesContext()
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const heat = useMemo(() => getHeatLevel(clicksPerSecond), [clicksPerSecond])
  const heatLabel = heat.key ? strings.home.heat[heat.key] : ''
  const powerupMultiplier = activePowerup?.multiplier ?? 1
  const moneyMultiplier = bestMoneyOwned?.multiplier ?? 1
  const totalMultiplier = heat.multiplier * powerupMultiplier * bonusMultiplier * moneyMultiplier

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const luckMultiplier = rollLuckMultiplier()
      const isLucky = luckMultiplier > 1
      const amount = totalMultiplier * luckMultiplier

      const id = effectId++
      setEffects((prev) => [
        ...prev,
        { id, x, y, ripple: isLucky ? 'bg-green-400/70' : heat.ripple, amount, isLucky },
      ])
      registerClick(amount)

      window.setTimeout(() => {
        setEffects((prev) => prev.filter((fx) => fx.id !== id))
      }, 900)
    },
    [registerClick, heat, totalMultiplier, rollLuckMultiplier],
  )

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative flex h-[100dvh] w-full touch-none select-none flex-col items-center justify-center overflow-hidden bg-[#08080c]"
    >
      {/* ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
        <div
          className="animate-pulse-glow absolute left-1/3 top-2/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]"
          style={{ animationDelay: '1.2s' }}
        />
        <div
          className="animate-pulse-glow absolute right-1/4 top-1/4 h-56 w-56 rounded-full bg-cyan-500/10 blur-[100px]"
          style={{ animationDelay: '2s' }}
        />
        {/* combo heat glow — intensifies with clicksPerSecond, invisible at rest */}
        <div
          className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-all duration-300"
          style={{
            backgroundColor: heat.glow,
            opacity: heat.key ? 1 : 0,
          }}
        />
      </div>

      {/* CPS badge + combined multiplier (below the fixed header) */}
      <div className="pointer-events-none absolute left-4 top-20 z-10 flex flex-col gap-1.5 sm:left-6">
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-medium shadow-lg shadow-black/20 transition-colors">
          <Zap size={13} className={clicksPerSecond > 0 ? heat.icon : 'text-neutral-600'} />
          <span className={clicksPerSecond > 0 ? heat.badge : 'text-neutral-300'}>
            {clicksPerSecond.toFixed(1)} {strings.home.cps}
          </span>
          {heatLabel && (
            <span className={`font-semibold uppercase tracking-wide ${heat.badge}`}>· {heatLabel}</span>
          )}
        </span>

        {bestMoneyOwned && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-3 py-1.5 text-xs font-bold text-fuchsia-200 shadow-lg shadow-black/20">
            <Gem size={12} className="text-fuchsia-300" />×{bestMoneyOwned.multiplier}
          </span>
        )}

        {bestOwned && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-green-400/20 bg-green-500/[0.07] px-3 py-1.5 text-xs font-bold text-green-200 shadow-lg shadow-black/20">
            <Clover size={12} className="text-green-300" />×{bestOwned.multiplier}
          </span>
        )}

        {totalMultiplier > 1 && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-bold text-violet-200 shadow-lg shadow-black/20">
            ×{totalMultiplier}
            {activePowerup && (
              <>
                <Rocket size={12} className="text-violet-300" />
                <span className="tabular-nums text-violet-300">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </span>
              </>
            )}
          </span>
        )}

        {bonusMultiplier > 1 && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-200 shadow-lg shadow-black/20">
            <TrendingUp size={12} className="text-emerald-300" />×{bonusMultiplier}
          </span>
        )}
      </div>

      {/* main counter */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <span className="relative mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          {strings.home.yourClicks}
        </span>
        <motion.span
          key={totalClicks}
          initial={{ scale: 1 }}
          animate={{ scale: [1.06, 1] }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text font-[Space_Grotesk] text-6xl font-bold tabular-nums text-transparent transition-[filter] duration-300 sm:text-8xl"
          style={{ filter: `drop-shadow(0 0 40px ${heat.glow})` }}
        >
          {totalClicks.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
        </motion.span>

        <span className="mt-8 text-xs font-medium tracking-wide text-neutral-600 sm:text-sm">
          {strings.home.tapAnywhere}
        </span>
      </div>

      {/* click ripples + floating +N */}
      <AnimatePresence>
        {effects.map((fx) => (
          <div key={fx.id} className="pointer-events-none absolute inset-0 z-20">
            <span
              className={`animate-ripple absolute rounded-full ${fx.ripple} ${fx.isLucky ? 'h-36 w-36' : 'h-24 w-24'}`}
              style={{ left: fx.x, top: fx.y }}
            />
            <span
              className={`animate-float-up absolute select-none font-bold ${
                fx.isLucky
                  ? 'text-2xl text-green-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                  : 'text-lg text-white'
              }`}
              style={{ left: fx.x, top: fx.y }}
            >
              +{fx.amount}
              {fx.isLucky && '!'}
            </span>
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
