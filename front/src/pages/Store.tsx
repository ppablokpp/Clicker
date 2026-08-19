import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import { Rocket, Dices, Clock, MousePointerClick, Gift, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useTimedLuckPowerupContext, type TimedLuckPowerupDef } from '../context/TimedLuckPowerupContext'
import { useUpgradesContext } from '../context/UpgradesContext'
import { useMoneyUpgradesContext, type MoneyUpgradeDef } from '../context/MoneyUpgradesContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useDailyCaseContext, type DailyCasePrize } from '../context/DailyCaseContext'
import { useMoneyCaseContext } from '../context/MoneyCaseContext'
import { UPGRADE_ICON, MONEY_UPGRADE_ICON } from '../store/config'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import { playCaseReveal, playCaseTick } from '../lib/caseSound'

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
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.lootSection}</h2>
          <CaseOpeningCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
        </section>

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
  lootSection: string
  casesSection: string
  casesSubtitle: string
  openCase: string
  openCaseMoney: string
  opening: string
  youWon: (amount: string) => string
  casePrizeNames: Record<string, string>
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

/** Same idea as ClickPriceTag but for a real-money price string from RevenueCat. */
function MoneyPriceTag({ price }: { price: string }) {
  return <span className="text-base font-bold tabular-nums">{price}</span>
}

// Cooldowns here can span up to a full day (unlike the 1h powerup cooldowns),
// so this needs an hours segment where TierTile's mm:ss didn't.
function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

interface TierTileProps {
  name: string
  durationSeconds: number
  cost: number
  locale: string
  accent: 'violet' | 'green'
  isActive: boolean
  /** Buying any tier in this category locks all 4 for an hour. */
  isOnCooldown: boolean
  isBuyingThis: boolean
  disabled: boolean
  activeCountdown: string
  cooldownCountdown: string
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
  isOnCooldown,
  isBuyingThis,
  disabled,
  activeCountdown,
  cooldownCountdown,
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
            : isOnCooldown
              ? 'bg-white/70 text-neutral-900'
              : disabled
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
        }`}
      >
        {isActive ? (
          activeCountdown
        ) : isOnCooldown ? (
          cooldownCountdown
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
  const { userId } = useAuth()
  const { catalog, active, secondsLeft, cooldownSecondsLeft, buyingId, buy } = usePowerupContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: PowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
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
          const isOnCooldown = !isActive && cooldownSecondsLeft > 0
          // Guests always show "affordable" here — the click isn't blocked
          // by balance for them, it opens the sign-in prompt instead.
          const canAfford = !userId || totalClicks >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = isActive || isOnCooldown || buyingId !== null || !canAfford
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
              isOnCooldown={isOnCooldown}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
              activeCountdown={`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              cooldownCountdown={`${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`}
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
  const { userId } = useAuth()
  const { catalog, active, secondsLeft, cooldownSecondsLeft, buyingId, buy } = useTimedLuckPowerupContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: TimedLuckPowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
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
          const isOnCooldown = !isActive && cooldownSecondsLeft > 0
          const canAfford = !userId || totalClicks >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = isActive || isOnCooldown || buyingId !== null || !canAfford
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
              isOnCooldown={isOnCooldown}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
              activeCountdown={`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              cooldownCountdown={`${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`}
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
  const { userId } = useAuth()
  const { catalog, owned, bestOwned, buyingId, buy } = useUpgradesContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const ownedCount = catalog.filter((u) => owned.has(u.id)).length
  const nextUpgrade = catalog[ownedCount]
  const isMaxed = !nextUpgrade
  const canAfford = nextUpgrade ? !userId || totalClicks >= nextUpgrade.cost : false
  const isBuyingThis = nextUpgrade ? buyingId === nextUpgrade.id : false
  const looksDisabled = !isMaxed && (buyingId !== null || !canAfford)

  const handleBuy = async () => {
    if (!nextUpgrade) return
    setError(null)
    const result = await buy(nextUpgrade)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
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
    if (!result.ok && result.error !== 'cancelled' && result.error !== 'not-signed-in') {
      setError(result.error ?? 'error')
    }
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
              <MoneyPriceTag price={nextPrice} />
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

const CASE_ITEM_WIDTH = 88
const CASE_ITEM_GAP = 8
const CASE_ITEM_SPAN = CASE_ITEM_WIDTH + CASE_ITEM_GAP
const CASE_STRIP_LENGTH = 44
const CASE_LANDING_INDEX = 40

function pickRandomFiller(catalog: DailyCasePrize[]): DailyCasePrize {
  const total = catalog.reduce((sum, p) => sum + p.weight, 0)
  let r = Math.random() * total
  for (const p of catalog) {
    if (r < p.weight) return p
    r -= p.weight
  }
  return catalog[catalog.length - 1]
}

function buildCaseStrip(won: DailyCasePrize, catalog: DailyCasePrize[]): DailyCasePrize[] {
  return Array.from({ length: CASE_STRIP_LENGTH }, (_, i) =>
    i === CASE_LANDING_INDEX ? won : pickRandomFiller(catalog),
  )
}

interface CasePrizeCardProps {
  prize: DailyCasePrize
  locale: string
}

function CasePrizeCard({ prize, locale }: CasePrizeCardProps) {
  const style = CASE_PRIZE_STYLES[prize.id] ?? DEFAULT_CASE_PRIZE_STYLE
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-lg border text-center"
      style={{
        width: CASE_ITEM_WIDTH,
        height: CASE_ITEM_WIDTH,
        borderColor: `${style.color}55`,
        backgroundColor: `${style.color}14`,
        boxShadow: `0 0 14px ${style.glow} inset, 0 0 10px ${style.glow}`,
      }}
    >
      <MousePointerClick size={16} style={{ color: style.color }} />
      <span className="mt-1 text-[11px] font-bold tabular-nums text-white">
        {prize.amount.toLocaleString(locale)}
      </span>
    </div>
  )
}

interface CaseOpeningCardProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// CS:GO-style case: the real prize is rolled server-side the moment you hit
// spin (never decided client-side) — once we know it, the strip is built
// with that prize fixed at CASE_LANDING_INDEX and the whole strip is
// translated so that slot ends up centered under the pointer.
function CaseOpeningCard({ locale, totalClicks, strings }: CaseOpeningCardProps) {
  const { catalog, cost, isAvailable, cooldownSecondsLeft, isSpinning, spin } = useDailyCaseContext()
  const { price: moneyPrice, isBuying: isBuyingMoney, buy: buyMoneyCase } = useMoneyCaseContext()
  const { syncTotalClicks } = useClickCounterContext()
  const viewportRef = useRef<HTMLDivElement>(null)
  // Holds the new balance between "purchase confirmed" and "reel finished
  // spinning" — applied only once the animation reveals the prize, so the
  // header counter doesn't jump (and spoil the result) while it's still reeling.
  const pendingTotalClicksRef = useRef<number | null>(null)
  // Tracks which item is currently under the center pointer so a tick only
  // fires once per item crossed, not once per animation frame.
  const lastTickIndexRef = useRef<number | null>(null)
  const [reel, setReel] = useState<{
    id: number
    items: DailyCasePrize[]
    targetX: number
    result: DailyCasePrize
  } | null>(null)
  const [isReeling, setIsReeling] = useState(false)
  const [revealed, setRevealed] = useState<DailyCasePrize | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [idleItems, setIdleItems] = useState<DailyCasePrize[]>([])

  // Fill the reel with real items right away instead of showing it empty —
  // opening it just starts the spin from where it already visually is.
  useEffect(() => {
    if (catalog.length > 0 && idleItems.length === 0) {
      setIdleItems(Array.from({ length: CASE_STRIP_LENGTH }, () => pickRandomFiller(catalog)))
    }
  }, [catalog, idleItems.length])

  const canAfford = totalClicks >= cost
  const isFreeBusy = isSpinning || isReeling
  // Not gated on isFreeBusy: the reel that plays after a *money* purchase
  // also flips isReeling true, and the free button's cooldown must keep
  // showing the timer through that shared animation, not fall back to the price.
  const isOnCooldown = !isAvailable
  // Only one reel can spin at a time, so buying the money case also locks
  // out the free button (and vice versa) while either purchase resolves.
  const isBusyOverall = isFreeBusy || isBuyingMoney
  const freeDisabled = isBusyOverall || !isAvailable || catalog.length === 0 || !canAfford
  const moneyDisabled = isBusyOverall || catalog.length === 0 || !moneyPrice

  const resolveWin = (prizeId: string, prizeAmount: number, newTotalClicks?: number) => {
    const won = catalog.find((p) => p.id === prizeId) ?? {
      id: prizeId,
      amount: prizeAmount,
      weight: 1,
    }
    const viewportWidth = viewportRef.current?.clientWidth ?? 320
    const items = buildCaseStrip(won, catalog)
    const jitter = (Math.random() - 0.5) * (CASE_ITEM_WIDTH * 0.5)
    const centerOfItem = CASE_LANDING_INDEX * CASE_ITEM_SPAN + CASE_ITEM_WIDTH / 2
    const targetX = centerOfItem - viewportWidth / 2 + jitter

    pendingTotalClicksRef.current = typeof newTotalClicks === 'number' ? newTotalClicks : null
    lastTickIndexRef.current = null
    setRevealed(null)
    setIsReeling(true)
    setReel((prev) => ({ id: (prev?.id ?? 0) + 1, items, targetX, result: won }))
  }

  const handleOpen = async () => {
    if (freeDisabled) return
    setError(null)
    const result = await spin()
    if (!result.ok || !result.prizeId) {
      if (result.error && result.error !== 'not-signed-in') setError(result.error)
      return
    }
    resolveWin(result.prizeId, result.prizeAmount ?? 0, result.totalClicks)
  }

  const handleBuyMoney = async () => {
    if (moneyDisabled) return
    setError(null)
    const result = await buyMoneyCase()
    if (!result.ok || !result.prizeId) {
      if (result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
        setError(strings.purchaseError)
      }
      return
    }
    resolveWin(result.prizeId, result.prizeAmount ?? 0, result.totalClicks)
  }

  const prizeStyle = revealed ? (CASE_PRIZE_STYLES[revealed.id] ?? DEFAULT_CASE_PRIZE_STYLE) : null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />

      <div className="relative mb-1 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-400/30 to-rose-500/20 text-red-200">
          <Gift size={17} />
        </div>
        <div className="text-base font-semibold text-white">{strings.casesSection}</div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.casesSubtitle}</p>

      <div
        ref={viewportRef}
        className="relative mb-4 h-[88px] overflow-hidden rounded-xl border border-white/5 bg-black/30"
      >
        {/* center pointer */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-red-300/70 shadow-[0_0_8px_rgba(252,165,165,0.8)]" />
        <div className="pointer-events-none absolute -top-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-300" />
        <div className="pointer-events-none absolute -bottom-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-300" />

        {reel ? (
          <motion.div
            key={reel.id}
            className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center"
            style={{ gap: CASE_ITEM_GAP }}
            initial={{ x: 0 }}
            animate={{ x: -reel.targetX }}
            transition={{ duration: 8, ease: [0.12, 0.72, 0.29, 1] }}
            onUpdate={(latest) => {
              const x = typeof latest.x === 'number' ? latest.x : 0
              const viewportWidth = viewportRef.current?.clientWidth ?? 320
              const pointerLocalX = viewportWidth / 2 - x
              const index = Math.floor(pointerLocalX / CASE_ITEM_SPAN)
              if (index !== lastTickIndexRef.current) {
                lastTickIndexRef.current = index
                playCaseTick()
              }
            }}
            onAnimationComplete={() => {
              setIsReeling(false)
              setRevealed(reel.result)
              const tier = catalog.findIndex((p) => p.id === reel.result.id)
              playCaseReveal(tier < 0 ? 0 : tier)
              if (pendingTotalClicksRef.current !== null) {
                syncTotalClicks(pendingTotalClicksRef.current)
                pendingTotalClicksRef.current = null
              }
            }}
          >
            {reel.items.map((item, i) => (
              <CasePrizeCard key={i} prize={item} locale={locale} />
            ))}
          </motion.div>
        ) : (
          <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center" style={{ gap: CASE_ITEM_GAP }}>
            {idleItems.map((item, i) => (
              <CasePrizeCard key={i} prize={item} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {revealed && !isReeling && prizeStyle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative mb-4 flex flex-col items-center gap-1 rounded-xl border py-4"
          style={{
            borderColor: `${prizeStyle.color}55`,
            backgroundColor: `${prizeStyle.color}14`,
            boxShadow: `0 0 24px ${prizeStyle.glow}`,
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: prizeStyle.color }}
          >
            {strings.casePrizeNames[revealed.id] ?? revealed.id}
          </span>
          <span
            className="flex items-center gap-1.5 text-2xl font-bold"
            style={{ color: prizeStyle.color, textShadow: `0 0 20px ${prizeStyle.glow}` }}
          >
            <MousePointerClick size={20} />
            {strings.youWon(revealed.amount.toLocaleString(locale))}
          </span>
        </motion.div>
      )}

      <div className="relative grid grid-cols-2 gap-2">
        <button
          onClick={handleOpen}
          disabled={freeDisabled}
          aria-label={strings.openCase}
          className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
            isOnCooldown
              ? 'bg-white/70 text-neutral-900'
              : freeDisabled
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
          }`}
        >
          {isOnCooldown ? (
            formatCountdown(cooldownSecondsLeft)
          ) : (
            <ClickPriceTag cost={cost} locale={locale} costLabel={strings.costLabel} />
          )}
        </button>

        <button
          onClick={handleBuyMoney}
          disabled={moneyDisabled}
          aria-label={strings.openCaseMoney}
          className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
            moneyDisabled
              ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'bg-white text-neutral-900 hover:opacity-90'
          }`}
        >
          {isBuyingMoney ? (
            <Loader2 size={16} className="mx-auto animate-spin" />
          ) : moneyPrice ? (
            <MoneyPriceTag price={moneyPrice} />
          ) : (
            '···'
          )}
        </button>
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
