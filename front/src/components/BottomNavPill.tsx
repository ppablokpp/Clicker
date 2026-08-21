import { NavLink } from 'react-router-dom'
import { MousePointerClick, Trophy, BarChart3, Store, Network } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const PILL_ITEMS = [
  { to: '/clasificacion', key: 'leaderboard', icon: Trophy, end: false },
  { to: '/arbol', key: 'tree', icon: Network, end: false },
  { to: '/', key: 'home', icon: MousePointerClick, end: true },
  { to: '/estadisticas', key: 'stats', icon: BarChart3, end: false },
  { to: '/tienda', key: 'store', icon: Store, end: false },
] as const

// Fixed (position: fixed, never moves with scroll) minimalist pill with
// every destination — one accent color throughout, no per-tab coloring.
export function BottomNavPill() {
  const { strings } = useLanguage()

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 sm:bottom-6">
      <nav className="flex items-center gap-0.5 rounded-full border border-white/5 bg-black/40 p-1 shadow-lg shadow-black/30 backdrop-blur-xl">
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
  )
}
