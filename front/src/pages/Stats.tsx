import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarCheck, Flame, Medal } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUserStats } from '../hooks/useUserStats'
import { useClickDays } from '../hooks/useClickDays'
import {
  STAT_CATEGORIES,
  MILESTONE_TIER_KEYS,
  MILESTONE_TIER_COLORS,
  MILESTONE_TIER_GRADIENTS,
  type StatCategoryKey,
} from '../stats/config'
import { CircularProgress } from '../components/CircularProgress'
import { toLocalDateString } from '../lib/date'

// Lowest milestone in the list that isn't reached yet — the last one if
// every tier is already reached.
function defaultMilestone(milestones: number[], value: number): number {
  return milestones.find((m) => value < m) ?? milestones[milestones.length - 1]
}

const DAY_CARD_WIDTH = 64
const DAY_CARD_HEIGHT = 76
const DAY_CARD_GAP = 10
const DAY_CARD_SPAN = DAY_CARD_WIDTH + DAY_CARD_GAP
// How far past today the strip still renders (empty, unclickable) cards —
// lets the calendar read as "still going", not a hard stop at today.
const FUTURE_DAYS_PADDING = 10
// Always visible before the earliest day the strip would otherwise start
// at (today for a brand-new user, the first click day otherwise) — so
// there's always a bit of "before" to scroll into, not a hard wall.
const PAST_DAYS_PADDING = 5

interface CalendarDay {
  iso: string
  date: Date
  isToday: boolean
  isFuture: boolean
}

// Runs from a few days before the user's very first click day (or before
// today, if they haven't clicked yet) up through today + a short future
// padding — today itself is what the strip scrolls to on load, with the
// past reachable by scrolling back and a handful of upcoming days visible
// ahead of it.
function getCalendarDays(clickDays: Set<string>): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let start = today
  if (clickDays.size > 0) {
    const earliestIso = [...clickDays].sort()[0]
    const [y, m, d] = earliestIso.split('-').map(Number)
    start = new Date(y, m - 1, d)
  }
  start = new Date(start)
  start.setDate(start.getDate() - PAST_DAYS_PADDING)

  const end = new Date(today)
  end.setDate(end.getDate() + FUTURE_DAYS_PADDING)

  const days: CalendarDay[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const iso = toLocalDateString(cursor)
    days.push({ iso, date: new Date(cursor), isToday: cursor.getTime() === today.getTime(), isFuture: cursor > today })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function Stats() {
  const { language, strings } = useLanguage()
  const { stats } = useUserStats()
  const { clickDays } = useClickDays()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  // Manual milestone pick per category — undefined means "follow the
  // default" (lowest not-yet-reached tier), so it keeps advancing on its
  // own as the stat crosses each threshold until the user taps a badge.
  const [selectedMilestones, setSelectedMilestones] = useState<Partial<Record<StatCategoryKey, number>>>({})
  const days = useMemo(() => getCalendarDays(clickDays), [clickDays])
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Today lands as the leftmost visible card — scrolling back reveals the
  // past, scrolling forward reveals the few upcoming padding days.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const todayIndex = days.findIndex((d) => d.isToday)
    if (todayIndex >= 0) el.scrollLeft = todayIndex * DAY_CARD_SPAN
  }, [days])

  // A plain vertical mouse wheel does nothing on a horizontal-only
  // scroller by default (only touch/trackpad swipes do) — redirect it here
  // so a desktop mouse wheel can scroll the strip too. Needs a real DOM
  // listener (not JSX onWheel) since React registers wheel as passive,
  // which silently ignores preventDefault.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

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
              return (
                <div
                  key={iso}
                  className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                    clicked
                      ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                      : isFuture
                        ? 'border-dashed border-white/5 text-neutral-700'
                        : 'border-white/5 bg-white/[0.02] text-neutral-600'
                  } ${isToday ? 'border-2 border-white/40' : ''}`}
                  style={{ width: DAY_CARD_WIDTH, height: DAY_CARD_HEIGHT }}
                >
                  {!clicked && (
                    <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                      {monthFormatter.format(date)}
                    </span>
                  )}
                  {clicked ? <CalendarCheck size={18} /> : date.getDate()}
                </div>
              )
            })}
          </div>

          <div
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-orange-400/30 bg-orange-500/10"
            style={{ width: DAY_CARD_WIDTH, height: DAY_CARD_HEIGHT }}
          >
            <Flame size={18} className="text-orange-400" />
            <span className="text-lg font-bold tabular-nums text-orange-200">{stats.currentStreak}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {STAT_CATEGORIES.map(({ key, statKey, icon: Icon, color, milestones }) => {
            const value = stats[statKey]
            const category = strings.stats.categories[key]
            const target = selectedMilestones[key] ?? defaultMilestone(milestones, value)
            const reachedTarget = value >= target
            const pct = Math.min(value / target, 1)
            const tierIndex = milestones.indexOf(target)
            const tierKey = MILESTONE_TIER_KEYS[tierIndex]
            const gradient = MILESTONE_TIER_GRADIENTS[tierKey]
            const isLastTier = tierIndex === milestones.length - 1
            // Once a tier is reached, freeze the numerator at its own
            // threshold (e.g. "1.000 / 1.000") instead of the live stat
            // value, which may already be well past it — except the very
            // last tier, which has nothing above it to freeze toward, so
            // its number just keeps climbing past the requirement instead.
            const displayValue = reachedTarget && !isLastTier ? target : value

            return (
              <div
                key={key}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center"
              >
                <div>
                  <div className="text-sm font-semibold text-neutral-200">{category.label}</div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {strings.stats.milestoneDescriptions[key](target.toLocaleString(locale))}
                  </p>
                </div>

                <div className="relative flex h-36 w-36 items-center justify-center">
                  {/* In progress: the same shared violet→fuchsia ring as
                      always. Completed: recolor it to the reached tier. */}
                  {reachedTarget ? (
                    <CircularProgress pct={pct} size={144} strokeWidth={8} gradientFrom={gradient.from} gradientTo={gradient.to} />
                  ) : (
                    <CircularProgress pct={pct} size={144} strokeWidth={8} />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
                    <Icon size={16} className={`mb-1 ${color}`} />
                    <span className="text-xl font-bold tabular-nums text-white">
                      {displayValue.toLocaleString(locale)}
                    </span>
                    <span className="mt-0.5 text-[10px] tabular-nums text-neutral-600">
                      / {target.toLocaleString(locale)} {category.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {milestones.map((milestone, tierIndex) => {
                    const tierKey = MILESTONE_TIER_KEYS[tierIndex]
                    const reached = value >= milestone
                    const isSelected = target === milestone
                    return (
                      <button
                        key={milestone}
                        onClick={() => setSelectedMilestones((prev) => ({ ...prev, [key]: milestone }))}
                        aria-label={`${strings.stats.milestoneTiers[tierKey]} · ${milestone.toLocaleString(locale)} ${category.unit}`}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                          isSelected ? 'border-white/40 bg-white/10' : 'border-white/5 bg-white/[0.02]'
                        }`}
                      >
                        <Medal size={14} className={reached ? MILESTONE_TIER_COLORS[tierKey] : 'text-neutral-700'} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
