import type { ReactNode } from 'react'
import { Crosshair, Plane, Sparkles, Split } from 'lucide-react'
import { StallModalHeader, StallModalWall } from './StallModalHeader'
import { DroneIcon } from './DroneIcon'
import { useLanguage } from '../context/LanguageContext'
import { formatPlatino, formatRate } from '../lib/formatPlatino'

// The fleet report — "Centro de mando" — that Home opens from the cockpit
// and the Nodo opens from the station. It used to be inline in Home; the
// station needed the same modal, so it lives here and both hand it the
// figures. The numbers are Home's derived values (the tree's levels and
// rates, the luck the player actually has once a powerup is counted), passed
// in rather than re-derived, so the two callers can never disagree.

export interface FleetReportFigures {
  currentMaterialName: string
  /** "am/s", "pt/s"… — the unit of whatever is being mined. */
  cpsUnit: string
  autoClickLevel: number
  autoClickCps: number
  scoutDroneLevel: number
  scoutDroneRate: number
  scoutDroneCps: number
  gunnerLevel: number
  gunnerRate: number
  gunnerCps: number
  multiShotValue: number
  baseClickMultiplier: number
  tapMultiplierValue: number
  autoMultiplierValue: number
  moneyMultiplier: number
  /** Whether there is any luck to report at all — a permanent level or an
   *  active powerup. */
  hasLuck: boolean
  /** The better of the permanent luck chance and an active powerup's. */
  luckChance: number
  combinedLuckMultiplier: number
  offlineProductionValue: number
}

/**
 * The console's parts. A Panel is one plate of the console: a recessed
 * dark box with a bevel, a scanline over it, its label riveted to the top
 * edge in mono caps. A Gauge is one instrument on a plate: a big figure
 * with its light beside it. A Bay is a hangar slot: the unit's icon, how
 * many, and what each one makes — dashed and dark when nothing is docked.
 */
function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-white/[0.08]"
      style={{
        background: 'linear-gradient(180deg, #14141c 0%, #0e0e14 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />
      <div className="relative flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_5px_1px_rgba(167,139,250,0.7)]" />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-neutral-400">{label}</span>
        <span className="ml-auto flex gap-1">
          <span className="h-1 w-1 rounded-full bg-white/15" />
          <span className="h-1 w-1 rounded-full bg-white/15" />
        </span>
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}

function Gauge({
  icon,
  tone,
  label,
  value,
  caption,
  dim,
}: {
  icon: ReactNode
  tone: string
  label: string
  value: string
  caption: string
  dim?: boolean
}) {
  return (
    <div className="flex flex-col items-center px-1.5 py-3 text-center">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{ color: tone, background: `${tone}22`, boxShadow: dim ? undefined : `0 0 10px ${tone}55` }}
      >
        {icon}
      </span>
      <p
        className="mt-2 font-[Space_Grotesk] text-2xl font-bold leading-none tabular-nums"
        style={{ color: dim ? '#525252' : '#fff' }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold text-neutral-200">{label}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-neutral-500">{caption}</p>
    </div>
  )
}

function Bay({
  tone,
  icon,
  label,
  count,
  each,
  installed,
  notInstalled,
}: {
  tone: string
  icon: ReactNode
  label: string
  count: number
  each: string
  installed: boolean
  notInstalled?: string
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg px-1.5 py-3 text-center ${installed ? 'border border-white/[0.07]' : 'border border-dashed border-white/[0.08]'}`}
      style={{ background: installed ? `linear-gradient(180deg, ${tone}14, transparent 70%)` : undefined }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ color: installed ? tone : '#525252', background: installed ? `${tone}22` : 'rgba(255,255,255,0.04)' }}
      >
        {icon}
      </span>
      <p
        className="mt-2 font-[Space_Grotesk] text-2xl font-bold leading-none tabular-nums"
        style={{ color: installed ? '#fff' : '#525252' }}
      >
        {installed ? count : 0}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold leading-tight text-neutral-200">{label}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-neutral-500">{installed ? each : notInstalled}</p>
    </div>
  )
}

/** The command centre's stall colour: the ship's violet. */
const STALL_VIOLET = { fill: '#a78bfa', glow: 'rgba(168,85,247,0.6)' }

export function FleetReportModal({ figures, onClose }: { figures: FleetReportFigures; onClose: () => void }) {
  const { language, strings } = useLanguage()
  const {
    currentMaterialName,
    cpsUnit,
    autoClickLevel,
    autoClickCps,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneCps,
    gunnerLevel,
    gunnerRate,
    gunnerCps,
    multiShotValue,
    baseClickMultiplier,
    tapMultiplierValue,
    autoMultiplierValue,
    moneyMultiplier,
    hasLuck,
    luckChance,
    combinedLuckMultiplier,
    offlineProductionValue,
  } = figures
  const totalCps = autoClickCps + scoutDroneCps + gunnerCps
  // Each unit's share of the production, for the bar — the tones are the
  // bays' own, so the bar reads as the same three things.
  const shares = [
    { key: 'drones', tone: '#a78bfa', pct: totalCps ? autoClickCps / totalCps : 0 },
    { key: 'scouts', tone: '#fbbf24', pct: totalCps ? scoutDroneCps / totalCps : 0 },
    { key: 'gunners', tone: '#22d3ee', pct: totalCps ? gunnerCps / totalCps : 0 },
  ]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onClose()}
    >
      <div
        className="bulkhead relative w-full max-w-sm overflow-hidden rounded-2xl border bg-[#0c0b11] shadow-2xl shadow-black/60"
        style={{ borderColor: '#a78bfa26' }}
        onClick={(e) => e.stopPropagation()}
      >
        <StallModalWall accent={STALL_VIOLET} onClose={() => onClose()} />
        <div className="scroll-thin relative max-h-[70vh] overflow-y-auto">
          <StallModalHeader title={strings.home.commandCenterTitle} accent={STALL_VIOLET} size="sm" />
          <div className="relative flex flex-col gap-4 px-4 pb-5 pt-4">
            {/* ── the ship: three instruments on one plate ── */}
            <Panel label={strings.home.shipSection}>
              <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
                <Gauge
                  icon={<Crosshair size={13} />}
                  tone="#f87171"
                  label={strings.home.shipPower}
                  value={formatPlatino(baseClickMultiplier * tapMultiplierValue * moneyMultiplier, language)}
                  caption={strings.home.shipPowerDesc(currentMaterialName).replace(/:$/, '')}
                />
                <Gauge
                  icon={<Split size={13} />}
                  tone="#22d3ee"
                  label={strings.home.shipMultiShot}
                  value={String(multiShotValue)}
                  caption={strings.home.shipMultiShotDesc.replace(/:$/, '')}
                />
                <Gauge
                  icon={<Sparkles size={13} />}
                  tone="#4ade80"
                  label={strings.home.shipLuckChance}
                  value={hasLuck ? `${Math.round(luckChance * 100)}%` : '—'}
                  caption={
                    hasLuck
                      ? `${strings.home.shipLuckPowerDesc.replace(/:$/, '')} ×${combinedLuckMultiplier}`
                      : strings.home.shipNotInstalled
                  }
                  dim={!hasLuck}
                />
              </div>
            </Panel>

            {/* ── production: the main readout, and who makes it ── */}
            <Panel label={strings.home.shipDroneProduction}>
              <div className="flex items-end justify-between gap-3 px-4 pt-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-neutral-500">
                    {strings.home.shipDroneProductionDesc.replace(/:$/, '')}
                  </p>
                  <p className="mt-0.5 font-[Space_Grotesk] text-3xl font-bold leading-none tabular-nums text-white">
                    {formatPlatino(totalCps, language)}
                    <span className="ml-1 text-sm font-semibold text-violet-300">{cpsUnit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-neutral-500">
                    {strings.home.shipOfflineProductionDesc.replace(/:$/, '')}
                  </p>
                  <p className="mt-0.5 font-[Space_Grotesk] text-base font-bold leading-none tabular-nums text-neutral-200">
                    {formatRate(totalCps * offlineProductionValue, language)}
                    <span className="ml-1 text-[11px] font-semibold text-neutral-500">{cpsUnit}</span>
                  </p>
                </div>
              </div>
              {/* the share bar: each unit's part of the total, in its light */}
              <div className="mx-4 mb-3 mt-3 flex h-2 gap-px overflow-hidden rounded-full bg-white/[0.05]">
                {shares.map((sh) => (
                  <span
                    key={sh.key}
                    style={{
                      width: `${sh.pct * 100}%`,
                      background: sh.tone,
                      boxShadow: sh.pct ? `0 0 8px ${sh.tone}88` : undefined,
                    }}
                  />
                ))}
              </div>
            </Panel>

            {/* ── the fleet: three bays ── */}
            <Panel label={strings.home.fleetSection}>
              <div className="grid grid-cols-3 gap-2 p-3">
                <Bay
                  tone="#a78bfa"
                  icon={<DroneIcon size={16} />}
                  label={strings.home.shipDroneCount}
                  count={autoClickLevel}
                  each={`${formatRate(autoMultiplierValue, language)} ${cpsUnit}`}
                  installed
                />
                <Bay
                  tone="#fbbf24"
                  icon={<DroneIcon size={16} />}
                  label={strings.home.shipScoutDrones}
                  count={scoutDroneLevel}
                  each={`${formatRate(scoutDroneRate, language)} ${cpsUnit}`}
                  installed={scoutDroneLevel > 0}
                  notInstalled={strings.home.shipNotInstalled}
                />
                <Bay
                  tone="#22d3ee"
                  icon={<Plane size={16} />}
                  label={strings.home.shipGunners}
                  count={gunnerLevel}
                  each={`${formatRate(gunnerRate, language)} ${cpsUnit}`}
                  installed={gunnerLevel > 0}
                  notInstalled={strings.home.shipNotInstalled}
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
