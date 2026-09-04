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
  /** Chest badge disc — the symbol on top of it is its own slot. */
  badge: { from: string; to: string }
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

/**
 * Shape-only slots. Unlike the material slots above, these carry no colours
 * at all — the geometry lives in AstronautAvatar and takes its palette from
 * whatever it's attached to (the antenna from the helmet, the pack and
 * trail from the trim, and so on).
 *
 * That split is the point of this batch: the six original slots are all
 * recolours, and recolours have a ceiling — six helmets that differ only in
 * glass stop feeling like six items. These change the *silhouette*, which
 * is what still reads at 28px in a leaderboard row.
 */
export interface ShapeOption {
  id: string
}

/**
 * Head furniture. Smallest geometry in the game, most visible spot on it.
 * The crest and dish that were here got cut: both fought the helmet's own
 * dome for the silhouette instead of sitting on it.
 *
 * No "none" option here or in any other slot: every slot always has
 * something equipped. An empty slot isn't a look, it's a hole — and it
 * would also mean the cheapest possible avatar is the one wearing the least,
 * which is backwards for a catalogue you're meant to want to fill.
 */
export const ANTENNA_SHAPES: ShapeOption[] = [{ id: 'estandar' }, { id: 'doble' }, { id: 'halo' }]

/** Life-support pack — peeks past the shoulders, so it changes the outline. */
export const PACK_SHAPES: ShapeOption[] = [
  { id: 'estandar' },
  { id: 'carga' },
  { id: 'aletas' },
  { id: 'cilindros' },
  { id: 'reactor' },
  { id: 'alas' },
]

/**
 * What comes out of the thruster. Lives under the trim tab rather than an
 * effects tab of its own — it's one more thing the accent colour drives,
 * not a category.
 */
export const TRAIL_SHAPES: ShapeOption[] = [{ id: 'llama' }, { id: 'ionico' }, { id: 'anillos' }]

/**
 * The symbol inside the chest badge. The badge disc itself now takes the
 * trim colour like everything else in that tab — it was fixed while it was
 * meant to be a rank marker, but as a chosen symbol it's decoration, and
 * decoration that refuses to match the outfit just looks like an oversight.
 */
export const BADGE_SHAPES: ShapeOption[] = [{ id: 'planeta' }, { id: 'estrella' }, { id: 'rayo' }]

/**
 * The companion droid. The one slot that DOES get a "none", and by default
 * gets it: every other slot dresses a body part that exists whether you
 * choose for it or not, but a pet is a second character on screen. Forcing
 * one on everybody would change what the avatar *is* rather than how it
 * looks, so this one is opt-in.
 *
 * Two slots share this list — `pet` flies off the left shoulder, `pet2` off
 * the right — rather than one slot with a "two droids" option, because they
 * are independent choices: one, the other, both, or neither. Same catalogue
 * for both, so a companion added here shows up on either side for free.
 *
 * The three share a construction — helmet-shell chassis, trim-coloured light,
 * the same float/tilt — and differ in silhouette, which is the only thing
 * that survives at avatar scale: the droid is a compact box, the satellite is
 * wide with panels, the orb is a circle inside two rings. Picking two of them
 * should read as two different companions from across the screen, not as the
 * same one twice in different paint.
 */
export const PET_SHAPES: ShapeOption[] = [
  { id: 'ninguna' },
  { id: 'mascota1' },
  { id: 'satelite' },
  { id: 'orbe' },
]

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
    // Smoked glass, not a tint: this is the one helmet whose *shell* is the
    // choice, so a coloured visor would both fight that and repeat whatever
    // hue it borrowed (it used to be cyan, which simply duplicated the Cian
    // helmet's glass). A mirrored dark visor is what a graphite shell would
    // actually come with, and it keeps the option reading as one material
    // rather than as two unrelated decisions.
    id: 'grafito',
    swatch: '#334155',
    shell: { from: '#8f9aa8', mid: '#5c6675', to: '#2b3240', stroke: '#232936', seam: '#6b7585' },
    visor: { from: '#9aa5b4', via: '#454f5e', to: '#c2ccd8' },
  },
]

// --- Suits ---------------------------------------------------------------
// Materials, not tints. The first pass at this slot was six pastel washes
// (mint, coral, sand…) and they failed for a specific reason: the suit is
// the largest surface on the character, so anything applied to it has to be
// low saturation to avoid swamping the figure — which left every option
// sitting at nearly the same value and reading as "slightly dirty white"
// rather than as a choice. They also competed with the visor, which is
// where the character's actual colour accent lives.
//
// These are real spacesuit materials instead: the white EVA suit, brushed
// steel, flight-suit navy, Mars-surface tan, the orange launch-and-entry
// "pumpkin" suit, and charcoal. Each is instantly distinguishable from the
// others because they differ in value and temperature, not just hue, and
// each reads as a suit someone would actually wear rather than as the base
// suit dipped in paint.
export const SUIT_STYLES: SuitStyle[] = [
  {
    // `stroke` is what draws the pauldron and glove outlines — the line
    // that separates arm from torso. Its weight has to be judged against
    // the material's own mid tone, not in isolation: the dark suits read
    // well because their stroke sits far below their mid, while the pale
    // ones had a stroke almost level with theirs, so the arms melted into
    // the body. Deepened here to match that separation.
    id: 'estandar',
    swatch: '#e8e5f5',
    body: { from: '#ffffff', mid: '#f1eff9', to: '#c6c0dc', stroke: '#b0a8cb', seam: '#bdb6d6' },
    limb: { from: '#fdfdff', mid: '#eeecf7', to: '#bfb9d6', stroke: '#a79fc4', seam: '#bdb6d6' },
  },
  {
    // Metal reads as metal through *contrast*, not hue: a near-white
    // specular falling fast to a dark shadow. The first pass sat in a
    // narrow pale band, which just looked like a slightly grey suit.
    id: 'acero',
    swatch: '#8494a6',
    body: { from: '#ffffff', mid: '#aab6c4', to: '#5d6a7a', stroke: '#47525f', seam: '#7d8a9a' },
    limb: { from: '#f8fbfd', mid: '#9fabb9', to: '#54606f', stroke: '#3e4855', seam: '#7d8a9a' },
  },
  {
    id: 'marino',
    swatch: '#2c4a75',
    body: { from: '#4a6fa5', mid: '#2c4a75', to: '#14243c', stroke: '#101d33', seam: '#3d5f8f' },
    limb: { from: '#446699', mid: '#27436b', to: '#111f33', stroke: '#0d1829', seam: '#35547f' },
  },
  {
    id: 'arena',
    swatch: '#d8c096',
    body: { from: '#f2e6cd', mid: '#d8c096', to: '#a3855a', stroke: '#7e6238', seam: '#b3966a' },
    limb: { from: '#eee0c4', mid: '#d1b78b', to: '#987b51', stroke: '#725832', seam: '#b3966a' },
  },
  {
    // Deep crimson rather than the launch-suit orange that was here: at
    // full-torso scale that orange was the loudest thing on the character
    // by a wide margin. This sits at the same depth as Marino, and shares
    // its id with the crimson bracelets/belt/trim so a player can match a
    // set across slots.
    id: 'carmesi',
    swatch: '#a63a4d',
    body: { from: '#d97b88', mid: '#a63a4d', to: '#5e1a29', stroke: '#4d1522', seam: '#bd5568' },
    limb: { from: '#d1707e', mid: '#9c3546', to: '#571725', stroke: '#47121f', seam: '#b04d60' },
  },
  {
    id: 'grafito',
    swatch: '#475569',
    body: { from: '#8b95a3', mid: '#59636f', to: '#2c323c', stroke: '#242932', seam: '#6b7583' },
    limb: { from: '#828d9b', mid: '#515b67', to: '#262c35', stroke: '#1f242c', seam: '#616b79' },
  },
]

// --- Boots ---------------------------------------------------------------
// Deliberately the same six materials as the suits, id for id, rather than
// the accessory colour set. Boots are garment, not jewellery: pairing them
// with the suit is what lets a player build one outfit head to toe, and it
// keeps the bright accent palette where it belongs — on the small pieces
// (bracelets, belt, trim) that can carry saturation without swamping the
// figure. The pastel washes that were here failed the same way the old
// pastel suits did: a bright top stop on a small shape reads as candy, not
// as footwear.
export const BOOT_STYLES: BootStyle[] = [
  {
    id: 'estandar',
    swatch: '#e8e5f5',
    ramp: { from: '#fdfdff', mid: '#eeecf7', to: '#bfb9d6', stroke: '#a79fc4', seam: '#bdb6d6' },
  },
  {
    id: 'acero',
    swatch: '#8494a6',
    ramp: { from: '#f8fbfd', mid: '#9fabb9', to: '#54606f', stroke: '#3e4855', seam: '#7d8a9a' },
  },
  {
    id: 'marino',
    swatch: '#27436b',
    ramp: { from: '#446699', mid: '#27436b', to: '#111f33', stroke: '#0d1829', seam: '#35547f' },
  },
  {
    id: 'arena',
    swatch: '#d1b78b',
    ramp: { from: '#eee0c4', mid: '#d1b78b', to: '#987b51', stroke: '#725832', seam: '#b3966a' },
  },
  {
    id: 'carmesi',
    swatch: '#9c3546',
    ramp: { from: '#d1707e', mid: '#9c3546', to: '#571725', stroke: '#47121f', seam: '#b04d60' },
  },
  {
    id: 'grafito',
    swatch: '#4c5561',
    ramp: { from: '#7e8896', mid: '#4c5561', to: '#262c35', stroke: '#1e232b', seam: '#6a7482' },
  },
]

// --- Accents -------------------------------------------------------------
// Violet leads every accessory list: it's the app's own accent colour, so
// it's what the stock astronaut wears, and `pick()` below falls back to the
// first entry — keeping the default first is what stops a stale saved id
// from resolving to something other than the default.
export const ACCENT_STYLES: AccentStyle[] = [
  {
    id: 'violeta',
    swatch: '#a855f7',
    color: '#a855f7',
    badge: { from: '#c4b5fd', to: '#a855f7' },
    pack: { from: '#8b46cc', to: '#63339a' },
    flame: { outer: '#a855f7', innerMid: '#e9d5ff', innerTo: '#c4b5fd' },
  },
  {
    id: 'oro',
    swatch: '#fbbf24',
    color: '#fbbf24',
    badge: { from: '#fde68a', to: '#f59e0b' },
    pack: { from: '#d9a02a', to: '#a97b1c' },
    flame: { outer: '#f59e0b', innerMid: '#fef3c7', innerTo: '#fcd34d' },
  },
  {
    id: 'cian',
    swatch: '#22d3ee',
    color: '#22d3ee',
    badge: { from: '#a5f3fc', to: '#22d3ee' },
    pack: { from: '#1fb2cb', to: '#15829a' },
    flame: { outer: '#06b6d4', innerMid: '#cffafe', innerTo: '#67e8f9' },
  },
  {
    id: 'esmeralda',
    swatch: '#34d399',
    color: '#34d399',
    badge: { from: '#a7f3d0', to: '#10b981' },
    pack: { from: '#2bb489', to: '#1d8767' },
    flame: { outer: '#10b981', innerMid: '#d1fae5', innerTo: '#6ee7b7' },
  },
  {
    id: 'grafito',
    swatch: '#64748b',
    color: '#64748b',
    badge: { from: '#cbd5e1', to: '#64748b' },
    pack: { from: '#5a6675', to: '#3b4552' },
    flame: { outer: '#64748b', innerMid: '#e2e8f0', innerTo: '#94a3b8' },
  },
  {
    id: 'carmesi',
    swatch: '#fb7185',
    color: '#fb7185',
    badge: { from: '#fecdd3', to: '#fb7185' },
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
  { id: 'violeta', color: '#a855f7' },
  { id: 'oro', color: '#fbbf24' },
  { id: 'cian', color: '#22d3ee' },
  { id: 'esmeralda', color: '#34d399' },
  { id: 'grafito', color: '#64748b' },
  { id: 'carmesi', color: '#fb7185' },
] as const

export const BRACELET_STYLES: BraceletStyle[] = SHARED_ACCESSORY_COLORS.map(({ id, color }) => ({
  id,
  swatch: color,
  color,
}))

export const BELT_STYLES: BeltStyle[] = [
  { id: 'violeta', swatch: '#a855f7', band: { from: '#8b46cc', mid: '#c99cf5', to: '#63339a' } },
  { id: 'oro', swatch: '#fbbf24', band: { from: '#d9a72e', mid: '#fcd77a', to: '#a9781c' } },
  { id: 'cian', swatch: '#22d3ee', band: { from: '#1a9fb8', mid: '#7fe3f4', to: '#127287' } },
  { id: 'esmeralda', swatch: '#34d399', band: { from: '#26a67e', mid: '#7cebc0', to: '#197a5c' } },
  { id: 'grafito', swatch: '#64748b', band: { from: '#4a5464', mid: '#8a95a5', to: '#2c333d' } },
  { id: 'carmesi', swatch: '#fb7185', band: { from: '#d8586b', mid: '#fca6b2', to: '#a63f4f' } },
]

/** What a player has picked, stored as ids so the palettes can be retuned. */
export interface AstronautStyleIds {
  helmet: string
  suit: string
  boots: string
  belt: string
  bracelet: string
  antenna: string
  pack: string
  trail: string
  badge: string
  pet: string
  pet2: string
  accent: string
}

/** The same choice with every palette already looked up. */
export interface ResolvedAstronautStyle {
  helmet: HelmetStyle
  suit: SuitStyle
  boots: BootStyle
  belt: BeltStyle
  bracelet: BraceletStyle
  antenna: ShapeOption
  pack: ShapeOption
  trail: ShapeOption
  badge: ShapeOption
  pet: ShapeOption
  pet2: ShapeOption
  accent: AccentStyle
}

export const DEFAULT_STYLE_IDS: AstronautStyleIds = {
  helmet: 'estandar',
  suit: 'estandar',
  boots: 'estandar',
  belt: 'violeta',
  bracelet: 'violeta',
  antenna: 'estandar',
  pack: 'estandar',
  trail: 'llama',
  badge: 'planeta',
  pet: 'ninguna',
  pet2: 'ninguna',
  accent: 'violeta',
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
    antenna: pick(ANTENNA_SHAPES, ids.antenna),
    pack: pick(PACK_SHAPES, ids.pack),
    trail: pick(TRAIL_SHAPES, ids.trail),
    badge: pick(BADGE_SHAPES, ids.badge),
    pet: pick(PET_SHAPES, ids.pet),
    pet2: pick(PET_SHAPES, ids.pet2),
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
      antenna: typeof parsed.antenna === 'string' ? parsed.antenna : DEFAULT_STYLE_IDS.antenna,
      pack: typeof parsed.pack === 'string' ? parsed.pack : DEFAULT_STYLE_IDS.pack,
      trail: typeof parsed.trail === 'string' ? parsed.trail : DEFAULT_STYLE_IDS.trail,
      badge: typeof parsed.badge === 'string' ? parsed.badge : DEFAULT_STYLE_IDS.badge,
      pet: typeof parsed.pet === 'string' ? parsed.pet : DEFAULT_STYLE_IDS.pet,
      pet2: typeof parsed.pet2 === 'string' ? parsed.pet2 : DEFAULT_STYLE_IDS.pet2,
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
