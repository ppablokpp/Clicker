// Ported from front/src/pages/Home.tsx — the deterministic jagged-rock
// outline and its hardcoded crater/speckle decoration data, shared by
// SpaceObject (the tappable rock) and any future preview/mini variant.

type Point = [number, number]

// Deterministic wobble (not random) so the shape is stable across renders —
// two overlapping sine waves at different frequencies read as an organic,
// rounded rock instead of a perfect circle or a jagged/spiky one.
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

export const ASTEROID_POINTS = buildRoundRockOutline(20, 42, 3)
export const ASTEROID_POLYGON_POINTS = ASTEROID_POINTS.map((p) => p.join(',')).join(' ')

export const CRATERS = [
  { cx: 38, cy: 38, r: 6.5 },
  { cx: 63, cy: 55, r: 8.5 },
  { cx: 68, cy: 32, r: 4 },
  { cx: 42, cy: 66, r: 5.5 },
  { cx: 55, cy: 40, r: 3 },
  { cx: 28, cy: 55, r: 3.5 },
  { cx: 60, cy: 68, r: 2.5 },
]

export const SPECKLES = [
  { cx: 30, cy: 28, r: 1.4 },
  { cx: 48, cy: 24, r: 1 },
  { cx: 72, cy: 45, r: 1.2 },
  { cx: 58, cy: 58, r: 1 },
  { cx: 35, cy: 48, r: 0.9 },
  { cx: 45, cy: 72, r: 1.3 },
  { cx: 25, cy: 62, r: 1 },
  { cx: 65, cy: 25, r: 0.9 },
]
