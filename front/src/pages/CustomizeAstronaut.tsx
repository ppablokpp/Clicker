import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Palette } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { AstronautPiecePreview } from '../components/AstronautPiecePreview'
import { useLanguage } from '../context/LanguageContext'
import { useAppAuth } from '../hooks/useAppAuth'
import { fetchMyStyle, saveMyStyle } from '../lib/astronautStyleApi'
import {
  ACCENT_STYLES,
  BELT_STYLES,
  BOOT_STYLES,
  BRACELET_STYLES,
  ANTENNA_SHAPES,
  PACK_SHAPES,
  TRAIL_SHAPES,
  BADGE_SHAPES,
  HELMET_STYLES,
  SUIT_STYLES,
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
  icon: 'helmet' | 'suit' | 'boots' | 'accessories' | 'accent'
  label: 'tabHead' | 'tabBody' | 'slotBoots' | 'slotBracelet' | 'slotAccent'
  slots: SlotKey[]
}[] = [
  { id: 'head', icon: 'helmet', label: 'tabHead', slots: ['helmet', 'antenna'] },
  { id: 'body', icon: 'suit', label: 'tabBody', slots: ['suit', 'pack'] },
  { id: 'boots', icon: 'boots', label: 'slotBoots', slots: ['boots'] },
  { id: 'accessories', icon: 'accessories', label: 'slotBracelet', slots: ['bracelet', 'belt'] },
  { id: 'accent', icon: 'accent', label: 'slotAccent', slots: ['accent', 'badge', 'trail'] },
]

const SLOT_LABELS: Record<SlotKey, string> = {
  helmet: 'slotHelmet',
  antenna: 'slotAntenna',
  suit: 'slotSuit',
  pack: 'slotPack',
  boots: 'slotBoots',
  bracelet: 'slotBracelet',
  belt: 'slotBelt',
  trail: 'slotTrail',
  badge: 'slotBadge',
  accent: 'slotAccent',
}

function optionIds(slot: SlotKey): string[] {
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
  }
}

// Each slot's options carry their own style type, so the preview stays
// strictly typed per piece — collapsing them into one list would lose that.
function PieceForOption({ slot, id }: { slot: SlotKey; id: string }) {
  switch (slot) {
    case 'helmet': {
      const style = HELMET_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="helmet" style={style} /> : null
    }
    case 'suit': {
      const style = SUIT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="suit" style={style} /> : null
    }
    case 'boots': {
      const style = BOOT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="boots" style={style} /> : null
    }
    case 'bracelet': {
      const style = BRACELET_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="bracelet" style={style} /> : null
    }
    case 'belt': {
      const style = BELT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="belt" style={style} /> : null
    }
    case 'accent': {
      const style = ACCENT_STYLES.find((o) => o.id === id)
      return style ? <AstronautPiecePreview slot="accent" style={style} /> : null
    }
    // Shape-only slots all take the same `{ id }` shape, so they share one
    // branch instead of six identical lookups.
    default:
      return <AstronautPiecePreview slot={slot} style={{ id }} />
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

// A full screen rather than a modal, reached from the pencil on the
// profile's astronaut — same treatment as a public profile: no bottom nav
// (see BottomNavPill), just a back arrow.
//
// The character stays pinned at the top and the pickers live underneath,
// because the avatar *is* the preview: every tap recolours it instantly, so
// the option cards only have to identify the piece, not preview the result.
// That's also why the starfield porthole is off here — behind the pickers it
// competes with them, and the point of this screen is the character.
export function CustomizeAstronaut() {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const { getToken } = useAppAuth()
  // Seeded from the local cache so the character paints correctly on the
  // first frame, then reconciled with the server row — which is the real
  // source of truth, since it's what other players see.
  const [styleIds, setStyleIds] = useState<AstronautStyleIds>(() => loadStyleIds())
  const [tabId, setTabId] = useState(TABS[0].id)
  const saveTimer = useRef<number | null>(null)
  // The choice that hasn't reached the server yet. Held separately from
  // state so the unmount cleanup can still see (and flush) it.
  const pendingSave = useRef<AstronautStyleIds | null>(null)

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
  // would only be ceremony between the player and what they can already
  // see. The debounce exists because flicking through six options fires six
  // choices in a second, and only the last one matters.
  const choose = (key: SlotKey, id: string) => {
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
  // timer. `saveMyStyle` is a plain fetch with no component state behind
  // it, so it completes fine after this unmounts.
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

  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0]

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-16 pt-14 sm:px-6 sm:pt-16">
      <button
        onClick={() => navigate(-1)}
        aria-label={strings.profile.backButton}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Stage — a soft radial pool under the character instead of the
            profile's starfield circle, so the figure reads as lit on a
            plinth rather than pasted onto a second background. */}
        <div className="relative flex w-full justify-center">
          <div
            className="pointer-events-none absolute inset-x-0 top-6 h-56 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 55% 50% at 50% 55%, rgba(168,85,247,0.16), rgba(168,85,247,0) 70%)',
            }}
          />
          <AstronautAvatar size={168} styleIds={styleIds} showSky={false} />
        </div>

        {/* Tabs — icon only. With the section heading below naming whatever
            is open, a second copy of that word in the pill would be noise. */}
        <div className="mt-6 flex w-full items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
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
            {/* Each option renders the actual piece in its own colourway, so
                the grid reads as a rack of items rather than a paint tray.
                The piece sits on a recessed panel for an "on a shelf" feel
                instead of floating on the card. */}
            <div className="grid grid-cols-3 gap-2.5">
              {optionIds(slot).map((id) => {
                const selected = styleIds[slot] === id
                return (
                  <button
                    key={id}
                    onClick={() => choose(slot, id)}
                    aria-pressed={selected}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-colors ${
                      selected
                        ? 'border-violet-400/50 bg-violet-500/[0.10]'
                        : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="flex h-[72px] w-full items-center justify-center rounded-xl bg-black/25 shadow-inner shadow-black/40">
                      <PieceForOption slot={slot} id={id} />
                    </span>
                    <span className={`text-[11px] font-medium ${selected ? 'text-violet-100' : 'text-neutral-500'}`}>
                      {strings.profile.styleNames[id] ?? id}
                    </span>
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-400 text-neutral-900">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
