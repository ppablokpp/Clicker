import { Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { ACHIEVEMENT_CATEGORIES } from '../achievements/config'

export function Achievements() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
            {strings.achievements.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{strings.achievements.subtitle}</p>
        </header>

        <div className="flex flex-col gap-7">
          {ACHIEVEMENT_CATEGORIES.map(({ key, icon: Icon, color, ring, tiers }) => {
            const value = stats[key]
            const category = strings.achievements.categories[key]
            const maxTier = tiers[tiers.length - 1]
            const nextTier = tiers.find((t) => value < t)
            const progressTarget = nextTier ?? maxTier
            const progressPct = Math.min((value / progressTarget) * 100, 100)

            return (
              <section key={key}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={color} />
                    <span className="text-sm font-semibold text-neutral-200">{category.label}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-neutral-500">
                    {Math.min(value, progressTarget).toLocaleString(locale)} /{' '}
                    {progressTarget.toLocaleString(locale)} {category.unit}
                  </span>
                </div>

                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {tiers.map((tier) => {
                    const unlocked = value >= tier
                    return (
                      <div
                        key={tier}
                        title={unlocked ? strings.achievements.unlocked : undefined}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all ${
                          unlocked
                            ? `border-white/20 bg-white/[0.06] ring-1 ${ring}`
                            : 'border-white/5 bg-white/[0.02] opacity-50'
                        }`}
                      >
                        {unlocked ? (
                          <Check size={16} className={color} />
                        ) : (
                          <Icon size={16} className="text-neutral-600" />
                        )}
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            unlocked ? 'text-neutral-100' : 'text-neutral-500'
                          }`}
                        >
                          {tier.toLocaleString(locale)}
                        </span>
                        <span className="text-[10px] text-neutral-500">{category.unit}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
