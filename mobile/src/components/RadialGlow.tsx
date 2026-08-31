import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import { parseRgba } from '../lib/color'

// A real, single-instance SVG radial gradient — same shape as CSS's
// `radial-gradient(circle, color 0%, transparent 70%)`: a continuous fade
// from full color at the center to fully transparent by 70% of the radius
// (nothing beyond). An earlier version repeated the color at both 0% and
// 70% before fading, which holds it flat/solid across that whole inner
// region instead of actually fading the whole way — that read as a
// harder-edged disc with a soft rim, not the uniformly diffuse glow the web
// version has. Used wherever the web version has one of these ambient
// glows (the asteroid's aura, a modal header's accent light) —
// react-native-svg's gradient scaling is only unreliable when ONE gradient
// definition gets reused across several differently-sized shapes (see
// Asteroid.tsx's craters); a glow like this only ever paints a single
// circle, so a real gradient here is safe.
export function RadialGlow({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  const { color: solid, alpha } = parseRgba(color)
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={solid} stopOpacity={alpha * opacity} />
          <Stop offset="70%" stopColor={solid} stopOpacity={0} />
          <Stop offset="100%" stopColor={solid} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow)" />
    </Svg>
  )
}
