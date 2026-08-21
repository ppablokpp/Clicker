import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import {
  Zap,
  Rocket,
  Clover,
  Gem,
  Dices,
  Magnet,
  Key,
  Gift,
  TrendingUp,
  Sparkles,
  Backpack,
  Info,
  X,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext } from '../context/PowerupContext'
import { useTimedLuckPowerupContext } from '../context/TimedLuckPowerupContext'
import { useMagnetContext } from '../context/MagnetContext'
import { useKeysContext } from '../context/KeysContext'
import { useGemsContext } from '../context/GemsContext'
import { useGemUpgradesContext } from '../context/GemUpgradesContext'
import { useTreeContext } from '../context/TreeContext'
import { useMilestonesContext } from '../context/MilestonesContext'
import { useDailyCaseContext } from '../context/DailyCaseContext'
import { useGemChestContext } from '../context/GemChestContext'
import { useInventoryContext } from '../context/InventoryContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { playMagnetProc } from '../lib/caseSound'

interface InfoModalData {
  icon: LucideIcon
  color: string
  name: string
  desc: string
  durationSeconds: number
}

interface ClickEffect {
  id: number
  x: number
  y: number
  ripple: string
  amount: number
  isLucky: boolean
  /** Set only for a magnet proc "click" — shows the currency icon next to the +N instead of the lucky "!". */
  icon?: 'key' | 'gem'
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

// First prestige threshold — reaching it is meant to be when prestige becomes
// available (prestige itself isn't built yet, this is just the ring's target).
const PRESTIGE_TARGET = 1_000_000

// Glowing ring around the counter that fills up towards the prestige target.
// Once maxed, it stops being a progress indicator and becomes a spinning gold
// halo instead — a visibly different state for "you've got something to do here".
function ProgressRing({ pct, isMaxed }: { pct: number; isMaxed: boolean }) {
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, pct)))

  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible -rotate-90 ${isMaxed ? 'animate-spin-slow' : ''}`}
    >
      <defs>
        <linearGradient id="homeProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id="homePrestigeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
      <circle
        cx="100"
        cy="100"
        r={radius}
        stroke={isMaxed ? 'url(#homePrestigeGradient)' : 'url(#homeProgressGradient)'}
        strokeWidth={isMaxed ? 4 : 3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={isMaxed ? 0 : offset}
        style={{
          transition: 'stroke-dashoffset 0.6s ease-out',
          filter: isMaxed
            ? 'drop-shadow(0 0 10px rgba(245,158,11,0.8))'
            : 'drop-shadow(0 0 6px rgba(217,70,239,0.55))',
        }}
      />
    </svg>
  )
}

// Shrinks the counter as it grows more digits so it never overflows the
// fixed-size ring around it (much tighter budget than the old full-width layout).
function counterTextSizeClass(value: number): string {
  const digits = Math.max(1, Math.floor(value)).toString().length
  if (digits <= 3) return 'text-7xl sm:text-8xl'
  if (digits <= 6) return 'text-5xl sm:text-7xl'
  if (digits <= 9) return 'text-4xl sm:text-6xl'
  if (digits <= 12) return 'text-3xl sm:text-5xl'
  return 'text-2xl sm:text-4xl'
}

export function Home() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const { promptSignIn } = useSignInPrompt()
  const { totalClicks, clicksPerSecond, registerClick } = useClickCounterContext()
  const { autoClickCps, luckChance: permanentLuckChance, luckMultiplier: permanentLuckMultiplier } = useTreeContext()
  const { language, strings } = useLanguage()
  const {
    catalog: powerupCatalog,
    active: activePowerup,
    secondsLeft,
    activatingId: activatingPowerupId,
    activate: activatePowerup,
  } = usePowerupContext()
  const {
    catalog: luckCatalog,
    active: activeLuckPowerup,
    secondsLeft: luckSecondsLeft,
    activatingId: activatingLuckId,
    activate: activateLuck,
  } = useTimedLuckPowerupContext()
  const {
    catalog: magnetCatalog,
    active: activeMagnet,
    secondsLeft: magnetSecondsLeft,
    activatingId: activatingMagnetId,
    activate: activateMagnet,
  } = useMagnetContext()
  const { keys } = useKeysContext()
  const { gems } = useGemsContext()
  const { ownedChests: ownedClickChests } = useDailyCaseContext()
  const { ownedChests: ownedGemChests } = useGemChestContext()
  const { inventory } = useInventoryContext()
  // Keeps the just-activated item visible (its owned count can drop to 0)
  // until its own timer runs out, instead of it vanishing the instant it starts.
  const ownedPowerups = powerupCatalog.filter((p) => (inventory[p.id] ?? 0) > 0 || activePowerup?.id === p.id)
  const ownedLuckPowerups = luckCatalog.filter(
    (p) => (inventory[p.id] ?? 0) > 0 || activeLuckPowerup?.id === p.id,
  )
  const ownedMagnets = magnetCatalog.filter((m) => (inventory[m.id] ?? 0) > 0 || activeMagnet?.id === m.id)
  const isInventoryEmpty =
    ownedClickChests === 0 &&
    ownedGemChests === 0 &&
    ownedPowerups.length === 0 &&
    ownedLuckPowerups.length === 0 &&
    ownedMagnets.length === 0
  const { bestOwned: bestMoneyOwned } = useGemUpgradesContext()
  const { bonusMultiplier } = useMilestonesContext()
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const [showPrestigeComingSoon, setShowPrestigeComingSoon] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevKeysRef = useRef<number | null>(null)
  const prevGemsRef = useRef<number | null>(null)
  // Where the last real tap landed — a magnet proc has no coordinates of its
  // own (it's rolled server-side inside the batched click flush, up to ~1s
  // later), so its "+1" effect spawns from here instead, reading as just
  // another click landing rather than a separate notification.
  const lastPosRef = useRef({ x: 0, y: 0 })
  const heat = useMemo(() => getHeatLevel(clicksPerSecond), [clicksPerSecond])
  useEffect(() => {
    if (prevKeysRef.current !== null && keys > prevKeysRef.current && activeMagnet?.currency === 'keys') {
      const amount = keys - prevKeysRef.current
      const id = effectId++
      const { x, y } = lastPosRef.current
      setEffects((prev) => [...prev, { id, x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'key' }])
      playMagnetProc('keys')
      window.setTimeout(() => setEffects((prev) => prev.filter((fx) => fx.id !== id)), 900)
    }
    prevKeysRef.current = keys
  }, [keys, activeMagnet, heat.ripple])
  useEffect(() => {
    if (prevGemsRef.current !== null && gems > prevGemsRef.current && activeMagnet?.currency === 'gems') {
      const amount = gems - prevGemsRef.current
      const id = effectId++
      const { x, y } = lastPosRef.current
      setEffects((prev) => [...prev, { id, x, y, ripple: heat.ripple, amount, isLucky: false, icon: 'gem' }])
      playMagnetProc('gems')
      window.setTimeout(() => setEffects((prev) => prev.filter((fx) => fx.id !== id)), 900)
    }
    prevGemsRef.current = gems
  }, [gems, activeMagnet, heat.ripple])
  const heatLabel = heat.key ? strings.home.heat[heat.key] : ''
  const powerupMultiplier = activePowerup?.multiplier ?? 1
  const moneyMultiplier = bestMoneyOwned?.multiplier ?? 1
  const totalMultiplier = heat.multiplier * powerupMultiplier * bonusMultiplier * moneyMultiplier

  // Permanent Suerte (now a tree node, branch A) and the timed one aren't
  // two separate rolls — owning both multiplies together into a single
  // number under one shared 1% roll, so buying the timed one actually
  // amplifies the permanent level you already have.
  const hasLuck = Boolean(permanentLuckChance > 0 || activeLuckPowerup)
  const luckChance = activeLuckPowerup?.chance ?? permanentLuckChance
  const combinedLuckMultiplier = permanentLuckMultiplier * (activeLuckPowerup?.multiplier ?? 1)

  const prestige = useMemo(
    () => ({
      isMaxed: totalClicks >= PRESTIGE_TARGET,
      pct: Math.min(1, totalClicks / PRESTIGE_TARGET),
    }),
    [totalClicks],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!userId) {
        promptSignIn()
        return
      }

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      lastPosRef.current = { x, y }

      const luckMultiplier = hasLuck && Math.random() < luckChance ? combinedLuckMultiplier : 1
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
    [userId, promptSignIn, registerClick, heat, totalMultiplier, hasLuck, luckChance, combinedLuckMultiplier],
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
        {/* prestige glow — replaces the ambient mood once you hit the target.
            Rendered only when maxed (not just faded via opacity), since the
            infinite pulse-glow keyframe would otherwise keep animating its
            own opacity and fight the inline style meant to hide it. */}
        {prestige.isMaxed && (
          <div className="animate-pulse-glow absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-[140px]" />
        )}
      </div>

      {/* Inventory button — mirrors the CPS badge's position on the right. */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setShowInventory(true)}
        aria-label={strings.home.inventory}
        className="pointer-events-auto absolute right-4 top-20 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:right-6"
      >
        <Backpack size={16} />
      </button>

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

        {autoClickCps > 0 && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-zinc-400/25 bg-zinc-500/30 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-lg shadow-black/20">
            <Bot size={12} className="text-zinc-400" />
            {strings.tree.autoClickLabel} {autoClickCps.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}{' '}
            {strings.home.cps}
          </span>
        )}

        {bestMoneyOwned && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-3 py-1.5 text-xs font-bold text-fuchsia-200 shadow-lg shadow-black/20">
            <Gem size={12} className="text-fuchsia-300" />×{bestMoneyOwned.multiplier}
          </span>
        )}

        {hasLuck && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-green-400/20 bg-green-500/[0.07] px-3 py-1.5 text-xs font-bold text-green-200 shadow-lg shadow-black/20">
            <Clover size={12} className="text-green-300" />×{combinedLuckMultiplier}
            {activeLuckPowerup && (
              <>
                <Dices size={12} className="text-green-300" />
                <span className="tabular-nums text-green-300">
                  {Math.floor(luckSecondsLeft / 60)}:{String(luckSecondsLeft % 60).padStart(2, '0')}
                </span>
              </>
            )}
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

        {activeMagnet && (
          <span
            className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg shadow-black/20 ${
              activeMagnet.currency === 'keys'
                ? 'border-amber-400/20 bg-amber-500/[0.07] text-amber-200'
                : 'border-indigo-400/20 bg-indigo-500/[0.07] text-indigo-200'
            }`}
          >
            <Magnet size={12} className={activeMagnet.currency === 'keys' ? 'text-amber-300' : 'text-indigo-300'} />
            <span className="tabular-nums">
              {Math.floor(magnetSecondsLeft / 60)}:{String(magnetSecondsLeft % 60).padStart(2, '0')}
            </span>
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
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
          <ProgressRing pct={prestige.pct} isMaxed={prestige.isMaxed} />

          <div className="flex flex-col items-center px-3">
            <span
              className={`mb-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-300 ${
                prestige.isMaxed ? 'text-amber-300' : 'text-neutral-500'
              }`}
            >
              {prestige.isMaxed ? strings.home.prestigeReady : strings.home.yourClicks}
            </span>
            <motion.span
              key={totalClicks}
              initial={{ scale: 1 }}
              animate={{ scale: [1.06, 1] }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`bg-clip-text text-center font-[Space_Grotesk] font-bold leading-none tabular-nums text-transparent transition-[filter] duration-300 ${
                prestige.isMaxed
                  ? 'bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500'
                  : 'bg-gradient-to-b from-white to-neutral-400'
              } ${counterTextSizeClass(totalClicks)}`}
              style={{
                filter: prestige.isMaxed
                  ? 'drop-shadow(0 0 40px rgba(245,158,11,0.55))'
                  : `drop-shadow(0 0 40px ${heat.glow})`,
              }}
            >
              {totalClicks.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
            </motion.span>

            {prestige.isMaxed ? (
              <div className="pointer-events-auto mt-4 flex flex-col items-center gap-1.5">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setShowPrestigeComingSoon(true)
                    window.setTimeout(() => setShowPrestigeComingSoon(false), 2000)
                  }}
                  className="animate-prestige-pulse flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 px-4 py-2 text-xs font-bold text-amber-200 shadow-lg shadow-amber-500/10 transition-transform hover:scale-105"
                >
                  <Sparkles size={13} className="text-amber-300" />
                  {strings.home.changePrestige}
                </button>
                {showPrestigeComingSoon && (
                  <span className="text-[10px] font-medium text-amber-300/80">
                    {strings.home.prestigeComingSoon}
                  </span>
                )}
              </div>
            ) : (
              <span className="mt-3 text-[11px] font-medium tabular-nums text-neutral-500">
                {`${totalClicks.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')} / ${PRESTIGE_TARGET.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}`}
              </span>
            )}
          </div>
        </div>

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
              className={`animate-float-up absolute flex select-none items-center gap-1 font-bold ${
                fx.isLucky
                  ? 'text-2xl text-green-300 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                  : fx.icon === 'key'
                    ? 'text-lg text-amber-300'
                    : fx.icon === 'gem'
                      ? 'text-lg text-indigo-300'
                      : 'text-lg text-white'
              }`}
              style={{ left: fx.x, top: fx.y }}
            >
              +{fx.amount}
              {fx.isLucky && '!'}
              {fx.icon === 'key' && <Key size={14} />}
              {fx.icon === 'gem' && <Gem size={14} />}
            </span>
          </div>
        ))}
      </AnimatePresence>

      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowInventory(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-white/10 bg-[#0d0d14] py-6 pl-6 pr-2 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInventory(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex shrink-0 items-center gap-2 pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-sky-500/20 text-cyan-200">
                <Backpack size={17} />
              </div>
              <p className="text-sm font-semibold text-white">{strings.home.inventoryTitle}</p>
            </div>

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-4">
              {(ownedClickChests > 0 || ownedGemChests > 0) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.casesSection}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedClickChests > 0 && (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                        <Gift size={18} className="text-neutral-400" />
                        <span className="text-xs font-semibold text-white">{strings.store.caseTitleClicks}</span>
                        <span className="text-[10px] tabular-nums text-neutral-500">x{ownedClickChests}</span>
                        <button
                          onClick={() => navigate('/tienda')}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1]"
                        >
                          {strings.home.openButton}
                        </button>
                      </div>
                    )}

                    {ownedGemChests > 0 && (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                        <Gift size={18} className="text-indigo-300" />
                        <span className="text-xs font-semibold text-white">{strings.store.caseTitleGems}</span>
                        <span className="text-[10px] tabular-nums text-neutral-500">x{ownedGemChests}</span>
                        <button
                          onClick={() => navigate('/tienda')}
                          className="w-full rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-2 py-1.5 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/15"
                        >
                          {strings.home.openButton}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ownedPowerups.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.powerupsCardTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedPowerups.map((powerup) => {
                      const isThisActive = activePowerup?.id === powerup.id
                      const name = strings.store.powerups[powerup.id]?.name ?? powerup.id
                      return (
                        <div
                          key={powerup.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Rocket,
                                color: 'text-violet-300',
                                name,
                                desc: strings.store.powerups[powerup.id]?.desc ?? '',
                                durationSeconds: powerup.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Rocket size={18} className="text-violet-300" />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[powerup.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className="w-full rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1.5 text-xs font-semibold tabular-nums text-violet-200">
                              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activatePowerup(powerup)}
                              disabled={Boolean(activePowerup) || activatingPowerupId !== null}
                              className="w-full rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {ownedLuckPowerups.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.timedLuckTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedLuckPowerups.map((powerup) => {
                      const isThisActive = activeLuckPowerup?.id === powerup.id
                      const name = strings.store.timedLuckPowerups[powerup.id]?.name ?? powerup.id
                      return (
                        <div
                          key={powerup.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Dices,
                                color: 'text-green-300',
                                name,
                                desc: strings.store.timedLuckPowerups[powerup.id]?.desc ?? '',
                                durationSeconds: powerup.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Dices size={18} className="text-green-300" />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[powerup.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className="w-full rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-1.5 text-xs font-semibold tabular-nums text-green-200">
                              {Math.floor(luckSecondsLeft / 60)}:{String(luckSecondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activateLuck(powerup)}
                              disabled={Boolean(activeLuckPowerup) || activatingLuckId !== null}
                              className="w-full rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-1.5 text-xs font-semibold text-green-200 transition-colors hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {ownedMagnets.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {strings.store.magnetsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ownedMagnets.map((magnet) => {
                      const isThisActive = activeMagnet?.id === magnet.id
                      const accent =
                        magnet.currency === 'keys'
                          ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                          : 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200'
                      const accentHover =
                        magnet.currency === 'keys' ? 'hover:bg-amber-500/15' : 'hover:bg-indigo-500/15'
                      const iconColor = magnet.currency === 'keys' ? 'text-amber-300' : 'text-indigo-300'
                      const name = strings.store.magnets[magnet.id]?.name ?? magnet.id
                      return (
                        <div
                          key={magnet.id}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
                        >
                          <button
                            onClick={() =>
                              setInfoModal({
                                icon: Magnet,
                                color: iconColor,
                                name,
                                desc: strings.store.magnets[magnet.id]?.desc ?? '',
                                durationSeconds: magnet.durationSeconds,
                              })
                            }
                            aria-label="Info"
                            className="absolute right-1.5 top-1.5 text-neutral-600 hover:text-neutral-300"
                          >
                            <Info size={13} />
                          </button>
                          <Magnet size={18} className={iconColor} />
                          <span className="text-xs font-semibold text-white">{name}</span>
                          <span className="text-[10px] tabular-nums text-neutral-500">
                            x{inventory[magnet.id] ?? 0}
                          </span>
                          {isThisActive ? (
                            <div className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold tabular-nums ${accent}`}>
                              {Math.floor(magnetSecondsLeft / 60)}:{String(magnetSecondsLeft % 60).padStart(2, '0')}
                            </div>
                          ) : (
                            <button
                              onClick={() => activateMagnet(magnet)}
                              disabled={Boolean(activeMagnet) || activatingMagnetId !== null}
                              className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${accent} ${accentHover}`}
                            >
                              {strings.home.activateButton}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {isInventoryEmpty && (
                <p className="py-6 text-center text-sm text-neutral-500">{strings.home.inventoryEmpty}</p>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {infoModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setInfoModal(null)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInfoModal(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <infoModal.icon size={18} className={infoModal.color} />
              <p className="text-sm font-semibold text-white">{infoModal.name}</p>
            </div>
            <p className="mb-3 text-sm text-neutral-400">{infoModal.desc}</p>
            <p className="text-xs font-medium text-neutral-500">
              {strings.home.durationLabel(infoModal.durationSeconds)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
