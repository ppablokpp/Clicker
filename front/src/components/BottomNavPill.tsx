import { NavLink, useLocation } from 'react-router-dom'
import { Trophy, BarChart3, Store, Network, Rocket } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const PILL_ITEMS = [
  { to: '/arbol', key: 'tree', icon: Network, end: false },
  { to: '/clasificacion', key: 'leaderboard', icon: Trophy, end: false },
  { to: '/', key: 'home', icon: Rocket, end: true },
  { to: '/estadisticas', key: 'stats', icon: BarChart3, end: false },
  { to: '/tienda', key: 'store', icon: Store, end: false },
] as const

// Fixed (position: fixed, never moves with scroll) minimalist pill with
// every destination — one accent color throughout, no per-tab coloring.
export function BottomNavPill() {
  const { strings } = useLanguage()
  const location = useLocation()
  // No nav during a battle — the bottom of the screen is the countdown
  // bar's spot instead.
  if (location.pathname.startsWith('/batalla')) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 sm:bottom-6">
      {/* A touch of the cockpit console's own material/accent — subtle
          scanline texture and a thin violet hairline — layered onto the
          plain rounded pill instead of replacing it, so the bar still
          reads as minimal, just with a hint of "ship" to it. */}
      <div className="relative rounded-full border border-white/10 bg-gradient-to-b from-[#17171f] via-[#101017] to-[#0a0a10] shadow-lg shadow-black/30 backdrop-blur-xl">
        {/* Clipped to the pill shape on its own — the raised Nave circle
            below still needs to poke out past this same rounded-full
            outline uncropped, so only this decorative layer (not the
            whole bar) gets overflow-hidden. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
            }}
          />
          <div className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        </div>

        <nav className="relative flex items-center gap-0.5 p-1">
        {PILL_ITEMS.map(({ to, key, icon: Icon, end }) => {
          const label = strings.nav[key]
          // The home tab (the actual clicker screen, and the default route
          // on load) sits in the center of the pill with a permanent
          // violet glow matching the ClankUp wordmark icon — everything
          // else is flat/minimal by comparison.
          const isCenter = key === 'home'

          // The raised center button is absolutely positioned (centered
          // both ways) inside a wider, same-height placeholder — height
          // stays h-10 so the pill's own height doesn't grow, the extra
          // width reserves breathing room from its neighbors (otherwise
          // their active-state highlight overlapped the raised circle),
          // and centering it on both axes makes it poke out symmetrically
          // above and below the bar instead of only on top.
          if (isCenter) {
            return (
              <div key={to} className="relative h-10 w-16">
                <NavLink
                  to={to}
                  end={end}
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors ${
                      isActive
                        ? 'border-violet-400/50 bg-[#171224] shadow-violet-500/30'
                        : 'border-violet-400/25 bg-[#12101a] shadow-violet-500/10 hover:border-violet-400/40'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <Icon
                      size={22}
                      className={`text-violet-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)] ${isActive ? '' : 'opacity-80'}`}
                    />
                  )}
                </NavLink>
              </div>
            )
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <Icon size={17} className={isActive ? 'text-violet-300' : 'text-neutral-500'} />
              )}
            </NavLink>
          )
        })}
        </nav>
      </div>
    </div>
  )
}
