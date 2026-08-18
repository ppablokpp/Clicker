import { useState } from 'react'
import { Rocket, Dices, Clock, MousePointerClick } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useTimedLuckPowerupContext, type TimedLuckPowerupDef } from '../context/TimedLuckPowerupContext'
import { useUpgradesContext } from '../context/UpgradesContext'
import { useMoneyUpgradesContext, type MoneyUpgradeDef } from '../context/MoneyUpgradesContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { UPGRADE_ICON, MONEY_UPGRADE_ICON } from '../store/config'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
              {strings.store.title}
            </h1>
            <span className="shrink-0 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-xs font-semibold tabular-nums text-neutral-300">
              {totalClicks.toLocaleString(locale)} {strings.store.costLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">{strings.store.subtitle}</p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.upgradesSection}</h2>
          <div className="flex flex-col gap-3">
            <MoneyUpgradeLadder strings={strings.store} />
            <UpgradeLadder locale={locale} totalClicks={totalClicks} strings={strings.store} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.powerupsSection}</h2>
          <div className="flex flex-col gap-3">
            <PowerupGridCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
            <TimedLuckGridCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
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
  powerupsSection: string
  powerupsCardTitle: string
  powerupsSubtitle: string
  upgradesSection: string
  infinity: string
  luckTitle: string
  noUpgradeYet: string
  maxLevel: string
  upgradeCta: string
  moneyUpgradesTitle: string
  purchaseError: string
  timedLuckTitle: string
  timedLuckSubtitle: string
  powerups: Record<string, { name: string; desc: string }>
  upgrades: Record<string, { name: string; desc: string }>
  moneyUpgrades: Record<string, { name: string; desc: string }>
  timedLuckPowerups: Record<string, { name: string; desc: string }>
}

/** The buy button's own content IS the price — no separate cost row, no generic "Buy" label. */
function ClickPriceTag({ cost, locale, costLabel }: { cost: number; locale: string; costLabel: string }) {
  return (
    <span className="flex items-center justify-center gap-1.5">
      <MousePointerClick size={14} className="opacity-70" />
      <span className="text-base font-bold tabular-nums">{cost.toLocaleString(locale)}</span>
      <span className="text-xs font-medium opacity-70">{costLabel}</span>
    </span>
  )
}

interface TierTileProps {
  name: string
  durationSeconds: number
  cost: number
  locale: string
  accent: 'violet' | 'green'
  isActive: boolean
  isBuyingThis: boolean
  disabled: boolean
  activeCountdown: string
  buyingLabel: string
  onClick: () => void
}

// One tile = one freely-buyable tier: name, duration, and a white price
// button — compact enough for all 4 to sit in a row like the original cards did.
function TierTile({
  name,
  durationSeconds,
  cost,
  locale,
  accent,
  isActive,
  isBuyingThis,
  disabled,
  activeCountdown,
  buyingLabel,
  onClick,
}: TierTileProps) {
  const activeClasses =
    accent === 'violet'
      ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
      : 'border-green-400/30 bg-green-500/10 text-green-200'

  return (
    <div className="flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
      <span className="text-xs font-semibold text-white">{name}</span>
      <span className="mb-2 flex items-center gap-1 text-[10px] font-medium text-neutral-500">
        <Clock size={9} />
        {durationSeconds}s
      </span>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={name}
        className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
          isActive
            ? `border ${activeClasses}`
            : disabled
              ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'bg-white text-neutral-900 hover:opacity-90'
        }`}
      >
        {isActive ? (
          activeCountdown
        ) : isBuyingThis ? (
          buyingLabel
        ) : (
          <span className="flex items-center justify-center gap-1">
            <MousePointerClick size={10} className="opacity-70" />
            <span className="tabular-nums">{cost.toLocaleString(locale)}</span>
          </span>
        )}
      </button>
    </div>
  )
}

interface PowerupGridCardProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// All 4 click-multiplier powerups in one card instead of 4 separate ones —
// freely buyable in any order (only one can run at a time), each tile is its
// own price button.
function PowerupGridCard({ locale, totalClicks, strings }: PowerupGridCardProps) {
  const { catalog, active, secondsLeft, buyingId, buy } = usePowerupContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: PowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <Rocket size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.powerupsCardTitle}</div>
          {active && (
            <div className="text-xs text-neutral-500">{strings.powerups[active.id]?.name ?? active.id}</div>
          )}
        </div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.powerupsSubtitle}</p>

      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
        {catalog.map((powerup) => {
          const isActive = active?.id === powerup.id
          const blockedByOther = active !== null && active.id !== powerup.id
          const canAfford = totalClicks >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = isActive || buyingId !== null || !canAfford || blockedByOther
          const name = strings.powerups[powerup.id]?.name ?? powerup.id

          return (
            <TierTile
              key={powerup.id}
              name={name}
              durationSeconds={powerup.durationSeconds}
              cost={powerup.cost}
              locale={locale}
              accent="violet"
              isActive={isActive}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
              activeCountdown={`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              buyingLabel={strings.buying}
              onClick={() => handleBuy(powerup)}
            />
          )
        })}
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TimedLuckGridCardProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// Same freely-buyable grid as PowerupGridCard, but for the temporary,
// high-variance version of the permanent Suerte upgrade — same 1% chance,
// much bigger multiplier, only lasts a short while.
function TimedLuckGridCard({ locale, totalClicks, strings }: TimedLuckGridCardProps) {
  const { catalog, active, secondsLeft, buyingId, buy } = useTimedLuckPowerupContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: TimedLuckPowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />

      <div className="relative mb-1 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/20 text-green-200">
          <Dices size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.timedLuckTitle}</div>
          {active && (
            <div className="text-xs text-neutral-500">
              {strings.timedLuckPowerups[active.id]?.name ?? active.id}
            </div>
          )}
        </div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.timedLuckSubtitle}</p>

      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
        {catalog.map((powerup) => {
          const isActive = active?.id === powerup.id
          const blockedByOther = active !== null && active.id !== powerup.id
          const canAfford = totalClicks >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = isActive || buyingId !== null || !canAfford || blockedByOther
          const name = strings.timedLuckPowerups[powerup.id]?.name ?? powerup.id

          return (
            <TierTile
              key={powerup.id}
              name={name}
              durationSeconds={powerup.durationSeconds}
              cost={powerup.cost}
              locale={locale}
              accent="green"
              isActive={isActive}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
              activeCountdown={`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              buyingLabel={strings.buying}
              onClick={() => handleBuy(powerup)}
            />
          )
        })}
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface UpgradeLadderProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// One card for the whole luck ladder instead of 4 separate cards — a
// segmented bar shows how far you've gone, and the CTA always targets
// whatever the next tier is (buying is enforced sequential server-side).
function UpgradeLadder({ locale, totalClicks, strings }: UpgradeLadderProps) {
  const { catalog, owned, bestOwned, buyingId, buy } = useUpgradesContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const ownedCount = catalog.filter((u) => owned.has(u.id)).length
  const nextUpgrade = catalog[ownedCount]
  const isMaxed = !nextUpgrade
  const canAfford = nextUpgrade ? totalClicks >= nextUpgrade.cost : false
  const isBuyingThis = nextUpgrade ? buyingId === nextUpgrade.id : false
  const looksDisabled = !isMaxed && (buyingId !== null || !canAfford)

  const handleBuy = async () => {
    if (!nextUpgrade) return
    setError(null)
    const result = await buy(nextUpgrade)
    if (!result.ok) setError(result.error ?? 'error')
  }

  const currentLabel = bestOwned
    ? `×${bestOwned.multiplier} (${(bestOwned.chance * 100).toFixed(0)}%)`
    : strings.noUpgradeYet

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/20 text-green-200">
          <UPGRADE_ICON size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.luckTitle}</div>
          <div className="text-xs text-neutral-500">{currentLabel}</div>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-medium text-neutral-500">
          <Clock size={11} />
          {strings.infinity}
        </span>
      </div>

      <div className="relative mb-1.5 flex gap-1">
        {catalog.map((u, i) => (
          <div
            key={u.id}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < ownedCount ? 'bg-green-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="relative mb-4 flex text-[10px] font-medium text-neutral-600">
        {catalog.map((u) => (
          <span key={u.id} className="flex-1 text-center">
            ×{u.multiplier}
          </span>
        ))}
      </div>

      {isMaxed ? (
        <div className="relative rounded-xl border border-green-400/20 bg-green-500/[0.07] py-2.5 text-center text-sm font-semibold text-green-200">
          {strings.maxLevel}
        </div>
      ) : (
        <>
          <p className="relative mb-4 text-sm text-neutral-500">
            {strings.upgrades[nextUpgrade.id]?.desc ?? ''}
          </p>

          <button
            onClick={handleBuy}
            disabled={buyingId !== null || !canAfford}
            aria-label={strings.upgradeCta}
            className={`relative w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
              looksDisabled
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
            }`}
          >
            {isBuyingThis ? (
              strings.buying
            ) : (
              <ClickPriceTag cost={nextUpgrade.cost} locale={locale} costLabel={strings.costLabel} />
            )}
          </button>
        </>
      )}

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface MoneyUpgradeLadderProps {
  strings: StoreStrings
}

// Same exact mechanic and layout as UpgradeLadder — small, sequential,
// non-cumulative tiers — but bought with real money via RevenueCat instead
// of clicks, so price comes from RevenueCat (once loaded) and there's no
// "not enough clicks" state to show.
function MoneyUpgradeLadder({ strings }: MoneyUpgradeLadderProps) {
  const { catalog, owned, bestOwned, prices, buyingId, buy } = useMoneyUpgradesContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const ownedCount = catalog.filter((u) => owned.has(u.id)).length
  const nextUpgrade: MoneyUpgradeDef | undefined = catalog[ownedCount]
  const isMaxed = !nextUpgrade
  const isBuyingThis = nextUpgrade ? buyingId === nextUpgrade.id : false
  const isBuyingAny = buyingId !== null
  const nextPrice = nextUpgrade ? prices[nextUpgrade.id] : undefined

  const handleBuy = async () => {
    if (!nextUpgrade) return
    setError(null)
    const result = await buy(nextUpgrade)
    if (!result.ok && result.error !== 'cancelled') setError(result.error ?? 'error')
  }

  const currentLabel = bestOwned ? `×${bestOwned.multiplier}` : strings.noUpgradeYet

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400/30 to-violet-500/20 text-fuchsia-200">
          <MONEY_UPGRADE_ICON size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.moneyUpgradesTitle}</div>
          <div className="text-xs text-neutral-500">{currentLabel}</div>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-medium text-neutral-500">
          <Clock size={11} />
          {strings.infinity}
        </span>
      </div>

      <div className="relative mb-1.5 flex gap-1">
        {catalog.map((u, i) => (
          <div
            key={u.id}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < ownedCount ? 'bg-fuchsia-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="relative mb-4 flex text-[10px] font-medium text-neutral-600">
        {catalog.map((u) => (
          <span key={u.id} className="flex-1 text-center">
            ×{u.multiplier}
          </span>
        ))}
      </div>

      {isMaxed ? (
        <div className="relative rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] py-2.5 text-center text-sm font-semibold text-fuchsia-200">
          {strings.maxLevel}
        </div>
      ) : (
        <>
          <p className="relative mb-4 text-sm text-neutral-500">
            {strings.moneyUpgrades[nextUpgrade.id]?.desc ?? ''}
          </p>

          <button
            onClick={handleBuy}
            disabled={isBuyingAny}
            aria-label={strings.upgradeCta}
            className={`relative w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
              isBuyingAny
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
            }`}
          >
            {isBuyingThis ? (
              strings.buying
            ) : nextPrice ? (
              <span className="text-base font-bold">{nextPrice}</span>
            ) : (
              strings.upgradeCta
            )}
          </button>
        </>
      )}

      {error && <p className="relative mt-2 text-xs text-red-400">{strings.purchaseError}</p>}
    </div>
  )
}
