import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { POWERUP_ICONS, DEFAULT_POWERUP_ICON } from '../store/config'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const { catalog, active, secondsLeft, isBuying, buy } = usePowerupContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
            {strings.store.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{strings.store.subtitle}</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.map((powerup) => (
            <PowerupCard
              key={powerup.id}
              powerup={powerup}
              locale={locale}
              totalClicks={totalClicks}
              isActive={active?.id === powerup.id}
              blockedByOther={active !== null && active.id !== powerup.id}
              secondsLeft={secondsLeft}
              isBuying={isBuying}
              onBuy={buy}
              strings={strings.store}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface PowerupCardProps {
  powerup: PowerupDef
  locale: string
  totalClicks: number
  isActive: boolean
  blockedByOther: boolean
  secondsLeft: number
  isBuying: boolean
  onBuy: (powerup: PowerupDef) => Promise<{ ok: boolean; error?: string }>
  strings: {
    costLabel: string
    buy: string
    buying: string
    active: string
    notEnoughClicks: string
    powerups: Record<string, { name: string; desc: string }>
  }
}

function PowerupCard({
  powerup,
  locale,
  totalClicks,
  isActive,
  blockedByOther,
  secondsLeft,
  isBuying,
  onBuy,
  strings,
}: PowerupCardProps) {
  const [error, setError] = useState<string | null>(null)
  const Icon = POWERUP_ICONS[powerup.id] ?? DEFAULT_POWERUP_ICON
  const display = strings.powerups[powerup.id] ?? { name: powerup.id, desc: '' }
  const canAfford = totalClicks >= powerup.cost

  const handleBuy = async () => {
    setError(null)
    const result = await onBuy(powerup)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <Icon size={17} />
        </div>
        <span className="text-base font-semibold text-white">{display.name}</span>
      </div>

      <p className="mb-4 text-sm text-neutral-500">{display.desc}</p>

      <div className="mb-4 flex items-center gap-4 text-xs text-neutral-400">
        <span className="font-semibold text-neutral-200">
          {powerup.cost.toLocaleString(locale)} {strings.costLabel}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {powerup.durationSeconds}s
        </span>
      </div>

      <button
        onClick={handleBuy}
        disabled={isActive || isBuying || !canAfford || blockedByOther}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          isActive
            ? 'border border-violet-400/30 bg-violet-500/10 text-violet-200'
            : canAfford
              ? 'bg-white text-neutral-900 hover:opacity-90'
              : 'border border-white/10 bg-white/5 text-neutral-500'
        } disabled:cursor-not-allowed`}
      >
        {isActive
          ? `${strings.active} · ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
          : isBuying
            ? strings.buying
            : canAfford
              ? strings.buy
              : strings.notEnoughClicks}
      </button>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
