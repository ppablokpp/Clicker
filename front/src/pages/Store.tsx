import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import { Rocket, Dices, Magnet, Clock, Gift, Loader2, List, X, Gem, Key } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { PlatinumIcon } from '../components/PlatinumIcon'

// Loose enough to accept both a Lucide icon (Gem, Key…) and our own
// PlatinumIcon — every consumer here only ever passes size/className.
type PackIcon = React.ComponentType<{ size?: number; className?: string }>
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useTimedLuckPowerupContext, type TimedLuckPowerupDef } from '../context/TimedLuckPowerupContext'
import { useMagnetContext, type MagnetDef } from '../context/MagnetContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useDailyCaseContext, type DailyCasePrize } from '../context/DailyCaseContext'
import { useGemCaseContext } from '../context/GemCaseContext'
import { useGemChestContext } from '../context/GemChestContext'
import { useGemsContext } from '../context/GemsContext'
import { useKeysContext } from '../context/KeysContext'
import { useDailyKeyContext } from '../context/DailyKeyContext'
import { useClickPacksContext, type ClickPackDef } from '../context/ClickPacksContext'
import { useKeyPacksContext, type KeyPackDef } from '../context/KeyPacksContext'
import { useGemPacksContext, type GemPackDef } from '../context/GemPacksContext'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import { playCaseReveal, playCaseTick, playChestPurchase } from '../lib/caseSound'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const { gems } = useGemsContext()
  const { keys } = useKeysContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [showClickPacks, setShowClickPacks] = useState(false)
  const [showKeyPacks, setShowKeyPacks] = useState(false)
  const [showGemPacks, setShowGemPacks] = useState(false)

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
              {strings.store.title}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowClickPacks(true)}
                aria-label={strings.store.buyClicksTitle}
                className="flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-xs font-semibold tabular-nums text-neutral-300 transition-colors hover:bg-white/[0.06]"
              >
                <PlatinumIcon size={15} className="opacity-70" />
                {totalClicks.toLocaleString(locale)}
              </button>
              <button
                onClick={() => setShowKeyPacks(true)}
                aria-label={strings.store.buyKeysTitle}
                className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-semibold tabular-nums text-amber-200 transition-colors hover:bg-amber-500/[0.14]"
              >
                <Key size={12} className="opacity-80" />
                {keys.toLocaleString(locale)}
              </button>
              <button
                onClick={() => setShowGemPacks(true)}
                aria-label={strings.store.buyGemsTitle}
                className="flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3 py-1 text-xs font-semibold tabular-nums text-indigo-200 transition-colors hover:bg-indigo-500/[0.14]"
              >
                <Gem size={12} className="opacity-80" />
                {gems.toLocaleString(locale)}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.lootSection}</h2>
          <CaseOpeningCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.powerupsSection}</h2>
          <div className="flex flex-col gap-4">
            <PowerupGridCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
            <TimedLuckGridCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
            <MagnetGridCard locale={locale} totalClicks={totalClicks} strings={strings.store} />
          </div>
        </section>
      </div>

      {showClickPacks && <ClickPacksModal locale={locale} strings={strings.store} onClose={() => setShowClickPacks(false)} />}
      {showKeyPacks && <KeyPacksModal locale={locale} strings={strings.store} onClose={() => setShowKeyPacks(false)} />}
      {showGemPacks && <GemPacksModal locale={locale} strings={strings.store} onClose={() => setShowGemPacks(false)} />}
    </div>
  )
}

interface StoreStrings {
  costLabel: string
  buy: string
  buying: string
  availableIn: (time: string) => string
  active: string
  owned: string
  notEnoughClicks: string
  lootSection: string
  casesSection: string
  casesSubtitle: string
  openCase: string
  openCaseMoney: string
  openCaseGems: string
  notEnoughGems: string
  notEnoughKeys: string
  notEnoughChests: string
  notEnoughClicksForChest: string
  buyChest: string
  chestLimitReached: string
  claimDailyKey: string
  keyClaimedToday: string
  claimingKey: string
  buyClicksTitle: string
  buyKeysTitle: string
  buyGemsTitle: string
  savingsBadge: (pct: number) => string
  opening: string
  youWon: (amount: string) => string
  youWonGems: (amount: string) => string
  casePrizeNames: Record<string, string>
  caseCatalogButton: string
  caseCatalogTitle: string
  caseMythicLabel: string
  caseTitleClicks: string
  caseTitleGems: string
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
  magnetsTitle: string
  magnetsSubtitle: string
  powerups: Record<string, { name: string; desc: string }>
  upgrades: Record<string, { name: string; desc: string }>
  moneyUpgrades: Record<string, { name: string; desc: string }>
  timedLuckPowerups: Record<string, { name: string; desc: string }>
  magnets: Record<string, { name: string }>
}

/** Same idea as a click-price tag but priced in gems instead of clicks. */
function GemPriceTag({ cost }: { cost: number }) {
  return (
    <span className="flex items-center justify-center gap-1.5">
      <Gem size={14} className="opacity-80" />
      <span className="text-base font-bold tabular-nums">{cost}</span>
    </span>
  )
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

// Same "price per unit, relative to the first tier" math for all three pack
// modals — clicks (priced in gems) and keys/gems (priced in real money via
// RevenueCat) all reduce to "how much does one unit cost here vs. tier 1".
function computeSavingsPct(baseUnitPrice: number, unitPrice: number): number {
  if (baseUnitPrice <= 0 || unitPrice <= 0) return 0
  return Math.round((1 - unitPrice / baseUnitPrice) * 100)
}

type PackTheme = 'neutral' | 'amber' | 'indigo'

const PACK_THEME: Record<PackTheme, { iconWrap: string }> = {
  neutral: { iconWrap: 'bg-gradient-to-br from-white/25 to-white/10 text-white' },
  amber: { iconWrap: 'bg-gradient-to-br from-amber-400/30 to-yellow-500/20 text-amber-200' },
  indigo: { iconWrap: 'bg-gradient-to-br from-indigo-400/30 to-violet-500/20 text-indigo-200' },
}

// Same soft glass look by default — bordered, translucent, blurred, not the
// solid opaque white used elsewhere (e.g. the free-case button). Clicks
// override this to indigo since they're paid for with gems, same as the
// gem-case button in the Cofres card.
const PACK_BUTTON_CLASSES = 'border border-white/15 bg-white/[0.06] text-white backdrop-blur-sm hover:bg-white/[0.1]'
const PACK_BUTTON_CLASSES_INDIGO =
  'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15'

interface PackTileData {
  id: string
  amount: number
  priceContent: React.ReactNode
  isBuying: boolean
  disabled: boolean
  savingsBadge: string | null
  onClick: () => void
}

function PackTile({
  tile,
  icon: Icon,
  locale,
  inline = false,
  accentColorClass = 'text-neutral-300',
  buttonClassName = PACK_BUTTON_CLASSES,
}: {
  tile: PackTileData
  icon: PackIcon
  locale: string
  /** Icon + amount side by side instead of stacked — reads better for small numbers like key/gem counts. */
  inline?: boolean
  accentColorClass?: string
  buttonClassName?: string
}) {
  return (
    <div className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 pt-4 text-center">
      {tile.savingsBadge && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-md shadow-black/30">
          {tile.savingsBadge}
        </span>
      )}
      {inline ? (
        <span className={`flex items-center gap-1.5 ${accentColorClass}`}>
          <Icon size={18} />
          <span className="text-lg font-bold tabular-nums">x{tile.amount.toLocaleString(locale)}</span>
        </span>
      ) : (
        <>
          <Icon size={20} className="text-neutral-300" />
          <span className="text-base font-bold tabular-nums text-white">{tile.amount.toLocaleString(locale)}</span>
        </>
      )}
      <button
        onClick={tile.onClick}
        disabled={tile.disabled}
        className={`mt-0.5 w-full rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
          tile.disabled
            ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
            : buttonClassName
        }`}
      >
        {tile.isBuying ? <Loader2 size={12} className="mx-auto animate-spin" /> : tile.priceContent}
      </button>
    </div>
  )
}

interface PackModalShellProps {
  title: string
  icon: PackIcon
  theme: PackTheme
  onClose: () => void
  error?: string | null
  children: React.ReactNode
}

function PackModalShell({ title, icon: Icon, theme, onClose, error, children }: PackModalShellProps) {
  const classes = PACK_THEME[theme]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${classes.iconWrap}`}>
            <Icon size={17} />
          </div>
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-6">{children}</div>

        {error && <p className="relative mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

interface ClickPacksModalProps {
  locale: string
  strings: StoreStrings
  onClose: () => void
}

function ClickPacksModal({ locale, strings, onClose }: ClickPacksModalProps) {
  const { catalog, buyingId, buy } = useClickPacksContext()
  const { gems } = useGemsContext()
  const [error, setError] = useState<string | null>(null)

  const baseUnitPrice = catalog[0] ? catalog[0].gemCost / catalog[0].clicks : 0

  const handleBuy = async (pack: ClickPackDef) => {
    setError(null)
    const result = await buy(pack)
    if (!result.ok && result.error && result.error !== 'not-signed-in') {
      setError(result.error === 'not-enough-gems' ? strings.notEnoughGems : strings.purchaseError)
      return
    }
    if (result.ok) playChestPurchase()
  }

  return (
    <PackModalShell title={strings.buyClicksTitle} icon={PlatinumIcon} theme="neutral" onClose={onClose} error={error}>
      {catalog.map((pack, i) => {
        const unitPrice = pack.gemCost / pack.clicks
        const savingsPct = i >= 2 ? computeSavingsPct(baseUnitPrice, unitPrice) : 0
        return (
          <PackTile
            key={pack.id}
            icon={PlatinumIcon}
            locale={locale}
            buttonClassName={PACK_BUTTON_CLASSES_INDIGO}
            tile={{
              id: pack.id,
              amount: pack.clicks,
              priceContent: (
                <span className="flex items-center justify-center gap-1">
                  <Gem size={11} className="opacity-70" />
                  {pack.gemCost}
                </span>
              ),
              isBuying: buyingId === pack.id,
              disabled: buyingId !== null || gems < pack.gemCost,
              savingsBadge: i >= 2 && savingsPct > 0 ? strings.savingsBadge(savingsPct) : null,
              onClick: () => handleBuy(pack),
            }}
          />
        )
      })}
    </PackModalShell>
  )
}

interface KeyPacksModalProps {
  locale: string
  strings: StoreStrings
  onClose: () => void
}

function KeyPacksModal({ locale, strings, onClose }: KeyPacksModalProps) {
  const { catalog, prices, buyingId, buy } = useKeyPacksContext()
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async (pack: KeyPackDef) => {
    setError(null)
    const result = await buy(pack)
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
      setError(strings.purchaseError)
    }
  }

  return (
    <PackModalShell title={strings.buyKeysTitle} icon={Key} theme="amber" onClose={onClose} error={error}>
      {catalog.map((pack) => {
        const priceLabel = prices[pack.id]
        return (
          <PackTile
            key={pack.id}
            icon={Key}
            locale={locale}
            inline
            accentColorClass="text-amber-300"
            tile={{
              id: pack.id,
              amount: pack.amount,
              priceContent: priceLabel ?? '···',
              isBuying: buyingId === pack.id,
              disabled: buyingId !== null || !priceLabel,
              savingsBadge: pack.id === 'x50_keys' ? strings.savingsBadge(10) : null,
              onClick: () => handleBuy(pack),
            }}
          />
        )
      })}
    </PackModalShell>
  )
}

interface GemPacksModalProps {
  locale: string
  strings: StoreStrings
  onClose: () => void
}

function GemPacksModal({ locale, strings, onClose }: GemPacksModalProps) {
  const { catalog, prices, buyingId, buy } = useGemPacksContext()
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async (pack: GemPackDef) => {
    setError(null)
    const result = await buy(pack)
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
      setError(strings.purchaseError)
    }
  }

  return (
    <PackModalShell title={strings.buyGemsTitle} icon={Gem} theme="indigo" onClose={onClose} error={error}>
      {catalog.map((pack) => {
        const priceLabel = prices[pack.id]
        return (
          <PackTile
            key={pack.id}
            icon={Gem}
            locale={locale}
            inline
            accentColorClass="text-indigo-300"
            tile={{
              id: pack.id,
              amount: pack.amount,
              priceContent: priceLabel ?? '···',
              isBuying: buyingId === pack.id,
              disabled: buyingId !== null || !priceLabel,
              savingsBadge: pack.id === 'x50_gems' ? strings.savingsBadge(20) : null,
              onClick: () => handleBuy(pack),
            }}
          />
        )
      })}
    </PackModalShell>
  )
}

interface TierTileProps {
  name: string
  durationSeconds: number
  cost: number
  currency: 'clicks' | 'gems'
  locale: string
  isBuyingThis: boolean
  disabled: boolean
  buyingLabel: string
  onClick: () => void
}

// One tile = one freely-buyable tier: name, duration, and a price button —
// compact enough for all 4 to sit in a row like the original cards did. A
// gem-priced tier gets the same indigo "diamond" button used everywhere
// else gems are spent, instead of the white click-currency one. The
// active/cooldown countdown itself lives once in the card's header, not
// repeated per tile — the button just goes disabled (same muted style as
// "can't afford it") and keeps showing its cost.
function TierTile({
  name,
  durationSeconds,
  cost,
  currency,
  locale,
  isBuyingThis,
  disabled,
  buyingLabel,
  onClick,
}: TierTileProps) {
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
          disabled
            ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
            : currency === 'gems'
              ? 'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15'
              : 'bg-white text-neutral-900 hover:opacity-90'
        }`}
      >
        {isBuyingThis ? (
          buyingLabel
        ) : (
          <span className="flex items-center justify-center gap-1">
            {currency === 'gems' ? (
              <Gem size={10} className="opacity-80" />
            ) : (
              <PlatinumIcon size={13} className="opacity-70" />
            )}
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
  const { gems } = useGemsContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: PowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
  }

  const activeCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const cooldownCountdown = `${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <Rocket size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.powerupsCardTitle}</div>
          {active ? (
            <div className="text-xs text-neutral-500">
              {strings.powerups[active.id]?.name ?? active.id} · {activeCountdown}
            </div>
          ) : (
            cooldownSecondsLeft > 0 && (
              <div className="text-xs text-neutral-500">{strings.availableIn(cooldownCountdown)}</div>
            )
          )}
        </div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.powerupsSubtitle}</p>

      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
        {catalog.map((powerup) => {
          // Guests always show "affordable" here — the click isn't blocked
          // by balance for them, it opens the sign-in prompt instead.
          // Buying is independent of whether a tier is currently active — it
          // only adds to the owned count, so only the shared cooldown and
          // affordability gate it.
          const balance = powerup.currency === 'gems' ? gems : totalClicks
          const canAfford = !userId || balance >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = cooldownSecondsLeft > 0 || buyingId !== null || !canAfford
          const name = strings.powerups[powerup.id]?.name ?? powerup.id

          return (
            <TierTile
              key={powerup.id}
              name={name}
              durationSeconds={powerup.durationSeconds}
              cost={powerup.cost}
              currency={powerup.currency}
              locale={locale}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
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
  const { gems } = useGemsContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (powerup: TimedLuckPowerupDef) => {
    setError(null)
    const result = await buy(powerup)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
  }

  const activeCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const cooldownCountdown = `${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/20 text-green-200">
          <Dices size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.timedLuckTitle}</div>
          {active ? (
            <div className="text-xs text-neutral-500">
              {strings.timedLuckPowerups[active.id]?.name ?? active.id} · {activeCountdown}
            </div>
          ) : (
            cooldownSecondsLeft > 0 && (
              <div className="text-xs text-neutral-500">{strings.availableIn(cooldownCountdown)}</div>
            )
          )}
        </div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.timedLuckSubtitle}</p>

      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
        {catalog.map((powerup) => {
          // Buying is independent of whether a tier is currently active — it
          // only adds to the owned count, so only the shared cooldown and
          // affordability gate it.
          const balance = powerup.currency === 'gems' ? gems : totalClicks
          const canAfford = !userId || balance >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = cooldownSecondsLeft > 0 || buyingId !== null || !canAfford
          const name = strings.timedLuckPowerups[powerup.id]?.name ?? powerup.id

          return (
            <TierTile
              key={powerup.id}
              name={name}
              durationSeconds={powerup.durationSeconds}
              cost={powerup.cost}
              currency={powerup.currency}
              locale={locale}
              isBuyingThis={isBuyingThis}
              disabled={disabled}
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

interface MagnetGridCardProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// Only two items (not a 4-tier ladder), so its own compact 2-column layout
// instead of reusing TierTile's grid — each tile keeps the currency it
// grants visually distinct (amber for keys, indigo for gems, same language
// as the Cofres card) since the icon alone is otherwise identical.
function MagnetGridCard({ locale, totalClicks, strings }: MagnetGridCardProps) {
  const { userId } = useAuth()
  const { catalog, active, secondsLeft, cooldownSecondsLeft, buyingId, buy } = useMagnetContext()
  const [error, setError] = useState<string | null>(null)

  if (catalog.length === 0) return null

  const handleBuy = async (magnet: MagnetDef) => {
    setError(null)
    const result = await buy(magnet)
    if (!result.ok && result.error !== 'not-signed-in') setError(result.error ?? 'error')
  }

  const activeCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const cooldownCountdown = `${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-indigo-500/20 text-amber-200">
          <Magnet size={17} />
        </div>
        <div>
          <div className="text-base font-semibold text-white">{strings.magnetsTitle}</div>
          {active ? (
            <div className="text-xs text-neutral-500">
              {strings.magnets[active.id]?.name ?? active.id} · {activeCountdown}
            </div>
          ) : (
            cooldownSecondsLeft > 0 && (
              <div className="text-xs text-neutral-500">{strings.availableIn(cooldownCountdown)}</div>
            )
          )}
        </div>
      </div>

      <p className="relative mb-4 text-sm text-neutral-500">{strings.magnetsSubtitle}</p>

      <div className="relative grid grid-cols-2 gap-3">
        {catalog.map((magnet) => {
          // Buying is independent of whether a magnet is currently active —
          // it only adds to the owned count, so only the shared cooldown
          // and affordability gate it.
          const canAfford = !userId || totalClicks >= magnet.cost
          const isBuyingThis = buyingId === magnet.id
          const disabled = cooldownSecondsLeft > 0 || buyingId !== null || !canAfford
          const name = strings.magnets[magnet.id]?.name ?? magnet.id
          const accentColor = magnet.currency === 'keys' ? 'text-amber-300' : 'text-indigo-300'

          return (
            <div
              key={magnet.id}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
            >
              <Magnet size={20} className={accentColor} />
              <span className="text-xs font-semibold text-white">{name}</span>
              <span className="mb-1 flex items-center gap-1 text-[10px] font-medium text-neutral-500">
                <Clock size={9} />
                {magnet.durationSeconds}s
              </span>
              <button
                onClick={() => handleBuy(magnet)}
                disabled={disabled}
                aria-label={name}
                className={`w-full rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                  disabled
                    ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                    : 'bg-white text-neutral-900 hover:opacity-90'
                }`}
              >
                {isBuyingThis ? (
                  strings.buying
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <PlatinumIcon size={13} className="opacity-70" />
                    <span className="tabular-nums">{magnet.cost.toLocaleString(locale)}</span>
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// Mirrors MAX_OWNED_CHESTS on the backend — presentation-only, the server
// is what actually enforces it.
const CHEST_LIMIT = 10

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
  const glowSize = style.glowSize ?? 1
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-lg border text-center"
      style={{
        width: CASE_ITEM_WIDTH,
        height: CASE_ITEM_WIDTH,
        borderColor: `${style.color}55`,
        backgroundColor: `${style.color}14`,
        boxShadow: `0 0 ${14 * glowSize}px ${style.glow} inset, 0 0 ${10 * glowSize}px ${style.glow}`,
      }}
    >
      {prize.currency === 'gems' ? (
        <Gem size={16} style={{ color: style.color }} />
      ) : (
        <PlatinumIcon size={19} style={{ color: style.color }} />
      )}
      <span className="mt-1 text-[11px] font-bold tabular-nums text-white">
        {prize.amount.toLocaleString(locale)}
      </span>
    </div>
  )
}

// Both cases (and the store buttons that open them) resolve to this same
// shape, whichever context they came from — lets MiniCaseReel stay generic.
interface CaseOpenOutcome {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  prizeCurrency?: 'clicks' | 'gems'
  totalClicks?: number
  gems?: number
  keys?: number
}

interface MiniCaseReelButtonConfig {
  content: React.ReactNode
  ariaLabel: string
  affordable: boolean
  className: string
  onOpen: () => Promise<CaseOpenOutcome>
}

interface MiniCaseReelProps {
  catalog: DailyCasePrize[]
  locale: string
  strings: StoreStrings
  accent: 'red' | 'indigo'
  primary: MiniCaseReelButtonConfig
  secondary: MiniCaseReelButtonConfig
  syncTotalClicks: (n: number) => void
  syncGems: (n: number) => void
  syncKeys: (n: number) => void
  suspendTotalClicksSync: () => void
  resumeTotalClicksSync: () => void
}

const REEL_ACCENT_CLASSES: Record<'red' | 'indigo', { line: string; dot: string }> = {
  red: { line: 'bg-red-300/70 shadow-[0_0_8px_rgba(252,165,165,0.8)]', dot: 'bg-red-300' },
  indigo: { line: 'bg-indigo-300/70 shadow-[0_0_8px_rgba(165,180,252,0.8)]', dot: 'bg-indigo-300' },
}

// The CS:GO-style reel itself: the real prize is rolled server-side the
// moment either button is hit (never decided client-side) — once we know
// it, the strip is built with that prize fixed at CASE_LANDING_INDEX and
// the whole strip is translated so that slot ends up centered under the
// pointer. Shared by both cases in the Cofres card — only the catalog and
// the two buttons' data/handlers differ between them.
function MiniCaseReel({
  catalog,
  locale,
  strings,
  accent,
  primary,
  secondary,
  syncTotalClicks,
  syncGems,
  syncKeys,
  suspendTotalClicksSync,
  resumeTotalClicksSync,
}: MiniCaseReelProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const pendingGemsRef = useRef<number | null>(null)
  const pendingKeysRef = useRef<number | null>(null)
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
  // Which button's request is currently in flight — drives the spinner and,
  // together with isReeling, keeps both buttons locked through the whole
  // open (API call + the 8s reel animation), not just the network round trip.
  const [openingSide, setOpeningSide] = useState<'primary' | 'secondary' | null>(null)
  const idleDragX = useMotionValue(0)
  const idleLoopWidth = idleItems.length * CASE_ITEM_SPAN
  const accentClasses = REEL_ACCENT_CLASSES[accent]

  useEffect(() => {
    if (catalog.length > 0 && idleItems.length === 0) {
      const items = Array.from({ length: CASE_STRIP_LENGTH }, () => pickRandomFiller(catalog))
      const gemPrizes = catalog.filter((p) => p.currency === 'gems')
      if (gemPrizes.length > 0 && !items.some((p) => p.currency === 'gems')) {
        const slot = Math.floor(Math.random() * items.length)
        items[slot] = gemPrizes[Math.floor(Math.random() * gemPrizes.length)]
      }
      setIdleItems(items)
    }
  }, [catalog, idleItems.length])

  useEffect(() => {
    if (idleLoopWidth > 0) idleDragX.set(-idleLoopWidth)
  }, [idleLoopWidth, idleDragX])

  useMotionValueEvent(idleDragX, 'change', (latest) => {
    if (idleLoopWidth <= 0) return
    if (latest > 0) {
      idleDragX.set(latest - idleLoopWidth)
    } else if (latest < -idleLoopWidth * 2) {
      idleDragX.set(latest + idleLoopWidth)
    }
  })

  const isBusyOverall = isReeling || openingSide !== null
  const primaryDisabled = isBusyOverall || catalog.length === 0 || !primary.affordable
  const secondaryDisabled = isBusyOverall || catalog.length === 0 || !secondary.affordable

  const resolveWin = (
    prizeId: string,
    prizeAmount: number,
    prizeCurrency?: 'clicks' | 'gems',
    newTotalClicks?: number,
    newGems?: number,
    newKeys?: number,
  ) => {
    const won = catalog.find((p) => p.id === prizeId) ?? {
      id: prizeId,
      amount: prizeAmount,
      weight: 1,
      currency: prizeCurrency,
    }
    const viewportWidth = viewportRef.current?.clientWidth ?? 320
    const items = buildCaseStrip(won, catalog)
    const jitter = (Math.random() - 0.5) * (CASE_ITEM_WIDTH * 0.5)
    const centerOfItem = CASE_LANDING_INDEX * CASE_ITEM_SPAN + CASE_ITEM_WIDTH / 2
    const targetX = centerOfItem - viewportWidth / 2 + jitter

    // The real total already includes this prize the instant the server
    // committed it — sync it now, but held behind suspendTotalClicksSync so
    // it can't reach the display (and spoil the reel) before the animation
    // lands. Any unrelated sync that fires during the spin (auto-click's
    // own poll, most notably) gets caught by the same gate instead of
    // slipping the real number in early.
    suspendTotalClicksSync()
    if (typeof newTotalClicks === 'number') syncTotalClicks(newTotalClicks)
    pendingGemsRef.current = typeof newGems === 'number' ? newGems : null
    pendingKeysRef.current = typeof newKeys === 'number' ? newKeys : null
    lastTickIndexRef.current = null
    setRevealed(null)
    setIsReeling(true)
    setReel((prev) => ({ id: (prev?.id ?? 0) + 1, items, targetX, result: won }))
  }

  const handleOpen = async (side: 'primary' | 'secondary') => {
    const disabled = side === 'primary' ? primaryDisabled : secondaryDisabled
    if (disabled) return
    setError(null)
    setOpeningSide(side)
    try {
      const result = await (side === 'primary' ? primary : secondary).onOpen()
      if (!result.ok || !result.prizeId) {
        if (result.error) setError(result.error)
        return
      }
      resolveWin(
        result.prizeId,
        result.prizeAmount ?? 0,
        result.prizeCurrency,
        result.totalClicks,
        result.gems,
        result.keys,
      )
    } finally {
      setOpeningSide(null)
    }
  }

  const prizeStyle = revealed ? (CASE_PRIZE_STYLES[revealed.id] ?? DEFAULT_CASE_PRIZE_STYLE) : null

  return (
    <div>
      <div
        ref={viewportRef}
        className="relative mb-3 h-[88px] overflow-hidden rounded-xl border border-white/5 bg-black/30"
      >
        {/* center pointer */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 ${accentClasses.line}`}
        />
        <div
          className={`pointer-events-none absolute -top-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 ${accentClasses.dot}`}
        />
        <div
          className={`pointer-events-none absolute -bottom-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 ${accentClasses.dot}`}
        />

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
              resumeTotalClicksSync()
              if (pendingGemsRef.current !== null) {
                syncGems(pendingGemsRef.current)
                pendingGemsRef.current = null
              }
              if (pendingKeysRef.current !== null) {
                syncKeys(pendingKeysRef.current)
                pendingKeysRef.current = null
              }
            }}
          >
            {reel.items.map((item, i) => (
              <CasePrizeCard key={i} prize={item} locale={locale} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            drag="x"
            dragElastic={0}
            dragMomentum
            style={{ x: idleDragX, gap: CASE_ITEM_GAP }}
            className="absolute left-0 top-1/2 flex -translate-y-1/2 cursor-grab items-center active:cursor-grabbing"
          >
            {[...idleItems, ...idleItems, ...idleItems].map((item, i) => (
              <CasePrizeCard key={i} prize={item} locale={locale} />
            ))}
          </motion.div>
        )}
      </div>

      {revealed && !isReeling && prizeStyle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="relative mb-3 flex flex-col items-center gap-1 rounded-xl border py-3"
          style={{
            borderColor: `${prizeStyle.color}55`,
            backgroundColor: `${prizeStyle.color}14`,
            boxShadow: `0 0 24px ${prizeStyle.glow}`,
          }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: prizeStyle.color }}
          >
            {strings.casePrizeNames[revealed.id] ?? revealed.id}
          </span>
          <span
            className="flex items-center gap-1.5 text-lg font-bold"
            style={{ color: prizeStyle.color, textShadow: `0 0 20px ${prizeStyle.glow}` }}
          >
            {revealed.currency === 'gems' ? <Gem size={16} /> : <PlatinumIcon size={19} />}
            {revealed.currency === 'gems'
              ? strings.youWonGems(revealed.amount.toLocaleString(locale))
              : strings.youWon(revealed.amount.toLocaleString(locale))}
          </span>
        </motion.div>
      )}

      <div className="relative grid grid-cols-2 gap-2">
        <button
          onClick={() => handleOpen('primary')}
          disabled={primaryDisabled}
          aria-label={primary.ariaLabel}
          className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
            primaryDisabled ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60' : primary.className
          }`}
        >
          {openingSide === 'primary' ? <Loader2 size={16} className="mx-auto animate-spin" /> : primary.content}
        </button>
        <button
          onClick={() => handleOpen('secondary')}
          disabled={secondaryDisabled}
          aria-label={secondary.ariaLabel}
          className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
            secondaryDisabled
              ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : secondary.className
          }`}
        >
          {openingSide === 'secondary' ? <Loader2 size={16} className="mx-auto animate-spin" /> : secondary.content}
        </button>
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface CaseCatalogModalProps {
  catalog: DailyCasePrize[]
  locale: string
  strings: StoreStrings
  onClose: () => void
  // 'grouped' (case 1): click prizes listed individually, all gem prizes
  // collapsed into one combined "Mythic" row. 'percent' (case 2, an
  // all-gems catalog): each prize listed individually with its actual
  // roll odds, e.g. "x1 gema 75%".
  variant?: 'grouped' | 'percent'
}

function CaseCatalogModal({ catalog, locale, strings, onClose, variant = 'grouped' }: CaseCatalogModalProps) {
  const totalWeight = catalog.reduce((sum, p) => sum + p.weight, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        <p className="mb-4 text-sm font-semibold text-white">{strings.caseCatalogTitle}</p>

        <div className="flex flex-col gap-2">
          {variant === 'percent'
            ? catalog.map((prize) => {
                const style = CASE_PRIZE_STYLES[prize.id] ?? DEFAULT_CASE_PRIZE_STYLE
                const pct = totalWeight > 0 ? Math.round((prize.weight / totalWeight) * 100) : 0
                return (
                  <div
                    key={prize.id}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: `${style.color}30`, backgroundColor: `${style.color}0d` }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.glow}` }}
                    />
                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: style.color }}>
                      <Gem size={12} className="opacity-70" />
                      x{prize.amount}
                    </span>
                    <span className="ml-auto text-sm font-bold tabular-nums text-white">{pct}%</span>
                  </div>
                )
              })
            : catalog
                .filter((prize) => prize.currency !== 'gems')
                .map((prize) => {
                  const style = CASE_PRIZE_STYLES[prize.id] ?? DEFAULT_CASE_PRIZE_STYLE
                  return (
                    <div
                      key={prize.id}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{ borderColor: `${style.color}30`, backgroundColor: `${style.color}0d` }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.glow}` }}
                      />
                      <span className="text-sm font-medium" style={{ color: style.color }}>
                        {strings.casePrizeNames[prize.id] ?? prize.id}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-sm font-bold tabular-nums text-white">
                        <PlatinumIcon size={15} className="opacity-70" />
                        {prize.amount.toLocaleString(locale)}
                      </span>
                    </div>
                  )
                })}

          {/* All gem prizes shown as one combined "Mythic" entry instead of separate near-identical rows. */}
          {variant === 'grouped' &&
            (() => {
              const gemPrizes = catalog.filter((prize) => prize.currency === 'gems')
              if (gemPrizes.length === 0) return null
              const style = CASE_PRIZE_STYLES[gemPrizes[0].id] ?? DEFAULT_CASE_PRIZE_STYLE
              return (
                <div
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: `${style.color}30`, backgroundColor: `${style.color}0d` }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.glow}` }}
                  />
                  <span className="text-sm font-medium" style={{ color: style.color }}>
                    {strings.caseMythicLabel}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-sm font-bold tabular-nums text-white">
                    <Gem size={12} className="opacity-70" />
                    {gemPrizes.map((p) => p.amount).join(' / ')}
                  </span>
                </div>
              )
            })()}
        </div>
      </div>
    </div>
  )
}

interface CaseOpeningCardProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
}

// Two cases live in this one card: the original (clicks or gems) and a
// second one (keys or gems, pays out gems) — same reel mechanic, laid out
// side by side.
function CaseOpeningCard({ locale, totalClicks, strings }: CaseOpeningCardProps) {
  const {
    catalog: catalog1,
    chestCost: chestCost1,
    keyCost,
    ownedChests: ownedChests1,
    spin,
    buyChest: buyClickChest,
  } = useDailyCaseContext()
  const {
    catalog: catalog2,
    chestCost: chestCost2,
    keyCost: chestKeyCost,
    gemCost: chestGemCost,
    ownedChests: ownedChests2,
    openWithKeys,
    openWithGems,
    buyChest: buyGemChest,
  } = useGemChestContext()
  const { cost: gemCost, open: openGemCase } = useGemCaseContext()
  const { syncTotalClicks, suspendSync, resumeSync } = useClickCounterContext()
  const { gems, syncGems } = useGemsContext()
  const { keys, syncKeys } = useKeysContext()
  const {
    claimedToday,
    cooldownSecondsLeft: keyCooldownSecondsLeft,
    isClaiming,
    claim: claimDailyKey,
  } = useDailyKeyContext()
  const [error, setError] = useState<string | null>(null)
  const [showCatalog1, setShowCatalog1] = useState(false)
  const [showCatalog2, setShowCatalog2] = useState(false)
  const [buyingChest, setBuyingChest] = useState<'click' | 'gem' | null>(null)

  const handleClaimKey = async () => {
    if (claimedToday || isClaiming) return
    setError(null)
    const result = await claimDailyKey()
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'already-claimed') {
      setError(strings.purchaseError)
    }
  }

  const handleBuyChest = async (type: 'click' | 'gem') => {
    if (buyingChest) return
    setError(null)
    setBuyingChest(type)
    try {
      const result = type === 'click' ? await buyClickChest() : await buyGemChest()
      if (!result.ok) {
        if (result.error === 'not-enough-clicks') setError(strings.notEnoughClicksForChest)
        else if (result.error === 'chest-limit-reached') setError(strings.chestLimitReached)
        else if (result.error && result.error !== 'not-signed-in') setError(strings.purchaseError)
        return
      }
      playChestPurchase()
      if (typeof result.totalClicks === 'number') syncTotalClicks(result.totalClicks)
    } finally {
      setBuyingChest(null)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />

      <div className="relative mb-1 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400/30 to-rose-500/20 text-red-200">
          <Gift size={17} />
        </div>
        <div className="text-base font-semibold text-white">{strings.casesSection}</div>
        <button
          onClick={handleClaimKey}
          disabled={claimedToday || isClaiming}
          aria-label={strings.claimDailyKey}
          className={`ml-auto flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
            claimedToday
              ? 'border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
          }`}
        >
          <Key size={13} className="opacity-80" />
          {isClaiming
            ? strings.claimingKey
            : claimedToday
              ? formatCountdown(keyCooldownSecondsLeft)
              : strings.claimDailyKey}
        </button>
      </div>

      <p className="relative mb-6 mt-4 text-sm text-neutral-500">{strings.casesSubtitle}</p>

      <div className="relative mb-12 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <Gift size={18} className="text-neutral-400" />
          <span className="text-[11px] font-semibold text-neutral-300">{strings.caseTitleClicks}</span>
          <button
            onClick={() => handleBuyChest('click')}
            disabled={buyingChest !== null || totalClicks < chestCost1 || ownedChests1 >= CHEST_LIMIT}
            aria-label={`${strings.buyChest} — ${strings.caseTitleClicks}`}
            className={`flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              totalClicks < chestCost1 || ownedChests1 >= CHEST_LIMIT
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
            }`}
          >
            {buyingChest === 'click' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <PlatinumIcon size={15} className="opacity-70" />
                <span className="tabular-nums">{chestCost1.toLocaleString(locale)}</span>
              </>
            )}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <Gift size={18} className="text-indigo-300" />
          <span className="text-[11px] font-semibold text-neutral-300">{strings.caseTitleGems}</span>
          <button
            onClick={() => handleBuyChest('gem')}
            disabled={buyingChest !== null || totalClicks < chestCost2 || ownedChests2 >= CHEST_LIMIT}
            aria-label={`${strings.buyChest} — ${strings.caseTitleGems}`}
            className={`flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              totalClicks < chestCost2 || ownedChests2 >= CHEST_LIMIT
                ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                : 'bg-white text-neutral-900 hover:opacity-90'
            }`}
          >
            {buyingChest === 'gem' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <PlatinumIcon size={15} className="opacity-70" />
                <span className="tabular-nums">{chestCost2.toLocaleString(locale)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">
            {strings.caseTitleClicks}{' '}
            <span className="ml-1 tabular-nums text-neutral-500">
              {ownedChests1}/{CHEST_LIMIT}
            </span>
          </span>
          <button
            onClick={() => setShowCatalog1(true)}
            aria-label={strings.caseCatalogButton}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <List size={12} />
          </button>
        </div>
        <MiniCaseReel
          catalog={catalog1}
          locale={locale}
          strings={strings}
          accent="red"
          syncTotalClicks={syncTotalClicks}
          syncGems={syncGems}
          syncKeys={syncKeys}
          suspendTotalClicksSync={suspendSync}
          resumeTotalClicksSync={resumeSync}
          primary={{
            ariaLabel: strings.openCase,
            affordable: keys >= keyCost && ownedChests1 >= 1,
            className: 'border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15',
            content: (
              <span className="flex items-center justify-center gap-1">
                <Key size={12} className="opacity-80" />
                <span className="tabular-nums">{keyCost}</span>
              </span>
            ),
            onOpen: async (): Promise<CaseOpenOutcome> => {
              const result = await spin()
              if (!result.ok) {
                if (result.error === 'not-enough-keys') return { ok: false, error: strings.notEnoughKeys }
                if (result.error === 'not-enough-chests') return { ok: false, error: strings.notEnoughChests }
                return { ok: false, error: result.error }
              }
              return result
            },
          }}
          secondary={{
            ariaLabel: strings.openCaseGems,
            affordable: gems >= gemCost,
            className: 'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15',
            content: <GemPriceTag cost={gemCost} />,
            onOpen: async (): Promise<CaseOpenOutcome> => {
              const result = await openGemCase()
              if (!result.ok) {
                if (result.error === 'not-enough-gems') return { ok: false, error: strings.notEnoughGems }
                if (result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
                  return { ok: false, error: strings.purchaseError }
                }
                return { ok: false, error: result.error }
              }
              return result
            },
          }}
        />
      </div>

      <div className="relative mt-14">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">
            {strings.caseTitleGems}{' '}
            <span className="ml-1 tabular-nums text-neutral-500">
              {ownedChests2}/{CHEST_LIMIT}
            </span>
          </span>
          <button
            onClick={() => setShowCatalog2(true)}
            aria-label={strings.caseCatalogButton}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <List size={12} />
          </button>
        </div>
        <MiniCaseReel
          catalog={catalog2}
          locale={locale}
          strings={strings}
          accent="red"
          syncTotalClicks={() => {}}
          syncGems={syncGems}
          syncKeys={syncKeys}
          suspendTotalClicksSync={suspendSync}
          resumeTotalClicksSync={resumeSync}
          primary={{
            ariaLabel: strings.openCase,
            affordable: keys >= chestKeyCost && ownedChests2 >= 1,
            className: 'border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15',
            content: (
              <span className="flex items-center justify-center gap-1">
                <Key size={12} className="opacity-80" />
                <span className="tabular-nums">{chestKeyCost}</span>
              </span>
            ),
            onOpen: async (): Promise<CaseOpenOutcome> => {
              const result = await openWithKeys()
              if (!result.ok) {
                if (result.error === 'not-enough-keys') return { ok: false, error: strings.notEnoughKeys }
                if (result.error === 'not-enough-chests') return { ok: false, error: strings.notEnoughChests }
                return { ok: false, error: result.error }
              }
              return { ...result, prizeCurrency: 'gems' }
            },
          }}
          secondary={{
            ariaLabel: strings.openCaseGems,
            affordable: gems >= chestGemCost,
            className: 'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15',
            content: <GemPriceTag cost={chestGemCost} />,
            onOpen: async (): Promise<CaseOpenOutcome> => {
              const result = await openWithGems()
              if (!result.ok) {
                if (result.error === 'not-enough-gems') return { ok: false, error: strings.notEnoughGems }
                if (result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
                  return { ok: false, error: strings.purchaseError }
                }
                return { ok: false, error: result.error }
              }
              return { ...result, prizeCurrency: 'gems' }
            },
          }}
        />
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}

      {showCatalog1 && (
        <CaseCatalogModal catalog={catalog1} locale={locale} strings={strings} onClose={() => setShowCatalog1(false)} />
      )}
      {showCatalog2 && (
        <CaseCatalogModal
          catalog={catalog2}
          locale={locale}
          strings={strings}
          onClose={() => setShowCatalog2(false)}
          variant="percent"
        />
      )}
    </div>
  )
}
