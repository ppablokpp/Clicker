import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import { parseRgba } from '../lib/color'

// A real, single-instance SVG radial gradient — same shape as CSS's
// `radial-gradient(circle, color 0%, transparent 70%)`: solid color out to
// 70% of the radius, then a smooth fade to transparent at the edge. Used
// wherever the web version has one of these ambient glows (the asteroid's
// aura, a modal header's accent light) — a flat `backgroundColor` circle
// reads as a hard-edged disc instead of a soft glow, and react-native-svg's
// gradient scaling is only unreliable when ONE gradient definition gets
// reused across several differently-sized shapes (see Asteroid.tsx's
// craters) — a glow like this only ever paints a single circle, so a real
// gradient here is safe and gives a genuinely smooth falloff.
export function RadialGlow({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  const { color: solid, alpha } = parseRgba(color)
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={solid} stopOpacity={alpha * opacity} />
          <Stop offset="70%" stopColor={solid} stopOpacity={alpha * opacity} />
          <Stop offset="100%" stopColor={solid} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow)" />
    </Svg>
  )
}
