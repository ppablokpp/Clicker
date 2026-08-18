import { NavLink } from 'react-router-dom'
import { MousePointerClick, Trophy, Award, Store } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const PILL_ITEMS = [
  { to: '/', key: 'home', icon: MousePointerClick, end: true },
  { to: '/clasificacion', key: 'leaderboard', icon: Trophy, end: false },
  { to: '/logros', key: 'achievements', icon: Award, end: false },
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
