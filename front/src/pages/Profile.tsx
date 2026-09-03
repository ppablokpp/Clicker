import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { Check, ChevronRight, CircleUserRound, Crown, LogOut, Mail, Settings, X } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { formatPlatino } from '../lib/formatPlatino'
import type { Language } from '../i18n/translations'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
// Clerk's own instance settings: minimum 4 characters, no extended/accented
// characters, no purely numeric usernames. Its own maximum is 64 — capped
// tighter here at 20 (mirrored in back/src/routes/users.js) since a name
// that long doesn't fit anywhere it's actually shown.
const USERNAME_MIN = 4
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
    setUsername(user.username ?? '')
  }, [user])

  const cancelEdit = () => {
    setUsername(user?.username ?? '')
    setError(null)
    setShowUsernameModal(false)
  }

  // Goes through our own backend (PATCH /api/users/me/username) instead of
  // the client-side `user.update({ username })` — Clerk gates that call
  // behind "reverification" (a fresh proof of identity beyond just holding
  // a session), and for a Google-only account with no password the only
  // factor Clerk has for that is an emailed code, every single time. That's
  // real friction for picking a display name. Reverification is a
  // client-SDK protection against a hijacked *browser* session quietly
  // changing account-recovery info; it was never a rule on the username
  // field itself, so doing the write from our already-authenticated
  // backend (Clerk's admin API, which reverification doesn't apply to)
  // sidesteps it without weakening anything — this route still requires the
  // same signed session token every other API call does.
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
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/users/me/username`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: trimmed }),
      })
      if (res.status === 409) {
        setNameStatus('idle')
        setError(strings.profile.errorUsernameTaken)
        return
      }
      if (res.status === 400) {
        setNameStatus('idle')
        setError(strings.profile.errorUsernameInvalid)
        return
      }
      if (!res.ok) throw new Error(`PATCH username failed: ${res.status}`)
      // The backend already wrote the new username to Clerk — this just
      // refreshes the browser's own cached Clerk user so `user.username`
      // (and everywhere it's displayed) reflects it immediately instead of
      // waiting for Clerk's own next background refetch.
      await user.reload()
      setNameStatus('idle')
      setShowUsernameModal(false)
    } catch (err) {
      console.error('No se pudo guardar el username', err)
      setNameStatus('idle')
      setError(strings.profile.errorGeneric)
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
        className="mt-8 rounded-lg px-2 py-1 font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white transition-colors hover:bg-white/[0.06]"
      >
        @{username || strings.profile.usernamePlaceholder}
      </button>

      <RankCard />

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

// The one competitive number this game has, and the reason the leaderboard
// tab exists — so it gets the space directly under the name.
//
// Shown as the player's *neighbourhood* rather than as a lone figure: the
// rank above, the player themselves, and the rank below, stitched together
// by a vertical hairline so the three read as rungs of a ladder. A bare
// "#12" tells you where you are; this tells you who you're chasing and by
// how much, which is the thing that actually makes a ranking worth opening.
// The ladder is structural, not decorative — the rows are literally in
// leaderboard order and the hairline is the axis they sit on.
//
// No backend work behind any of it: /api/leaderboard already returns the
// full sorted list, so the rank is the player's own index in it.
function RankCard() {
  const { strings, language } = useLanguage()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const { leaderboard, isLoading } = useLeaderboard('clicks')

  // Reserve the card's height while loading so the name above it doesn't
  // jump once the ranking lands.
  if (isLoading) return <div className="mt-6 h-[168px] w-full" />

  const index = leaderboard.findIndex((entry) => entry.id === userId)
  if (index < 0) {
    return (
      <p className="mt-6 text-sm text-neutral-600">{strings.profile.rankUnranked}</p>
    )
  }

  const me = leaderboard[index]
  const above = index > 0 ? leaderboard[index - 1] : null
  const below = index + 1 < leaderboard.length ? leaderboard[index + 1] : null
  // How far along the player is toward the score of whoever is directly
  // ahead. `above` is by definition >= `me`, so this can't exceed 1.
  const progress = above && above.lifetimePlatino > 0 ? me.lifetimePlatino / above.lifetimePlatino : 1

  const rows = [above, me, below]
    .map((entry, i) => (entry ? { entry, rank: index + i } : null))
    .filter((row): row is { entry: (typeof leaderboard)[number]; rank: number } => row !== null)

  return (
    <button
      onClick={() => navigate('/clasificacion')}
      aria-label={strings.profile.rankViewAll}
      className="mt-6 w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4 text-left transition-colors hover:border-white/[0.14]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {strings.profile.rankLabel}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-[Space_Grotesk] text-lg font-bold text-violet-300/60">#</span>
            <span className="bg-gradient-to-br from-violet-200 via-violet-300 to-fuchsia-400 bg-clip-text font-[Space_Grotesk] text-5xl font-bold leading-none tabular-nums text-transparent">
              {index + 1}
            </span>
            <span className="ml-2 text-xs text-neutral-500">
              {strings.profile.rankOf(leaderboard.length.toLocaleString(language === 'en' ? 'en-US' : 'es-ES'))}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-neutral-600" />
      </div>

      {/* The ladder. */}
      <div className="relative mt-4 flex flex-col gap-1">
        <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        {rows.map(({ entry, rank }) => {
          const isMe = entry.id === me.id
          return (
            <div
              key={entry.id}
              className={`relative flex items-center gap-3 rounded-lg px-2 py-1.5 ${
                isMe ? 'bg-violet-500/[0.09]' : ''
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                  isMe
                    ? 'bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white'
                    : 'border border-white/10 bg-[#0d0d14] text-neutral-500'
                }`}
              >
                {rank}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  isMe ? 'font-semibold text-violet-100' : 'text-neutral-500'
                }`}
              >
                {entry.username ?? strings.leaderboard.fallbackName}
              </span>
              <span className={`shrink-0 text-xs tabular-nums ${isMe ? 'text-violet-200' : 'text-neutral-600'}`}>
                {formatPlatino(entry.lifetimePlatino, language)}
              </span>
            </div>
          )
        })}
      </div>

      {/* The chase. Rank 1 has nothing to chase, so it gets the state that
          says so rather than an empty progress bar sitting at 100%. */}
      {above ? (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
              style={{ width: `${Math.min(progress, 1) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            {strings.profile.rankGap(
              formatPlatino(above.lifetimePlatino - me.lifetimePlatino, language),
              above.username ?? strings.leaderboard.fallbackName,
            )}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-yellow-300/90">
          <Crown size={13} />
          {strings.profile.rankFirst}
        </div>
      )}
    </button>
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
  // Only modal in Profile.tsx that was missing this — every other modal in
  // the app (Store, Leaderboard, Tree, Battle, FleetAwayModal, SignInModal)
  // locks body scroll while open. Without it, on mobile Safari/Chrome a
  // `position: fixed` modal can end up rendered against the page's own
  // (still-scrollable) layout viewport instead of the visible one — it
  // opens pinned to the bottom of the whole page instead of the screen.
  useLockBodyScroll(true)

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
  // Same fix as EditUsernameModal's — see its own comment.
  useLockBodyScroll(true)

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
