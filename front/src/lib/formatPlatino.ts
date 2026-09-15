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
  return abbreviate(floored)
}

/**
 * The short-scale ladder idle games have settled on, so a player arriving from
 * any of them reads it without a key: M, B, T, then two letters each from
 * quadrillion up, because one letter cannot tell a quadrillion from a
 * quintillion. Same abbreviations in both languages — this is a game unit,
 * not a localized number, and the file has always used B and T short-scale
 * even though Spanish counts long.
 *
 * It used to stop at Q on the theory that anything past 1e15 was beyond what
 * a Number can count exactly, which is true and beside the point: the balance
 * has been a double for a long time, players do get there, and what they saw
 * was "1000.00Q". A display only needs the leading three digits, and those are
 * exact at any magnitude a double can hold.
 *
 * Shared with the wager ladder, so the two cannot drift.
 */
export const SUFFIX_TIERS: readonly [number, string][] = [
  [1e33, 'Dc'],
  [1e30, 'No'],
  [1e27, 'Oc'],
  [1e24, 'Sp'],
  [1e21, 'Sx'],
  [1e18, 'Qi'],
  [1e15, 'Qa'],
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]

/** Past a decillion. The ladder does go on (UDc, DDc, TDc…) but nobody reads
 *  those either; an exponent is at least unambiguous, and it never produces a
 *  four-digit mantissa the way a capped suffix does. */
const EXPONENT_FROM = 1e36

/**
 * Truncated, not rounded, all the way down — a rounded-up decimal would flash
 * a number slightly bigger than what's actually owned.
 *
 * Truncated with a hair of slack, though. A double cannot hold 1e23 exactly
 * (the nearest is 99999999999999991611392), so 1e23 / 1e21 comes out as
 * 99.99999999999999 and a bare floor turned the Diamante goal into 99.99Sx.
 * The slack is far below a hundredth of a unit, so a real 99.994 still shows
 * as 99.99 — only representation error gets rounded away, never an amount.
 */
const SLACK = 1e-9

function abbreviate(value: number): string {
  const abs = Math.abs(value)
  if (abs >= EXPONENT_FROM) {
    const exponent = Math.floor(Math.log10(abs) + SLACK)
    const mantissa = Math.floor((value / 10 ** exponent) * 100 + SLACK) / 100
    return `${mantissa.toFixed(2)}e${exponent}`
  }
  const [threshold, suffix] = SUFFIX_TIERS.find(([t]) => abs >= t) ?? SUFFIX_TIERS[SUFFIX_TIERS.length - 1]
  const scaled = Math.floor((value / threshold) * 100 + SLACK) / 100
  return `${scaled.toFixed(2)}${suffix}`
}

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
  return abbreviate(value)
}
