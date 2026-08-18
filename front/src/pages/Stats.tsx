import { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { STAT_CATEGORIES } from '../stats/config'

interface OpenMilestone {
  categoryKey: string
  milestone: number
  unit: string
  reached: boolean
}

export function Stats() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [openMilestone, setOpenMilestone] = useState<OpenMilestone | null>(null)

  const toggleMilestone = (next: OpenMilestone) => {
    setOpenMilestone((current) =>
      current?.categoryKey === next.categoryKey && current?.milestone === next.milestone
        ? null
        : next,
    )
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
          {STAT_CATEGORIES.map(({ key, icon: Icon, color, max, milestones }) => {
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

                  {milestones.map((milestone) => {
                    const reached = value >= milestone
                    const leftPct = Math.min((milestone / max) * 100, 100)
                    return (
                      <button
                        key={milestone}
                        onClick={() =>
                          toggleMilestone({ categoryKey: key, milestone, unit: category.unit, reached })
                        }
                        style={{ left: `${leftPct}%` }}
                        aria-label={`${milestone} ${category.unit}`}
                        className="absolute top-1/2 z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      >
                        <span
                          className={`block rounded-full transition-all ${
                            reached
                              ? 'h-2.5 w-2.5 bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.8)]'
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

            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                openMilestone.reached
                  ? 'bg-gradient-to-br from-yellow-400/30 to-amber-500/20'
                  : 'bg-white/5'
              }`}
            >
              <span
                className={`block rounded-full ${
                  openMilestone.reached
                    ? 'h-3 w-3 bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]'
                    : 'h-2.5 w-2.5 border border-neutral-500'
                }`}
              />
            </div>

            <p className="font-[Space_Grotesk] text-xl font-bold text-white">
              {openMilestone.milestone.toLocaleString(locale)} {openMilestone.unit}
            </p>
            <p className={`mt-1 text-sm ${openMilestone.reached ? 'text-yellow-300' : 'text-neutral-500'}`}>
              {openMilestone.reached ? strings.stats.reached : strings.stats.rewardTbd}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
