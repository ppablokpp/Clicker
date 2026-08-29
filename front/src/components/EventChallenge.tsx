import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'
import { useLanguage } from '../context/LanguageContext'
import { playLaserShot } from '../lib/battleSound'
import { Asteroid, type AsteroidColors } from './Asteroid'

// Same starfield trick as Home/Battle — one element's box-shadow holding
// hundreds of point-lights, zero per-star DOM cost.
function generateStars(count: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    stars.push(`${x}vw ${y}vh 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const CHALLENGE_DURATION_MS = 15_000
const TAPS_GOAL = 100

// Same shot-bolt/debris recipe as Home's own click (see index.css's
// .shot-bolt/.debris-chip) — plain CSS so a rapid-fire 10-second burst here
// doesn't hit the same per-frame Framer reconciliation cost that used to
// bog down Home's manual taps.
interface ShotEffect {
  id: number
  startX: number
  startY: number
  dx: number
  dy: number
  angleDeg: number
}
let shotId = 0
const BOLT_LENGTH = 22
const BOLT_THICKNESS = 3
const SHOT_DURATION_MS = 220

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
const PARTICLE_DURATION_MS = 320
const PARTICLE_COUNT = 3
const MIN_PARTICLE_INTERVAL_MS = 80

type Phase = 'playing' | 'result'

interface EventChallengeProps {
  colors: AsteroidColors
  glow: string
  onClose: () => void
}

// Home's random "Anomalía" event — tap the flying meteor to open this, then
// land TAPS_GOAL taps before the 10-second countdown runs out. Full win/lose
// is decided client-side (there's no realistic way to verify 100 real taps
// in 10s with a per-tap round trip) — the backend only re-checks a cooldown
// before it'll actually pay out, so this is "trust, but rate limit", not a
// verifiable anti-cheat boundary. Good enough for a decorative bonus event,
// not for anything that needs to be tamper-proof.
//
// `colors`/`glow` are the meteor's own (randomized, purely decorative) rock
// color, captured at the moment it was tapped — the reward text below still
// always names the player's real current material (`prestigeTier`), since
// the payout itself is 5% of their actual current material, not the rock's.
export function EventChallenge({ colors, glow, onClose }: EventChallengeProps) {
  const { userId, getToken } = useAuth()
  const { prestigeTier, syncTotalClicks } = useClickCounterContext()
  const { multiShotValue } = useTreeContext()
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const materialName = strings.home.trajectoryTierNames[prestigeTier]
  const starsDim = useMemo(() => generateStars(220, 0.5), [])
  const starsBright = useMemo(() => generateStars(60, 0.9), [])

  const [phase, setPhase] = useState<Phase>('playing')
  const [taps, setTaps] = useState(0)
  const [timeLeftPct, setTimeLeftPct] = useState(100)
  const [reward, setReward] = useState<number | null>(null)
  const [shots, setShots] = useState<ShotEffect[]>([])
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const tapsRef = useRef(0)
  const phaseRef = useRef<Phase>('playing')
  const startTimeRef = useRef(Date.now())
  const lastParticleAtRef = useRef(0)
  // Same cannon cap as Home's own manual shots (Multidisparo/multiShotValue)
  // — the anomaly is neutralized with the ship's actual guns, so a ship with
  // more cannons can land more simultaneous taps here too, same as it does
  // on the main click target.
  const activePointersRef = useRef<Set<number>>(new Set())

  const finishRound = useCallback(async () => {
    if (phaseRef.current !== 'playing') return
    phaseRef.current = 'result'
    const finalTaps = tapsRef.current
    if (finalTaps >= TAPS_GOAL && userId) {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/events/claim`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && typeof data.reward === 'number') {
          setReward(data.reward)
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        }
      } catch (err) {
        console.error('No se pudo reclamar la recompensa de la anomalía', err)
      }
    }
    setPhase('result')
  }, [userId, getToken, syncTotalClicks])

  // Countdown ticks off a fixed start timestamp rather than decrementing a
  // counter each frame, so it can't drift from real elapsed time.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.max(0, 100 - (elapsed / CHALLENGE_DURATION_MS) * 100)
      setTimeLeftPct(pct)
      if (elapsed >= CHALLENGE_DURATION_MS) {
        window.clearInterval(interval)
        finishRound()
      }
    }, 100)
    return () => window.clearInterval(interval)
  }, [finishRound])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      // This container sits inside Home's own DOM tree (not a portal), and
      // Home's manual-shot handler is bound to its own outer pointerdown —
      // without this, every tap here (including the result modal's "Volver"
      // button) would bubble up and silently register as a real shot/click
      // on Home underneath. Called unconditionally, before the phase check,
      // so it applies during both 'playing' and 'result'.
      e.stopPropagation()
      if (phaseRef.current !== 'playing') return

      // Multidisparo's cap — a finger landing while the allowance is
      // already full is ignored entirely, same as Home's own manual shots.
      if (!activePointersRef.current.has(e.pointerId) && activePointersRef.current.size >= multiShotValue) {
        return
      }
      activePointersRef.current.add(e.pointerId)

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const targetRect = targetRef.current?.getBoundingClientRect()
      const targetX = targetRect ? targetRect.left + targetRect.width / 2 - rect.left : x
      const targetY = targetRect ? targetRect.top + targetRect.height / 2 - rect.top : y

      tapsRef.current += 1
      setTaps(tapsRef.current)
      playLaserShot()

      const sId = shotId++
      const dx = targetX - x
      const dy = targetY - y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      setShots((prev) => [...prev, { id: sId, startX: x, startY: y, dx, dy, angleDeg }])

      if (tapsRef.current >= TAPS_GOAL) finishRound()
    },
    [finishRound, multiShotValue],
  )

  // Frees the pointer's slot the moment it lifts (or the gesture is
  // cancelled), same as Home's own handlePointerUp, so the next finger down
  // can use it.
  const handlePointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId)
  }, [])

  const handleShotEnd = useCallback((shot: ShotEffect) => {
    setShots((current) => current.filter((s) => s.id !== shot.id))

    const impactAt = Date.now()
    if (impactAt - lastParticleAtRef.current < MIN_PARTICLE_INTERVAL_MS) return
    lastParticleAtRef.current = impactAt
    const pId = particleId++
    const targetRect = targetRef.current?.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    const cx = targetRect && containerRect ? targetRect.left + targetRect.width / 2 - containerRect.left : shot.startX + shot.dx
    const cy = targetRect && containerRect ? targetRect.top + targetRect.height / 2 - containerRect.top : shot.startY + shot.dy
    const chips: ParticleChip[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * 360,
      distance: 24 + Math.random() * 30,
      size: 3 + Math.random() * 3,
    }))
    setParticleBursts((current) => [...current, { id: pId, x: cx, y: cy, chips }])
    window.setTimeout(() => {
      setParticleBursts((current) => current.filter((b) => b.id !== pId))
    }, PARTICLE_DURATION_MS)
  }, [])

  const pct = Math.min(1, taps / TAPS_GOAL)
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const succeeded = phase === 'result' && reward !== null

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed inset-0 z-[70] touch-none select-none overflow-hidden bg-[#08080c]"
    >
      {/* Same two-layer starfield as Battle.tsx's own duel screen. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>
      {/* Header — same micro-label language as Home's own HUD. */}
      <div className="pointer-events-none absolute inset-x-0 top-8 z-10 flex flex-col items-center gap-1 sm:top-10">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: colors.fill }}>
          {strings.event.title}
        </span>
        <span className="text-xs text-neutral-500">{strings.event.subtitle}</span>
      </div>

      <div className="pointer-events-none relative z-0 flex h-full items-center justify-center">
        <svg viewBox="0 0 200 200" className="pointer-events-none absolute h-72 w-72 -rotate-90 overflow-visible sm:h-96 sm:w-96">
          <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={colors.fill}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.15s ease-out', filter: `drop-shadow(0 0 8px ${glow})` }}
          />
        </svg>

        {/* Same rock + floating/spin motion as Home's own centerpiece
            asteroid and Battle's duel target — just this meteor's own
            captured (randomized) color. */}
        <div ref={targetRef} className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          <div
            className="absolute -inset-6 rounded-full"
            style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.35 }}
          />
          <motion.div
            animate={{ rotate: 360, y: [0, -6, 0] }}
            transition={{
              rotate: { duration: 26, repeat: Infinity, ease: 'linear' },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Asteroid idPrefix="eventTarget" size={76} colors={colors} />
          </motion.div>
        </div>
      </div>

      {shots.map((shot) => (
        <div
          key={shot.id}
          className="shot-bolt pointer-events-none absolute z-20 rounded-full bg-gradient-to-r from-violet-300/0 via-violet-200 to-white shadow-[0_0_8px_2px_rgba(216,180,254,0.85)]"
          style={
            {
              left: shot.startX - BOLT_LENGTH / 2,
              top: shot.startY - BOLT_THICKNESS / 2,
              width: BOLT_LENGTH,
              height: BOLT_THICKNESS,
              '--shot-dx': `${shot.dx}px`,
              '--shot-dy': `${shot.dy}px`,
              '--shot-angle': `${shot.angleDeg}deg`,
              '--shot-duration': `${SHOT_DURATION_MS}ms`,
            } as CSSProperties
          }
          onAnimationEnd={() => handleShotEnd(shot)}
        />
      ))}

      {particleBursts.map((burst) =>
        burst.chips.map((chip, i) => {
          const rad = (chip.angle * Math.PI) / 180
          const dx = Math.cos(rad) * chip.distance
          const dy = Math.sin(rad) * chip.distance
          return (
            <span
              key={`${burst.id}-${i}`}
              className="debris-chip pointer-events-none absolute z-20 rounded-sm"
              style={
                {
                  left: burst.x - chip.size / 2,
                  top: burst.y - chip.size / 2,
                  width: chip.size,
                  height: chip.size,
                  background: colors.light,
                  boxShadow: `0 0 8px 1px ${glow}`,
                  '--chip-dx': `${dx}px`,
                  '--chip-dy': `${dy}px`,
                  '--chip-duration': `${PARTICLE_DURATION_MS}ms`,
                } as CSSProperties
              }
            />
          )
        }),
      )}

      {/* Countdown bar — same bottom-of-viewport language as Battle.tsx's own duel timer. */}
      <div className="pointer-events-none absolute inset-x-6 bottom-10 z-10 sm:inset-x-10 sm:bottom-12">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${timeLeftPct}%`, background: `linear-gradient(to right, ${colors.dark}, ${colors.fill})` }}
          />
        </div>
      </div>

      {phase === 'result' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl shadow-black/50 ${
              succeeded ? 'border-green-400/25 bg-[#0f1f16]' : 'border-red-400/25 bg-[#1f0d0d]'
            }`}
          >
            <p className={`mb-2 text-lg font-bold ${succeeded ? 'text-green-300' : 'text-red-300'}`}>
              {succeeded ? strings.event.successTitle : strings.event.failureTitle}
            </p>
            <p className="mb-6 text-sm text-neutral-400">
              {succeeded && reward !== null
                ? strings.event.successBody(reward.toLocaleString(locale), materialName)
                : strings.event.failureBody}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
            >
              {strings.battle.backButton}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
