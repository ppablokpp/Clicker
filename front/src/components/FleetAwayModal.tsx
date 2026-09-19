import { X } from 'lucide-react'
import { useTreeContext } from '../context/TreeContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { MineralIcon } from './MaterialIcons'
import { formatPlatino } from '../lib/formatPlatino'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

/**
 * The fleet's report, shown once per session right after the first
 * /api/tree/me response says how much the fleet brought in while the app
 * was closed (see TreeContext's isFirstFetchRef). By the time this renders
 * the amount is already credited: this is the hangar's delivery note, not
 * a claim.
 *
 * One of the command centre's instrument plates, on its own: the strip
 * along the top with its lamp and the name in mono caps (and the close
 * cross where the plate's rivets would be), and under it the docket —
 * what came in while you were away, the haul stacked on its light, the
 * amount stamped big in the mineral's own colour, where it went, and the
 * button.
 */
export function FleetAwayModal() {
  const { awayCredit, clearAwayCredit } = useTreeContext()
  const { prestigeTier } = useClickCounterContext()
  const { strings, language } = useLanguage()
  const tier = MATERIAL_TIER_COLORS[prestigeTier] ?? MATERIAL_TIER_COLORS[0]
  const materialName = strings.home.trajectoryTierNames[prestigeTier]
  useLockBodyScroll(awayCredit !== null)

  if (awayCredit === null) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={clearAwayCredit}
    >
      <section
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-white/[0.08]"
        style={{
          background: 'linear-gradient(180deg, #14141c 0%, #0e0e14 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* the strip: lamp, name, and the cross to close */}
        <div className="relative flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_5px_1px_rgba(167,139,250,0.7)]" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
            {strings.home.fleetAwayTitle}
          </span>
          <button
            onClick={clearAwayCredit}
            aria-label="Close"
            className="ml-auto -mr-1 flex h-6 w-6 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <X size={14} />
          </button>
        </div>

        {/* the docket */}
        <div className="relative flex flex-col items-center px-5 pb-5 pt-5 text-center">
          <p className="max-w-[24ch] text-sm leading-snug text-neutral-300">{strings.home.fleetAwayPrefix}</p>

          {/* the haul, stacked on its own pool of light */}
          <div className="relative mt-3 flex h-14 w-24 items-end justify-center">
            <span
              className="pointer-events-none absolute inset-x-2 bottom-0 h-7 rounded-[50%]"
              style={{ background: `radial-gradient(50% 60% at 50% 50%, ${tier.fill}55, transparent 70%)` }}
            />
            <span className="relative flex items-end">
              <MineralIcon size={26} style={{ color: tier.fill }} className="-mr-2 translate-y-1" />
              <MineralIcon size={34} style={{ color: tier.fill }} />
              <MineralIcon size={24} style={{ color: tier.fill }} className="-ml-2 translate-y-1" />
            </span>
          </div>

          {/* the amount, stamped */}
          <p
            className="mt-2 font-[Space_Grotesk] text-4xl font-bold leading-none tabular-nums"
            style={{ color: tier.light, textShadow: `0 0 22px ${tier.glow}` }}
          >
            {formatPlatino(awayCredit, language)}
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: `${tier.fill}b3` }}>
            {materialName}
          </p>
          <p className="mt-6 text-[13px] text-neutral-400">{strings.home.fleetAwaySuffix}</p>

          <button
            onClick={clearAwayCredit}
            className="mt-4 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
          >
            {strings.home.fleetAwayAccept}
          </button>
        </div>
      </section>
    </div>
  )
}
