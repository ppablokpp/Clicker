// Splits an "rgba(r,g,b,a)" string into its solid color and alpha — needed
// wherever a value has to feed an SVG `stopColor`/`stopOpacity` pair
// separately instead of one CSS color string (e.g. MATERIAL_TIER_COLORS'
// `glow` values).
export function parseRgba(rgba: string): { color: string; alpha: number } {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (!match) return { color: rgba, alpha: 1 }
  const [, r, g, b, a] = match
  return { color: `rgb(${r},${g},${b})`, alpha: a !== undefined ? Number(a) : 1 }
}
