// Shared rock renderer for the newer, one-off asteroid appearances (the
// Anomalía meteor + its full-size target inside EventChallenge) — Home.tsx
// and Battle.tsx each still keep their own hand-copied version (see
// feedback_meteorite_sync in memory: no shared component existed between
// those two when that convention was set), but a *third* and *fourth* copy
// for brand-new features was one too many to hand-duplicate again, so this
// one's actually shared. `idPrefix` keeps every instance's SVG gradient/clip
// ids unique so simultaneous instances on the same page never collide.
type Point = [number, number]

function buildRoundRockOutline(pointCount: number, baseRadius: number, jitter: number): Point[] {
  const points: Point[] = []
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2
    const wobble = Math.sin(angle * 3) * jitter * 0.6 + Math.sin(angle * 5 + 1) * jitter * 0.4
    const r = baseRadius + wobble
    points.push([50 + Math.cos(angle) * r, 50 + Math.sin(angle) * r])
  }
  return points
}

const ASTEROID_POINTS = buildRoundRockOutline(20, 42, 3)
  .map((p) => p.join(','))
  .join(' ')

const CRATERS = [
  { cx: 38, cy: 38, r: 6.5 },
  { cx: 63, cy: 55, r: 8.5 },
  { cx: 68, cy: 32, r: 4 },
  { cx: 42, cy: 66, r: 5.5 },
  { cx: 55, cy: 40, r: 3 },
  { cx: 28, cy: 55, r: 3.5 },
  { cx: 60, cy: 68, r: 2.5 },
]

const SPECKLES = [
  { cx: 30, cy: 28, r: 1.4 },
  { cx: 48, cy: 24, r: 1 },
  { cx: 72, cy: 45, r: 1.2 },
  { cx: 58, cy: 58, r: 1 },
  { cx: 35, cy: 48, r: 0.9 },
  { cx: 45, cy: 72, r: 1.3 },
  { cx: 25, cy: 62, r: 1 },
  { cx: 65, cy: 25, r: 0.9 },
]

export interface AsteroidColors {
  light: string
  fill: string
  dark: string
  speckleColor?: string
}

export function Asteroid({
  idPrefix,
  size,
  colors,
  className,
}: {
  idPrefix: string
  size: number
  colors: AsteroidColors
  className?: string
}) {
  const bodyId = `${idPrefix}RockBody`
  const craterId = `${idPrefix}CraterWell`
  const clipId = `${idPrefix}RockSilhouette`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
      <defs>
        <radialGradient id={bodyId} cx="34%" cy="30%" r="80%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="45%" stopColor={colors.fill} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
        <radialGradient id={craterId} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
          <stop offset="75%" stopColor="rgba(0,0,0,0.32)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </radialGradient>
        <clipPath id={clipId}>
          <polygon points={ASTEROID_POINTS} />
        </clipPath>
      </defs>

      <polygon
        points={ASTEROID_POINTS}
        fill={`url(#${bodyId})`}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      <g clipPath={`url(#${clipId})`}>
        {CRATERS.map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill={`url(#${craterId})`} />
            <circle cx={c.cx - c.r * 0.32} cy={c.cy - c.r * 0.32} r={c.r * 0.3} fill="rgba(255,255,255,0.16)" />
          </g>
        ))}
        {SPECKLES.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={colors.speckleColor ?? 'rgba(0,0,0,0.22)'} />
        ))}
        <ellipse cx="32" cy="27" rx="20" ry="14" fill="rgba(255,255,255,0.16)" />
      </g>
    </svg>
  )
}
