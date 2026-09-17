import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { usePlace } from '../lib/place'

/**
 * The way back to outside the ship. The tab bar is gone while you're out
 * there (see BottomNavPill), so every screen a station opens — the store,
 * the ranking, the tree, the Refinería, the ship — gets this instead: the
 * same button the locker has, top left, back to where you were standing.
 * Inside the ship the tab bar is the way around, so it draws nothing.
 */
export function OutsideBackButton({ always = false }: { always?: boolean }) {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const place = usePlace()
  if (!always && place !== 'station') return null
  return (
    <button
      onClick={() => navigate('/estacion')}
      aria-label={strings.profile.backButton}
      className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
    >
      <ChevronLeft size={18} />
    </button>
  )
}
