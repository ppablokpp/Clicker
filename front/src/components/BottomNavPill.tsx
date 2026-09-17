import { memo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { PLACE_ROUTES, usePlace } from '../lib/place'

/**
 * The tab glyphs, drawn here rather than taken from an icon set — the same
 * treatment the locker's own tab strip gives its pieces: solid silhouettes in
 * `currentColor`, chunky enough to survive 20px, and each one a thing from
 * this game rather than the generic sign for its category.
 *
 *   tree         the upgrade tree: a hub and two branches, as nodes
 *   leaderboard  a cup, with the handles and the plinth
 *   home         the rock with its ring — the thing you click, Saturn-style
 *   store        a market stall: the scalloped awning over the counter
 *   stats        the helmet, which is the profile's own avatar
 *
 * Solid fill instead of strokes on purpose: overlapping shapes merge into one
 * mass, which is what reads at this size. The cup's bowl is a cut-out
 * (evenodd) rather than a second colour, so it holds in any tint.
 */
function TabGlyph({ kind, size = 22 }: { kind: string; size?: number }) {
  switch (kind) {
    case 'tree':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 6 L5.5 17.5 M12 6 L18.5 17.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="5.5" r="3.4" />
          <circle cx="5.2" cy="18.2" r="3.2" />
          <circle cx="18.8" cy="18.2" r="3.2" />
        </svg>
      )
    case 'leaderboard':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5.5 4h13v2.4h2.5v2.2a4.4 4.4 0 0 1-3.2 4.2A6.5 6.5 0 0 1 12 15a6.5 6.5 0 0 1-5.8-2.2A4.4 4.4 0 0 1 3 8.6V6.4h2.5z M5.5 8.6v1.6a2.6 2.6 0 0 0 .3 1.2A6.5 6.5 0 0 1 5.5 9.5z M18.5 8.6a6.5 6.5 0 0 1-.3 2.8 2.6 2.6 0 0 0 .3-1.2z" fillRule="evenodd" />
          <rect x="10.4" y="14.5" width="3.2" height="3.5" />
          <rect x="6.5" y="17.5" width="11" height="3.2" rx="1.4" />
        </svg>
      )
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {/* The ring, tilted like the real one; the rock sits over its
              far half and merges with the near half, which is exactly how
              the silhouette of a ringed body reads. No craters: at this
              size two holes read as a face, not a surface. */}
          <ellipse cx="12" cy="12" rx="11" ry="3.6" transform="rotate(-16 12 12)" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="6.8" />
        </svg>
      )
    case 'store':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {/* The storefront the old icon-set glyph drew — a flared awning of
              three scallops over a rounded front with an arched doorway —
              flattened to a silhouette like the rest. The front's top sits
              just inside the scallops' lowest point, so the two overlap
              instead of leaving a hairline between them. */}
          <path d="M2.4 8 L3.9 3.6 a1.4 1.4 0 0 1 1.3-.9 h13.6 a1.4 1.4 0 0 1 1.3 .9 L21.6 8 v.4 a3.2 3.2 0 0 1-6.4 0 a3.2 3.2 0 0 1-6.4 0 a3.2 3.2 0 0 1-6.4 0 z" />
          <path d="M3.8 11.2 h16.4 v7.7 a2.2 2.2 0 0 1-2.2 2.2 H6 A2.2 2.2 0 0 1 3.8 18.9 z M9.6 21.1 v-3.5 a2.4 2.4 0 0 1 4.8 0 v3.5 z" fillRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {/* The helmet, as the locker's own tab draws it: dome, collar and
              antenna, one solid mass. */}
          <path d="M16.5 7.5 L20 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="20.2" cy="3.8" r="1.7" />
          <rect x="7" y="17" width="9" height="4.4" rx="2.2" />
          <circle cx="11.5" cy="11.5" r="8" />
        </svg>
      )
  }
}

const PILL_ITEMS = [
  { to: '/arbol', key: 'tree', end: false },
  { to: '/clasificacion', key: 'leaderboard', end: false },
  { to: '/', key: 'home', end: true },
  { to: '/tienda', key: 'store', end: false },
  // Profile glyph, not a chart one: this tab opens on the profile now and
  // the stats sit behind its own pill (see Stats.tsx).
  { to: '/estadisticas', key: 'stats', end: false },
] as const

// Thin wrapper — the only thing here that reads ClickCounterContext, whose
// value changes on every single tap (see useClickCounter.ts's own comment).
// Splitting it out like this means only *this* trivial component re-renders
// per tap; the actual pill markup below is memoized and only re-renders
// when `isSyncSuspended` itself actually flips, not on every click, even
// though this bar is mounted for the app's entire lifetime.
export function BottomNavPill() {
  // Store's case-opening reel suspends total-clicks syncing for the length
  // of its reveal animation (see MiniCaseReel/resolveWin) — leaving the
  // page mid-animation unmounts it before that suspend is ever released
  // (Framer's onAnimationComplete never fires for an unmounted node),
  // permanently wedging every future sync app-wide. Blocking navigation
  // for that same window is the actual fix, not just a courtesy.
  const { isSyncSuspended } = useClickCounterContext()
  return <BottomNavPillContent isSyncSuspended={isSyncSuspended} />
}

// The same glyph language as the locker's tabs — solid silhouettes — on the
// bar's own states: the open tab is a soft white wash with the glyph in
// violet, everything else a silhouette in the dark. The centre — the rock —
// is the one thing raised off the bar, because it's the screen the whole
// app is about.
const BottomNavPillContent = memo(function BottomNavPillContent({ isSyncSuspended }: { isSyncSuspended: boolean }) {
  const { strings } = useLanguage()
  const location = useLocation()
  // The centre tab leads to wherever you last were — the rock or the
  // station (see lib/place) — so leaving the station for the store and
  // coming back lands you back at the station.
  const place = usePlace()
  // No nav during a battle — the bottom of the screen is the countdown
  // bar's spot instead. Same for someone else's public profile: it's a
  // read-only drill-down reached by tapping a leaderboard row, not one of
  // the app's own tabs, so the only way back is its own back button —
  // showing the tab bar there would make it look like a sixth destination.
  // And none outside the ship: the tabs are the ship's own console, and
  // out there the stations are the way around, each screen they open with
  // a back button to outside (see OutsideBackButton).
  if (
    place === 'station' ||
    location.pathname.startsWith('/batalla') ||
    location.pathname.startsWith('/perfil/') ||
    location.pathname.startsWith('/personalizar')
  ) {
    return null
  }

  return (
    <div
      data-tutorial="bottom-nav"
      className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 transition-opacity sm:bottom-6 ${
        isSyncSuspended ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      <nav className="relative flex items-center gap-1 rounded-full border border-white/[0.09] bg-[#0d0d14]/85 p-1 shadow-lg shadow-black/40 backdrop-blur-xl">
        {PILL_ITEMS.map(({ to, key, end }) => {
          const label = strings.nav[key]

          // The raised centre button is absolutely positioned (centred both
          // ways) inside a wider, same-height placeholder — height stays
          // h-10 so the pill's own height doesn't grow, the extra width
          // reserves breathing room from its neighbours, and centring it on
          // both axes makes it poke out symmetrically above and below.
          if (key === 'home') {
            return (
              <div key={to} className="relative h-10 w-[4.25rem]">
                <NavLink
                  to={PLACE_ROUTES[place]}
                  end={end}
                  replace
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-colors ${
                      isActive
                        ? 'border-violet-400/50 bg-[#171224] text-violet-300 shadow-lg shadow-violet-500/30'
                        : 'border-violet-400/25 bg-[#12101a] text-violet-400 shadow-lg shadow-violet-500/10 hover:border-violet-400/40'
                    }`
                  }
                >
                  <TabGlyph kind="home" size={30} />
                </NavLink>
              </div>
            )
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              replace
              title={label}
              aria-label={label}
              data-tutorial={key === 'tree' ? 'nav-tree' : undefined}
              className={({ isActive }) =>
                `flex h-10 w-[3.25rem] items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-white/10 text-violet-300' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                }`
              }
            >
              <TabGlyph kind={key} />
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
})
