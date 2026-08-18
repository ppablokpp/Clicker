import { NavLink } from 'react-router-dom'
import { MousePointerClick, Trophy, Award, Store } from 'lucide-react'

const PILL_ITEMS = [
  { to: '/', label: 'Inicio', icon: MousePointerClick, end: true, color: 'text-violet-300', ring: 'ring-violet-400/60' },
  { to: '/clasificacion', label: 'Clasificación', icon: Trophy, end: false, color: 'text-amber-300', ring: 'ring-amber-400/60' },
  { to: '/logros', label: 'Logros', icon: Award, end: false, color: 'text-emerald-300', ring: 'ring-emerald-400/60' },
  { to: '/tienda', label: 'Tienda', icon: Store, end: false, color: 'text-sky-300', ring: 'ring-sky-400/60' },
] as const

// Fixed (position: fixed, never moves with scroll) minimalist pill with
// every destination — the header carries brand + account instead.
export function BottomNavPill() {
  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 sm:bottom-6">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
        {PILL_ITEMS.map(({ to, label, icon: Icon, end, color, ring }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                isActive ? `bg-white/10 ring-2 ${ring}` : 'hover:bg-white/5'
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
