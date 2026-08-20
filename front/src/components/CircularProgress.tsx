import { useId } from 'react'

interface CircularProgressProps {
  /** 0 to 1. */
  pct: number
  size?: number
  strokeWidth?: number
  gradientFrom?: string
  gradientTo?: string
}

// Thin ring, gap at the top (via -rotate-90), rounded ends — same visual
// language as the Home page's prestige ring, minus the maxed-out gold
// state. Every instance shares the same violet→fuchsia gradient by default
// (matching the old linear stat bars, which were all one color regardless
// of category) — pass gradientFrom/To only for a deliberately different one.
export function CircularProgress({
  pct,
  size = 88,
  strokeWidth = 6,
  gradientFrom = '#a78bfa',
  gradientTo = '#e879f9',
}: CircularProgressProps) {
  const gradientId = `circular-progress-${useId()}`
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, pct)))
  const center = size / 2

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientFrom} />
          <stop offset="100%" stopColor={gradientTo} />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
    </svg>
  )
}
