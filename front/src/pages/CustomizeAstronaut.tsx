import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { useLanguage } from '../context/LanguageContext'
import {
  ACCENT_STYLES,
  BOOT_STYLES,
  HELMET_STYLES,
  SUIT_STYLES,
  loadStyleIds,
  saveStyleIds,
  type AstronautStyleIds,
} from '../lib/astronautStyles'

type SlotKey = keyof AstronautStyleIds

// Each tab is just "which slot are we editing" — the options themselves,
// their swatches and their names all come from lib/astronautStyles.ts, so
// a new colourway (or eventually a new shape) never touches this file.
const SLOTS: { key: SlotKey; labelKey: 'slotHelmet' | 'slotSuit' | 'slotBoots' | 'slotAccent' }[] = [
  { key: 'helmet', labelKey: 'slotHelmet' },
  { key: 'suit', labelKey: 'slotSuit' },
  { key: 'boots', labelKey: 'slotBoots' },
  { key: 'accent', labelKey: 'slotAccent' },
]

const OPTIONS: Record<SlotKey, { id: string; swatch: string }[]> = {
  helmet: HELMET_STYLES,
  suit: SUIT_STYLES,
  boots: BOOT_STYLES,
  accent: ACCENT_STYLES,
}

// A full screen rather than a modal, reached from the pencil on the
// profile's astronaut — same treatment as a public profile: no bottom nav
// (see BottomNavPill), just a back arrow.
//
// The character stays pinned at the top and the pickers live underneath,
// because the avatar *is* the preview: every tap recolours it instantly, so
// the option chips only have to be identifiable, not to re-render the piece
// themselves. That's also why the starfield porthole is off here — behind
// the pickers it competes with them, and the point of this screen is the
// character, not the sky.
export function CustomizeAstronaut() {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const [styleIds, setStyleIds] = useState<AstronautStyleIds>(() => loadStyleIds())
  const [slot, setSlot] = useState<SlotKey>('helmet')

  // Persisted on every tap rather than behind a save button: there's no
  // failure case to confirm and nothing to lose, so a "save" step would
  // only be ceremony between the player and the thing they can already see.
  const choose = (key: SlotKey, id: string) => {
    const next = { ...styleIds, [key]: id }
    setStyleIds(next)
    saveStyleIds(next)
  }

  const options = OPTIONS[slot]

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

        {/* Tabs. */}
        <div className="mt-6 flex w-full items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
          {SLOTS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setSlot(key)}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                slot === key ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {strings.profile[labelKey]}
            </button>
          ))}
        </div>

        {/* Options for the active slot. The swatch is the real colour the
            piece takes, so the grid reads as a paint tray rather than as a
            list of names. */}
        <div className="mt-4 grid w-full grid-cols-3 gap-2.5">
          {options.map((opt) => {
            const selected = styleIds[slot] === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => choose(slot, opt.id)}
                aria-pressed={selected}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors ${
                  selected
                    ? 'border-violet-400/50 bg-violet-500/[0.10]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <span
                  className="h-11 w-11 rounded-full shadow-inner"
                  style={{
                    background: `radial-gradient(circle at 32% 26%, #ffffff 0%, ${opt.swatch} 58%, rgba(0,0,0,0.45) 130%)`,
                  }}
                />
                <span className={`text-[11px] font-medium ${selected ? 'text-violet-100' : 'text-neutral-500'}`}>
                  {strings.profile.styleNames[opt.id] ?? opt.id}
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
    </div>
  )
}
