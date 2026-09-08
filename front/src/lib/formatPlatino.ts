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
  // Q (cuatrillón) is the last one worth having: 1e15 is already past
  // Number.MAX_SAFE_INTEGER's own order of magnitude (~9.007e15), so anything
  // that would need a further tier is a number this can't count on being
  // exact anyway.
  const [threshold, suffix] = tierFor(abs)
  // Truncated, not rounded — a rounded-up decimal would flash a number
  // slightly bigger than what's actually owned.
  const scaled = Math.floor((floored / threshold) * 100) / 100
  return `${scaled.toFixed(2)}${suffix}`
}

// Q (cuatrillón) is the last one worth having: 1e15 is already past
// Number.MAX_SAFE_INTEGER's own order of magnitude (~9.007e15), so anything
// that would need a further tier is a number this can't count on being
// exact anyway.
const TIERS: [number, string][] = [
  [1e15, 'Q'],
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]
const tierFor = (abs: number) => TIERS.find(([t]) => abs >= t) ?? TIERS[TIERS.length - 1]

/**
 * Same suffixes as formatPlatino, for a *rate* rather than a balance.
 *
 * The difference is what happens below 1M: formatPlatino floors, because a
 * balance is a whole number of clicks. A production rate is not — a drone
 * starts at 0.5/s and Sobrecarga moves it in fifteen-percent steps, so
 * flooring would show "10" for three different values in a row and "0" for
 * a fresh drone. Two decimals below the suffix threshold, suffix above it.
 */
export function formatRate(value: number, language: 'es' | 'en'): string {
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const abs = Math.abs(value)
  if (abs < 1_000_000) return value.toLocaleString(locale, { maximumFractionDigits: 2 })
  const [threshold, suffix] = tierFor(abs)
  const scaled = Math.floor((value / threshold) * 100) / 100
  return `${scaled.toFixed(2)}${suffix}`
}
