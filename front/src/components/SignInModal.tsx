import { useState } from 'react'
import { useClerk, useSignIn } from '@clerk/clerk-react'
import { TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { isNativeApp } from '../lib/native'
import { NativeSignInCancelled, signInWithGoogleNative } from '../lib/nativeSignIn'

interface ClerkApiError {
  errors?: { message?: string; longMessage?: string }[]
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const apiError = err as ClerkApiError
  const first = apiError?.errors?.[0]
  return first?.longMessage ?? first?.message ?? fallback
}

// Opened by any click/buy/claim action attempted while signed out — a
// dismissible overlay instead of a full-page wall, so guests can keep
// browsing the app without an account.
export function SignInModal() {
  const { isOpen, closePrompt } = useSignInPrompt()
  const { signIn, isLoaded } = useSignIn()
  const clerk = useClerk()
  const { strings } = useLanguage()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useLockBodyScroll(isOpen)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return
    setError(null)
    setIsRedirecting(true)
    // Inside the native shell there is no redirect: the system's account
    // sheet opens over the app and the token goes to Clerk directly (see
    // lib/nativeSignIn). The page never leaves, so the modal closes itself.
    if (isNativeApp()) {
      try {
        await signInWithGoogleNative(clerk)
        closePrompt()
      } catch (err) {
        if (!(err instanceof NativeSignInCancelled)) {
          console.error('Error iniciando sesión con Google (nativo)', err)
          // The plugin's own words after ours: on a phone there is no console
          // to read, and a client-id mismatch or a Play Services complaint is
          // only diagnosable from that text.
          const detail = (err as { message?: string })?.message
          setError(detail ? `${extractErrorMessage(err, strings.signIn.genericError)} (${detail})` : extractErrorMessage(err, strings.signIn.genericError))
        }
      } finally {
        setIsRedirecting(false)
      }
      return
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${import.meta.env.BASE_URL}sso-callback`,
        redirectUrlComplete: import.meta.env.BASE_URL,
      })
    } catch (err) {
      console.error('Error iniciando sesión con Google', err)
      setError(extractErrorMessage(err, strings.signIn.genericError))
      setIsRedirecting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={closePrompt}
    >
      {/* No name and no title: the sheet opens on the ringed rock itself —
          the app's own icon, drawn from its starfield — the way the game
          opens, and says in three lines what an account is for. */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0910] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* the sky: the icon's own starfield, fading into the card */}
        <div className="relative h-44">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-512.png`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_42%]"
            draggable={false}
          />
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(11,9,16,0) 45%, rgba(11,9,16,0.85) 82%, #0b0910 100%)' }}
          />
          <button
            onClick={closePrompt}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-neutral-300 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative -mt-2 px-6 pb-6">
          <p className="text-center font-[Space_Grotesk] text-lg font-bold text-white">{strings.signIn.tagline}</p>

          {/* what an account is for: three lit points on one line each */}
          <ul className="mt-4 flex flex-col gap-2">
            {strings.signIn.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-neutral-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_6px_1px_rgba(196,181,253,0.8)]" />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <button
            onClick={handleGoogleSignIn}
            disabled={!isLoaded || isRedirecting}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <GoogleIcon />
            {isRedirecting ? strings.signIn.redirecting : strings.signIn.continueWithGoogle}
          </button>

          <button
            onClick={closePrompt}
            className="mt-3 w-full py-1.5 text-center text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            {strings.signIn.continueAsGuest}
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-left text-xs text-red-300">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}
