import { useLocation } from 'react-router-dom'
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { MousePointerClick, CircleUserRound } from 'lucide-react'
import { LanguageToggle } from './LanguageToggle'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'

// No bar, no border, no background — the wordmark and the avatar just float
// directly on the page like everything else in the UI, nothing reads as chrome.
export function Header() {
  const { strings } = useLanguage()
  const { promptSignIn } = useSignInPrompt()
  const location = useLocation()
  // The battle screen is deliberately chrome-free — no wordmark, no avatar,
  // nothing but the fight itself for the full 30 seconds. Home is chrome-free
  // too, but for a different reason — its own cockpit console (top of
  // Home.tsx) is the only thing that gets to sit at the top of that screen.
  if (location.pathname.startsWith('/batalla') || location.pathname === '/') return null

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
        <SignedIn>
          <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-9 w-9' } }} />
        </SignedIn>
        <SignedOut>
          <button
            onClick={promptSignIn}
            aria-label={strings.signIn.continueWithGoogle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-200"
          >
            <CircleUserRound size={20} />
          </button>
        </SignedOut>
      </div>
    </>
  )
}
