import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { STAT_CATEGORIES } from '../stats/config'

export function Stats() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const locale = language === 'en' ? 'en-US' : 'es-ES'

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
          {STAT_CATEGORIES.map(({ key, icon: Icon, color, max }) => {
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

                <div className="relative h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
