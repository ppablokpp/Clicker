import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { useBattlesContext, type BattleDetail } from '../context/BattlesContext'
import { useLanguage } from '../context/LanguageContext'
import { playLaserShot } from '../lib/battleSound'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { Asteroid } from '../components/Asteroid'

// Same green/red as Tree.tsx's LUCK_NODE_STYLE/LEGENDARY_NODE_STYLE, reused
// here so a duel win/loss reads with the same "flow" language as the tree.
const WIN_CARD_STYLE = 'border-green-400/25 bg-[#0f1f16]'
const LOSE_CARD_STYLE = 'border-red-400/25 bg-[#1f0d0d]'
const TIE_CARD_STYLE = 'border-white/10 bg-[#0d0d14]'

function DuelSide({ avatarUrl, name, value }: { avatarUrl: string | null; name: string | null; value: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
          <User size={20} />
        </div>
      )}
      <span className="max-w-full truncate text-xs font-medium text-neutral-300">{name ?? '—'}</span>
      <span className="font-[Space_Grotesk] text-2xl font-bold tabular-nums text-white">{value}</span>
    </div>
  )
}

// The rock's geometry, crater field and lighting live in
// components/Asteroid.tsx — one copy for the whole game. This file used to
// carry its own hand-mirrored duplicate, which is what the "mirror Home's
// asteroid changes into Battle's copy" convention was a workaround for. There
// is nothing left to keep in sync.
// Only the palette is local: a battle rock is always violet, with no tier or
// break system to animate through during a 30-second duel.
const BATTLE_ROCK = { light: '#ede9fe', fill: '#a78bfa', dark: '#3b0764' }

// Same starfield trick as Home — one element's box-shadow holding hundreds
// of point-lights, zero per-star DOM cost.
function generateStars(count: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    stars.push(`${x}vw ${y}vh 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

// Same short blaster-bolt shot as Home's click — a travelling capsule
// rotated to face its direction of travel, `rotate` set as a Framer style
// value (not a manual transform string) so it composes with the animated
// x/y translate on this same element.
interface ShotEffect {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
}
let shotId = 0
const BOLT_LENGTH = 26
const BOLT_THICKNESS = 3
const SHOT_DURATION_MS = 280

// Small debris chips that burst outward from the asteroid on every hit —
// each shot spawns a handful of them from the asteroid's own center, not
// from the tap point, so they read as chunks breaking off on impact.
interface ParticleChip {
  angle: number
  distance: number
  size: number
}
interface ParticleBurst {
  id: number
  x: number
  y: number
  chips: ParticleChip[]
}
let particleId = 0
const PARTICLE_DURATION_MS = 380
const PARTICLE_COUNT = 4
// A fast tapper can fire well past 20-30 shots/second — spawning a burst on
// every single one piles up too many simultaneously-animated elements and
// visibly janks on mobile. Bursts are throttled independently of shots so
// the laser bolts themselves stay perfectly responsive either way.
const MIN_PARTICLE_INTERVAL_MS = 90

const TAPS_PER_SECOND_WINDOW_MS = 2000

type Phase = 'idle' | 'playing' | 'submitting' | 'result'

interface ResultState {
  didWin?: boolean
  isTie?: boolean
  challengerTaps?: number
  myTaps: number
  role: 'challenger' | 'opponent'
}

export function Battle() {
  const { battleId: battleIdParam } = useParams()
  const battleId = Number(battleIdParam)
  const navigate = useNavigate()
  const { strings, language } = useLanguage()
  const { durationSeconds, getBattle, submitScore } = useBattlesContext()

  const [battle, setBattle] = useState<BattleDetail | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [taps, setTaps] = useState(0)
  useLockBodyScroll(phase === 'submitting' || phase === 'result')
  const [tapsPerSecond, setTapsPerSecond] = useState(0)
  const [timeLeftPct, setTimeLeftPct] = useState(100)
  const [result, setResult] = useState<ResultState | null>(null)
  const [shots, setShots] = useState<ShotEffect[]>([])
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const objectRef = useRef<HTMLDivElement>(null)
  const activePointersRef = useRef<Set<number>>(new Set())
  const startTimeRef = useRef<number | null>(null)
  const recentTapsRef = useRef<number[]>([])
  const tapsRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const lastParticleAtRef = useRef(0)

  const starsDim = useMemo(() => generateStars(220, 0.5), [])
  const starsBright = useMemo(() => generateStars(60, 0.9), [])

  useEffect(() => {
    if (!Number.isInteger(battleId)) {
      setLoadError(true)
      return
    }
    let cancelled = false
    getBattle(battleId).then((data) => {
      if (cancelled) return
      if (!data) {
        setLoadError(true)
        return
      }
      // Only a battle that's actually your turn to play makes sense here —
      // anything else (already completed, or waiting on the other side)
      // just bounces back to the leaderboard's battle list.
      const myTurn =
        (data.role === 'challenger' && data.status === 'awaiting_challenger') ||
        (data.role === 'opponent' && data.status === 'opponent_accepted')
      if (!myTurn) {
        setLoadError(true)
        return
      }
      setBattle(data)
    })
    return () => {
      cancelled = true
    }
  }, [battleId, getBattle])

  // Countdown ticks off a fixed start timestamp rather than decrementing a
  // counter each frame, so it can't drift from real elapsed time.
  useEffect(() => {
    if (phase !== 'playing') return
    const interval = window.setInterval(() => {
      const start = startTimeRef.current
      if (start === null) return
      const elapsed = (Date.now() - start) / 1000
      const pct = Math.max(0, 100 - (elapsed / durationSeconds) * 100)
      setTimeLeftPct(pct)

      const now = Date.now()
      recentTapsRef.current = recentTapsRef.current.filter((t) => now - t < TAPS_PER_SECOND_WINDOW_MS)
      setTapsPerSecond(recentTapsRef.current.length / (TAPS_PER_SECOND_WINDOW_MS / 1000))

      if (elapsed >= durationSeconds) {
        window.clearInterval(interval)
        finishRound()
      }
    }, 100)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationSeconds])

  const finishRound = useCallback(async () => {
    if (phaseRef.current !== 'playing') return
    phaseRef.current = 'submitting'
    setPhase('submitting')
    const finalTaps = tapsRef.current
    const res = await submitScore(battleId, finalTaps)
    if (!res.ok) {
      setLoadError(true)
      return
    }
    setResult({
      didWin: res.didWin,
      isTie: res.isTie,
      challengerTaps: res.challengerTaps,
      myTaps: finalTaps,
      role: battle?.role ?? 'challenger',
    })
    phaseRef.current = 'result'
    setPhase('result')
  }, [battleId, submitScore, battle])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (phaseRef.current === 'submitting' || phaseRef.current === 'result') return
      activePointersRef.current.add(e.pointerId)

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const objectRect = objectRef.current?.getBoundingClientRect()
      const objX = objectRect ? objectRect.left + objectRect.width / 2 - rect.left : x
      const objY = objectRect ? objectRect.top + objectRect.height / 2 - rect.top : y

      if (phaseRef.current === 'idle') {
        phaseRef.current = 'playing'
        setPhase('playing')
        startTimeRef.current = Date.now()
      }

      const now = Date.now()
      recentTapsRef.current.push(now)
      tapsRef.current += 1
      setTaps(tapsRef.current)
      playLaserShot()

      const sId = shotId++
      const dx = objX - x
      const dy = objY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      setShots((prev) => [...prev, { id: sId, startX: x, startY: y, dx, dy, angleDeg }])

      window.setTimeout(() => {
        setShots((current) => current.filter((s) => s.id !== sId))

        // Debris burst fires once the bolt actually reaches the asteroid,
        // not on the tap itself — throttled separately from shots so a fast
        // tapper doesn't pile up dozens of animated chips at once.
        const impactAt = Date.now()
        if (impactAt - lastParticleAtRef.current >= MIN_PARTICLE_INTERVAL_MS) {
          lastParticleAtRef.current = impactAt
          const pId = particleId++
          const chips: ParticleChip[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            angle: Math.random() * 360,
            distance: 38 + Math.random() * 48,
            size: 3.5 + Math.random() * 4,
          }))
          setParticleBursts((current) => [...current, { id: pId, x: objX, y: objY, chips }])
          window.setTimeout(() => {
            setParticleBursts((current) => current.filter((b) => b.id !== pId))
          }, PARTICLE_DURATION_MS)
        }
      }, SHOT_DURATION_MS)
    },
    [],
  )

  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId)
  }, [])

  if (loadError) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#08080c] px-6 text-center">
        <p className="text-sm text-neutral-400">—</p>
        <button
          onClick={() => navigate('/clasificacion')}
          className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
        >
          {strings.battle.backButton}
        </button>
      </div>
    )
  }

  if (!battle) {
    return <div className="h-[100dvh] w-full bg-[#08080c]" />
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex h-[100dvh] w-full touch-none select-none flex-col items-center justify-center overflow-hidden bg-[#08080c]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>

      {/* t/s pill — real taps per second only, no heat tiers/legendary. */}
      <div className="pointer-events-none absolute left-4 top-6 z-10 sm:left-6">
        <span className="flex w-fit items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-bold text-violet-200 shadow-lg shadow-black/20">
          {tapsPerSecond.toFixed(1)} {strings.home.tps}
        </span>
      </div>

      {/* Taps counter — big number at the top, same spot/size language as
          Home's platino number. */}
      <div className="pointer-events-none absolute left-0 right-0 top-20 z-10 flex justify-center sm:top-24">
        <motion.span
          key={taps}
          initial={{ scale: 1 }}
          animate={{ scale: [1.08, 1] }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-clip-text text-center font-[Space_Grotesk] text-4xl font-bold leading-none tabular-nums text-transparent bg-gradient-to-b from-white to-neutral-400 sm:text-5xl"
        >
          {taps.toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}
        </motion.span>
      </div>

      <div className="pointer-events-none relative z-10 flex flex-col items-center">
        <div ref={objectRef} className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          <div
            className="absolute -inset-6 rounded-full transition-opacity duration-200"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)', opacity: 0.35 }}
          />
          {/* Only the bob. The rock used to spin on Z as well, which rolls a
              flat disc; the surface turning inside <Asteroid> is what a
              sphere rotating looks like, and it is that component's job now.
              The drop-shadow went with it: the ambient glow behind already
              sells the aura, and a filter around a rock with a moving surface
              means re-tracing its whole alpha silhouette every frame. */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
          >
            <Asteroid idPrefix="battle" size={76} colors={BATTLE_ROCK} />
          </motion.div>
        </div>

        {phase === 'idle' && (
          <span className="absolute left-0 right-0 top-full mt-8 text-center text-xs font-medium tracking-wide text-neutral-500 sm:text-sm">
            {strings.battle.tapToStart}
          </span>
        )}
      </div>

      {/* shots — same laser-bolt language as Home's click. */}
      {shots.map((shot) => (
        <motion.div
          key={shot.id}
          className="pointer-events-none absolute z-20 rounded-full bg-gradient-to-r from-violet-300/0 via-violet-200 to-white shadow-[0_0_8px_2px_rgba(216,180,254,0.85)]"
          style={{
            left: shot.startX - BOLT_LENGTH / 2,
            top: shot.startY - BOLT_THICKNESS / 2,
            width: BOLT_LENGTH,
            height: BOLT_THICKNESS,
            rotate: shot.angleDeg,
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: shot.dx, y: shot.dy, opacity: [1, 1, 0] }}
          transition={{ duration: SHOT_DURATION_MS / 1000, ease: 'easeIn' }}
        />
      ))}

      {/* Debris — small chips bursting off the asteroid on every hit. */}
      {particleBursts.map((burst) =>
        burst.chips.map((chip, i) => {
          const rad = (chip.angle * Math.PI) / 180
          const dx = Math.cos(rad) * chip.distance
          const dy = Math.sin(rad) * chip.distance
          return (
            <motion.span
              key={`${burst.id}-${i}`}
              className="pointer-events-none absolute z-20 rounded-sm bg-violet-100"
              style={{
                left: burst.x - chip.size / 2,
                top: burst.y - chip.size / 2,
                width: chip.size,
                height: chip.size,
                boxShadow: '0 0 8px 1px rgba(233,213,255,0.9)',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: dx, y: dy, opacity: 0, scale: 0.3 }}
              transition={{ duration: PARTICLE_DURATION_MS / 1000, ease: 'easeOut' }}
            />
          )
        }),
      )}

      {/* Countdown bar — no tab bar on this screen, so the bottom of the
          viewport is free for it. Stays full until the first tap starts it. */}
      <div className="pointer-events-none absolute inset-x-4 bottom-6 z-10 sm:inset-x-6 sm:bottom-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-100 ease-linear"
            style={{ width: `${timeLeftPct}%` }}
          />
        </div>
      </div>

      {(phase === 'submitting' || phase === 'result') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl shadow-black/50 ${
              phase === 'result' && result && result.role === 'opponent'
                ? result.isTie
                  ? TIE_CARD_STYLE
                  : result.didWin
                    ? WIN_CARD_STYLE
                    : LOSE_CARD_STYLE
                : 'border-white/10 bg-[#0d0d14]'
            }`}
          >
            {phase === 'submitting' && <p className="text-sm text-neutral-400">{strings.battle.submitting}</p>}
            {phase === 'result' && result && (
              <>
                {result.role === 'challenger' ? (
                  <p className="mb-2 text-sm font-semibold text-white">
                    {strings.battle.sentResult(result.myTaps.toLocaleString(language === 'en' ? 'en-US' : 'es-ES'))}
                  </p>
                ) : (
                  <>
                    <p
                      className={`mb-5 text-lg font-bold ${
                        result.isTie ? 'text-neutral-200' : result.didWin ? 'text-green-300' : 'text-red-300'
                      }`}
                    >
                      {result.isTie ? strings.battle.tieResult : result.didWin ? strings.battle.youWon : strings.battle.youLost}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <DuelSide
                        avatarUrl={battle.opponentAvatarUrl}
                        name={battle.opponentUsername}
                        value={result.myTaps}
                      />
                      <span className="shrink-0 text-xs font-black uppercase tracking-widest text-neutral-500">VS</span>
                      <DuelSide
                        avatarUrl={battle.challengerAvatarUrl}
                        name={battle.challengerUsername}
                        value={result.challengerTaps ?? 0}
                      />
                    </div>
                  </>
                )}
                <button
                  onClick={() => navigate('/clasificacion')}
                  className="mt-6 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
                >
                  {strings.battle.backButton}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
