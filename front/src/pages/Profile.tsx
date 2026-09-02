import { useEffect, useState } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { Check, CircleUserRound, LogOut, Mail, Settings, X } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import type { Language } from '../i18n/translations'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const USERNAME_MIN = 3
const USERNAME_MAX = 20

type Status = 'idle' | 'busy'

// Clerk owns the identity (name, email); our own `users` table only mirrors
// it, and only at sign-in — see back/src/routes/users.js's /sync, which
// reads straight off the Clerk user. So every edit here goes to Clerk first
// and then re-fires that same sync endpoint, which is what actually makes a
// new name show up on the leaderboard instead of waiting for the player's
// next sign-in. No backend changes needed for any of this.
export function Profile() {
  const { strings } = useLanguage()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()

  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [username, setUsername] = useState('')
  const [nameStatus, setNameStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Seeded from Clerk once it loads (and again if the account changes),
  // never on every render — otherwise it would clobber whatever the player
  // is in the middle of typing.
  useEffect(() => {
    if (!user) return
    setUsername(user.username ?? user.firstName ?? '')
  }, [user])

  const resync = async () => {
    try {
      const token = await getToken()
      await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      // The Clerk-side change already succeeded; a failed mirror just means
      // the leaderboard catches up on the next sign-in instead of now.
      console.error('No se pudo resincronizar el perfil', err)
    }
  }

  const cancelEdit = () => {
    setUsername(user?.username ?? user?.firstName ?? '')
    setError(null)
    setShowUsernameModal(false)
  }

  const handleSaveName = async () => {
    if (!user) return
    const trimmed = username.trim()
    if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
      setError(strings.profile.errorUsernameInvalid)
      return
    }
    setError(null)
    setNameStatus('busy')
    try {
      await user.update({ username: trimmed })
      await resync()
      setNameStatus('idle')
      setShowUsernameModal(false)
      return
    } catch (err) {
      const clerkError = (err as { errors?: { code?: string; message?: string }[] })?.errors?.[0]
      const code = clerkError?.code ?? ''
      const message = clerkError?.message ?? ''
      // A genuinely taken name is a real, actionable failure — say so and
      // stop, rather than quietly writing the name somewhere else.
      if (code === 'form_identifier_exists' || /taken|already/i.test(message)) {
        setNameStatus('idle')
        setError(strings.profile.errorUsernameTaken)
        return
      }
      // Anything else here is almost always Clerk's "Usernames" feature
      // being switched off for this instance, in which case `username` is
      // simply not a field this account has. The leaderboard reads
      // `username ?? firstName` (see back/src/routes/users.js's /sync), so
      // firstName is an equally valid home for the display name — fall back
      // to it instead of showing the player an error for a setting they
      // can't see or control.
      try {
        await user.update({ firstName: trimmed })
        await resync()
        setNameStatus('idle')
        setShowUsernameModal(false)
      } catch (fallbackErr) {
        console.error('No se pudo guardar el nombre', fallbackErr)
        setNameStatus('idle')
        setError(strings.profile.errorGeneric)
      }
    }
  }

  if (isLoaded && !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 pt-24 text-center sm:pt-28">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
          <CircleUserRound size={26} />
        </div>
        <div>
          <p className="text-base font-semibold text-white">{strings.profile.signedOutTitle}</p>
          <p className="mt-1 text-sm text-neutral-500">{strings.profile.signedOutBody}</p>
        </div>
        <button
          onClick={promptSignIn}
          className="mt-1 rounded-xl border border-violet-400/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
        >
          {strings.profile.signIn}
        </button>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="mx-auto max-w-md pt-24 sm:pt-28" />
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-24 sm:pt-28">
      {/* Settings — gear top-right, same fixed strip the tab's own
          profile/stats pill sits in. Everything account-adjacent (language,
          email, sign out) lives behind it, keeping this main view down to
          just the character and the name. */}
      <button
        onClick={() => setShowSettings(true)}
        aria-label={strings.profile.settingsLabel}
        className="fixed right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:right-6 sm:top-6"
      >
        <Settings size={16} />
      </button>

      <div className="mt-6">
        <AstronautAvatar />
      </div>

      {/* Tapping the name itself opens the edit modal below — no separate
          pencil icon sitting next to it. */}
      <button
        onClick={() => setShowUsernameModal(true)}
        aria-label={strings.profile.editName}
        className="mt-14 rounded-lg px-2 py-1 font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white transition-colors hover:bg-white/[0.06]"
      >
        @{username || strings.profile.usernamePlaceholder}
      </button>

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      {showUsernameModal && (
        <EditUsernameModal
          username={username}
          setUsername={setUsername}
          status={nameStatus}
          error={error}
          onSave={handleSaveName}
          onClose={cancelEdit}
        />
      )}
    </div>
  )
}

// Opened by tapping the name itself — a small, focused modal instead of an
// inline pencil-triggered edit, so the main view stays down to just the
// character and the name it's actually showing.
function EditUsernameModal({
  username,
  setUsername,
  status,
  error,
  onSave,
  onClose,
}: {
  username: string
  setUsername: (value: string) => void
  status: Status
  error: string | null
  onSave: () => void
  onClose: () => void
}) {
  const { strings } = useLanguage()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] p-5 shadow-2xl shadow-black/50 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[Space_Grotesk] text-base font-bold text-white">{strings.profile.editName}</h2>
          <button
            onClick={onClose}
            aria-label={strings.profile.cancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <X size={15} />
          </button>
        </div>

        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
            if (e.key === 'Escape') onClose()
          }}
          maxLength={USERNAME_MAX}
          placeholder={strings.profile.usernamePlaceholder}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-violet-400/40 focus:outline-none"
        />
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

        <button
          onClick={onSave}
          disabled={status === 'busy'}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15 disabled:opacity-50"
        >
          <Check size={16} />
          {strings.profile.save}
        </button>
      </div>
    </div>
  )
}

// Language + account actions — split out of the main view entirely per its
// own trigger button's comment. A plain overlay sheet rather than a new
// route: it's a handful of controls, not a screen of its own.
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { strings, language, setLanguage } = useLanguage()
  const { user } = useUser()
  const { signOut } = useClerk()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  const LANGUAGES: { value: Language; label: string }[] = [
    { value: 'es', label: 'ES' },
    { value: 'en', label: 'EN' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] p-5 shadow-2xl shadow-black/50 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[Space_Grotesk] text-base font-bold text-white">{strings.profile.settingsLabel}</h2>
          <button
            onClick={onClose}
            aria-label={strings.profile.cancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* Language — a real selector (both options shown, pick one
            directly), not a single button that cycles through on every
            click. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-300">{strings.profile.languageLabel}</p>
          <div
            role="radiogroup"
            aria-label={strings.profile.languageLabel}
            className="inline-flex rounded-full border border-white/10 bg-black/30 p-1"
          >
            {LANGUAGES.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={language === opt.value}
                onClick={() => setLanguage(opt.value)}
                className={`w-12 rounded-full py-1.5 text-xs font-bold tracking-wide transition-colors ${
                  language === opt.value ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="my-4 h-px bg-white/5" />

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
            <Mail size={14} />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm text-neutral-400">{email ?? strings.profile.noEmail}</p>
        </div>

        {/* Always this red, not just on hover — signing out is the one
            genuinely destructive action on this whole screen and should
            read that way at a glance, not only when a cursor happens to be
            over it (which touch never triggers anyway). */}
        <button
          onClick={() => signOut()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/[0.12]"
        >
          <LogOut size={16} />
          {strings.profile.signOut}
        </button>
      </div>
    </div>
  )
}
