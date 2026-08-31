import { Circle, G } from 'react-native-svg'

// One clean solid circle (dark "well") plus a small rim highlight on its
// sunlit edge. Shared by Asteroid and MiniAsteroid so the two never drift
// out of sync.
export function Crater({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const wellCx = cx - r * 0.1
  const wellCy = cy - r * 0.12
  return (
    <G>
      <Circle cx={wellCx} cy={wellCy} r={r} fill="rgba(0,0,0,0.42)" />
      <Circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.3} fill="rgba(255,255,255,0.16)" />
    </G>
  )
}
