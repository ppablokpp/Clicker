import { useState } from 'react'
import { Clock, MousePointerClick } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useUpgradesContext } from '../context/UpgradesContext'
import { useMoneyUpgradesContext, type MoneyUpgradeDef } from '../context/MoneyUpgradesContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { POWERUP_ICONS, DEFAULT_POWERUP_ICON, UPGRADE_ICON, MONEY_UPGRADE_ICON } from '../store/config'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const { catalog: powerups, active, secondsLeft, buyingId, buy } = usePowerupContext()
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
            {/* RevenueCat money purchases disabled for now — uncomment to bring them back. Logic untouched. */}
            {/* <MoneyUpgradeLadder strings={strings.store} /> */}
            <UpgradeLadder locale={locale} totalClicks={totalClicks} strings={strings.store} />
          </div>
        </section>

        <section>
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
  infinity: string
  luckTitle: string
  noUpgradeYet: string
  maxLevel: string
  upgradeCta: string
  moneyUpgradesTitle: string
  purchaseError: string
  powerups: Record<string, { name: string; desc: string }>
  upgrades: Record<string, { name: string; desc: string }>
  moneyUpgrades: Record<string, { name: string; desc: string }>
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
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <Icon size={17} />
        </div>
        <span className="text-base font-semibold text-white">{display.name}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-medium text-neutral-500">
          <Clock size={11} />
          {powerup.durationSeconds}s
        </span>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{display.desc}</p>

      <button
        onClick={handleBuy}
        disabled={isActive || isBuyingAny || !canAfford || blockedByOther}
        aria-label={strings.buy}
        className={`relative w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
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
              ? <ClickPriceTag cost={powerup.cost} locale={locale} costLabel={strings.costLabel} />
              : strings.notEnoughClicks}
      </button>

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
            ) : canAfford ? (
              <ClickPriceTag cost={nextUpgrade.cost} locale={locale} costLabel={strings.costLabel} />
            ) : (
              strings.notEnoughClicks
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
// Exported (even though currently unused) so TS doesn't flag it as dead code
// while the RevenueCat section above is commented out.
export function MoneyUpgradeLadder({ strings }: MoneyUpgradeLadderProps) {
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
