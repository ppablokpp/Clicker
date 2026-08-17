import { MousePointerClick, Trophy, Store } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Click', icon: MousePointerClick, end: true },
  { to: '/clasificacion', label: 'Ranking', icon: Trophy, end: false },
  { to: '/tienda', label: 'Tienda', icon: Store, end: false },
]

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/60 backdrop-blur-xl
                 pb-[env(safe-area-inset-bottom)]
                 sm:bottom-auto sm:top-0 sm:border-t-0 sm:border-b"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around sm:max-w-3xl sm:justify-center sm:gap-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1 sm:flex-none">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:px-5 sm:py-4 sm:text-sm ${
                  isActive
                    ? 'text-violet-300'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' : ''}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
