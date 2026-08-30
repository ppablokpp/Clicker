import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lottie } from 'lottie-react'
import { useTutorialContext } from '../context/TutorialContext'
import { useLanguage } from '../context/LanguageContext'
import { playRobotBeep } from '../lib/caseSound'
import robotAnimation from '../assets/robotTutorial.json'

const TARGET_POLL_MS = 150
const HOLE_PADDING = 10
const BLOCK_PADDING = 6
const TYPE_INTERVAL_MS = 26
const NEXT_BUTTON_DELAY_MS = 1400

interface Rect {
  top: number
  left: number
  right: number
  bottom: number
}

function padRect(r: DOMRect, padding: number): Rect {
  return { top: r.top - padding, left: r.left - padding, right: r.right + padding, bottom: r.bottom + padding }
}

function pointInRect(x: number, y: number, r: Rect) {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

// Counts real hits toward whatever this step needs (usually 1, 5 for the
// "shoot the asteroid a few times" step) and fires once that count is
// reached. Keyed on `stepId` (not just `enabled`) — two consecutive steps
// can both be "auto-advance on click" with `enabled` never actually
// flipping between them, which used to leave the previous step's "already
// fired" flag stuck true forever and silently eat every future step's
// first click.
//
// Listens to `pointerdown` only, deliberately not also `click` — a single
// real tap on a touchscreen fires both, so counting both was silently
// double-counting every tap on mobile (5 required taps completing after
// ~2-3 real ones). `pointerdown` alone also matches Home's own real click
// handler (`onPointerDown`), so "a hit" here means the same thing as "a hit"
// there.
function useAdvanceOnRealInteraction(
  stepId: string | undefined,
  isHit: (x: number, y: number) => boolean,
  requiredClicks: number,
  enabled: boolean,
  onHit: () => void,
) {
  const countRef = useRef(0)
  const isHitRef = useRef(isHit)
  isHitRef.current = isHit

  useEffect(() => {
    countRef.current = 0
  }, [stepId])

  useEffect(() => {
    if (!enabled) return
    const handler = (e: PointerEvent) => {
      if (!isHitRef.current(e.clientX, e.clientY)) return
      countRef.current += 1
      if (countRef.current >= requiredClicks) onHit()
    }
    document.addEventListener('pointerdown', handler)
    return () => {
      document.removeEventListener('pointerdown', handler)
    }
  }, [enabled, requiredClicks, onHit])
}

function useTargetRect(targetSelector: string | undefined) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!targetSelector) {
      setRect(null)
      return
    }
    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${targetSelector}"]`)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    // Polling, not a ResizeObserver/scroll listener — the target can be on
    // a different route (opens after a nav-tree click) or inside a modal
    // that's still animating in, so there's no single event to hook that
    // reliably covers every way its position can change.
    const interval = window.setInterval(measure, TARGET_POLL_MS)
    return () => window.clearInterval(interval)
  }, [targetSelector])

  return rect
}

function useBlockRects(selectors: string[] | undefined) {
  const key = selectors?.join(',')
  const [rects, setRects] = useState<DOMRect[]>([])

  useEffect(() => {
    if (!selectors || selectors.length === 0) {
      setRects([])
      return
    }
    const measure = () => {
      setRects(
        selectors
          .map((s) => document.querySelector(`[data-tutorial="${s}"]`))
          .filter((el): el is Element => el !== null)
          .map((el) => el.getBoundingClientRect()),
      )
    }
    measure()
    const interval = window.setInterval(measure, TARGET_POLL_MS)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return rects
}

function useTypewriter(text: string) {
  const [count, setCount] = useState(0)
  // Two separate counters on purpose: `charsSeen` decides *when* to beep
  // (every other letter, so it doesn't fire on every single keystroke),
  // `playedBeeps` decides the *pitch* alternation — reusing charsSeen for
  // both would mean it only ever hits playRobotBeep on an even count,
  // which always resolves to the same "beep" and never the "boop".
  const charsSeenRef = useRef(0)
  const playedBeepsRef = useRef(0)

  useEffect(() => {
    setCount(0)
    charsSeenRef.current = 0
    playedBeepsRef.current = 0
    if (!text) return
    const interval = window.setInterval(() => {
      setCount((prev) => {
        const next = prev + 1
        const ch = text[prev]
        if (ch && ch !== ' ') {
          charsSeenRef.current += 1
          if (charsSeenRef.current % 2 === 0) {
            playRobotBeep(playedBeepsRef.current)
            playedBeepsRef.current += 1
          }
        }
        if (next >= text.length) window.clearInterval(interval)
        return next
      })
    }, TYPE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [text])

  const done = count >= text.length
  const skipToEnd = () => setCount(text.length)

  // The "Siguiente" button only appears a beat after the last letter lands
  // — popping in the instant `done` flips true read as the button
  // anticipating the text before you'd even finished reading it.
  const [readyForNext, setReadyForNext] = useState(false)
  useEffect(() => {
    setReadyForNext(false)
    if (!done) return
    const timeout = window.setTimeout(() => setReadyForNext(true), NEXT_BUTTON_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [done, text])

  return { visibleText: text.slice(0, count), done, readyForNext, skipToEnd }
}

export function TutorialOverlay() {
  const { isActive, currentStep, advance } = useTutorialContext()
  const { strings } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const target = currentStep?.target
  const rect = useTargetRect(target)
  const blockSelectors = currentStep?.blockTargets
  const blockRectsRaw = useBlockRects(blockSelectors)
  const blockRects = blockRectsRaw.map((r) => padRect(r, BLOCK_PADDING))

  const hole = target && rect ? padRect(rect, HOLE_PADDING) : null

  const isHit = (x: number, y: number) => {
    if (hole) return pointInRect(x, y, hole)
    if (blockSelectors) {
      // Nothing measured yet (the very first tick or two after this step
      // becomes active) means there's nothing to exclude — treating that as
      // "everywhere is fair game" let a stray very-first tap on a brand-new
      // page load count as a hit before the HUD/nav had even been measured
      // once, instead of waiting for a real reading.
      if (blockRectsRaw.length === 0) return false
      return !blockRects.some((r) => pointInRect(x, y, r))
    }
    return false
  }

  useAdvanceOnRealInteraction(
    currentStep?.id,
    isHit,
    currentStep?.requiredClicks ?? 1,
    isActive && (currentStep?.autoAdvanceOnClick ?? false),
    advance,
  )

  // Replaying the whole thing from Tree's own "?" button still needs to
  // land back on Home for the opening steps — jumps there itself instead
  // of expecting whoever called `start()` to have navigated first.
  useEffect(() => {
    if (currentStep?.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route)
    }
  }, [currentStep, location.pathname, navigate])

  const stepText = currentStep
    ? (strings.tutorial[`${currentStep.id}Text` as keyof typeof strings.tutorial] as string)
    : ''
  const { visibleText, done, readyForNext, skipToEnd } = useTypewriter(stepText)

  if (!isActive || !currentStep) return null

  return (
    // pointer-events-none on the wrapper itself is what actually makes the
    // "hole" (or, in open-field mode, everything outside blockTargets)
    // clickable — without it, this full-viewport positioned div is the
    // topmost box at every point and would swallow the click itself
    // regardless of whether any child paints there. Only the pieces meant
    // to be interactive turn pointer-events back on individually.
    <div className="pointer-events-none fixed inset-0 z-[95]">
      {hole ? (
        <>
          <div
            className="pointer-events-auto fixed left-0 right-0 top-0 bg-black/75"
            style={{ height: Math.max(0, hole.top) }}
          />
          <div className="pointer-events-auto fixed left-0 right-0 bottom-0 bg-black/75" style={{ top: hole.bottom }} />
          <div
            className="pointer-events-auto fixed left-0 bg-black/75"
            style={{ top: hole.top, bottom: `calc(100% - ${hole.bottom}px)`, width: Math.max(0, hole.left) }}
          />
          <div
            className="pointer-events-auto fixed right-0 bg-black/75"
            style={{ top: hole.top, bottom: `calc(100% - ${hole.bottom}px)`, left: hole.right }}
          />
          {/* Glow ring — purely decorative, pointer-events-none so it never
              steals the real click meant for whatever's underneath it. */}
          <div
            className="pointer-events-none fixed rounded-2xl border-2 border-violet-400/70 shadow-[0_0_0_4px_rgba(168,85,247,0.25),0_0_24px_rgba(168,85,247,0.5)] transition-all duration-150"
            style={{ top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top }}
          />
        </>
      ) : blockSelectors ? (
        // Open-field mode: only cover the specific off-limits elements
        // (the HUD, the bottom nav) — the rest of the actual viewport, where
        // Home's real click surface already lives, stays completely
        // undimmed and untouched.
        blockRects.map((r, i) => (
          <div
            key={i}
            className="pointer-events-auto fixed bg-black/75"
            style={{ top: r.top, left: r.left, width: r.right - r.left, height: r.bottom - r.top }}
          />
        ))
      ) : (
        <div className="pointer-events-auto fixed inset-0 bg-black/75" />
      )}

      {/* C0-PI + its speech bubble — bottom-anchored so it never competes
          with whatever's spotlit higher up the screen, but clear of the
          bottom nav pill itself (same bottom-24/28 offset Tree's own
          zoom-control stack uses to stay above it), since the nav is
          exactly where a step might need the player to tap next.
          The robot itself sits outside the card entirely (no border/box
          around it, just the animation, sized up so it actually reads as
          the one talking) with the bubble as its own separate card to the
          right, tailed back toward it via an asymmetric triangle notch at
          its bottom-left corner, stretching further left than tall — the
          classic corner comic-bubble tail, not a symmetric little diamond. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 flex justify-center sm:bottom-28 sm:inset-x-0">
        <div className="flex w-full max-w-md items-end gap-2">
          <div className="pointer-events-none h-36 w-36 shrink-0 sm:h-40 sm:w-40">
            <Lottie src={robotAnimation} className="h-full w-full" loop autoplay />
          </div>
          <div
            onClick={!done ? skipToEnd : undefined}
            className="pointer-events-auto relative min-w-0 flex-1 overflow-visible rounded-2xl border border-violet-400/25 bg-[#0d0d14]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="absolute left-0 bottom-6 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-l border-violet-400/25 bg-[#0d0d14]" />
            <p className="min-h-[2.5rem] text-sm leading-snug text-neutral-100">
              {visibleText}
              {!done && <span className="animate-pulse">▍</span>}
            </p>
            {readyForNext && !currentStep.target && !currentStep.blockTargets && (
              <button
                onClick={advance}
                className="mt-3 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
              >
                {currentStep.id === 'closing' ? strings.tutorial.finish : strings.tutorial.next}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
