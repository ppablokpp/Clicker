// Everything the astronaut can be re-skinned with. Deliberately data, not
// components: AstronautAvatar reads a resolved style object and feeds it
// straight into its gradient stops, so adding a new colourway later is one
// entry here and nothing else.
//
// Every slot is a *recolour* of geometry that already exists — no new
// shapes. That's the whole scope for now (see the customization screen);
// real alternate silhouettes (a different helmet shell, actual boot
// shapes) are the natural next step and this shape is built to take them:
// a slot option can grow extra fields without any caller changing.

/** A material's volume gradient plus the line work drawn on top of it. */
export interface Ramp {
  /** Lit face, where the key light hits. */
  from: string
  /** The material's own mid tone — most of what the eye reads as "colour". */
  mid: string
  /** Shadow side. */
  to: string
  /** Outlines (glove/boot rims, pauldron edges). */
  stroke: string
  /** Interior line work (quilting seams, creases) — softer than `stroke`. */
  seam: string
}

export interface HelmetStyle {
  id: string
  /** Swatch shown in the picker — the colour a player actually recognises. */
  swatch: string
  shell: Ramp
  visor: { from: string; via: string; to: string }
}

export interface SuitStyle {
  id: string
  swatch: string
  /** Torso. */
  body: Ramp
  /** Arms, gloves, pauldrons — a shade off the torso so limbs read separately. */
  limb: Ramp
  /** Belt roll: light edge, bright centre, shadow edge. */
  belt: { from: string; mid: string; to: string }
  /** Life-support pack behind the shoulders. */
  pack: { from: string; to: string }
}

export interface BootStyle {
  id: string
  swatch: string
  ramp: Ramp
}

/** Cuffs, zip pull, name tag, antenna light, chest badge and the thruster. */
export interface AccentStyle {
  id: string
  swatch: string
  /** Flat accent (cuffs, tag, zip pull, antenna bulb). */
  color: string
  /** Chest badge gradient. */
  badge: { from: string; to: string }
  /** Thruster flame — outer plume and inner core. */
  flame: { outer: string; innerMid: string; innerTo: string }
}

// --- Helmets -------------------------------------------------------------
// `estandar` is the exact original palette; everything after it is a
// recolour of the same dome.
export const HELMET_STYLES: HelmetStyle[] = [
  {
    id: 'estandar',
    swatch: '#a855f7',
    shell: { from: '#ffffff', mid: '#efedf9', to: '#b9b3d3', stroke: '#b6b0ce', seam: '#cbc6e2' },
    visor: { from: '#c4b5fd', via: '#a855f7', to: '#e879f9' },
  },
  {
    id: 'platino',
    swatch: '#94a3b8',
    shell: { from: '#ffffff', mid: '#eef2f6', to: '#a9b4c2', stroke: '#a3aebc', seam: '#c3ccd6' },
    visor: { from: '#bae6fd', via: '#38bdf8', to: '#e0f2fe' },
  },
  {
    id: 'esmeralda',
    swatch: '#10b981',
    shell: { from: '#ffffff', mid: '#e9f7f0', to: '#a8ccbb', stroke: '#9fc4b3', seam: '#c2ded1' },
    visor: { from: '#a7f3d0', via: '#10b981', to: '#6ee7b7' },
  },
  {
    id: 'oro',
    swatch: '#f59e0b',
    shell: { from: '#fffdf7', mid: '#fbf1dc', to: '#d3b98a', stroke: '#c9ae7d', seam: '#e3d2b0' },
    visor: { from: '#fde68a', via: '#f59e0b', to: '#fcd34d' },
  },
  {
    id: 'carmesi',
    swatch: '#e11d48',
    shell: { from: '#fffafb', mid: '#fbe9ee', to: '#cfa3b1', stroke: '#c599a8', seam: '#e2c6cf' },
    visor: { from: '#fda4af', via: '#e11d48', to: '#fb7185' },
  },
  {
    id: 'grafito',
    swatch: '#334155',
    shell: { from: '#8f9aa8', mid: '#5c6675', to: '#2b3240', stroke: '#232936', seam: '#6b7585' },
    visor: { from: '#67e8f9', via: '#06b6d4', to: '#a5f3fc' },
  },
]

// --- Suits ---------------------------------------------------------------
export const SUIT_STYLES: SuitStyle[] = [
  {
    id: 'estandar',
    swatch: '#e8e5f5',
    body: { from: '#ffffff', mid: '#f1eff9', to: '#c6c0dc', stroke: '#c9c4e0', seam: '#cbc6e2' },
    limb: { from: '#fdfdff', mid: '#eeecf7', to: '#bfb9d6', stroke: '#c1bbd8', seam: '#cbc6e2' },
    belt: { from: '#e4e0f1', mid: '#fbfaff', to: '#cbc6de' },
    pack: { from: '#9b8cc7', to: '#7a6aa8' },
  },
  {
    id: 'acero',
    swatch: '#cbd5e1',
    body: { from: '#ffffff', mid: '#eef2f7', to: '#b3bfcd', stroke: '#b6c2cf', seam: '#c6d0da' },
    limb: { from: '#fdfeff', mid: '#e9eef4', to: '#aab6c4', stroke: '#adb9c7', seam: '#c6d0da' },
    belt: { from: '#dfe6ee', mid: '#fbfdff', to: '#c0cad6' },
    pack: { from: '#8e9bad', to: '#6d798a' },
  },
  {
    id: 'menta',
    swatch: '#6ee7b7',
    body: { from: '#ffffff', mid: '#e9f8f1', to: '#a9cfbd', stroke: '#a6ccba', seam: '#c0dcd0' },
    limb: { from: '#fdfffe', mid: '#e2f4ec', to: '#9ec6b4', stroke: '#9dc4b2', seam: '#c0dcd0' },
    belt: { from: '#dcf0e7', mid: '#fbfffd', to: '#b6d5c6' },
    pack: { from: '#7fb69f', to: '#5f9382' },
  },
  {
    id: 'arena',
    swatch: '#fcd34d',
    body: { from: '#fffefa', mid: '#faf2e2', to: '#d2bd97', stroke: '#cfba95', seam: '#e0d1b6' },
    limb: { from: '#fffefb', mid: '#f6ecd9', to: '#c9b38c', stroke: '#c6b089', seam: '#e0d1b6' },
    belt: { from: '#f3e8d3', mid: '#fffdf8', to: '#d9c6a3' },
    pack: { from: '#b9a37e', to: '#948063' },
  },
  {
    id: 'coral',
    swatch: '#fb7185',
    body: { from: '#fffbfb', mid: '#fceaed', to: '#d6a8b1', stroke: '#d3a4ae', seam: '#e6c8cf' },
    limb: { from: '#fffcfc', mid: '#f9e2e6', to: '#cd9ca6', stroke: '#ca98a3', seam: '#e6c8cf' },
    belt: { from: '#f7e2e6', mid: '#fffcfd', to: '#dfb6bf' },
    pack: { from: '#c08d97', to: '#9a6f78' },
  },
  {
    id: 'grafito',
    swatch: '#475569',
    body: { from: '#8b95a3', mid: '#59636f', to: '#2c323c', stroke: '#242932', seam: '#6b7583' },
    limb: { from: '#828d9b', mid: '#515b67', to: '#262c35', stroke: '#1f242c', seam: '#616b79' },
    belt: { from: '#5d6773', mid: '#8d97a4', to: '#3b434e' },
    pack: { from: '#3f4753', to: '#2b323b' },
  },
]

// --- Boots ---------------------------------------------------------------
export const BOOT_STYLES: BootStyle[] = [
  {
    id: 'estandar',
    swatch: '#e8e5f5',
    ramp: { from: '#fdfdff', mid: '#eeecf7', to: '#bfb9d6', stroke: '#c1bbd8', seam: '#c1bbd8' },
  },
  {
    id: 'grafito',
    swatch: '#334155',
    ramp: { from: '#7e8896', mid: '#4c5561', to: '#262c35', stroke: '#1e232b', seam: '#6a7482' },
  },
  {
    id: 'ambar',
    swatch: '#f59e0b',
    ramp: { from: '#fff3d6', mid: '#fbd88b', to: '#c08d2c', stroke: '#b3822a', seam: '#e0b45e' },
  },
  {
    id: 'cian',
    swatch: '#06b6d4',
    ramp: { from: '#d9f6fb', mid: '#8fdcea', to: '#2b93a8', stroke: '#27879a', seam: '#63c0d2' },
  },
  {
    id: 'violeta',
    swatch: '#a855f7',
    ramp: { from: '#eadcff', mid: '#c4a3f5', to: '#7a4bbd', stroke: '#6f43ad', seam: '#a583d8' },
  },
  {
    id: 'carmesi',
    swatch: '#e11d48',
    ramp: { from: '#ffd9e1', mid: '#f899ac', to: '#b23a53', stroke: '#a4344b', seam: '#dd7488' },
  },
]

// --- Accents -------------------------------------------------------------
export const ACCENT_STYLES: AccentStyle[] = [
  {
    id: 'ambar',
    swatch: '#fbbf24',
    color: '#fbbf24',
    badge: { from: '#c4b5fd', to: '#e879f9' },
    flame: { outer: '#a855f7', innerMid: '#e9d5ff', innerTo: '#c4b5fd' },
  },
  {
    id: 'cian',
    swatch: '#22d3ee',
    color: '#22d3ee',
    badge: { from: '#a5f3fc', to: '#22d3ee' },
    flame: { outer: '#06b6d4', innerMid: '#cffafe', innerTo: '#67e8f9' },
  },
  {
    id: 'esmeralda',
    swatch: '#34d399',
    color: '#34d399',
    badge: { from: '#a7f3d0', to: '#10b981' },
    flame: { outer: '#10b981', innerMid: '#d1fae5', innerTo: '#6ee7b7' },
  },
  {
    id: 'rosa',
    swatch: '#f472b6',
    color: '#f472b6',
    badge: { from: '#fbcfe8', to: '#ec4899' },
    flame: { outer: '#ec4899', innerMid: '#fce7f3', innerTo: '#f9a8d4' },
  },
  {
    id: 'carmesi',
    swatch: '#fb7185',
    color: '#fb7185',
    badge: { from: '#fecdd3', to: '#e11d48' },
    flame: { outer: '#e11d48', innerMid: '#ffe4e6', innerTo: '#fda4af' },
  },
  {
    id: 'nieve',
    swatch: '#e2e8f0',
    color: '#e2e8f0',
    badge: { from: '#f8fafc', to: '#cbd5e1' },
    flame: { outer: '#94a3b8', innerMid: '#f1f5f9', innerTo: '#cbd5e1' },
  },
]

/** What a player has picked, stored as ids so the palettes can be retuned. */
export interface AstronautStyleIds {
  helmet: string
  suit: string
  boots: string
  accent: string
}

/** The same choice with every palette already looked up. */
export interface ResolvedAstronautStyle {
  helmet: HelmetStyle
  suit: SuitStyle
  boots: BootStyle
  accent: AccentStyle
}

export const DEFAULT_STYLE_IDS: AstronautStyleIds = {
  helmet: 'estandar',
  suit: 'estandar',
  boots: 'estandar',
  accent: 'ambar',
}

// Unknown ids fall back to the first entry rather than throwing — a saved
// id can outlive the option it named (a retuned palette, a renamed slot),
// and a player's avatar failing to render is never the right response to
// that.
function pick<T extends { id: string }>(list: T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0]
}

export function resolveStyle(ids: AstronautStyleIds): ResolvedAstronautStyle {
  return {
    helmet: pick(HELMET_STYLES, ids.helmet),
    suit: pick(SUIT_STYLES, ids.suit),
    boots: pick(BOOT_STYLES, ids.boots),
    accent: pick(ACCENT_STYLES, ids.accent),
  }
}

const STORAGE_KEY = 'clankup_astronaut_style'

// Browser-local for now, deliberately: the customization is cosmetic and
// has no server model yet, so there's nothing to sync and nothing that
// breaks if it's missing. When it does become an account-level thing (so
// other players see it on your public profile), this is the one function
// to change.
export function loadStyleIds(): AstronautStyleIds {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STYLE_IDS
    const parsed = JSON.parse(raw) as Partial<AstronautStyleIds>
    return {
      helmet: typeof parsed.helmet === 'string' ? parsed.helmet : DEFAULT_STYLE_IDS.helmet,
      suit: typeof parsed.suit === 'string' ? parsed.suit : DEFAULT_STYLE_IDS.suit,
      boots: typeof parsed.boots === 'string' ? parsed.boots : DEFAULT_STYLE_IDS.boots,
      accent: typeof parsed.accent === 'string' ? parsed.accent : DEFAULT_STYLE_IDS.accent,
    }
  } catch {
    return DEFAULT_STYLE_IDS
  }
}

export function saveStyleIds(ids: AstronautStyleIds): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
}
