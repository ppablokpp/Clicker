import { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { useMilestonesContext } from '../context/MilestonesContext'
import { STAT_CATEGORIES, MILESTONE_REWARD_TIERS, type StatAccent } from '../stats/config'

interface OpenMilestone {
  categoryKey: string
  categoryLabel: string
  milestone: number
  unit: string
  reached: boolean
  tierIndex: number
  accent: StatAccent
}

export function Stats() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const { claimed, claimingKey, claim } = useMilestonesContext()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [openMilestone, setOpenMilestone] = useState<OpenMilestone | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleMilestone = (next: OpenMilestone) => {
    setError(null)
    setOpenMilestone((current) =>
      current?.categoryKey === next.categoryKey && current?.milestone === next.milestone
        ? null
        : next,
    )
  }

  const rewardDescription = (tierIndex: number) => {
    const reward = MILESTONE_REWARD_TIERS[tierIndex]
    if (reward.type === 'powerup') {
      return strings.stats.rewardPowerup(strings.store.powerups[reward.powerupId]?.name ?? reward.powerupId)
    }
    if (reward.type === 'clicks') {
      return strings.stats.rewardClicks(reward.amount.toLocaleString(locale))
    }
    return strings.stats.rewardPermanent((1 + reward.amount).toFixed(0))
  }

  const handleClaim = async () => {
    if (!openMilestone) return
    setError(null)
    const result = await claim(openMilestone.categoryKey, openMilestone.milestone)
    if (!result.ok) setError(result.error ?? 'error')
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
            {strings.stats.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{strings.stats.subtitle}</p>
        </header>

        <div className="flex flex-col gap-12">
          {STAT_CATEGORIES.map(({ key, icon: Icon, color, max, milestones, accent }) => {
            const value = stats[key]
            const category = strings.stats.categories[key]
            const pct = Math.min((value / max) * 100, 100)

            return (
              <section key={key}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={color} />
                    <span className="text-sm font-semibold text-neutral-200">{category.label}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-neutral-500">
                    {value.toLocaleString(locale)} / {max.toLocaleString(locale)} {category.unit}
                  </span>
                </div>

                <div className="relative mb-2 h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />

                  {milestones.map((milestone, tierIndex) => {
                    const reached = value >= milestone
                    const isClaimed = claimed.has(`${key}:${milestone}`)
                    const leftPct = Math.min((milestone / max) * 100, 100)
                    return (
                      <button
                        key={milestone}
                        onClick={() =>
                          toggleMilestone({
                            categoryKey: key,
                            categoryLabel: category.label,
                            milestone,
                            unit: category.unit,
                            reached,
                            tierIndex,
                            accent,
                          })
                        }
                        style={{ left: `${leftPct}%` }}
                        aria-label={`${milestone} ${category.unit}`}
                        className="absolute top-1/2 z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      >
                        <span
                          className={`block rounded-full transition-all ${
                            isClaimed
                              ? `h-2.5 w-2.5 ${accent.dotClaimed}`
                              : reached
                                ? `h-2.5 w-2.5 ${accent.dotReached}`
                                : 'h-2 w-2 border border-neutral-500 bg-[#08080c]'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {openMilestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setOpenMilestone(null)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-6 text-center shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenMilestone(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            {(() => {
              const isClaimed = claimed.has(`${openMilestone.categoryKey}:${openMilestone.milestone}`)
              const isClaiming = claimingKey === `${openMilestone.categoryKey}:${openMilestone.milestone}`

              return (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    {openMilestone.categoryLabel}
                  </p>
                  <p className="mt-1 font-[Space_Grotesk] text-3xl font-bold text-white">
                    {openMilestone.milestone.toLocaleString(locale)}{' '}
                    <span className="text-lg font-semibold text-neutral-400">{openMilestone.unit}</span>
                  </p>

                  <div
                    className={`mt-5 rounded-xl border px-4 py-3 text-left ${openMilestone.accent.rewardBorder} ${openMilestone.accent.rewardBg}`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${openMilestone.accent.rewardLabelColor}`}>
                      {strings.stats.rewardLabel}
                    </p>
                    <p className={`mt-0.5 text-sm font-semibold ${openMilestone.accent.rewardTextColor}`}>
                      {rewardDescription(openMilestone.tierIndex)}
                    </p>
                  </div>

                  {openMilestone.reached && (
                    <button
                      onClick={handleClaim}
                      disabled={isClaimed || isClaiming}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                        isClaimed
                          ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                          : 'bg-white text-neutral-900 hover:opacity-90 disabled:opacity-60'
                      }`}
                    >
                      {isClaimed ? strings.stats.claimed : isClaiming ? strings.stats.claiming : strings.stats.claim}
                    </button>
                  )}

                  {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
