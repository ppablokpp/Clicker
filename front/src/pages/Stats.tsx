import { useEffect, useMemo, useRef } from 'react'
import { Check, Flame } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { useClickDays } from '../hooks/useClickDays'
import { STAT_CATEGORIES } from '../stats/config'

const DAY_CARD_WIDTH = 64
const DAY_CARD_HEIGHT = 76
const DAY_CARD_GAP = 10
const DAY_CARD_SPAN = DAY_CARD_WIDTH + DAY_CARD_GAP
// How far past today the strip still renders (empty, unclickable) cards —
// lets the calendar read as "still going", not a hard stop at today.
const FUTURE_DAYS_PADDING = 10
const MONTH_LABEL_FONT = '500 10px system-ui, sans-serif'

interface CalendarDay {
  iso: string
  date: Date
  isToday: boolean
  isFuture: boolean
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Runs from the user's very first click day up through today + a short
// future padding — today itself is what the strip scrolls to on load, with
// the past reachable by scrolling back and a handful of upcoming days
// visible ahead of it.
function getCalendarDays(clickDays: Set<string>): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let start = today
  if (clickDays.size > 0) {
    const earliestIso = [...clickDays].sort()[0]
    const [y, m, d] = earliestIso.split('-').map(Number)
    start = new Date(y, m - 1, d)
  }

  const end = new Date(today)
  end.setDate(end.getDate() + FUTURE_DAYS_PADDING)

  const days: CalendarDay[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const iso = toIso(cursor)
    days.push({ iso, date: new Date(cursor), isToday: cursor.getTime() === today.getTime(), isFuture: cursor > today })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

let measureCtx: CanvasRenderingContext2D | null = null
function textWidth(text: string): number {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return Infinity
  measureCtx.font = MONTH_LABEL_FONT
  return measureCtx.measureText(text).width
}

export function Stats() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const { clickDays } = useClickDays()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const days = useMemo(() => getCalendarDays(clickDays), [clickDays])
  const shortMonthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale])
  const longMonthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long' }), [locale])
  // Full month name if it fits the card, otherwise the short/abbreviated
  // form ("Septiembre" → "sept.") — cached per month since it's identical
  // across years. Rebuilt whenever the formatters change (locale switch).
  const monthLabelCache = useMemo(() => new Map<number, string>(), [shortMonthFormatter, longMonthFormatter])
  const scrollRef = useRef<HTMLDivElement>(null)

  const getMonthLabel = (date: Date): string => {
    const key = date.getMonth()
    const cached = monthLabelCache.get(key)
    if (cached) return cached
    const full = longMonthFormatter.format(date).toUpperCase()
    const label = textWidth(full) <= DAY_CARD_WIDTH - 4 ? full : shortMonthFormatter.format(date).toUpperCase()
    monthLabelCache.set(key, label)
    return label
  }

  // Today lands as the leftmost visible card — scrolling back reveals the
  // past, scrolling forward reveals the few upcoming padding days.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const todayIndex = days.findIndex((d) => d.isToday)
    if (todayIndex >= 0) el.scrollLeft = todayIndex * DAY_CARD_SPAN
  }, [days])

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-end gap-3">
          <div
            ref={scrollRef}
            className="flex min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ gap: DAY_CARD_GAP }}
          >
            {days.map(({ iso, date, isToday, isFuture }) => {
              const clicked = clickDays.has(iso)
              const isFirstOfMonth = date.getDate() === 1
              return (
                <div
                  key={iso}
                  className="flex shrink-0 flex-col items-center"
                  style={{ width: DAY_CARD_WIDTH }}
                >
                  <span
                    className={`mb-1.5 text-[10px] font-medium tracking-wide text-neutral-600 ${
                      isFirstOfMonth ? '' : 'invisible'
                    }`}
                  >
                    {isFirstOfMonth ? getMonthLabel(date) : '·'}
                  </span>
                  <div
                    className={`flex w-full items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                      clicked
                        ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                        : isFuture
                          ? 'border-dashed border-white/5 text-neutral-700'
                          : 'border-white/5 bg-white/[0.02] text-neutral-600'
                    } ${isToday ? 'border-2 border-white/40' : ''}`}
                    style={{ height: DAY_CARD_HEIGHT }}
                  >
                    {clicked ? <Check size={18} /> : date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex shrink-0 flex-col items-center" style={{ width: DAY_CARD_WIDTH }}>
            <span className="invisible mb-1.5 text-[10px] font-medium tracking-wide">·</span>
            <div
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-orange-400/30 bg-orange-500/10"
              style={{ height: DAY_CARD_HEIGHT }}
            >
              <Flame size={18} className="text-orange-400" />
              <span className="text-lg font-bold tabular-nums text-orange-200">{stats.currentStreak}</span>
            </div>
          </div>
        </div>

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
