import { useLanguage } from '../context/LanguageContext'
import { useRefineryContext } from '../context/RefineryContext'
import { useClickDays } from '../hooks/useClickDays'
import { formatPlatino } from '../lib/formatPlatino'
import { CORES_PER_TIER } from '../lib/refinery'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { DiaryBook, type DiaryPage } from './DiaryBook'
import {
  CalendarSketch,
  CapsulesSketch,
  PencilFilter,
  ReactorSketch,
  RefinerySketch,
  RobotSketch,
  RouteSketch,
  ShipSketch,
} from './DiarySketches'

/**
 * DIARIO — the commander's notebook, opened from the cockpit: the book
 * itself, open, over the dimmed screen, with its pages to turn.
 *
 * What goes in a notebook like this, going by the ones in the games that
 * do it well (Outer Wilds' ship log, Subnautica's PDA, Stardew's journal,
 * Hollow Knight's hunter's journal): the day's entry, the story so far as
 * it is uncovered, a field manual with the commander's own sketches, and a
 * compendium that fills in as things are found. The day's entry, the
 * manual and the compendium are in here, one to a page; the tasks board
 * will likely move in too (see Home's hidden Tareas button).
 */

const DIARY_FONT = '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive'

export interface DiaryFigures {
  tierIndex: number
  currentMaterialName: string
  lifetimePlatino: number
  autoClickLevel: number
  scoutDroneLevel: number
  gunnerLevel: number
}

export function DiaryModal({ figures, onClose }: { figures: DiaryFigures; onClose: () => void }) {
  const { language, strings } = useLanguage()
  const { core } = useRefineryContext()
  const d = strings.diary
  const tierNames = strings.home.trajectoryTierNames
  const cores = core?.cores ?? Array.from({ length: tierNames.length }, () => 0)
  const whole = cores.map((n) => n >= CORES_PER_TIER)
  const wholeCount = whole.filter(Boolean).length
  const loadedHere = Math.min(CORES_PER_TIER, cores[figures.tierIndex] ?? 0)
  const now = new Date()
  const today = now.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric',
    month: 'long',
  })
  // The day's entry: the asteroid's own three, rotating with the date so a
  // different one is written each day.
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const entries = d.todayEntries[figures.tierIndex] ?? d.todayEntries[0]
  const entry = entries[dayOfYear % entries.length]
  // The calendar: this month, with the days the commander went out to
  // mine (the stats calendar's own days) coloured in.
  const { clickDays } = useClickDays()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`
  const playedThisMonth = new Set(
    [...clickDays].filter((day) => day.startsWith(monthKey)).map((day) => Number(day.slice(8))),
  )
  const monthName = now.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  const pages: DiaryPage[] = [
    // ── the day's entry ──
    {
      head: d.todayHead,
      tab: 'report',
      content: (
        <div className="relative h-full">
          {/* the ship floats in the corner: the entry wraps round it for
              its first lines and takes the full width under it */}
          <ShipSketch className="pointer-events-none float-right -mt-1 ml-2 h-[78px] w-[56px] opacity-80" />
          <p className="text-[17px]">{today}</p>
          <p>{entry}</p>
          <ul className="mt-[26px] list-none">
            <li>· {d.todayMined(formatPlatino(figures.lifetimePlatino, language))}</li>
            <li>· {d.todayFleet(figures.autoClickLevel + figures.scoutDroneLevel + figures.gunnerLevel)}</li>
            <li>· {d.todayCapsules(loadedHere, CORES_PER_TIER)}</li>
          </ul>
          {/* C0-PI, over its signature, in the blank below the figures */}
          <RobotSketch className="pointer-events-none absolute bottom-[26px] right-0 h-[78px] w-[78px] opacity-80" />
          <p className="absolute bottom-0 right-0 -rotate-6 text-[13px] text-[#8a8070]">{d.signature}</p>
        </div>
      ),
    },
    // ── the calendar ──
    {
      head: d.calendarHead,
      tab: 'report',
      content: (
        <div>
          <p className="text-[17px] underline decoration-[#c9605a]/50 underline-offset-4">{monthTitle}</p>
          <CalendarSketch
            year={now.getFullYear()}
            month={now.getMonth()}
            today={now.getDate()}
            played={playedThisMonth}
            color={MATERIAL_TIER_COLORS[figures.tierIndex]?.fill}
            weekdays={d.calendarWeekdays}
            className="mt-[26px] h-[208px] w-full"
          />
          <p className="mt-[26px]">{d.calendarNote}</p>
          <p className="text-[13px] text-[#8a8070]">{d.calendarDaysOut(playedThisMonth.size)}</p>
        </div>
      ),
    },
    // ── the manual: the reactor ──
    {
      head: d.manualHead,
      tab: 'manual',
      content: (
        <div>
          <p className="text-[17px] underline decoration-[#c9605a]/50 underline-offset-4">{strings.ship.reactor}</p>
          <ReactorSketch
            whole={whole}
            colors={whole.map((_, i) => MATERIAL_TIER_COLORS[i]?.fill)}
            className="mx-auto mt-[26px] h-[208px] w-64"
          />
          <p className="mt-[26px]">{d.reactorNote}</p>
          <p className="text-[13px] text-[#8a8070]">{d.reactorCaption(wholeCount, whole.length)}</p>
        </div>
      ),
    },
    // ── the manual: the refinery ──
    {
      head: d.manualHead,
      tab: 'manual',
      content: (
        <div>
          <p className="text-[17px] underline decoration-[#c9605a]/50 underline-offset-4">
            {strings.home.stationRefinery}
          </p>
          <RefinerySketch className="mt-[26px] h-[104px] w-full" />
          <p className="mt-[26px]">{d.refineryNote}</p>
          <CapsulesSketch loaded={loadedHere} total={CORES_PER_TIER} className="mt-[26px] h-[26px] w-full" />
          <p className="text-[13px] text-[#8a8070]">
            {d.capsulesCaption(loadedHere, CORES_PER_TIER, figures.currentMaterialName)}
          </p>
        </div>
      ),
    },
    // ── the compendium ──
    {
      head: d.compendiumHead,
      tab: 'route',
      content: (
        <div>
          <p className="pr-2">{d.compendiumNote}</p>
          <RouteSketch
            names={tierNames}
            colors={tierNames.map((_, i) => MATERIAL_TIER_COLORS[i]?.fill)}
            reached={figures.tierIndex}
            className="h-[364px] w-full"
          />
        </div>
      ),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/70 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <PencilFilter />
      {/* the book is the whole sheet — no card round it, no title over it */}
      <div className="relative flex w-full justify-center" onClick={(e) => e.stopPropagation()}>
        {/* scaled as a whole rather than laid out smaller: every block on a
            page is sized to the rules, and a scale keeps them in step */}
        <div className="flex shrink-0 justify-center" style={{ transform: 'scale(0.923077)' }}>
          <DiaryBook pages={pages} font={DIARY_FONT} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
