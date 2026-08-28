// Trayectoria's 5 materials — one color identity per prestige tier, shared
// by the asteroid itself (Home.tsx's OBJECT_TIERS) and every other bit of UI
// that's colored to match "whatever you're currently mining" (Store's buy
// buttons/pills, Tree's buy buttons, the currency icon). Index-aligned with
// strings.home.trajectoryTierNames and TRAJECTORY_TIER_THRESHOLDS.
//
// Amatista's violet is deliberately the app's original, long-standing
// accent color (violet-400/fuchsia-500) — that branding predates the
// material-tier system and just happens to already match Amatista, not
// Platino, so Platino gets its own real silvery-white identity here instead
// of inheriting it.
export interface MaterialTierColors {
  light: string
  fill: string
  dark: string
  glow: string
}

export const MATERIAL_TIER_COLORS: readonly MaterialTierColors[] = [
  // Amatista — the app's original violet accent. Tier 0 (swapped with Platino).
  { light: '#ede9fe', fill: '#a78bfa', dark: '#3b0764', glow: 'rgba(168,85,247,0.6)' },
  // Platino — cool silvery-white metal. Tier 1 (swapped with Amatista).
  { light: '#f8fafc', fill: '#cbd5e1', dark: '#334155', glow: 'rgba(203,213,225,0.55)' },
  // Esmeralda — green.
  { light: '#d1fae5', fill: '#6ee7b7', dark: '#022c22', glow: 'rgba(52,211,153,0.6)' },
  // Oro — warm metallic gold.
  { light: '#fef9c3', fill: '#facc15', dark: '#713f12', glow: 'rgba(250,204,21,0.6)' },
  // Diamante — placeholder cyan (Diamante's own real look TBD later).
  { light: '#cffafe', fill: '#67e8f9', dark: '#083344', glow: 'rgba(34,211,238,0.6)' },
] as const

// Store/Tree's "spend the current material" buttons and pills — same
// violet Tailwind classes those already used (Amatista, unchanged), just
// re-derived per tier from its own color family below instead of always
// being violet. Deliberately scoped to actual buy buttons only — node
// circles (Tree) and stat panels (Home) stay a fixed violet regardless of
// tier; only the purchase action itself follows the material.
// Every value here is a *complete* literal class string (never built with
// a template literal) so Tailwind's build-time class scanner can actually
// find and generate each one — an interpolated `` `bg-${family}-500/10` ``
// would silently produce no CSS at all.
export interface MaterialButtonTheme {
  /** Small balance pill (e.g. Store's header "your material" button). */
  pill: string
  /** Standard "you can afford this" buy button. */
  button: string
  /** Icon-wrap gradient badge used by modal headers/section cards. */
  iconWrap: string
}

export const MATERIAL_BUTTON_THEMES: readonly MaterialButtonTheme[] = [
  {
    // Amatista — identical to the app's original always-violet styling.
    // Tier 0 (swapped with Platino).
    pill: 'border border-violet-400/20 bg-violet-500/[0.07] text-violet-200 hover:bg-violet-500/[0.14]',
    button: 'border border-violet-400/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15',
    iconWrap: 'bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200',
  },
  {
    // Platino — Tier 1 (swapped with Amatista).
    pill: 'border border-slate-400/20 bg-slate-500/[0.07] text-slate-200 hover:bg-slate-500/[0.14]',
    button: 'border border-slate-400/30 bg-slate-500/10 text-slate-200 hover:bg-slate-500/15',
    iconWrap: 'bg-gradient-to-br from-slate-400/30 to-slate-600/20 text-slate-200',
  },
  {
    // Esmeralda
    pill: 'border border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-200 hover:bg-emerald-500/[0.14]',
    button: 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15',
    iconWrap: 'bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 text-emerald-200',
  },
  {
    // Oro
    pill: 'border border-yellow-400/20 bg-yellow-500/[0.07] text-yellow-200 hover:bg-yellow-500/[0.14]',
    button: 'border border-yellow-400/30 bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/15',
    iconWrap: 'bg-gradient-to-br from-yellow-400/30 to-yellow-600/20 text-yellow-200',
  },
  {
    // Diamante
    pill: 'border border-cyan-400/20 bg-cyan-500/[0.07] text-cyan-200 hover:bg-cyan-500/[0.14]',
    button: 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15',
    iconWrap: 'bg-gradient-to-br from-cyan-400/30 to-cyan-600/20 text-cyan-200',
  },
] as const
