import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Gem, Loader2 } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { AstronautPieceById, type AstronautSlot } from '../components/AstronautPiecePreview'
import { GemsPill } from '../components/GemsPill'
import { GemPacksModal } from './Store'
import { useLanguage } from '../context/LanguageContext'
import { useAppAuth } from '../hooks/useAppAuth'
import { useCosmetics } from '../context/CosmeticsContext'
import { useGemsContext } from '../context/GemsContext'
import { fetchMyStyle, saveMyStyle } from '../lib/astronautStyleApi'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import { COSMETIC_GEM_PRICES, getCosmetic } from '../store/cosmeticCase'
import {
  DEFAULT_STYLE_IDS,
  loadStyleIds,
  saveStyleIds,
  type AstronautStyleIds,
} from '../lib/astronautStyles'

const SLOT_LABELS: Record<string, string> = {
  helmet: 'slotHelmet',
  visor: 'slotVisor',
  background: 'slotBackground',
  antenna: 'slotAntenna',
  suit: 'slotSuit',
  pack: 'slotPack',
  boots: 'slotBoots',
  bracelet: 'slotBracelet',
  belt: 'slotBelt',
  trail: 'slotTrail',
  badge: 'slotBadge',
  accent: 'slotAccent',
  pet: 'slotPet1',
  pet2: 'slotPet2',
}

/**
 * One piece, full screen: the astronaut wearing it, what it is, and the one
 * button that matters.
 *
 * A page rather than a sheet over the grid, because the whole reason it
 * exists is the character — you need the figure at full size wearing the
 * thing before you decide, and a sheet would cover exactly that. It's also
 * why the piece goes on the astronaut here and nowhere else: the grid stays a
 * plain rack you can scroll without changing anything, and this page is the
 * only place where a look is being tried.
 *
 * Nothing here writes to the saved outfit unless the player presses the
 * button. The style shown is assembled locally and thrown away on unmount —
 * there is no debounce, no autosave and no cleanup flush, deliberately unlike
 * the grid screen, so a piece can never be worn out of this page by accident.
 */
export function CosmeticDetail() {
  const navigate = useNavigate()
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const { getToken } = useAppAuth()
  const { isUnlocked, loaded, buyCosmetics } = useCosmetics()
  const { gems } = useGemsContext()
  const params = useParams<{ slot: string; id: string }>()

  const slot = (params.slot ?? '') as AstronautSlot
  const id = params.id ?? ''

  const [styleIds, setStyleIds] = useState<AstronautStyleIds>(() => loadStyleIds())
  const [busy, setBusy] = useState(false)
  const [showGemPacks, setShowGemPacks] = useState(false)
  const [error, setError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    void fetchMyStyle(getToken).then((remote) => {
      if (!cancelled && remote) setStyleIds(remote)
    })
    return () => {
      cancelled = true
      mounted.current = false
    }
  }, [getToken])

  const valid = slot in DEFAULT_STYLE_IDS && id.length > 0
  const item = valid ? getCosmetic(slot, id) : null
  const unlocked = valid && (!loaded || isUnlocked(slot, id))
  const equipped = valid && styleIds[slot as keyof AstronautStyleIds] === id
  const price = item ? COSMETIC_GEM_PRICES[item.rarity] : 0
  const missing = Math.max(0, price - gems)
  // Stock-kit pieces take the Consumer colour rather than a neutral, same as
  // the locker grid: they're the bottom of the ladder, not off it.
  const tint = (CASE_PRIZE_STYLES[item?.rarity ?? 'consumer'] ?? DEFAULT_CASE_PRIZE_STYLE).color

  // The figure always shows the piece, owned or not — that's the question the
  // page answers. It's a local overlay, never persisted.
  const worn = useMemo(
    () => (valid ? ({ ...styleIds, [slot]: id } as AstronautStyleIds) : styleIds),
    [styleIds, slot, id, valid],
  )

  const name = strings.profile.styleNames[id] ?? id
  // pet2 is a separate purchase but the same droid, so it borrows pet's copy.
  const description =
    strings.profile.styleDescriptions[`${slot === 'pet2' ? 'pet' : slot}:${id}`] ?? ''
  const slotLabel = strings.profile[SLOT_LABELS[slot] as keyof typeof strings.profile] as string

  // A route someone typed by hand, or a piece that stopped existing. Bounce
  // rather than render half a page.
  useEffect(() => {
    if (!valid) navigate('/personalizar', { replace: true })
  }, [valid, navigate])
  if (!valid) return null

  const persist = (next: AstronautStyleIds) => {
    setStyleIds(next)
    saveStyleIds(next)
    void saveMyStyle(getToken, next)
  }

  const onPrimary = async () => {
    if (busy || equipped) return
    if (unlocked) {
      persist(worn)
      return
    }
    if (!item || missing > 0) return
    setBusy(true)
    setError(false)
    const result = await buyCosmetics([{ slot, id }], worn)
    if (!mounted.current) return
    setBusy(false)
    if (!result.ok) {
      setError(true)
      return
    }
    // Bought and worn in the same request — mirror it locally so the button
    // flips to EQUIPPED without waiting for a refetch.
    setStyleIds(worn)
    saveStyleIds(worn)
  }

  const primaryLabel = busy
    ? strings.profile.detailBuying
    : equipped
      ? strings.profile.detailEquipped
      : unlocked
        ? strings.profile.detailEquip
        : strings.profile.detailUnlock

  return (
    // Same frame as the locker, down to the padding: this page is that page
    // with the grid swapped for one piece, so the back arrow, the gem pill
    // and the astronaut all have to land in exactly the same spot. Anything
    // that shifts between the two reads as a different screen.
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-16 pt-14 sm:px-6 sm:pt-16">
      <button
        onClick={() => navigate(-1)}
        aria-label={strings.profile.detailBack}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      <GemsPill
        gems={gems}
        locale={locale}
        label={strings.store.buyGemsTitle}
        onClick={() => setShowGemPacks(true)}
      />

      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Same stage as the locker — nothing behind the figure — except the
            piece is already on, which is the whole question this page
            answers. */}
        <div className="relative flex w-full justify-center">
          <AstronautAvatar size={168} styleIds={worn} />
        </div>
      </div>

      {/* Card — thumbnail beside the copy, exactly the reading order the
          player needs: what it looks like, what it's called, what it is,
          what it costs. */}
      <div className="mx-auto mt-8 max-w-md">
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.04] p-4">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div
                className="flex h-[104px] w-[104px] items-center justify-center rounded-2xl border"
                style={{ backgroundColor: `${tint}1a`, borderColor: `${tint}59` }}
              >
                <AstronautPieceById slot={slot} id={id} size={66} />
              </div>
              <p
                className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: tint }}
              >
                {/* Stock-kit pieces have no rarity to show, and repeating
                    the slot name here (it's already the eyebrow) just reads
                    as a bug. They get what they actually are instead. */}
                {item
                  ? (strings.store.cosmeticRarityNames[
                      item.rarity as keyof typeof strings.store.cosmeticRarityNames
                    ] ?? item.rarity)
                  : strings.profile.detailStock}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{slotLabel}</p>
              <h1 className="mt-0.5 text-2xl font-extrabold leading-[1.1] tracking-tight text-white">{name}</h1>
              {description && (
                <p className="mt-2 text-[13px] leading-snug text-neutral-400">{description}</p>
              )}

            </div>
          </div>

          {/* The price *is* the button — the same gem button the rest of the
              app uses — and it sits inside the card, spanning it, under both
              columns. One thing to read instead of a number in the card and a
              verb somewhere below it. Owned pieces get the plain equip
              button; there's nothing to charge. */}
          <button
            onClick={() => void onPrimary()}
            disabled={busy || equipped || (!unlocked && missing > 0)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-bold tracking-wide transition-colors ${
              equipped
                ? 'cursor-default border border-violet-400/30 bg-violet-500/10 text-violet-200'
                : unlocked
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-400'
                  : missing > 0
                    ? 'cursor-not-allowed border border-white/5 bg-white/[0.04] text-neutral-500'
                    : 'border border-indigo-400/30 bg-indigo-500/[0.12] text-indigo-100 hover:bg-indigo-500/[0.2]'
            }`}
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : unlocked ? (
              primaryLabel
            ) : (
              <>
                <Gem size={16} className="opacity-85" />
                <span className="tabular-nums">{price.toLocaleString(locale)}</span>
              </>
            )}
          </button>

          {!unlocked && missing > 0 && (
            <p className="mt-2 text-center text-[12px] font-medium text-rose-300/90">
              {(missing === 1 ? strings.profile.detailMissingGemsOne : strings.profile.detailMissingGems).replace('{n}', missing.toLocaleString(locale))}
            </p>
          )}
          {error && (
            <p className="mt-2 text-center text-[12px] font-medium text-rose-300/90">
              {strings.profile.detailError}
            </p>
          )}
        </div>
      </div>

      {showGemPacks && (
        <GemPacksModal locale={locale} strings={strings.store} onClose={() => setShowGemPacks(false)} />
      )}
    </div>
  )
}
