import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, Gem, Palette } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
// The per-option piece renderer lives beside the drawings themselves so the
// store's cosmetics chest shows the identical art these cards do.
import { AstronautPieceById } from '../components/AstronautPiecePreview'
import { GemsPill } from '../components/GemsPill'
import { GemPacksModal } from './Store'
import { useLanguage } from '../context/LanguageContext'
import { useAppAuth } from '../hooks/useAppAuth'
import { useCosmetics } from '../context/CosmeticsContext'
import { useGemsContext } from '../context/GemsContext'
import { fetchMyStyle, saveMyStyle } from '../lib/astronautStyleApi'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import {
  COSMETIC_CATALOG,
  COSMETIC_GEM_PRICES as PRICES,
  COSMETIC_RARITY_ORDER,
  getCosmetic,
} from '../store/cosmeticCase'
import {
  ACCENT_STYLES,
  BELT_STYLES,
  BOOT_STYLES,
  BRACELET_STYLES,
  ANTENNA_SHAPES,
  PACK_SHAPES,
  TRAIL_SHAPES,
  BADGE_SHAPES,
  PET_SHAPES,
  VISOR_SHAPES,
  BACKGROUND_SHAPES,
  HELMET_STYLES,
  SUIT_STYLES,
  isDefaultCosmetic,
  loadStyleIds,
  saveStyleIds,
  type AstronautStyleIds,
} from '../lib/astronautStyles'

type SlotKey = keyof AstronautStyleIds

// Tabs group slots by where they live on the character, so a tab is "this
// part of the astronaut" rather than one item each — twelve slots would
// otherwise need twelve tabs, which no phone strip survives.
const TABS: {
  id: string
  icon: 'helmet' | 'suit' | 'pet' | 'accessories' | 'accent'
  label: 'tabHead' | 'tabBody' | 'slotPet' | 'slotBracelet' | 'slotAccent'
  slots: SlotKey[]
}[] = [
  { id: 'head', icon: 'helmet', label: 'tabHead', slots: ['helmet', 'visor', 'antenna'] },
  // Boots moved in with the suit: they're the bottom of the same garment,
  // and one tab holding a single three-option slot was the thinnest tab in
  // the strip while the pet — a whole second character — had none at all.
  { id: 'body', icon: 'suit', label: 'tabBody', slots: ['suit', 'pack', 'boots'] },
  { id: 'accessories', icon: 'accessories', label: 'slotBracelet', slots: ['bracelet', 'belt'] },
  { id: 'pet', icon: 'pet', label: 'slotPet', slots: ['pet', 'pet2'] },
  { id: 'accent', icon: 'accent', label: 'slotAccent', slots: ['background', 'accent', 'badge', 'trail'] },
]

const SLOT_LABELS: Record<SlotKey, string> = {
  helmet: 'slotHelmet',
  visor: 'slotVisor',
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
  background: 'slotBackground',
}

const RARITY_RANK = new Map(COSMETIC_RARITY_ORDER.map((rarity, i) => [rarity, i]))

/**
 * Where a piece sits in the grid: the free stock piece first, then everything
 * else common → exceptional.
 *
 * The stock piece leads rather than sorting in as "rarity zero" because it
 * isn't a rarity at all — it's the thing you already have, and a rack you
 * scroll should start from what you're wearing and climb.
 */
function rarityRank(slot: SlotKey, id: string): number {
  if (isDefaultCosmetic(slot, id)) return -1
  const item = getCosmetic(slot, id)
  return item ? (RARITY_RANK.get(item.rarity) ?? 90) : 90
}

/**
 * Every option for a slot, in rarity order. Same ordering in every slot —
 * colourways, suits, companions alike — so a card's position on the shelf
 * always means the same thing and the last row is always the one worth
 * chasing.
 *
 * Ties keep their catalogue order, so the colours inside a band stay in the
 * sequence they were designed in instead of being shuffled by the sort.
 */
function optionIds(slot: SlotKey): string[] {
  return slotOptionIds(slot)
    .map((id, i) => ({ id, i, rank: rarityRank(slot, id) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((o) => o.id)
}

function slotOptionIds(slot: SlotKey): string[] {
  switch (slot) {
    case 'helmet':
      return HELMET_STYLES.map((o) => o.id)
    case 'suit':
      return SUIT_STYLES.map((o) => o.id)
    case 'boots':
      return BOOT_STYLES.map((o) => o.id)
    case 'bracelet':
      return BRACELET_STYLES.map((o) => o.id)
    case 'belt':
      return BELT_STYLES.map((o) => o.id)
    case 'accent':
      return ACCENT_STYLES.map((o) => o.id)
    case 'antenna':
      return ANTENNA_SHAPES.map((o) => o.id)
    case 'pack':
      return PACK_SHAPES.map((o) => o.id)
    case 'trail':
      return TRAIL_SHAPES.map((o) => o.id)
    case 'badge':
      return BADGE_SHAPES.map((o) => o.id)
    case 'pet':
    case 'pet2':
      return PET_SHAPES.map((o) => o.id)
    case 'visor':
      return VISOR_SHAPES.map((o) => o.id)
    case 'background':
      return BACKGROUND_SHAPES.map((o) => o.id)
  }
}

// Tab glyphs are the pieces themselves, at icon scale: the exact same path
// data AstronautAvatar and AstronautPiecePreview draw, flattened to a solid
// silhouette in `currentColor`. Not an icon-set approximation and not a
// hand-drawn lookalike — a tab that means "this helmet" should be that
// helmet's actual outline, so it can never drift from what the cards below
// it sell.
//
// Solid fill instead of strokes on purpose: overlapping shapes merge into
// one chunky mass, which is what reads at ~23px. An outlined version of the
// same geometry turns to spaghetti at this size.
//
// Each glyph carries its own viewBox cropped to its content, so the pieces
// all end up optically similar in size despite living at wildly different
// coordinates in the character.
function SlotIcon({ kind, size = 23 }: { kind: string; size?: number }) {
  switch (kind) {
    case 'helmet':
      return (
        <svg width={size} height={size} viewBox="28 0 124 124" fill="currentColor" aria-hidden="true">
          <path d="M124 30 L138 12" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
          <circle cx="138" cy="12" r="8" />
          <rect x="68" y="94" width="44" height="22" rx="11" />
          <circle cx="90" cy="66" r="54" />
        </svg>
      )
    case 'suit':
      // Traced from the card's garment (AstronautPiecePreview's SuitPiece),
      // not from the worn body: the character's own arms hang far out to
      // the sides, which at icon scale letterboxes into a squat, too-wide
      // blob. The garment's tucked sleeves give a near-square silhouette
      // that actually reads as a suit.
      return (
        <svg width={size} height={size} viewBox="8 12 84 74" fill="currentColor" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="15" strokeLinecap="round">
            <path d="M32 34 C22 42 18 54 19 64" />
            <path d="M68 34 C78 42 82 54 81 64" />
          </g>
          <rect x="39" y="16" width="22" height="11" rx="5.5" />
          <rect x="22" y="24" width="20" height="15" rx="7.5" />
          <rect x="58" y="24" width="20" height="15" rx="7.5" />
          <rect x="27" y="22" width="46" height="60" rx="17" />
        </svg>
      )
    case 'boots':
      return (
        <svg width={size} height={size} viewBox="6 26 88 58" fill="currentColor" aria-hidden="true">
          <rect x="14" y="34" width="30" height="42" rx="13" transform="rotate(-7 29 55)" />
          <rect x="56" y="34" width="30" height="42" rx="13" transform="rotate(7 71 55)" />
        </svg>
      )
    case 'pet':
      // The droid's own chassis, fins and antenna, flattened. Its eye is cut
      // out rather than filled: at 23px a solid blob loses the one feature
      // that makes it read as a creature instead of a backpack, and a hole
      // survives where a second fill colour wouldn't (the tab flips between
      // white-on-dark and dark-on-white).
      return (
        <svg width={size} height={size} viewBox="-24 -29 48 48" fill="currentColor" aria-hidden="true">
          <path d="M0 -14 L0 -23" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="0" cy="-25" r="3.6" />
          <rect x="-22" y="-7.5" width="8" height="15" rx="4" />
          <rect x="14" y="-7.5" width="8" height="15" rx="4" />
          <path
            d="M-2 -14 H2 A13 13 0 0 1 15 -1 V1 A13 13 0 0 1 2 14 H-2 A13 13 0 0 1 -15 1 V-1 A13 13 0 0 1 -2 -14 Z
               M6.5 -1 A6.5 6.5 0 1 1 -6.5 -1 A6.5 6.5 0 1 1 6.5 -1 Z"
            fillRule="evenodd"
          />
        </svg>
      )
    case 'accessories':
      return (
        <svg width={size} height={size} viewBox="4 20 92 58" fill="none" stroke="currentColor" aria-hidden="true">
          <ellipse cx="36" cy="38" rx="22" ry="9.5" strokeWidth="10" transform="rotate(-14 36 38)" />
          <ellipse cx="52" cy="62" rx="25" ry="11" strokeWidth="11" transform="rotate(-14 52 62)" />
        </svg>
      )
    case 'effects':
      // The thruster plume — the effects tab's own headline piece, and the
      // one shape that already means "something is coming off the suit".
      return (
        <svg width={size} height={size} viewBox="14 10 72 80" fill="currentColor" aria-hidden="true">
          <path d="M50 14 C76 30 84 52 50 88 C16 52 24 30 50 14 Z" />
        </svg>
      )
    default:
      // The one tab that isn't a single wearable — it's the colour scheme
      // running across the trim, the jetpack and the thruster at once. So
      // it takes the conventional palette icon instead of a silhouette:
      // drawing any one of those parts would imply the tab only changes
      // that part.
      return <Palette size={size - 2} aria-hidden="true" />
  }
}

/**
 * The rarity ladder's own colour, shared with the chest reel and its odds
 * table, so a tier looks the same wherever it turns up.
 *
 * Stock-kit pieces have no rarity, and they take the Consumer colour rather
 * than a neutral: they're the bottom of the same ladder, and giving them a
 * grey of their own would break a shelf that otherwise reads as one
 * continuous gradient from cheap to rare.
 */
function rarityColor(slot: SlotKey, id: string): string {
  const item = getCosmetic(slot, id)
  const rarity = item?.rarity ?? 'consumer'
  return (CASE_PRIZE_STYLES[rarity] ?? DEFAULT_CASE_PRIZE_STYLE).color
}

// A full screen rather than a modal, reached from the pencil on the
// profile's astronaut — same treatment as a public profile: no bottom nav
// (see BottomNavPill), just a back arrow.
//
// The character stays pinned at the top and the pickers live underneath,
// because the avatar *is* the preview: every tap recolours it instantly, so
// the option cards only have to identify the piece, not preview the result.
// That's also why the starfield porthole is off here — behind the pickers it
// competes with them, and the point of this screen is the character.
//
// THE LOCKER. Most of the catalogue is locked, and this screen doesn't try to
// resolve that inline: every card — owned or not — opens the piece's own page
// (CosmeticDetail), which is where it goes on the astronaut and where it's
// bought or equipped. So the grid stays a rack you can scroll through without
// changing anything, and there is exactly one place in the app that can alter
// what you're wearing. The figure at the top is always your real, saved
// outfit; nothing here is ever a preview.
export function CustomizeAstronaut() {
  const navigate = useNavigate()
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const { getToken } = useAppAuth()
  const { isUnlocked, owned, loaded } = useCosmetics()
  const { gems } = useGemsContext()
  // Seeded from the local cache so the character paints correctly on the
  // first frame, then reconciled with the server row — which is the real
  // source of truth, since it's what other players see.
  const [styleIds, setStyleIds] = useState<AstronautStyleIds>(() => loadStyleIds())
  // The open tab lives in the URL, not in state, so that coming back from a
  // piece's page lands on the shelf you left. `navigate(-1)` restores the
  // whole location including this, where component state would have been
  // thrown away on unmount and dumped you back on the first tab.
  const [searchParams, setSearchParams] = useSearchParams()
  const tabId = searchParams.get('tab') ?? TABS[0].id
  // Replace rather than push: flicking through five tabs shouldn't put five
  // entries in the history for the back arrow to walk out of.
  const setTabId = (id: string) => setSearchParams({ tab: id }, { replace: true })
  const [showGemPacks, setShowGemPacks] = useState(false)
  const saveTimer = useRef<number | null>(null)
  // The choice that hasn't reached the server yet. Held in a ref so the
  // unmount cleanup can still see (and flush) it.
  const pendingSave = useRef<AstronautStyleIds | null>(null)

  // Refetched on every mount, not just the first: coming back from a detail
  // page that just bought or equipped something has to repaint the figure.
  useEffect(() => {
    let cancelled = false
    void fetchMyStyle(getToken).then((remote) => {
      // A failed fetch returns null on purpose — keep whatever is already
      // on screen rather than repainting the character as the default kit.
      if (!cancelled && remote) setStyleIds(remote)
    })
    return () => {
      cancelled = true
    }
  }, [getToken])

  // Applied and cached instantly, pushed to the server on a short debounce.
  // No save button: there's nothing to confirm and nothing to lose, so it
  // would only be ceremony between the player and what they can already see.
  // The debounce exists because flicking through six options fires six
  // choices in a second, and only the last one matters.
  const equip = (key: SlotKey, id: string) => {
    const next = { ...styleIds, [key]: id }
    setStyleIds(next)
    saveStyleIds(next)
    pendingSave.current = next
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      pendingSave.current = null
      void saveMyStyle(getToken, next)
    }, 400)
  }

  // Leaving the screen mid-debounce has to *flush* the pending save, not
  // cancel it — the last thing tapped before hitting back is exactly the
  // choice the player cared about, and it's the one still sitting in the
  // timer. `saveMyStyle` is a plain fetch with no component state behind it,
  // so it completes fine after this unmounts.
  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      if (pendingSave.current) {
        void saveMyStyle(getToken, pendingSave.current)
        pendingSave.current = null
      }
    },
    [getToken],
  )

  // How much of the catalogue is theirs. The stock kit isn't counted on
  // either side of the fraction: it was never earned, so including it would
  // start everyone at 15/59 and make the first real unlock look like noise.
  const ownedCount = COSMETIC_CATALOG.reduce(
    (n, item) => n + (owned.has(`${item.slot}:${item.id}`) ? 1 : 0),
    0,
  )

  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0]

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-16 pt-14 sm:px-6 sm:pt-16"
    >
      <button
        onClick={() => navigate(-1)}
        aria-label={strings.profile.backButton}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Gems, because every price on this screen is denominated in them and
          a price you can't weigh against your balance is just a number. Same
          pill as the store's, and it opens the same gem packs — running out
          mid-browse shouldn't send you off to find where gems are sold. */}
      <GemsPill gems={gems} locale={locale} label={strings.store.buyGemsTitle} onClick={() => setShowGemPacks(true)} />

      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Stage — nothing behind the figure. The character is the only thing
            worth looking at up here, and any disc or pool behind it just
            competes with the grid below. */}
        <div className="relative flex w-full justify-center">
          <AstronautAvatar size={168} styleIds={styleIds} />

          {/* Clear of the porthole, which is 1.5x the character's width and
              so hangs a few pixels below the avatar's own box — the pill sat
              on its rim at anything tighter than this. */}
          <span className="pointer-events-none absolute -bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">
            {strings.profile.lockerCollection}
            <span className="tabular-nums text-neutral-300">
              {ownedCount}/{COSMETIC_CATALOG.length}
            </span>
          </span>
        </div>

        {/* Tabs — icon only. With the section heading below naming whatever
            is open, a second copy of that word in the pill would be noise. */}
        <div className="mt-14 flex w-full items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabId(t.id)}
              aria-label={strings.profile[t.label] as string}
              aria-pressed={tabId === t.id}
              className={`flex flex-1 items-center justify-center rounded-full py-3 transition-colors ${
                tabId === t.id ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <SlotIcon kind={t.icon} />
            </button>
          ))}
        </div>

        {tab.slots.map((slot) => (
          <div key={slot} className="mt-5 w-full">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {strings.profile[SLOT_LABELS[slot] as keyof typeof strings.profile] as string}
            </p>
            {/* One card per piece: the art, big, and one pill underneath.
                Locked art is drawn exactly like owned art — no dimming, no
                padlock — because the point of the grid is to show off what
                you could be wearing, and a greyed-out shelf sells nothing.
                The gem pill is the only thing that marks a piece as locked.

                Two different taps, deliberately. Something you own equips on
                the spot: changing your look is the common action and it
                shouldn't cost a page. Something you don't opens its page,
                which is where it can be seen on the astronaut and bought. */}
            <div className="grid grid-cols-3 gap-2.5">
              {optionIds(slot).map((id) => {
                // Nothing is locked until ownership has actually arrived.
                // Otherwise the first paint puts a price on the player's own
                // equipped outfit for as long as the fetch takes — and being
                // told to buy back what you're wearing is a far worse failure
                // than a moment of being too permissive. The server is the
                // real gate, so a brief open client costs nothing.
                const unlocked = !loaded || isUnlocked(slot, id)
                const equipped = unlocked && styleIds[slot] === id
                const item = getCosmetic(slot, id)
                const tint = rarityColor(slot, id)
                return (
                  <button
                    key={id}
                    onClick={() =>
                      unlocked ? equip(slot, id) : navigate(`/personalizar/${slot}/${id}`)
                    }
                    aria-label={strings.profile.styleNames[id] ?? id}
                    aria-current={equipped || undefined}
                    className="relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-[filter] hover:brightness-125"
                    // Every card carries its tier's colour, owned or not, so
                    // the shelf reads as a ladder at a glance instead of
                    // needing the price on each card to be compared. Which
                    // one you're *wearing* is the tick's job, below — one
                    // signal per question.
                    style={{ backgroundColor: `${tint}1a`, borderColor: `${tint}59` }}
                  >
                    <span className="flex h-[70px] w-full items-center justify-center">
                      <AstronautPieceById slot={slot} id={id} />
                    </span>

                    {!unlocked && item ? (
                      <span className="flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/[0.10] px-2.5 py-1 text-[12px] font-semibold leading-none tabular-nums text-indigo-200">
                        <Gem size={11} className="opacity-80" />
                        {PRICES[item.rarity]}
                      </span>
                    ) : (
                      // Owned. Lit in the tier colour when it's the one on the
                      // astronaut, dimmed to a ghost when it's just in the
                      // locker — the difference between "yours" and "worn".
                      <span
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full"
                        style={
                          equipped
                            ? { backgroundColor: tint, color: '#0b0b10' }
                            : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }
                        }
                      >
                        <Check size={14} strokeWidth={equipped ? 3.5 : 3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {showGemPacks && (
        <GemPacksModal locale={locale} strings={strings.store} onClose={() => setShowGemPacks(false)} />
      )}
    </div>
  )
}
