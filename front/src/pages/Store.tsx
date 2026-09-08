import { useState } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { Rocket, Dices, Clock, Loader2, X, Gem, Key } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { PlatinumIcon } from '../components/PlatinumIcon'

// Loose enough to accept both a Lucide icon (Gem, Keyâ€¦) and our own
// PlatinumIcon â€” every consumer here only ever passes size/className.
type PackIcon = React.ComponentType<{ size?: number; className?: string }>
import { usePowerupContext, type PowerupDef } from '../context/PowerupContext'
import { useTimedLuckPowerupContext, type TimedLuckPowerupDef } from '../context/TimedLuckPowerupContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useGemsContext } from '../context/GemsContext'
import { useKeysContext } from '../context/KeysContext'
import { useClickPacksContext, type ClickPackDef } from '../context/ClickPacksContext'
import { useKeyPacksContext, type KeyPackDef } from '../context/KeyPacksContext'
import { useGemPacksContext, type GemPackDef } from '../context/GemPacksContext'
import { ChestBench } from '../components/ChestBench'
import { MATERIAL_BUTTON_THEMES } from '../lib/materialTiers'
import { formatPlatino } from '../lib/formatPlatino'
import { playChestPurchase } from '../lib/caseSound'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks, prestigeTier } = useClickCounterContext()
  // Whatever's currently being mined â€” every "your balance" label here
  // follows this instead of hardcoding "platino" (see Home.tsx's own copy).
  const currentMaterialName = strings.home.trajectoryTierNames[prestigeTier]
  const materialTheme = MATERIAL_BUTTON_THEMES[prestigeTier]
  const { gems } = useGemsContext()
  const { keys } = useKeysContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [showClickPacks, setShowClickPacks] = useState(false)
  const [showKeyPacks, setShowKeyPacks] = useState(false)
  const [showGemPacks, setShowGemPacks] = useState(false)

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
              {strings.store.title}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowClickPacks(true)}
                aria-label={strings.store.buyClicksTitle(currentMaterialName)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors ${materialTheme.pill}`}
              >
                <PlatinumIcon size={15} className="opacity-70" />
                {formatPlatino(totalClicks, language)}
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
          <ChestBench />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-200">{strings.store.powerupsSection}</h2>
          <div className="flex flex-col gap-4">
            <PowerupGridCard
              locale={locale}
              totalClicks={totalClicks}
              strings={strings.store}
              materialButtonClass={materialTheme.button}
            />
            <TimedLuckGridCard
              locale={locale}
              totalClicks={totalClicks}
              strings={strings.store}
              materialButtonClass={materialTheme.button}
            />
          </div>
        </section>
      </div>

      {showClickPacks && (
        <ClickPacksModal
          locale={locale}
          strings={strings.store}
          currentMaterialName={currentMaterialName}
          iconWrapClassName={materialTheme.iconWrap}
          onClose={() => setShowClickPacks(false)}
        />
      )}
      {showKeyPacks && <KeyPacksModal locale={locale} strings={strings.store} onClose={() => setShowKeyPacks(false)} />}
      {showGemPacks && <GemPacksModal locale={locale} strings={strings.store} onClose={() => setShowGemPacks(false)} />}
    </div>
  )
}

export interface StoreStrings {
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
  notEnoughClicksForChest: (materialName: string) => string
  buyChest: string
  chestLimitReached: string
  claimDailyKey: string
  keyClaimedToday: string
  claimingKey: string
  buyClicksTitle: (materialName: string) => string
  buyKeysTitle: string
  buyGemsTitle: string
  savingsBadge: (pct: number) => string
  opening: string
  youWon: (amount: string, materialName: string) => string
  youWonGems: (amount: string) => string
  casePrizeNames: Record<string, string>
  caseCatalogButton: string
  caseCatalogTitle: string
  caseMythicLabel: string
  caseTitleClicks: (materialName: string) => string
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
  powerups: Record<string, { name: string; desc: string }>
  upgrades: Record<string, { name: string; desc: string }>
  moneyUpgrades: Record<string, { name: string; desc: string }>
  timedLuckPowerups: Record<string, { name: string; desc: string }>
}

// Same "price per unit, relative to the first tier" math for all three pack
// modals â€” clicks (priced in gems) and keys/gems (priced in real money via
// RevenueCat) all reduce to "how much does one unit cost here vs. tier 1".
function computeSavingsPct(baseUnitPrice: number, unitPrice: number): number {
  if (baseUnitPrice <= 0 || unitPrice <= 0) return 0
  return Math.round((1 - unitPrice / baseUnitPrice) * 100)
}

type PackTheme = 'neutral' | 'amber' | 'indigo' | 'violet'

const PACK_THEME: Record<PackTheme, { iconWrap: string }> = {
  neutral: { iconWrap: 'bg-gradient-to-br from-white/25 to-white/10 text-white' },
  amber: { iconWrap: 'bg-gradient-to-br from-amber-400/30 to-yellow-500/20 text-amber-200' },
  indigo: { iconWrap: 'bg-gradient-to-br from-indigo-400/30 to-violet-500/20 text-indigo-200' },
  // Matches the platino badge/pill's own violet everywhere else (Home's
  // pt/s pill, the Store header badge).
  violet: { iconWrap: 'bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200' },
}

// Same soft glass look by default â€” bordered, translucent, blurred, not the
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
  /** Icon + amount side by side instead of stacked â€” reads better for small numbers like key/gem counts. */
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
  // Overrides PACK_THEME[theme]'s iconWrap â€” used by the click-pack modal
  // so its badge follows the current material's color instead of always
  // being violet's own fixed gradient.
  iconWrapClassName?: string
  onClose: () => void
  error?: string | null
  children: React.ReactNode
}

function PackModalShell({ title, icon: Icon, theme, iconWrapClassName, onClose, error, children }: PackModalShellProps) {
  const classes = PACK_THEME[theme]
  // Only ever mounted while its modal is open (see the `showX &&` gates
  // above) â€” same page-scrolls-behind-the-modal bug as Home's own overlays.
  useLockBodyScroll(true)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
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
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconWrapClassName ?? classes.iconWrap}`}>
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
  currentMaterialName: string
  iconWrapClassName: string
  onClose: () => void
}

function ClickPacksModal({ locale, strings, currentMaterialName, iconWrapClassName, onClose }: ClickPacksModalProps) {
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
    <PackModalShell
      title={strings.buyClicksTitle(currentMaterialName)}
      icon={PlatinumIcon}
      theme="violet"
      iconWrapClassName={iconWrapClassName}
      onClose={onClose}
      error={error}
    >
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
              priceContent: priceLabel ?? 'Â·Â·Â·',
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

export interface GemPacksModalProps {
  locale: string
  strings: StoreStrings
  onClose: () => void
}

export function GemPacksModal({ locale, strings, onClose }: GemPacksModalProps) {
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
              priceContent: priceLabel ?? 'Â·Â·Â·',
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
  /** Full class string for the "can afford, clicks-priced" button variant. */
  materialButtonClass: string
}

// One tile = one freely-buyable tier: name, duration, and a price button â€”
// compact enough for all 4 to sit in a row like the original cards did. A
// gem-priced tier gets the same indigo "diamond" button used everywhere
// else gems are spent, instead of the white click-currency one. The
// active/cooldown countdown itself lives once in the card's header, not
// repeated per tile â€” the button just goes disabled (same muted style as
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
  materialButtonClass,
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
              : materialButtonClass
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
  materialButtonClass: string
}

// All 4 click-multiplier powerups in one card instead of 4 separate ones â€”
// freely buyable in any order (only one can run at a time), each tile is its
// own price button.
function PowerupGridCard({ locale, totalClicks, strings, materialButtonClass }: PowerupGridCardProps) {
  const { userId } = useAppAuth()
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
              {strings.powerups[active.id]?.name ?? active.id} Â· {activeCountdown}
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
          // Guests always show "affordable" here â€” the click isn't blocked
          // by balance for them, it opens the sign-in prompt instead.
          // Buying is independent of whether a tier is currently active â€” it
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
              materialButtonClass={materialButtonClass}
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
  materialButtonClass: string
}

// Same freely-buyable grid as PowerupGridCard, but for the temporary,
// high-variance version of the permanent Suerte upgrade â€” same 1% chance,
// much bigger multiplier, only lasts a short while.
function TimedLuckGridCard({ locale, totalClicks, strings, materialButtonClass }: TimedLuckGridCardProps) {
  const { userId } = useAppAuth()
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
              {strings.timedLuckPowerups[active.id]?.name ?? active.id} Â· {activeCountdown}
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
          // Buying is independent of whether a tier is currently active â€” it
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
              materialButtonClass={materialButtonClass}
            />
          )
        })}
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
