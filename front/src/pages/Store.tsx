import { useState } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { Clock, Loader2, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { KeyIcon } from '../components/VaultChest'
import { GemContainer, GOODS_SHELF_LIFT, GOODS_SIZE, gemContainerFor, keyContainerFor } from '../components/StallGoods'
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
import { StampedHeading } from '../components/StampedHeading'
import { MATERIAL_BUTTON_THEMES, MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { formatPlatino } from '../lib/formatPlatino'
import { playChestPurchase } from '../lib/caseSound'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

interface WalletBayProps {
  icon: React.ReactNode
  amount: string
  ariaLabel: string
  /** Icon, amount and plus chip. A hex, not a class: the material bay's colour
      is picked at runtime from the tier you are on, and Tailwind can only ship
      classes it can see in the source. The other two follow the same mechanism
      so a bay is a bay. */
  tone: string
  /** The light this stock throws onto the shelf under it. Also a hex. */
  pool: string
  onClick: () => void
}

// One bay of the counter: what you hold, and the door to buying more of it.
//
// No name under the amount. A gem beside a number in gem colour is already
// "gems", and the three labels were the only thing making the counter tall.
// They live on the aria-label, where they were doing the work that mattered.
function WalletBay({ icon, amount, ariaLabel, tone, pool, onClick }: WalletBayProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="group relative flex flex-col items-center gap-1.5 px-2 py-3 transition-colors hover:bg-white/[0.025]"
    >
      <span className="relative flex h-7 items-center justify-center">
        <span
          className="pointer-events-none absolute h-9 w-9 rounded-full opacity-60 blur-lg transition-opacity group-hover:opacity-100"
          style={{ background: pool }}
        />
        <span className="relative flex" style={{ color: tone }}>
          {icon}
        </span>
      </span>

      {/* The amount centres on the icon above it, and the plus hangs off its
          right edge without a say in that. As a third item in a centred row
          the plus pushed the number half a chip off the icon — the kind of
          misalignment you feel before you can name it.

          The plus also has to hold still: a phone has no hover, so a bay that
          only admits to being a button when a cursor lands on it never admits
          it at all. */}
      <span className="relative block">
        <span className="font-[Space_Grotesk] text-base font-bold leading-none tabular-nums" style={{ color: tone }}>
          {amount}
        </span>
        <span
          className="absolute left-full top-1/2 ml-1.5 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold leading-none opacity-60 transition-opacity group-hover:opacity-100"
          style={{ background: `${pool}22`, color: tone, boxShadow: `inset 0 0 0 1px ${pool}55` }}
        >
          +
        </span>
      </span>
    </button>
  )
}

export function Store() {
  const { language, strings } = useLanguage()
  const { totalClicks, prestigeTier } = useClickCounterContext()
  // Whatever's currently being mined — every "your balance" label here
  // follows this instead of hardcoding "platino" (see Home.tsx's own copy).
  const currentMaterialName = strings.home.trajectoryTierNames[prestigeTier]
  const materialTheme = MATERIAL_BUTTON_THEMES[prestigeTier]
  // Clamped: a tier past the end of the ladder should light the counter with
  // the first material rather than crash on an undefined.
  const materialColors = MATERIAL_TIER_COLORS[prestigeTier] ?? MATERIAL_TIER_COLORS[0]
  const { gems } = useGemsContext()
  const { keys } = useKeysContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [showClickPacks, setShowClickPacks] = useState(false)
  const [showKeyPacks, setShowKeyPacks] = useState(false)
  const [showGemPacks, setShowGemPacks] = useState(false)

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          {/* The counter: one plate, three bays. Three separate pills read as
              three readouts that happen to sit near each other, and hid the
              fact that every one of them is a door into a shop. Bays cut into
              a single plate read as one instrument, and the plate is lit by
              whatever you are currently mining, so the wallet and the heading
              above it change colour together. */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.07]" />

            <div className="relative grid grid-cols-3">
              {/* Inset hairlines rather than full-height dividers: a cut that
                  stops short of the edges is what separates bays milled into
                  one plate from three panels bolted together. */}
              <span className="pointer-events-none absolute inset-y-3 left-1/3 w-px bg-white/[0.06]" />
              <span className="pointer-events-none absolute inset-y-3 left-2/3 w-px bg-white/[0.06]" />

              <WalletBay
                icon={<MineralIcon size={26} />}
                amount={formatPlatino(totalClicks, language)}
                ariaLabel={strings.store.buyClicksTitle(currentMaterialName)}
                tone={materialColors.light}
                pool={materialColors.fill}
                onClick={() => setShowClickPacks(true)}
              />
              <WalletBay
                icon={<KeyIcon size={26} />}
                amount={keys.toLocaleString(locale)}
                ariaLabel={strings.store.buyKeysTitle}
                tone="#FDE68A"
                pool="#F59E0B"
                onClick={() => setShowKeyPacks(true)}
              />
              <WalletBay
                icon={<GemIcon size={26} />}
                amount={gems.toLocaleString(locale)}
                ariaLabel={strings.store.buyGemsTitle}
                tone="#C7D2FE"
                pool="#6366F1"
                onClick={() => setShowGemPacks(true)}
              />
            </div>
          </div>
        </header>

        <section className="mb-10">
          <ChestBench />
        </section>

        <div className="flex flex-col gap-10">
          <PowerupRack
            locale={locale}
            totalClicks={totalClicks}
            strings={strings.store}
            materialButtonClass={materialTheme.button}
          />
          <TimedLuckRack
            locale={locale}
            totalClicks={totalClicks}
            strings={strings.store}
            materialButtonClass={materialTheme.button}
          />
        </div>
      </div>

      {showClickPacks && (
        <ClickPacksModal
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
  casesSection: string
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

        <StampedHeading ruleFrom={t.ruleFrom} ruleTo={t.ruleTo} tone={t.title} className="mb-6">
          {title}
        </StampedHeading>

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
  strings: StoreStrings
  currentMaterialName: string
  /** The tier material's own colour, applied to the icon. It used to tint
   *  the header badge; with the badge gone it moves onto the thing itself,
   *  which is where it belonged. */
  materialColor: string
  onClose: () => void
}

function ClickPacksModal({ strings, currentMaterialName, materialColor, onClose }: ClickPacksModalProps) {
  const { language } = useLanguage()
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
            amountLabel={formatPlatino(pack.clicks, language)}
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
                  <GemContainer kind={keyContainerFor(i)} contents="keys" size={GOODS_SIZE} />
                  {discount !== undefined && (
                    <span className="absolute -right-1 bottom-3 rotate-[8deg] rounded-sm bg-[#E8A33D] px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-[#2A1A06] shadow-md shadow-black/50">
                      {strings.savingsBadge(discount)}
                    </span>
                  )}
                </span>

                <span
                  className="h-2 w-24 rounded-sm bg-gradient-to-b from-[#6A717C] from-[2px] to-[#3A3F48] shadow-lg shadow-black/50"
                  style={{ marginTop: -GOODS_SHELF_LIFT }}
                />

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
              'radial-gradient(58% 34% at 50% -2%, rgba(142,157,255,.2), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)',
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
        <div className="relative mx-auto h-4 w-16 rounded-b-lg bg-gradient-to-b from-[#6D7480] to-[#2C3037] shadow-[0_10px_26px_rgba(142,157,255,0.4)]" />

        <div className="relative mt-5 flex flex-col items-center">
          <p
            className="border-y-2 px-7 py-1 text-3xl font-extrabold uppercase tracking-wider text-[#F7F3EA]"
            style={{ borderColor: 'rgba(142,157,255,.5)', textShadow: '0 2px 0 rgba(0,0,0,.5), 0 0 26px rgba(142,157,255,.35)' }}
          >
            {strings.gemsTitle}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[#8E9DFF]/60">
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
                  <span className="absolute left-1/2 top-0 h-3 w-px bg-[#8E9DFF]/50" />
                  <span
                    className="absolute left-1/2 top-2.5 -translate-x-1/2 -rotate-3 whitespace-nowrap bg-gradient-to-b from-[#F3E3BE] to-[#D9BE82] py-1 pl-4 pr-3 font-mono text-[11px] font-semibold text-[#2A1E08] shadow-md shadow-black/50"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)' }}
                  >
                    {buyingId === pack.id ? '···' : (priceLabel ?? '···')}
                  </span>
                </span>

                <span className="relative">
                  <GemContainer kind={gemContainerFor(i)} size={GOODS_SIZE} />
                  {discount !== undefined && (
                    <span className="absolute -right-1 bottom-3 rotate-[8deg] rounded-sm bg-[#A5B4FC] px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-[#1B1B3A] shadow-md shadow-black/50">
                      {strings.savingsBadge(discount)}
                    </span>
                  )}
                </span>

                {/* The shelf. Lit along its front lip, which is what puts
                    the object ON something instead of in front of it. */}
                <span
                  className="h-2 w-24 rounded-sm bg-gradient-to-b from-[#6A717C] from-[2px] to-[#3A3F48] shadow-lg shadow-black/50"
                  style={{ marginTop: -GOODS_SHELF_LIFT }}
                />

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

/** One rung of a section's ladder: dim and cheap at the bottom, white-hot at the top. */
interface BoostHeat {
  /** Border and ground of the cell. */
  frame: string
  /** Fill of the charge rail, read bottom-up. */
  rail: string
  numeral: string
  /** textShadow for the numeral — the glow ramps with the rung. */
  glow: string
}

interface BoostTheme {
  ruleFrom: string
  ruleTo: string
  tone: string
  /** Used for whatever is currently running: the live countdown and the ring. */
  status: string
  ring: string
  heat: readonly BoostHeat[]
}

// Two ladders of four. Spelled out rather than generated from the tier index
// because Tailwind only ships the class names it can literally see in the
// source — a `border-${hue}-400/20` would compile to nothing.
//
// Each ladder starts inside its section's own colour and ends a hue along it:
// violet running to fuchsia, emerald running to lime. Same family, so the four
// cells read as one rack; hotter at the top, so the ladder reads as a ladder.
const BOOST_THEMES: Record<'power' | 'luck', BoostTheme> = {
  power: {
    ruleFrom: 'bg-gradient-to-r from-transparent to-violet-300/50',
    ruleTo: 'bg-gradient-to-l from-transparent to-violet-300/50',
    tone: 'text-violet-50',
    status: 'text-violet-300',
    ring: 'ring-violet-300/40',
    heat: [
      {
        frame: 'border-violet-400/10 bg-violet-500/[0.02]',
        rail: 'bg-gradient-to-t from-violet-600/40 to-violet-400/60',
        numeral: 'text-violet-200/80',
        glow: '0 0 12px rgba(167,139,250,.25)',
      },
      {
        frame: 'border-violet-400/20 bg-violet-500/[0.04]',
        rail: 'bg-gradient-to-t from-violet-600/50 to-violet-300/80',
        numeral: 'text-violet-100',
        glow: '0 0 14px rgba(167,139,250,.42)',
      },
      {
        frame: 'border-fuchsia-400/25 bg-fuchsia-500/[0.05]',
        rail: 'bg-gradient-to-t from-fuchsia-600/50 to-fuchsia-300/90',
        numeral: 'text-fuchsia-100',
        glow: '0 0 18px rgba(232,121,249,.5)',
      },
      {
        frame: 'border-fuchsia-300/40 bg-fuchsia-500/[0.08]',
        rail: 'bg-gradient-to-t from-fuchsia-500/60 to-pink-200',
        numeral: 'text-white',
        glow: '0 0 22px rgba(240,171,252,.75)',
      },
    ],
  },
  luck: {
    ruleFrom: 'bg-gradient-to-r from-transparent to-emerald-300/50',
    ruleTo: 'bg-gradient-to-l from-transparent to-emerald-300/50',
    tone: 'text-emerald-50',
    status: 'text-emerald-300',
    ring: 'ring-emerald-300/40',
    heat: [
      {
        frame: 'border-emerald-400/10 bg-emerald-500/[0.02]',
        rail: 'bg-gradient-to-t from-emerald-600/40 to-emerald-400/60',
        numeral: 'text-emerald-200/80',
        glow: '0 0 12px rgba(52,211,153,.25)',
      },
      {
        frame: 'border-emerald-400/20 bg-emerald-500/[0.04]',
        rail: 'bg-gradient-to-t from-emerald-600/50 to-emerald-300/80',
        numeral: 'text-emerald-100',
        glow: '0 0 14px rgba(52,211,153,.42)',
      },
      {
        frame: 'border-lime-400/25 bg-lime-500/[0.05]',
        rail: 'bg-gradient-to-t from-lime-600/50 to-lime-300/90',
        numeral: 'text-lime-100',
        glow: '0 0 18px rgba(163,230,53,.5)',
      },
      {
        frame: 'border-lime-300/40 bg-lime-500/[0.08]',
        rail: 'bg-gradient-to-t from-lime-500/60 to-lime-100',
        numeral: 'text-white',
        glow: '0 0 22px rgba(217,249,157,.75)',
      },
    ],
  },
}

interface BoostTileProps {
  /** Localised name. The cell shows a numeral; this is what reaches a screen reader. */
  name: string
  multiplier: number
  durationSeconds: number
  /** Strongest rung in this section — the rail is drawn as a share of it. */
  peakMultiplier: number
  heat: BoostHeat
  theme: BoostTheme
  /** Live countdown, set only on the tier that is currently running. */
  activeCountdown: string | null
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

// A charge cell instead of a row of numbers. The multiplier is the whole face
// of it, and how hard it hits climbs the rail down the left edge — so the four
// of them side by side read as a ladder at a glance rather than as arithmetic.
// How long it runs is a clock and a number underneath: a duration is something
// you read, not something you eyeball against the tier next to it.
//
// The name is gone from the face. It reads "Disparo x2" while the cell already
// says x2 in 30px, and the heading above already says which family this is —
// the same redundancy the chest bench's description was. It stays on the
// button's aria-label, which is where it was doing real work.
//
// The cell keeps its heat while it is unbuyable and only the price bar goes
// dead: the cooldown disables all four at once, and draining four cells for an
// hour would empty the page out.
function BoostTile({
  name,
  multiplier,
  durationSeconds,
  peakMultiplier,
  heat,
  theme,
  activeCountdown,
  cost,
  currency,
  locale,
  isBuyingThis,
  disabled,
  buyingLabel,
  onClick,
  materialButtonClass,
}: BoostTileProps) {
  const { language } = useLanguage()
  const charge = Math.round((multiplier / peakMultiplier) * 100)

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-xl border ${heat.frame}`}>
      {/* Running right now: a lit ring around the whole cell, so it is findable
          from across the page rather than only by reading the countdown. */}
      {activeCountdown && (
        <span className={`pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-inset ${theme.ring}`} />
      )}

      <div className="relative">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-white/[0.06]">
          <span className={`absolute inset-x-0 bottom-0 ${heat.rail}`} style={{ height: `${charge}%` }} />
        </span>

        <div className="flex h-[68px] items-center justify-center pl-4 pr-2.5">
          <span
            className={`font-[Space_Grotesk] text-[30px] font-bold leading-none tabular-nums ${heat.numeral}`}
            style={{ textShadow: heat.glow }}
          >
            <span className="text-[17px] font-semibold opacity-40">×</span>
            {multiplier}
          </span>
        </div>

        {/* The window it buys you, and then what is left of it once it runs. */}
        <div
          className={`flex items-center justify-center gap-1 pb-2.5 pl-4 pr-2.5 ${
            activeCountdown ? theme.status : 'text-neutral-500'
          }`}
        >
          <Clock size={10} />
          <span className="font-mono text-[10px] tabular-nums">
            {activeCountdown ?? `${durationSeconds}s`}
          </span>
        </div>
      </div>

      <div className="px-1.5 pb-1.5">
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
              {currency === 'gems' ? <GemIcon size={14} /> : <MineralIcon size={15} />}
              <span className="tabular-nums">
                {currency === 'gems' ? cost.toLocaleString(locale) : formatPlatino(cost, language)}
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

interface BoostRackProps {
  locale: string
  totalClicks: number
  strings: StoreStrings
  materialButtonClass: string
}

// All 4 click-multiplier tiers in one rack — freely buyable in any order, only
// one running at a time. No card around them: every cell is already a card, and
// a fifth box holding four is the nesting the chest bench above just shed.
function PowerupRack({ locale, totalClicks, strings, materialButtonClass }: BoostRackProps) {
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

  const theme = BOOST_THEMES.power
  const peakMultiplier = Math.max(...catalog.map((p) => p.multiplier))
  const activeCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const cooldownCountdown = `${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`

  return (
    <section className="relative">
      <StampedHeading ruleFrom={theme.ruleFrom} ruleTo={theme.ruleTo} tone={theme.tone} className="mb-2">
        {strings.powerupsCardTitle}
      </StampedHeading>

      {/* What is being multiplied. The cells say how much and for how long;
          nothing else on the page says what it lands on. */}
      <p className="text-center text-xs text-neutral-500">{strings.powerupsSubtitle}</p>

      {/* Section-wide state under the section's own heading — the tier that is
          actually running counts down on its own cell instead. The line keeps
          its height when empty so the rack does not jump the moment you buy. */}
      <p className={`mb-3 mt-1.5 h-4 text-center font-mono text-[11px] tabular-nums ${theme.status}`}>
        {!active && cooldownSecondsLeft > 0 ? strings.availableIn(cooldownCountdown) : ''}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {catalog.map((powerup, i) => {
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
            <BoostTile
              key={powerup.id}
              name={name}
              multiplier={powerup.multiplier}
              durationSeconds={powerup.durationSeconds}
              peakMultiplier={peakMultiplier}
              heat={theme.heat[Math.min(i, theme.heat.length - 1)]}
              theme={theme}
              activeCountdown={active?.id === powerup.id ? activeCountdown : null}
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

      {error && <p className="relative mt-2 text-center text-xs text-red-400">{error}</p>}
    </section>
  )
}

// The same rack for the temporary, high-variance version of the permanent
// Suerte upgrade — same 1% chance, much bigger multiplier, short window.
//
// Every tier here runs for the same 20s: the rung is what changes in this
// catalogue, the window is not.
function TimedLuckRack({ locale, totalClicks, strings, materialButtonClass }: BoostRackProps) {
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

  const theme = BOOST_THEMES.luck
  const peakMultiplier = Math.max(...catalog.map((p) => p.multiplier))
  const activeCountdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
  const cooldownCountdown = `${Math.floor(cooldownSecondsLeft / 60)}:${String(cooldownSecondsLeft % 60).padStart(2, '0')}`

  return (
    <section className="relative">
      <StampedHeading ruleFrom={theme.ruleFrom} ruleTo={theme.ruleTo} tone={theme.tone} className="mb-2">
        {strings.timedLuckTitle}
      </StampedHeading>

      <p className="text-center text-xs text-neutral-500">{strings.timedLuckSubtitle}</p>

      <p className={`mb-3 mt-1.5 h-4 text-center font-mono text-[11px] tabular-nums ${theme.status}`}>
        {!active && cooldownSecondsLeft > 0 ? strings.availableIn(cooldownCountdown) : ''}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {catalog.map((powerup, i) => {
          // Buying is independent of whether a tier is currently active — it
          // only adds to the owned count, so only the shared cooldown and
          // affordability gate it.
          const balance = powerup.currency === 'gems' ? gems : totalClicks
          const canAfford = !userId || balance >= powerup.cost
          const isBuyingThis = buyingId === powerup.id
          const disabled = cooldownSecondsLeft > 0 || buyingId !== null || !canAfford
          const name = strings.timedLuckPowerups[powerup.id]?.name ?? powerup.id

          return (
            <BoostTile
              key={powerup.id}
              name={name}
              multiplier={powerup.multiplier}
              durationSeconds={powerup.durationSeconds}
              peakMultiplier={peakMultiplier}
              heat={theme.heat[Math.min(i, theme.heat.length - 1)]}
              theme={theme}
              activeCountdown={active?.id === powerup.id ? activeCountdown : null}
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

      {error && <p className="relative mt-2 text-center text-xs text-red-400">{error}</p>}
    </section>
  )
}
