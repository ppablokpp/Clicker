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

// Fixed, full-width cockpit console bar — the same styling on every screen
// (matches Home's own cockpit header), with active state per-tab driven
// entirely by NavLink's own route matching, so whichever screen is open
// just lights up automatically. No per-page branching here anymore.
export function BottomNavPill() {
  const { strings } = useLanguage()
  const location = useLocation()
  // No nav during a battle — the bottom of the screen is the countdown
  // bar's spot instead.
  if (location.pathname.startsWith('/batalla')) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="relative mx-auto w-full max-w-md px-3 pb-5 sm:max-w-lg sm:px-4 sm:pb-6">
        <div
          className="relative overflow-hidden rounded-b-sm border border-white/10 bg-gradient-to-t from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-[0_-10px_34px_-10px_rgba(0,0,0,0.75)]"
          style={{
            clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%, 0 14px)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-1 w-1 rounded-full bg-white/25 shadow-[0_0_2px_rgba(255,255,255,0.4)]" />

          {/* Every tab sits in the exact same flex-1 slot, same size — Nave
              is the one exception, its whole icon+label stack wrapped in a
              violet pill (in place, nothing about the slot itself moves or
              resizes) so it still reads as "home" among the four flat
              ones. */}
          <nav className="relative flex h-14 items-center justify-between px-1 sm:h-16 sm:px-2">
            {PILL_ITEMS.map(({ to, key, icon: Icon, end }) => {
              const label = strings.nav[key]
              const isHome = key === 'home'
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  aria-label={label}
                  className="group flex flex-1 flex-col items-center gap-1"
                >
                  {({ isActive }) =>
                    isHome ? (
                      <span
                        className={`flex h-[50px] w-[50px] flex-col items-center justify-center gap-1 rounded-full border shadow-lg transition-colors ${
                          isActive
                            ? 'border-violet-400/50 bg-[#171224] shadow-violet-500/30'
                            : 'border-violet-400/25 bg-[#12101a] shadow-violet-500/10'
                        }`}
                      >
                        <Icon size={17} className={`text-violet-300 ${isActive ? '' : 'opacity-80'}`} />
                        <span
                          className={`whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-widest ${
                            isActive ? 'text-violet-300/80' : 'text-neutral-500'
                          }`}
                        >
                          {label}
                        </span>
                      </span>
                    ) : (
                      <>
                        <Icon size={17} className={isActive ? 'text-violet-300' : 'text-neutral-500'} />
                        <span
                          className={`whitespace-nowrap font-mono text-[8px] font-semibold uppercase tracking-widest ${
                            isActive ? 'text-violet-300/80' : 'text-neutral-600'
                          }`}
                        >
                          {label}
                        </span>
                      </>
                    )
                  }
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
