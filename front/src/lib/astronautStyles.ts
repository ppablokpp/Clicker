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
}

/**
 * The belt, its own slot alongside the bracelets — both are worn *over* the
 * suit rather than being part of it, so they're things you pick up, not
 * finishes on the garment.
 */
export interface BeltStyle {
  id: string
  swatch: string
  /** Cylindrical roll across the band's height: light edge, bright centre, shadow edge. */
  band: { from: string; mid: string; to: string }
}

export interface BootStyle {
  id: string
  swatch: string
  ramp: Ramp
}

/** The suit's own trim: zip pull, name tag, jetpack and the thruster. */
export interface AccentStyle {
  id: string
  swatch: string
  /** Flat trim (zip pull button, chest name tag). */
  color: string
  /** Life-support pack behind the shoulders — the gear the thruster feeds. */
  pack: { from: string; to: string }
  /** Thruster flame — outer plume and inner core. */
  flame: { outer: string; innerMid: string; innerTo: string }
}

/**
 * Wrist cuffs, and only those — their own slot rather than part of the
 * trim, because they're a wearable you pick up, not a finish on the suit.
 * Keeping them separate is what lets the trim be "the suit's colour scheme"
 * and the bracelets be "a thing you bought".
 */
export interface BraceletStyle {
  id: string
  swatch: string
  color: string
}

// The chest badge is deliberately NOT customizable: it's a rank/level slot,
// not decoration, so it has to mean the same thing on every player's
// avatar. Letting it take the accent colour would make a status marker
// look like a style choice.
export const BADGE_GRADIENT = { from: '#c4b5fd', to: '#e879f9' } as const

// --- Helmets -------------------------------------------------------------
// The shell stays the standard white/lilac for almost every helmet and only
// the visor glass changes — a tinted dome fights the suit for attention and
// makes the whole figure read as one flat colour, where a tinted *visor*
// keeps the character recognisable and still reads instantly. Graphite is
// the deliberate exception: it's a genuinely different shell material, not
// a tint, which is exactly what makes it feel like a separate item rather
// than a seventh colour of the same helmet.
const STANDARD_SHELL: Ramp = { from: '#ffffff', mid: '#efedf9', to: '#b9b3d3', stroke: '#b6b0ce', seam: '#cbc6e2' }

export const HELMET_STYLES: HelmetStyle[] = [
  {
    id: 'estandar',
    swatch: '#a855f7',
    shell: STANDARD_SHELL,
    visor: { from: '#c4b5fd', via: '#a855f7', to: '#e879f9' },
  },
  {
    id: 'cian',
    swatch: '#22d3ee',
    shell: STANDARD_SHELL,
    visor: { from: '#a5f3fc', via: '#22d3ee', to: '#cffafe' },
  },
  {
    id: 'esmeralda',
    swatch: '#10b981',
    shell: STANDARD_SHELL,
    visor: { from: '#a7f3d0', via: '#10b981', to: '#6ee7b7' },
  },
  {
    id: 'oro',
    swatch: '#f59e0b',
    shell: STANDARD_SHELL,
    visor: { from: '#fde68a', via: '#f59e0b', to: '#fcd34d' },
  },
  {
    id: 'carmesi',
    swatch: '#e11d48',
    shell: STANDARD_SHELL,
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
  },
  {
    id: 'acero',
    swatch: '#cbd5e1',
    body: { from: '#ffffff', mid: '#eef2f7', to: '#b3bfcd', stroke: '#b6c2cf', seam: '#c6d0da' },
    limb: { from: '#fdfeff', mid: '#e9eef4', to: '#aab6c4', stroke: '#adb9c7', seam: '#c6d0da' },
  },
  {
    id: 'menta',
    swatch: '#6ee7b7',
    body: { from: '#ffffff', mid: '#e9f8f1', to: '#a9cfbd', stroke: '#a6ccba', seam: '#c0dcd0' },
    limb: { from: '#fdfffe', mid: '#e2f4ec', to: '#9ec6b4', stroke: '#9dc4b2', seam: '#c0dcd0' },
  },
  {
    id: 'arena',
    swatch: '#fcd34d',
    body: { from: '#fffefa', mid: '#faf2e2', to: '#d2bd97', stroke: '#cfba95', seam: '#e0d1b6' },
    limb: { from: '#fffefb', mid: '#f6ecd9', to: '#c9b38c', stroke: '#c6b089', seam: '#e0d1b6' },
  },
  {
    id: 'coral',
    swatch: '#fb7185',
    body: { from: '#fffbfb', mid: '#fceaed', to: '#d6a8b1', stroke: '#d3a4ae', seam: '#e6c8cf' },
    limb: { from: '#fffcfc', mid: '#f9e2e6', to: '#cd9ca6', stroke: '#ca98a3', seam: '#e6c8cf' },
  },
  {
    id: 'grafito',
    swatch: '#475569',
    body: { from: '#8b95a3', mid: '#59636f', to: '#2c323c', stroke: '#242932', seam: '#6b7583' },
    limb: { from: '#828d9b', mid: '#515b67', to: '#262c35', stroke: '#1f242c', seam: '#616b79' },
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
    id: 'oro',
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
    id: 'oro',
    swatch: '#fbbf24',
    color: '#fbbf24',
    pack: { from: '#d9a02a', to: '#a97b1c' },
    flame: { outer: '#a855f7', innerMid: '#e9d5ff', innerTo: '#c4b5fd' },
  },
  {
    id: 'cian',
    swatch: '#22d3ee',
    color: '#22d3ee',
    pack: { from: '#1fb2cb', to: '#15829a' },
    flame: { outer: '#06b6d4', innerMid: '#cffafe', innerTo: '#67e8f9' },
  },
  {
    id: 'esmeralda',
    swatch: '#34d399',
    color: '#34d399',
    pack: { from: '#2bb489', to: '#1d8767' },
    flame: { outer: '#10b981', innerMid: '#d1fae5', innerTo: '#6ee7b7' },
  },
  {
    id: 'grafito',
    swatch: '#64748b',
    color: '#64748b',
    pack: { from: '#5a6675', to: '#3b4552' },
    flame: { outer: '#64748b', innerMid: '#e2e8f0', innerTo: '#94a3b8' },
  },
  {
    id: 'violeta',
    swatch: '#a855f7',
    color: '#a855f7',
    pack: { from: '#8b46cc', to: '#63339a' },
    flame: { outer: '#a855f7', innerMid: '#e9d5ff', innerTo: '#c4b5fd' },
  },
  {
    id: 'carmesi',
    swatch: '#fb7185',
    color: '#fb7185',
    pack: { from: '#e05f70', to: '#ad4453' },
    flame: { outer: '#e11d48', innerMid: '#ffe4e6', innerTo: '#fda4af' },
  },
]

// Bracelets, belts and accents deliberately share one six-colour set, so a
// player can match them across slots without hunting for a shade that only
// exists on one of them. Graphite is in place of a pink here: against the
// dark card panel a mid-slate reads as gunmetal, where a true #334155
// would disappear.
const SHARED_ACCESSORY_COLORS = [
  { id: 'oro', color: '#fbbf24' },
  { id: 'cian', color: '#22d3ee' },
  { id: 'esmeralda', color: '#34d399' },
  { id: 'grafito', color: '#64748b' },
  { id: 'violeta', color: '#a855f7' },
  { id: 'carmesi', color: '#fb7185' },
] as const

export const BRACELET_STYLES: BraceletStyle[] = SHARED_ACCESSORY_COLORS.map(({ id, color }) => ({
  id,
  swatch: color,
  color,
}))

export const BELT_STYLES: BeltStyle[] = [
  { id: 'oro', swatch: '#fbbf24', band: { from: '#d9a72e', mid: '#fcd77a', to: '#a9781c' } },
  { id: 'cian', swatch: '#22d3ee', band: { from: '#1a9fb8', mid: '#7fe3f4', to: '#127287' } },
  { id: 'esmeralda', swatch: '#34d399', band: { from: '#26a67e', mid: '#7cebc0', to: '#197a5c' } },
  { id: 'grafito', swatch: '#64748b', band: { from: '#4a5464', mid: '#8a95a5', to: '#2c333d' } },
  { id: 'violeta', swatch: '#a855f7', band: { from: '#8b46cc', mid: '#c99cf5', to: '#63339a' } },
  { id: 'carmesi', swatch: '#fb7185', band: { from: '#d8586b', mid: '#fca6b2', to: '#a63f4f' } },
]

/** What a player has picked, stored as ids so the palettes can be retuned. */
export interface AstronautStyleIds {
  helmet: string
  suit: string
  boots: string
  belt: string
  bracelet: string
  accent: string
}

/** The same choice with every palette already looked up. */
export interface ResolvedAstronautStyle {
  helmet: HelmetStyle
  suit: SuitStyle
  boots: BootStyle
  belt: BeltStyle
  bracelet: BraceletStyle
  accent: AccentStyle
}

export const DEFAULT_STYLE_IDS: AstronautStyleIds = {
  helmet: 'estandar',
  suit: 'estandar',
  boots: 'estandar',
  belt: 'oro',
  bracelet: 'oro',
  accent: 'oro',
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
    belt: pick(BELT_STYLES, ids.belt),
    bracelet: pick(BRACELET_STYLES, ids.bracelet),
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
      belt: typeof parsed.belt === 'string' ? parsed.belt : DEFAULT_STYLE_IDS.belt,
      bracelet: typeof parsed.bracelet === 'string' ? parsed.bracelet : DEFAULT_STYLE_IDS.bracelet,
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
