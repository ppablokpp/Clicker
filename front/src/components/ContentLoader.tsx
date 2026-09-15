import { useEffect, useRef, useState } from 'react'
import { SpaceObject } from './SpaceObject'

/**
 * A screen's own loader: the same rock and orbiting ring as the startup
 * cover, over the content only. Fixed and opaque, but under the tab bar and
 * under each screen's own floating chrome (both z-40), so the player keeps
 * their bearings — the tabs stay put, the sort pill stays put, only the part
 * that isn't ready yet is covered.
 *
 * A screen renders it with `pending` set while its first data is on the way
 * (the ranking with no rows yet, the profile before its rank, the store
 * before its balances). The timing is the component's business, not the
 * screen's, and it's in two parts because they answer two different
 * complaints:
 *
 * - The COVER goes up on the very first render, with no delay: the plain
 *   dark ground, nothing on it. The alternative — the screen's stale or
 *   empty content for a few frames, then a loader, then the real content —
 *   was the thing that read as a glitch.
 * - The ROCK fades onto the cover only after SHOW_DELAY_MS. Most loads on a
 *   warm connection land inside that, and then the cover simply lifts:
 *   what the player saw was a dark beat between screens, not a loader that
 *   appeared and vanished. Once the rock IS up it stays for at least
 *   MIN_VISIBLE_MS however early the data lands, because a loader that
 *   takes a full breath reads as loading, and one gone a tenth of a second
 *   later reads as a flicker.
 *
 * Rendered in the same box as Home's rock so it sits where the rock does,
 * one screen over.
 */
const SHOW_DELAY_MS = 150
const MIN_VISIBLE_MS = 1000
const FADE_OUT_MS = 180

type Phase = 'hidden' | 'covering' | 'shown' | 'leaving'

function useLoaderPhase(pending: boolean): Phase {
  // Seeded from `pending`, not from 'hidden': the first render is the one
  // that would otherwise flash the content.
  const [phase, setPhase] = useState<Phase>(pending ? 'covering' : 'hidden')
  const shownAt = useRef(0)

  useEffect(() => {
    if (pending) {
      switch (phase) {
        case 'hidden':
          setPhase('covering')
          return
        case 'covering': {
          const t = window.setTimeout(() => {
            shownAt.current = performance.now()
            setPhase('shown')
          }, SHOW_DELAY_MS)
          return () => window.clearTimeout(t)
        }
        case 'leaving':
          // Needed again mid-fade: the fade is cancelled and it comes back.
          setPhase('shown')
          return
        default:
          return
      }
    }

    switch (phase) {
      case 'covering':
        // Landed before the rock ever showed — lift the cover, nothing owed.
        setPhase('leaving')
        return
      case 'shown': {
        const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt.current))
        const t = window.setTimeout(() => setPhase('leaving'), remaining)
        return () => window.clearTimeout(t)
      }
      case 'leaving': {
        const t = window.setTimeout(() => setPhase('hidden'), FADE_OUT_MS)
        return () => window.clearTimeout(t)
      }
      default:
        return
    }
  }, [pending, phase])

  return phase
}

export function ContentLoader({ pending }: { pending: boolean }) {
  const phase = useLoaderPhase(pending)
  if (phase === 'hidden') return null

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-[#08080c] ${
        phase === 'leaving' ? 'content-loader-out' : ''
      }`}
    >
      {phase !== 'covering' && (
        <div className="content-loader-in relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
          <div className="absolute inset-0" style={{ transform: 'scale(0.85)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <SpaceObject tierIndex={0} pct={0} isMaxed={false} paused={false} ringMode="orbit" idPrefix="contentLoader" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
