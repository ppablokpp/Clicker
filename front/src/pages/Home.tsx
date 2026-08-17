import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useClickCounter } from '../hooks/useClickCounter'
import { usePlayer } from '../hooks/usePlayer'

interface ClickEffect {
  id: number
  x: number
  y: number
}

let effectId = 0

export function Home() {
  const { totalClicks, clicksPerSecond, registerClick } = useClickCounter()
  const { name } = usePlayer()
  const [effects, setEffects] = useState<ClickEffect[]>([])
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const id = effectId++
      setEffects((prev) => [...prev, { id, x, y }])
      setIsPressed(true)
      registerClick()

      window.setTimeout(() => {
        setEffects((prev) => prev.filter((fx) => fx.id !== id))
      }, 900)
    },
    [registerClick],
  )

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative flex h-[100dvh] w-full touch-none select-none flex-col items-center justify-center overflow-hidden bg-[#08080c] pb-20 sm:pb-0 sm:pt-16"
    >
      {/* ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
        <div
          className="animate-pulse-glow absolute left-1/3 top-2/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]"
          style={{ animationDelay: '1.2s' }}
        />
        <div
          className="animate-pulse-glow absolute right-1/4 top-1/4 h-56 w-56 rounded-full bg-cyan-500/10 blur-[100px]"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* top-left greeting */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 text-xs font-medium text-neutral-500 sm:left-6 sm:top-20">
        Jugando como <span className="text-neutral-300">{name}</span>
      </div>

      {/* CPS badge */}
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 sm:right-6 sm:top-20">
        <Flame size={13} className={clicksPerSecond > 0 ? 'text-orange-400' : 'text-neutral-600'} />
        {clicksPerSecond.toFixed(1)} c/s
      </div>

      {/* main counter */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <span className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Tus clicks
        </span>
        <motion.span
          key={totalClicks}
          initial={{ scale: 1 }}
          animate={{ scale: [1.06, 1] }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text font-[Space_Grotesk] text-6xl font-bold tabular-nums text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.25)] sm:text-8xl"
        >
          {totalClicks.toLocaleString('es-ES')}
        </motion.span>

        <motion.div
          animate={{ scale: isPressed ? 0.94 : 1 }}
          transition={{ duration: 0.1 }}
          onAnimationComplete={() => setIsPressed(false)}
          className="mt-10 flex h-40 w-40 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-[0_0_60px_rgba(168,85,247,0.25)] sm:h-52 sm:w-52"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-violet-200/80">
            Toca la pantalla
          </span>
        </motion.div>
      </div>

      {/* click ripples + floating +1s */}
      <AnimatePresence>
        {effects.map((fx) => (
          <div key={fx.id} className="pointer-events-none absolute inset-0 z-20">
            <span
              className="animate-ripple absolute h-24 w-24 rounded-full bg-violet-400/40"
              style={{ left: fx.x, top: fx.y }}
            />
            <span
              className="animate-float-up absolute select-none text-lg font-bold text-violet-300"
              style={{ left: fx.x, top: fx.y }}
            >
              +1
            </span>
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
