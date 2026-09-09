import { useState } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { Rocket, Dices, Clock, Loader2, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { KeyIcon } from '../components/VaultChest'
import { GemContainer, gemContainerFor, keyContainerFor } from '../components/StallGoods'
import { GemIcon, MineralIcon } from '../components/MaterialIcons'

// Loose enough to accept both a Lucide icon (Gem, Key…) and our own
// PlatinumIcon — every consumer here only ever passes size/className.
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
import { MATERIAL_BUTTON_THEMES, MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { formatPlatino } from '../lib/formatPlatino'
import { playChestPurchase } from '../lib/caseSound'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks, prestigeTier } = useClickCounterContext()
  // Whatever's currently being mined — every "your balance" label here
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
                <MineralIcon size={20} />
                {formatPlatino(totalClicks, language)}
              </button>
              <button
                onClick={() => setShowKeyPacks(true)}
                aria-label={strings.store.buyKeysTitle}
                className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-semibold tabular-nums text-amber-200 transition-colors hover:bg-amber-500/[0.14]"
              >
                <KeyIcon size={20} />
                {keys.toLocaleString(locale)}
              </button>
              <button
                onClick={() => setShowGemPacks(true)}
                aria-label={strings.store.buyGemsTitle}
                className="flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3 py-1 text-xs font-semibold tabular-nums text-indigo-200 transition-colors hover:bg-indigo-500/[0.14]"
              >
                <GemIcon size={20} />
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
          materialColor={(MATERIAL_TIER_COLORS[prestigeTier] ?? MATERIAL_TIER_COLORS[0]).fill}
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
  keysTitle: string
  gemsTitle: string
  gemsStallTagline: string
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
// modals — clicks (priced in gems) and keys/gems (priced in real money via
// RevenueCat) all reduce to "how much does one unit cost here vs. tier 1".
function computeSavingsPct(baseUnitPrice: number, unitPrice: number): number {
  if (baseUnitPrice <= 0 || unitPrice <= 0) return 0
  return Math.round((1 - unitPrice / baseUnitPrice) * 100)
}

type PackTheme = 'amber' | 'indigo' | 'violet'

// Three modals sell three different things the same way: a stamped heading,
// then one row per lot. This used to be a 2x2 grid of small tiles, and the
// grid was the constraint — in a half-width tile there is no room for the
// item to be anything but a glyph. A row gives it forty-odd pixels, which
// is the difference between an icon and an object.
interface ManifestTheme {
  panel: string
  ruleFrom: string
  ruleTo: string
  lamp: string
  title: string
  row: string
  amount: string
  button: string
  sticker: string
}

const MANIFEST_THEME: Record<PackTheme, ManifestTheme> = {
  amber: {
    panel: 'border-amber-400/15',
    ruleFrom: 'bg-gradient-to-r from-transparent to-amber-300/50',
    ruleTo: 'bg-gradient-to-l from-transparent to-amber-300/50',
    lamp: 'bg-amber-400/10',
    title: 'text-amber-50',
    row: 'border-amber-400/15 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent',
    amount: 'text-amber-100',
    button: 'border border-amber-400/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25',
    sticker: 'bg-amber-300 text-[#2a1a06]',
  },
  indigo: {
    panel: 'border-indigo-400/15',
    ruleFrom: 'bg-gradient-to-r from-transparent to-indigo-300/50',
    ruleTo: 'bg-gradient-to-l from-transparent to-indigo-300/50',
    lamp: 'bg-indigo-400/10',
    title: 'text-indigo-50',
    row: 'border-indigo-400/15 bg-gradient-to-r from-indigo-500/[0.09] via-indigo-500/[0.03] to-transparent',
    amount: 'text-indigo-100',
    button: 'border border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25',
    sticker: 'bg-indigo-300 text-[#161038]',
  },
  violet: {
    panel: 'border-violet-400/15',
    ruleFrom: 'bg-gradient-to-r from-transparent to-violet-300/50',
    ruleTo: 'bg-gradient-to-l from-transparent to-violet-300/50',
    lamp: 'bg-violet-400/10',
    title: 'text-violet-50',
    row: 'border-violet-400/15 bg-gradient-to-r from-violet-500/[0.09] via-violet-500/[0.03] to-transparent',
    amount: 'text-violet-100',
    // Paid in gems, so the button is the gems colour even though the panel
    // is the material you are buying.
    button: 'border border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25',
    sticker: 'bg-violet-300 text-[#1d0f3a]',
  },
}

function PackManifest({
  title,
  theme,
  onClose,
  error,
  children,
}: {
  title: string
  theme: PackTheme
  onClose: () => void
  error?: string | null
  children: React.ReactNode
}) {
  const t = MANIFEST_THEME[theme]
  // Only ever mounted while its modal is open — otherwise the page scrolls
  // behind the overlay.
  useLockBodyScroll(true)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border ${t.panel} bg-[#0a0a0e] p-6 shadow-2xl shadow-black/60`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* A lit rail across the top and a lamp behind it. Two elements, and
            they are what turn a dark panel into a hold with something
            valuable in it. */}
        <span className={`pointer-events-none absolute inset-x-0 top-0 h-px ${t.ruleFrom}`} />
        <span className={`pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full ${t.lamp} blur-3xl`} />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-neutral-500 transition-colors hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        {/* Stamped, not written: wide-tracked caps between two hairlines,
            which is what a heading looks like when it has been struck into a
            plate rather than printed on a page. No icon — the lots below are
            made of the thing, so one up here would say it twice.

            The rules are fixed at 40px rather than flexing to the edges: a
            full-width rule would run underneath the close button, and short
            ones read as a stamp instead of as a divider.

            indent compensates the tracking. Letter-spacing is applied AFTER
            the last character too, so a centred word sits half a space left
            of true centre — visible at 0.32em, and the reason wide-tracked
            headings so often look subtly off. */}
        <div className="relative mb-6 flex items-center justify-center gap-3.5">
          <span className={`h-px w-10 ${t.ruleFrom}`} />
          <p className={`indent-[0.32em] whitespace-nowrap text-lg font-semibold uppercase tracking-[0.32em] ${t.title}`}>
            {title}
          </p>
          <span className={`h-px w-10 ${t.ruleTo}`} />
        </div>

        <div className="relative flex flex-col gap-2.5">{children}</div>

        {error && <p className="relative mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

function PackLot({
  icon: Icon,
  iconSize,
  iconClassName,
  iconColor,
  bundle,
  amountLabel,
  priceContent,
  discount,
  isBuying,
  disabled,
  onClick,
  theme,
}: {
  icon: PackIcon
  iconSize: number
  iconClassName?: string
  /** Inline colour for icons drawn in currentColor. The material modal uses
   *  it because its colour is a hex that moves with the prestige tier and so
   *  cannot be a fixed Tailwind class. */
  iconColor?: string
  /** How many copies are drawn — not how many you get. */
  bundle: number
  amountLabel: string
  priceContent: React.ReactNode
  discount: string | null
  isBuying: boolean
  disabled: boolean
  onClick: () => void
  theme: PackTheme
}) {
  const t = MANIFEST_THEME[theme]
  return (
    <div className={`relative flex items-center gap-3 rounded-xl border ${t.row} p-3`}>
      <span
        className="relative flex h-[56px] w-[62px] shrink-0 items-center justify-center"
        style={{ color: iconColor }}
      >
        {Array.from({ length: bundle - 1 }, (_, k) => (
          <span
            key={k}
            aria-hidden
            className="absolute"
            style={{ transform: `translate(${(k + 1) * 7}px, ${(k + 1) * -5}px)`, opacity: 0.3 - k * 0.1 }}
          >
            <Icon size={iconSize} className={iconClassName} />
          </span>
        ))}
        <span className="relative">
          <Icon size={iconSize} className={iconClassName} />
        </span>
      </span>

      <span className={`min-w-0 flex-1 text-xl font-bold tabular-nums ${t.amount}`}>{amountLabel}</span>

      {/* The discount rides the button, not the amount: it is a claim about
          the PRICE, not about how much is in the lot. */}
      <span className="relative shrink-0">
        {discount && (
          <span
            className={`pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wide shadow-md shadow-black/40 ${t.sticker}`}
          >
            {discount}
          </span>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-[96px] rounded-lg px-3 py-2 text-center text-sm font-bold tabular-nums transition-colors disabled:cursor-not-allowed ${
            disabled ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60' : t.button
          }`}
        >
          {isBuying ? <Loader2 size={14} className="mx-auto animate-spin" /> : priceContent}
        </button>
      </span>
    </div>
  )
}
interface ClickPacksModalProps {
  locale: string
  strings: StoreStrings
  currentMaterialName: string
  /** The tier material's own colour, applied to the icon. It used to tint
   *  the header badge; with the badge gone it moves onto the thing itself,
   *  which is where it belonged. */
  materialColor: string
  onClose: () => void
}

function ClickPacksModal({ locale, strings, currentMaterialName, materialColor, onClose }: ClickPacksModalProps) {
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
    <PackManifest title={currentMaterialName} theme="violet" onClose={onClose} error={error}>
      {catalog.map((pack, i) => {
        const unitPrice = pack.gemCost / pack.clicks
        const savingsPct = i >= 2 ? computeSavingsPct(baseUnitPrice, unitPrice) : 0
        return (
          <PackLot
            key={pack.id}
            theme="violet"
            icon={MineralIcon}
            iconSize={40}
            iconColor={materialColor}
            bundle={Math.min(i + 1, 3)}
            amountLabel={pack.clicks.toLocaleString(locale)}
            priceContent={
              <span className="flex items-center justify-center gap-1">
                <GemIcon size={16} />
                {pack.gemCost}
              </span>
            }
            discount={i >= 2 && savingsPct > 0 ? strings.savingsBadge(savingsPct) : null}
            isBuying={buyingId === pack.id}
            disabled={buyingId !== null || gems < pack.gemCost}
            onClick={() => handleBuy(pack)}
          />
        )
      })}
    </PackManifest>
  )
}

// Same idea for gems, and for keys below.
const GEM_PACK_DISCOUNTS: Record<string, number> = { x50_gems: 20, x100_gems: 20 }
// Lots that carry the bulk discount, and by how much. Kept as data next to
// the component rather than as an id compared inline in the JSX — that is
// how x100 ended up without its badge while x50 had one.
const KEY_PACK_DISCOUNTS: Record<string, number> = { x50_keys: 10, x100_keys: 10 }

interface KeyPacksModalProps {
  locale: string
  strings: StoreStrings
  onClose: () => void
}

function KeyPacksModal({ locale, strings, onClose }: KeyPacksModalProps) {
  const { catalog, prices, buyingId, buy } = useKeyPacksContext()
  const [error, setError] = useState<string | null>(null)
  useLockBodyScroll(true)

  const handleBuy = async (pack: KeyPackDef) => {
    setError(null)
    const result = await buy(pack)
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
      setError(strings.purchaseError)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* The same stall as the gem shop, in amber. Same lamp, same shelves,
          same tags on cords — it is one trader with two counters, and
          giving each its own furniture would say otherwise. */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-amber-400/15 bg-[#100d09] pb-5 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 34% at 50% -2%, rgba(245,199,126,.2), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)',
          }}
        />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 text-neutral-500 transition-colors hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        <div className="relative mx-auto h-4 w-16 rounded-b-lg bg-gradient-to-b from-[#6D7480] to-[#2C3037] shadow-[0_10px_26px_rgba(245,199,126,0.34)]" />

        <div className="relative mt-5 flex flex-col items-center">
          <p
            className="border-y-2 px-7 py-1 text-3xl font-extrabold uppercase tracking-wider text-[#F7F3EA]"
            style={{ borderColor: 'rgba(245,199,126,.45)', textShadow: '0 2px 0 rgba(0,0,0,.5), 0 0 26px rgba(245,199,126,.3)' }}
          >
            {strings.keysTitle}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[#F5C77E]/55">
            {strings.gemsStallTagline}
          </p>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-x-2 gap-y-4 px-4">
          {catalog.map((pack, i) => {
            const priceLabel = prices[pack.id]
            const disabled = buyingId !== null || !priceLabel
            const discount = KEY_PACK_DISCOUNTS[pack.id]
            return (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack)}
                disabled={disabled}
                aria-label={`${pack.amount} — ${priceLabel ?? ''}`}
                className="group relative flex flex-col items-center rounded-xl px-1 pb-2 pt-1 transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative block h-9 w-full">
                  <span className="absolute left-1/2 top-0 h-3 w-px bg-[#F5C77E]/45" />
                  <span
                    className="absolute left-1/2 top-2.5 -translate-x-1/2 -rotate-3 whitespace-nowrap bg-gradient-to-b from-[#F3E3BE] to-[#D9BE82] py-1 pl-4 pr-3 font-mono text-[11px] font-semibold text-[#2A1E08] shadow-md shadow-black/50"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)' }}
                  >
                    {buyingId === pack.id ? '···' : (priceLabel ?? '···')}
                  </span>
                </span>

                <span className="relative">
                  <GemContainer kind={keyContainerFor(i)} contents="keys" size={104} />
                  {discount !== undefined && (
                    <span className="absolute -right-1 bottom-3 rotate-[8deg] rounded-sm bg-[#E8A33D] px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-[#2A1A06] shadow-md shadow-black/50">
                      {strings.savingsBadge(discount)}
                    </span>
                  )}
                </span>

                <span className="-mt-1.5 h-2 w-24 rounded-sm bg-gradient-to-b from-[#6A717C] from-[2px] to-[#3A3F48] shadow-lg shadow-black/50" />

                <span className="mt-2.5 text-2xl font-extrabold leading-none text-amber-200 [text-shadow:0_0_18px_rgba(245,199,126,0.35)]">
                  <span className="text-base opacity-50">×</span>
                  {pack.amount.toLocaleString(locale)}
                </span>
              </button>
            )
          })}
        </div>

        {error && <p className="relative mt-3 px-6 text-xs text-red-400">{error}</p>}
      </div>
    </div>
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
  useLockBodyScroll(true)

  const handleBuy = async (pack: GemPackDef) => {
    setError(null)
    const result = await buy(pack)
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'cancelled') {
      setError(strings.purchaseError)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* A trader's stall rather than a list of packs. The lamp, the sign
          and the shelves are what make the four goods read as stock on a
          counter; without them they are four buttons with pictures on. */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-indigo-400/15 bg-[#0d0f16] pb-5 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bulkhead: a warm pool of lamp light over a faint plate grid, so
            the back of the stall is a surface and not a void. */}
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 34% at 50% -2%, rgba(245,199,126,.18), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)',
          }}
        />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 text-neutral-500 transition-colors hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        {/* The lamp is a real fixture hanging into frame, not a gradient.
            One visible source is what lets everything below cast in the same
            direction and be believed. */}
        <div className="relative mx-auto h-4 w-16 rounded-b-lg bg-gradient-to-b from-[#6D7480] to-[#2C3037] shadow-[0_10px_26px_rgba(245,199,126,0.34)]" />

        <div className="relative mt-5 flex flex-col items-center">
          <p
            className="border-y-2 px-7 py-1 text-3xl font-extrabold uppercase tracking-wider text-[#F7F3EA]"
            style={{ borderColor: 'rgba(245,199,126,.45)', textShadow: '0 2px 0 rgba(0,0,0,.5), 0 0 26px rgba(245,199,126,.3)' }}
          >
            {strings.gemsTitle}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[#F5C77E]/55">
            {strings.gemsStallTagline}
          </p>
        </div>

        {/* Two by two. Four across does not fit the width of a phone, and at
            a quarter of it the vial and the pouch stop being different
            objects — which is the whole idea. */}
        <div className="relative mt-5 grid grid-cols-2 gap-x-2 gap-y-4 px-4">
          {catalog.map((pack, i) => {
            const priceLabel = prices[pack.id]
            const disabled = buyingId !== null || !priceLabel
            const discount = GEM_PACK_DISCOUNTS[pack.id]
            return (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack)}
                disabled={disabled}
                aria-label={`${pack.amount} — ${priceLabel ?? ''}`}
                className="group relative flex flex-col items-center rounded-xl px-1 pb-2 pt-1 transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* The price hangs off a cord. The same figure inside a
                    button reads as a checkout; on a swinging card it reads
                    as a market. It costs nothing and says something else. */}
                <span className="relative block h-9 w-full">
                  <span className="absolute left-1/2 top-0 h-3 w-px bg-[#F5C77E]/45" />
                  <span
                    className="absolute left-1/2 top-2.5 -translate-x-1/2 -rotate-3 whitespace-nowrap bg-gradient-to-b from-[#F3E3BE] to-[#D9BE82] py-1 pl-4 pr-3 font-mono text-[11px] font-semibold text-[#2A1E08] shadow-md shadow-black/50"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)' }}
                  >
                    {buyingId === pack.id ? '···' : (priceLabel ?? '···')}
                  </span>
                </span>

                <span className="relative">
                  <GemContainer kind={gemContainerFor(i)} size={104} />
                  {discount !== undefined && (
                    <span className="absolute -right-1 bottom-3 rotate-[8deg] rounded-sm bg-[#E8A33D] px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-[#2A1A06] shadow-md shadow-black/50">
                      {strings.savingsBadge(discount)}
                    </span>
                  )}
                </span>

                {/* The shelf. Lit along its front lip, which is what puts
                    the object ON something instead of in front of it. */}
                <span className="-mt-1.5 h-2 w-24 rounded-sm bg-gradient-to-b from-[#6A717C] from-[2px] to-[#3A3F48] shadow-lg shadow-black/50" />

                <span className="mt-2.5 text-2xl font-extrabold leading-none text-indigo-300 [text-shadow:0_0_18px_rgba(165,180,252,0.35)]">
                  <span className="text-base opacity-50">×</span>
                  {pack.amount.toLocaleString(locale)}
                </span>
              </button>
            )
          })}
        </div>

        {error && <p className="relative mt-3 px-6 text-xs text-red-400">{error}</p>}
      </div>
    </div>
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
              <GemIcon size={14} />
            ) : (
              <MineralIcon size={15} />
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

// All 4 click-multiplier powerups in one card instead of 4 separate ones —
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
// high-variance version of the permanent Suerte upgrade — same 1% chance,
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
              materialButtonClass={materialButtonClass}
            />
          )
        })}
      </div>

      {error && <p className="relative mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
