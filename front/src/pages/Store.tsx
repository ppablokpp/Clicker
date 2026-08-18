import { useState } from 'react'
import { Clock, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useUpgradesContext, type PermanentUpgradeDef } from '../context/UpgradesContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { POWERUP_ICONS, DEFAULT_POWERUP_ICON, UPGRADE_ICON } from '../store/config'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const { catalog: powerups, active, secondsLeft, buyingId, buy } = usePowerupContext()
  const {
    catalog: upgrades,
    owned,
    bestOwned,
    buyingId: buyingUpgradeId,
    buy: buyUpgrade,
  } = useUpgradesContext()
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

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.powerupsSection}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {powerups.map((powerup) => (
              <PowerupCard
                key={powerup.id}
                powerup={powerup}
                locale={locale}
                totalClicks={totalClicks}
                isActive={active?.id === powerup.id}
                blockedByOther={active !== null && active.id !== powerup.id}
                secondsLeft={secondsLeft}
                isBuyingThis={buyingId === powerup.id}
                isBuyingAny={buyingId !== null}
                onBuy={buy}
                strings={strings.store}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-neutral-200">{strings.store.upgradesSection}</h2>
          <p className="mb-3 text-xs text-neutral-500">{strings.store.upgradesIntro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {upgrades.map((upgrade) => (
              <UpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                locale={locale}
                totalClicks={totalClicks}
                isOwned={owned.has(upgrade.id)}
                isIncluded={
                  !owned.has(upgrade.id) && !!bestOwned && bestOwned.multiplier > upgrade.multiplier
                }
                isBuyingThis={buyingUpgradeId === upgrade.id}
                isBuyingAny={buyingUpgradeId !== null}
                onBuy={buyUpgrade}
                strings={strings.store}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

interface StoreStrings {
  costLabel: string
  buy: string
  buying: string
  active: string
  owned: string
  notEnoughClicks: string
  included: string
  infinity: string
  powerups: Record<string, { name: string; desc: string }>
  upgrades: Record<string, { name: string; desc: string }>
}

interface PowerupCardProps {
  powerup: PowerupDef
  locale: string
  totalClicks: number
  isActive: boolean
  blockedByOther: boolean
  secondsLeft: number
  isBuyingThis: boolean
  isBuyingAny: boolean
  onBuy: (powerup: PowerupDef) => Promise<{ ok: boolean; error?: string }>
  strings: StoreStrings
}

function PowerupCard({
  powerup,
  locale,
  totalClicks,
  isActive,
  blockedByOther,
  secondsLeft,
  isBuyingThis,
  isBuyingAny,
  onBuy,
  strings,
}: PowerupCardProps) {
  const [error, setError] = useState<string | null>(null)
  const Icon = POWERUP_ICONS[powerup.id] ?? DEFAULT_POWERUP_ICON
  const display = strings.powerups[powerup.id] ?? { name: powerup.id, desc: '' }
  const canAfford = totalClicks >= powerup.cost
  const looksDisabled = !isActive && (isBuyingAny || !canAfford || blockedByOther)

  const handleBuy = async () => {
    setError(null)
    const result = await onBuy(powerup)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
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
        disabled={isActive || isBuyingAny || !canAfford || blockedByOther}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
          isActive
            ? 'border border-violet-400/30 bg-violet-500/10 text-violet-200'
            : looksDisabled
              ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'bg-white text-neutral-900 hover:opacity-90'
        }`}
      >
        {isActive
          ? `${strings.active} · ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
          : isBuyingThis
            ? strings.buying
            : canAfford
              ? strings.buy
              : strings.notEnoughClicks}
      </button>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface UpgradeCardProps {
  upgrade: PermanentUpgradeDef
  locale: string
  totalClicks: number
  isOwned: boolean
  isIncluded: boolean
  isBuyingThis: boolean
  isBuyingAny: boolean
  onBuy: (upgrade: PermanentUpgradeDef) => Promise<{ ok: boolean; error?: string }>
  strings: StoreStrings
}

function UpgradeCard({
  upgrade,
  locale,
  totalClicks,
  isOwned,
  isIncluded,
  isBuyingThis,
  isBuyingAny,
  onBuy,
  strings,
}: UpgradeCardProps) {
  const [error, setError] = useState<string | null>(null)
  const display = strings.upgrades[upgrade.id] ?? { name: upgrade.id, desc: '' }
  const canAfford = totalClicks >= upgrade.cost
  const isActiveState = isOwned || isIncluded
  const looksDisabled = !isActiveState && (isBuyingAny || !canAfford)

  const handleBuy = async () => {
    setError(null)
    const result = await onBuy(upgrade)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-500/20 text-yellow-200">
          <UPGRADE_ICON size={17} />
        </div>
        <span className="text-base font-semibold text-white">{display.name}</span>
      </div>

      <p className="mb-4 text-sm text-neutral-500">{display.desc}</p>

      <div className="mb-4 flex items-center gap-4 text-xs text-neutral-400">
        <span className="font-semibold text-neutral-200">
          {upgrade.cost.toLocaleString(locale)} {strings.costLabel}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {strings.infinity}
        </span>
      </div>

      <button
        onClick={handleBuy}
        disabled={isActiveState || isBuyingAny || !canAfford}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
          isOwned
            ? 'border border-yellow-400/30 bg-yellow-500/10 text-yellow-200'
            : looksDisabled
              ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'bg-white text-neutral-900 hover:opacity-90'
        }`}
      >
        {isOwned ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check size={14} />
            {strings.owned}
          </span>
        ) : isIncluded ? (
          strings.included
        ) : isBuyingThis ? (
          strings.buying
        ) : canAfford ? (
          strings.buy
        ) : (
          strings.notEnoughClicks
        )}
      </button>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
