import { useState } from 'react'
import { MousePointerClick } from 'lucide-react'

/**
 * Phase-locks the loops to wall clock instead of to mount time.
 *
 * The app shows a loading screen from two different places — AuthGate, while
 * it works out whose save this is, then GameStateGate, while that save
 * arrives. They sit at different points in the tree, so React unmounts one and
 * mounts the other, and a CSS animation restarts at 0% when that happens: the
 * spinner jumps backwards partway through loading, which is most of what reads
 * as the loader stuttering.
 *
 * A negative delay of `now % duration` starts each animation already that far
 * in, so its phase is a function of the clock rather than of when the element
 * appeared, and the handoff lands mid-spin.
 *
 * The lazy initialiser is the load-bearing part, not the maths. This has to be
 * computed once per MOUNT — fresh when the screen is re-created, then frozen.
 * Computed per *render* it was strictly worse than no fix at all: GameStateGate
 * subscribes to both game contexts, whose values change about ten times a
 * second while loading, so the screen re-renders at that rate — and changing
 * `animation-delay` on a running animation re-seats it. One jump at the handoff
 * became ten jumps a second.
 *
 * Reading the clock in here is impure on purpose: the whole point is that the
 * value must differ between mounts. That's also why it can't be hoisted to a
 * module constant.
 */
function usePhases() {
  const [phases] = useState(() => {
    const now = performance.now()
    const at = (durationMs: number) => `-${now % durationMs}ms`
    return {
      glow: { animationDelay: at(3000) },
      spin: { animationDuration: '0.8s', animationDelay: at(800) },
      pulse: { animationDelay: at(2000) },
    }
  })
  return phases
}

export function LoadingScreen() {
  const phases = usePhases()
  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#08080c]">
      {/* A radial-gradient, not a blurred div. `blur-[100px]` on a 288px
          element is a large raster the main thread has to produce, and this
          screen is on precisely when that thread is at its busiest — mounting
          every provider and parsing what they fetch — so it stuttered exactly
          when it most needed not to. Painting the falloff directly costs
          nothing per frame and leaves the opacity pulse pure compositor work.
          Same swap Home already made for the asteroid and prestige glows,
          which also dodged a mobile Chromium flash-to-square bug. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-pulse-glow absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 68%)',
            ...phases.glow,
          }}
        />
      </div>

      <div className="relative z-10 flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400 border-r-fuchsia-400"
          style={phases.spin}
        />
        <div
          className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200"
          style={phases.pulse}
        >
          <MousePointerClick size={18} />
        </div>
      </div>
    </div>
  )
}
