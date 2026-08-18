import { UserButton } from '@clerk/clerk-react'
import { MousePointerClick } from 'lucide-react'
import { LanguageToggle } from './LanguageToggle'

// No bar, no border, no background — the wordmark and the avatar just float
// directly on the page like everything else in the UI, nothing reads as chrome.
export function Header() {
  return (
    <>
      <div className="pointer-events-none fixed left-4 top-3.5 z-40 flex items-center gap-2 sm:left-6">
        <MousePointerClick size={16} className="text-violet-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
        <span className="font-[Space_Grotesk] text-base font-bold tracking-tight text-white/90">
          ClankUp
        </span>
      </div>

      <div className="fixed right-4 top-3 z-40 flex items-center gap-2 sm:right-6">
        <LanguageToggle />
        <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-9 w-9' } }} />
      </div>
    </>
  )
}
