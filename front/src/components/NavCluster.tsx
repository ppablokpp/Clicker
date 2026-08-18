import { NavLink } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { MousePointerClick, Trophy, Award, Store } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: MousePointerClick, end: true, color: 'text-violet-300', ring: 'ring-violet-400/60' },
  { to: '/clasificacion', label: 'Clasificación', icon: Trophy, end: false, color: 'text-amber-300', ring: 'ring-amber-400/60' },
  { to: '/logros', label: 'Logros', icon: Award, end: false, color: 'text-emerald-300', ring: 'ring-emerald-400/60' },
  { to: '/tienda', label: 'Tienda', icon: Store, end: false, color: 'text-sky-300', ring: 'ring-sky-400/60' },
] as const

// Replaces a labeled tab bar: one small icon-only cluster, same on mobile and
// desktop, that never fights with the fullscreen click area for space.
export function NavCluster() {
  return (
    <div className="fixed right-4 top-3 z-40 flex flex-col items-center gap-2.5 sm:right-6">
      <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-9 w-9' } }} />

      <div className="h-px w-6 bg-white/10" />

      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, color, ring }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-all ${
                isActive
                  ? `border-white/20 bg-white/10 ring-2 ${ring}`
                  : 'border-white/10 bg-black/40 hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => <Icon size={19} className={isActive ? color : 'text-neutral-400'} />}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
