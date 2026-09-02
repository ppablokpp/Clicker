import { useEffect, useRef, useState } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { Camera, Check, CircleUserRound, Globe, LogOut, Mail } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSignInPrompt } from '../context/SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const USERNAME_MIN = 3
const USERNAME_MAX = 20
// How long the green "Saved" confirmation sticks around before the button
// goes back to its normal state.
const SAVED_FLASH_MS = 2200

type Status = 'idle' | 'busy' | 'saved'

// Clerk owns the identity (name, photo, email); our own `users` table only
// mirrors it, and only at sign-in — see back/src/routes/users.js's /sync,
// which reads straight off the Clerk user. So every edit here goes to Clerk
// first and then re-fires that same sync endpoint, which is what actually
// makes a new name/photo show up on the leaderboard instead of waiting for
// the player's next sign-in. No backend changes needed for any of this.
export function Profile() {
  const { strings, language, toggleLanguage } = useLanguage()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const { promptSignIn } = useSignInPrompt()

  const [username, setUsername] = useState('')
  const [nameStatus, setNameStatus] = useState<Status>('idle')
  const [photoStatus, setPhotoStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const flash = (set: (s: Status) => void) => {
    set('saved')
    window.setTimeout(() => set('idle'), SAVED_FLASH_MS)
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
      flash(setNameStatus)
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
        flash(setNameStatus)
      } catch (fallbackErr) {
        console.error('No se pudo guardar el nombre', fallbackErr)
        setNameStatus('idle')
        setError(strings.profile.errorGeneric)
      }
    }
  }

  const handlePhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Clear the input either way, so picking the *same* file again still
    // fires a change event.
    e.target.value = ''
    if (!file || !user) return
    if (file.size > MAX_PHOTO_BYTES) {
      setError(strings.profile.errorPhoto)
      return
    }
    setError(null)
    setPhotoStatus('busy')
    try {
      await user.setProfileImage({ file })
      await resync()
      flash(setPhotoStatus)
    } catch (err) {
      console.error('No se pudo actualizar la foto', err)
      setPhotoStatus('idle')
      setError(strings.profile.errorPhoto)
    }
  }

  if (isLoaded && !user) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center">
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
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="h-48 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
      </div>
    )
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? null
  const avatarUrl = user?.imageUrl ?? null

  return (
    <div className="mx-auto max-w-md pt-16">
      <header className="mb-6 text-center">
        <h1 className="font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white">{strings.profile.title}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">{strings.profile.subtitle}</p>
      </header>

      {/* Identity card — the avatar and the name that actually show up on
          the leaderboard, edited right where they're previewed. */}
      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex flex-col items-center">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-neutral-600 ring-2 ring-white/10">
                <CircleUserRound size={40} />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoStatus === 'busy'}
              aria-label={strings.profile.changePhoto}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#15151d] text-neutral-300 shadow-lg shadow-black/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {photoStatus === 'saved' ? <Check size={15} className="text-green-300" /> : <Camera size={15} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoPicked}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-xs text-neutral-600">
            {photoStatus === 'busy' ? strings.profile.uploading : strings.profile.photoHint}
          </p>
        </div>

        <div className="mt-6">
          <label htmlFor="profile-username" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {strings.profile.usernameLabel}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="profile-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={USERNAME_MAX}
              placeholder={strings.profile.usernamePlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-violet-400/40 focus:outline-none"
            />
            <button
              onClick={handleSaveName}
              disabled={nameStatus === 'busy'}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                nameStatus === 'saved'
                  ? 'border-green-400/30 bg-green-500/10 text-green-300'
                  : 'border-violet-400/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15'
              }`}
            >
              {nameStatus === 'busy'
                ? strings.profile.saving
                : nameStatus === 'saved'
                  ? strings.profile.saved
                  : strings.profile.save}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-600">{strings.profile.usernameHint}</p>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-400/20 bg-red-500/[0.07] px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}
      </section>

      {/* Account row — read-only, just so the player can see which account
          they're actually signed in as. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
          <Mail size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            {strings.profile.emailLabel}
          </p>
          <p className="truncate text-sm text-neutral-300">{email ?? strings.profile.noEmail}</p>
        </div>
      </section>

      {/* Language — used to live in the global header; it's a per-account
          preference, so this is where it belongs now that the header is gone. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
          <Globe size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            {strings.profile.languageLabel}
          </p>
          <p className="truncate text-sm text-neutral-300">{strings.profile.languageHint}</p>
        </div>
        <button
          onClick={toggleLanguage}
          className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-bold tracking-wide text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {language.toUpperCase()}
        </button>
      </section>

      <button
        onClick={() => signOut()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm font-semibold text-neutral-400 transition-colors hover:border-red-400/20 hover:bg-red-500/[0.07] hover:text-red-200"
      >
        <LogOut size={16} />
        {strings.profile.signOut}
      </button>
    </div>
  )
}
