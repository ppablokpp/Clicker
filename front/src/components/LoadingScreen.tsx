import { useState } from 'react'
import { SpaceObject } from './SpaceObject'
import { useLanguage } from '../context/LanguageContext'

/**
 * The loading screen is the game's own first frame now: the Amatista rock —
 * the one every account starts on — with its ring, and a lit arc going round
 * it where the progress would be. It's the very same <SpaceObject> Home
 * draws, in the very same box, at the very same place on screen, so the
 * cover lifting onto Home is the rock staying put and the ring settling into
 * a percentage — not a spinner being swapped for a scene.
 *
 * Amatista is hard-coded rather than read from the save on purpose: this
 * screen is on precisely while that save is still arriving.
 */
const AMATISTA_TIER = 0

/**
 * Phase-locks the loops to wall clock instead of to mount time.
 *
 * The cover is mounted once per startup (see LoadingGate), but a hot reload
 * or a sign-in that restarts the gates can still re-create it, and a CSS
 * animation restarts at 0% when that happens. A negative delay of
 * `now % duration` starts each animation already that far in, so its phase is
 * a function of the clock rather than of when the element appeared.
 *
 * The lazy initialiser is the load-bearing part: computed once per MOUNT and
 * then frozen. Computed per render it re-seats a running animation on every
 * re-render, which is strictly worse than no fix at all.
 */
function usePhases() {
  const [phases] = useState(() => {
    const now = performance.now()
    return {
      twinkle: { animationDelay: `-${now % 3500}ms` },
      // Where in the status cycle the clock is, for the lines below.
      lines: now % CYCLE_MS,
    }
  })
  return phases
}

// A whole starfield from one 1x1px element — every star is another point in
// a single box-shadow list, so there's no per-star DOM cost. Two layers, one
// dim and still, one bright and twinkling. Same trick as Home's sky, which is
// what this screen hands over to.
function generateStars(count: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    stars.push(`${x}vw ${y}vh 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

/** How long each status line owns the screen. The lines are pure CSS on a
 *  shared clock — no timer, nothing to re-render while the providers behind
 *  the cover are busy. Four slots, and the keyframes (loader-line in
 *  index.css) are cut for exactly four, so the list is capped here. */
const STEP_MS = 1500
const STEP_COUNT = 4
const CYCLE_MS = STEP_MS * STEP_COUNT

export function LoadingScreen() {
  const phases = usePhases()
  const { strings } = useLanguage()
  const [stars] = useState(() => ({ dim: generateStars(90, 0.35), bright: generateStars(28, 0.85) }))
  const steps = strings.loading.steps.slice(0, STEP_COUNT)

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#08080c]">
      {/* Sky. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: stars.dim }} />
        <div
          className="animate-twinkle absolute h-px w-px rounded-full bg-white"
          style={{ boxShadow: stars.bright, ...phases.twinkle }}
        />
      </div>

      {/* Home's click box, box for box: the same h-72/h-96 square centred by
          the root's own justify-center, the same 0.85 shrink inside it. The
          rock lands on the same pixel it will occupy once the cover lifts.
          The wordmark hangs off the box's bottom edge rather than sitting in
          flow under it, so it can't push the rock off centre. */}
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
        <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.85)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <SpaceObject tierIndex={AMATISTA_TIER} pct={0} isMaxed={false} paused={false} ringMode="orbit" idPrefix="loader" />
          </div>
        </div>

        {/* Wordmark and status. The status lines all live in one grid cell
            and take turns through a staggered animation, so the block never
            changes height. */}
        <div className="absolute left-0 right-0 top-full -mt-6 flex flex-col items-center gap-3">
          <span
            className="text-[13px] font-bold uppercase tracking-[0.42em] text-violet-100/90"
            style={{ textIndent: '0.42em' }}
          >
            ClankUp
          </span>
          <span className="h-px w-8 bg-violet-300/25" />
          <div className="grid h-5 place-items-center">
            {steps.map((line, i) => (
              <span
                key={line}
                className="col-start-1 row-start-1 whitespace-nowrap text-[11px] font-medium tracking-[0.18em] text-violet-200/70"
                style={{
                  opacity: 0,
                  animation: `loader-line ${CYCLE_MS}ms ease-in-out infinite`,
                  // Every line runs the same cycle, offset by its slot — and
                  // the whole set is phase-locked to the clock like the rest.
                  // Always negative, so no line sits waiting for a first turn.
                  animationDelay: `-${phases.lines + (STEP_COUNT - i) * STEP_MS}ms`,
                }}
              >
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
