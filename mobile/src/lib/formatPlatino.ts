// Below 1M, the exact number — it's short enough to read at a glance and
// watching the digits climb is part of the fun. From 1M up it switches to a
// 2-decimal + suffix form (1.23M, 999.90M, 1.00B, 1.00T…) since a raw digit
// string past that point is just noise; the suffix keeps the display length
// short and constant instead of needing to keep shrinking the font forever.
// The decimal point here is always a literal "." regardless of language —
// unlike the plain-number branch below, this is a compact game-style unit
// suffix, not a localized number, so it stays consistent either way.
export function formatPlatino(value: number, language: 'es' | 'en'): string {
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const floored = Math.floor(value)
  const abs = Math.abs(floored)
  if (abs < 1_000_000) return floored.toLocaleString(locale)
  const tiers: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
  ]
  const [threshold, suffix] = tiers.find(([t]) => abs >= t) ?? tiers[tiers.length - 1]
  // Truncated, not rounded — a rounded-up decimal would flash a number
  // slightly bigger than what's actually owned.
  const scaled = Math.floor((floored / threshold) * 100) / 100
  return `${scaled.toFixed(2)}${suffix}`
}
