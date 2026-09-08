import { Gem, X } from 'lucide-react'
import { AstronautPieceById } from './AstronautPiecePreview'
import { PlatinumIcon } from './PlatinumIcon'
import { useLanguage } from '../context/LanguageContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import type { DailyCasePrize } from '../context/DailyCaseContext'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import { isCosmeticChest, type ChestId } from '../store/chestBench'
import { useCosmetics } from '../context/CosmeticsContext'
import {
  COSMETIC_CASE_ITEMS,
  COSMETIC_RARE_POOL,
  COSMETIC_RARITY_ORDER,
  cosmeticKey,
  cosmeticRarityChance,
  type CosmeticCaseItem,
} from '../store/cosmeticCase'

/**
 * One chest's odds. Opened from that chest's own card on the rack rather than
 * from a single combined list — four tables stacked in one modal made you
 * scroll past three chests to check the one you were actually considering,
 * and the question is always about one chest at a time.
 *
 * The panel caps its own height and scrolls inside itself rather than letting
 * the backdrop scroll: a centred flex child taller than its scroll container
 * gets its overflow clipped at the top, which is where the rarest band sits.
 */
export function ChestCatalogModal({
  chest,
  title,
  prizes,
  locale,
  onClose,
}: {
  chest: ChestId
  title: string
  /** The live, prestige-scaled catalogue — only used by the paying chests. */
  prizes: DailyCasePrize[]
  locale: string
  onClose: () => void
}) {
  const { strings } = useLanguage()
  const s = strings.store
  const { owned } = useCosmetics()
  useLockBodyScroll(true)

  // A chest never rolls a piece you already own, so listing one here would
  // advertise a prize that cannot come out of it. The odds shown are the
  // odds you actually face.
  const cosmeticPool = (chest === 'styleRare' ? COSMETIC_RARE_POOL : COSMETIC_CASE_ITEMS).filter(
    (i) => !owned.has(cosmeticKey(i)),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/70 px-6 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100dvh-5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-neutral-500 hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        <div className="shrink-0 px-6 pb-4 pr-12 pt-6">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{s.caseCatalogTitle}</p>
        </div>

        <div className="scroll-thin overflow-y-auto overscroll-contain px-6 pb-6">
          {isCosmeticChest(chest) ? (
            <CosmeticSection pool={cosmeticPool} />
          ) : (
            <CurrencySection chest={chest} prizes={prizes} locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The two paying chests read differently on purpose, exactly as they did
 * before this card was reworked.
 *
 * The gem chest's four prizes are 1/2/3/5 gems — the rarity name adds nothing
 * over the number itself, so the row is just the amount and its odds. The
 * material chest's prizes ARE named tiers, and its amounts span 3k to 100k,
 * so there the name and the amount both earn their place.
 */
function CurrencySection({
  chest,
  prizes,
  locale,
}: {
  chest: ChestId
  prizes: DailyCasePrize[]
  locale: string
}) {
  const { strings } = useLanguage()
  const s = strings.store
  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0)
  const isGems = chest === 'gems'
  return (
    <div className="flex flex-col gap-2">
      {prizes.map((prize) => {
        const style = CASE_PRIZE_STYLES[prize.id] ?? DEFAULT_CASE_PRIZE_STYLE
        const rawPct = totalWeight > 0 ? (prize.weight / totalWeight) * 100 : 0
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
            {isGems ? (
              <>
                <span className="flex items-center gap-1 text-sm font-medium" style={{ color: style.color }}>
                  <Gem size={12} className="opacity-70" />x{prize.amount}
                </span>
                <span className="ml-auto text-sm font-bold tabular-nums text-white">
                  {Math.round(rawPct)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium" style={{ color: style.color }}>
                  {s.casePrizeNames[prize.id] ?? prize.id}
                </span>
                <span className="ml-auto flex items-center gap-1 text-sm font-bold tabular-nums text-white">
                  <PlatinumIcon size={15} className="opacity-70" />
                  {prize.amount.toLocaleString(locale)}
                </span>
                {/* One decimal below 10% — the rarest tiers round to 0% whole. */}
                <span className="w-11 shrink-0 text-right text-sm font-bold tabular-nums text-neutral-400">
                  {rawPct < 10 ? rawPct.toFixed(1) : Math.round(rawPct)}%
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Grouped by rarity band rather than listed flat: with 30 cosmetics a flat
// list is a wall, and what you want off a chest catalogue is "what are my
// odds of something good", which is a per-band question.
function CosmeticSection({ pool }: { pool: CosmeticCaseItem[] }) {
  const { strings } = useLanguage()
  const s = strings.store
  return (
    <div className="flex flex-col gap-4">
      {COSMETIC_RARITY_ORDER.map((rarity) => {
        const items = pool.filter((i) => i.rarity === rarity)
        if (items.length === 0) return null
        const style = CASE_PRIZE_STYLES[rarity] ?? DEFAULT_CASE_PRIZE_STYLE
        const chance = cosmeticRarityChance(rarity, pool)
        return (
          <div key={rarity}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.glow}` }}
              />
              <span className="text-xs font-semibold" style={{ color: style.color }}>
                {s.cosmeticRarityNames[rarity] ?? rarity}
              </span>
              <span className="ml-auto text-xs font-bold tabular-nums text-neutral-300">
                {chance < 10 ? chance.toFixed(1) : Math.round(chance)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <div
                  key={cosmeticKey(item)}
                  className="flex flex-col items-center gap-1 rounded-xl border p-2"
                  style={{ borderColor: `${style.color}30`, backgroundColor: `${style.color}0d` }}
                >
                  <span className="flex h-[58px] w-full items-center justify-center rounded-lg bg-black/25 shadow-inner shadow-black/40">
                    <AstronautPieceById slot={item.slot} id={item.id} size={50} />
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-medium text-neutral-200">
                    {strings.profile.styleNames[item.id] ?? item.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
