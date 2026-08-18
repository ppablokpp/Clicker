import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { MousePointerClick, TriangleAlert, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'

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
  const { strings } = useLanguage()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return
    setError(null)
    setIsRedirecting(true)
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={closePrompt}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/5 bg-[#0d0d14] p-8 text-center shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closePrompt}
          aria-label="Close"
          className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <MousePointerClick size={26} />
        </div>
        <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white">ClankUp</h1>
        <p className="mt-2 text-sm text-neutral-500">{strings.signIn.tagline}</p>

        <button
          onClick={handleGoogleSignIn}
          disabled={!isLoaded || isRedirecting}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <GoogleIcon />
          {isRedirecting ? strings.signIn.redirecting : strings.signIn.continueWithGoogle}
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-left text-xs text-red-300">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
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
