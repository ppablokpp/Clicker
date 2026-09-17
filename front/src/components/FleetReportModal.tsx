import { ChartNoAxesCombined, Crosshair, Joystick, Plane, Sparkles, Split, X } from 'lucide-react'
import { DroneIcon } from './DroneIcon'
import { useLanguage } from '../context/LanguageContext'
import { formatPlatino, formatRate } from '../lib/formatPlatino'

// The fleet report — "Centro de mando" — that Home opens from the cockpit
// and the Nodo opens from the station. It used to be inline in Home; the
// station needed the same modal, so it lives here and both hand it the
// figures. The numbers are Home's derived values (the tree's levels and
// rates, the luck the player actually has once a powerup is counted), passed
// in rather than re-derived, so the two callers can never disagree.

const MODAL_CLIP_PATH =
  'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))'

// The scanline texture + corner rivets from the cockpit header/tab bar,
// dropped into the modal's own outer card unchanged.
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onClose()}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-t-sm border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
        style={{ clipPath: MODAL_CLIP_PATH }}
        onClick={(e) => e.stopPropagation()}
      >
        <CockpitModalChrome />
        {/* Cockpit-glow header strip — same radial-gradient trick as the
            asteroid/prestige glows elsewhere (never a CSS `blur()`, which
            flashes-to-square on some mobile Chromium builds). */}
        <div className="relative overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)' }}
          />
          <button
            onClick={() => onClose()}
            aria-label="Close"
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
          >
            <X size={16} />
          </button>
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
              <Joystick size={19} />
            </div>
            <p className="font-[Space_Grotesk] text-base font-bold text-white">{strings.home.commandCenterTitle}</p>
          </div>
        </div>

        <div className="scroll-thin flex max-h-[60vh] flex-col gap-5 overflow-y-auto p-5">
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {strings.home.shipSection}
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                    <Crosshair size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipPower}</p>
                </div>
                <p className="text-xs text-neutral-400">
                  {strings.home.shipPowerDesc(currentMaterialName)}{' '}
                  <span className="font-semibold text-white">
                    {formatPlatino(baseClickMultiplier * tapMultiplierValue * moneyMultiplier, language)}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                    <Split size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipMultiShot}</p>
                </div>
                <p className="text-xs text-neutral-400">
                  {strings.home.shipMultiShotDesc} <span className="font-semibold text-white">{multiShotValue}</span>
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-300">
                    <Sparkles size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipLuckChance}</p>
                </div>
                {hasLuck ? (
                  <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                    <p>
                      {strings.home.shipLuckPowerDesc}{' '}
                      <span className="font-semibold text-white">{combinedLuckMultiplier}</span>
                    </p>
                    <p>
                      {strings.home.shipLuckChanceDesc}{' '}
                      <span className="font-semibold text-white">{Math.round(luckChance * 100)}%</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {strings.home.fleetSection}
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-500/20 text-zinc-300">
                    <ChartNoAxesCombined size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipDroneProduction}</p>
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                  <p>
                    {strings.home.shipDroneProductionDesc}{' '}
                    <span className="font-semibold text-white">
                      {formatPlatino(autoClickCps + scoutDroneCps + gunnerCps, language)}
                    </span>{' '}
                    {cpsUnit}
                  </p>
                  <p>
                    {strings.home.shipOfflineProductionDesc}{' '}
                    <span className="font-semibold text-white">
                      {formatRate((autoClickCps + scoutDroneCps + gunnerCps) * offlineProductionValue, language)}
                    </span>{' '}
                    {cpsUnit}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                    <DroneIcon size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipDroneCount}</p>
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                  <p>
                    {strings.home.shipDroneCountDesc}{' '}
                    <span className="font-semibold text-white">{autoClickLevel}</span>
                  </p>
                  <p>
                    {strings.home.shipDronePerUnitDesc}{' '}
                    <span className="font-semibold text-white">
                      {formatRate(autoMultiplierValue, language)}
                    </span>{' '}
                    {cpsUnit}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                    <DroneIcon size={14} />
                  </div>
                  <p className="text-sm font-semibold text-white">{strings.home.shipScoutDrones}</p>
                </div>
                {scoutDroneLevel > 0 ? (
                  <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                    <p>
                      {strings.home.shipScoutDronesCountDesc}{' '}
                      <span className="font-semibold text-white">{scoutDroneLevel}</span>
                    </p>
                    <p>
                      {strings.home.shipScoutDronesPerUnitDesc}{' '}
                      <span className="font-semibold text-white">
                        {formatRate(scoutDroneRate, language)}
                      </span>{' '}
                      {cpsUnit}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</p>
                )}
              </div>

              {/* Gunners get no "not installed" placeholder, unlike the
                  scouts above: the drone tiles describe units the fleet
                  is expected to have, where this one is off a late node
                  most accounts will never reach. An empty slot for it
                  would read as something missing rather than something
                  optional. */}
              {gunnerLevel > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5D6532]/30 text-[#c3cc85]">
                      <Plane size={14} />
                    </div>
                    <p className="text-sm font-semibold text-white">{strings.home.shipGunners}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs text-neutral-400">
                    <p>
                      {strings.home.shipGunnersCountDesc}{' '}
                      <span className="font-semibold text-white">{gunnerLevel}</span>
                    </p>
                    <p>
                      {strings.home.shipGunnersPerUnitDesc}{' '}
                      <span className="font-semibold text-white">
                        {formatRate(gunnerRate, language)}
                      </span>{' '}
                      {cpsUnit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
