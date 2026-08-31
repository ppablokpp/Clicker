import { X } from 'lucide-react'
import { useTreeContext } from '../context/TreeContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { MATERIAL_BUTTON_THEMES } from '../lib/materialTiers'
import { DroneIcon } from './DroneIcon'
import { PlatinumIcon } from './PlatinumIcon'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

// Same cut-corner header shape as Home's own cockpit-styled modals (Centro
// de mando, Inventario, Tareas) — hand-copied rather than imported since
// those three are local to Home.tsx and this modal lives at the app's top
// level instead (see App.tsx, mounted once alongside SignInModal so it can
// show up regardless of which page you land on).
const MODAL_CLIP_PATH =
  'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))'

function CockpitModalChrome() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />
      <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
      <span className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
    </>
  )
}

// Mounted once above the routes (see App.tsx), same tier as SignInModal —
// shows once per app session, right after the very first /api/tree/me
// response reveals how much the fleet accrued since the last time this
// user's tab/app was actually open (see TreeContext's isFirstFetchRef).
// Dismissing just clears the number; it's already been credited server-side
// by the time this ever renders, this is purely a "here's what happened"
// report, not a claim action.
export function FleetAwayModal() {
  const { awayCredit, clearAwayCredit } = useTreeContext()
  const { prestigeTier } = useClickCounterContext()
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const materialTheme = MATERIAL_BUTTON_THEMES[prestigeTier]
  useLockBodyScroll(awayCredit !== null)

  if (awayCredit === null) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={clearAwayCredit}
    >
      <div
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
        style={{ clipPath: MODAL_CLIP_PATH }}
        onClick={(e) => e.stopPropagation()}
      >
        <CockpitModalChrome />
        <div className="relative shrink-0 overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)' }}
          />
          <button
            onClick={clearAwayCredit}
            aria-label="Close"
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
          >
            <X size={16} />
          </button>
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
              <DroneIcon size={19} />
            </div>
            <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.fleetAwayTitle}</p>
          </div>
        </div>

        <div className="p-5">
          {/* Plain inline text flow (not flex) so words wrap one at a time
              around the pill like any other inline element — a flex
              container here would wrap the whole suffix span as one atomic
              unit instead of letting it share a line with the pill. */}
          <p className="text-sm leading-7 text-neutral-300">
            {strings.home.fleetAwayPrefix}{' '}
            <span
              className={`inline-flex translate-y-[3px] items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${materialTheme.pill}`}
            >
              <PlatinumIcon size={13} className="opacity-70" />
              {awayCredit.toLocaleString(locale)}
            </span>{' '}
            {strings.home.fleetAwaySuffix}
          </p>

          <button
            onClick={clearAwayCredit}
            className="mt-5 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
          >
            {strings.home.fleetAwayAccept}
          </button>
        </div>
      </div>
    </div>
  )
}
