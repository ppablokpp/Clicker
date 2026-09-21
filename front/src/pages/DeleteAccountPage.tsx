import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { ChevronLeft, Trash2, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { clearStoredStyleIds } from '../lib/astronautStyles'
import { LEGAL_CONTACT_EMAIL } from './LegalPage'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Deleting the account, on a page of its own like the privacy policy:
// what goes, the way by email for anyone locked out, and — with a session
// — the form: the word typed out before the button wakes up, then one
// last modal with the real button. The server erases our rows and the
// Clerk user; only then is the session dropped, so a failure leaves an
// account that can try again. Reachable by URL too, which is the link the
// stores ask for.
export function DeleteAccountPage() {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const legal = strings.legal
  const p = strings.profile
  const [typed, setTyped] = useState('')
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const word = p.deleteAccountWord
  const armed = typed.trim().toUpperCase() === word

  const confirm = async () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`DELETE me failed: ${res.status}`)
      clearStoredStyleIds()
      void signOut()
      navigate('/')
    } catch (err) {
      console.error('No se pudo eliminar la cuenta', err)
      setBusy(false)
      setFailed(true)
      setAsking(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-16 pt-16 sm:pt-20">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/estadisticas'))}
        aria-label={p.backButton}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      <h1 className="font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white">{legal.deleteTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.deleteAccountBody}</p>

      <div className="mt-6 flex flex-col gap-6">
        {legal.delete.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-semibold text-neutral-100">{section.heading}</h2>
            <div className="mt-2 flex flex-col gap-2">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-neutral-400">
                  {paragraph.replaceAll('{email}', LEGAL_CONTACT_EMAIL)}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* the form, for a signed-in player; anyone else is told where to
          sign in first */}
      <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-4">
        {isLoaded && !user ? (
          <p className="text-sm leading-relaxed text-neutral-400">{p.deleteAccountSignedOut}</p>
        ) : (
          <>
            <p className="text-sm text-neutral-300">{p.deleteAccountConfirmBody(word)}</p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && armed) setAsking(true)
              }}
              placeholder={word}
              autoCapitalize="characters"
              autoComplete="off"
              disabled={!isLoaded}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center font-mono text-sm uppercase tracking-[0.2em] text-white placeholder:text-neutral-700 focus:border-red-400/40 focus:outline-none"
            />
            {failed && <p className="mt-2 text-xs text-red-300">{p.deleteAccountError}</p>}
            <button
              onClick={() => setAsking(true)}
              disabled={!armed || !isLoaded}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />
              {p.deleteAccount}
            </button>
          </>
        )}
      </div>

      {asking && (
        <FinalAsk busy={busy} onClose={() => !busy && setAsking(false)} onConfirm={() => void confirm()} />
      )}
    </div>
  )
}

// The last word: one modal, one red button.
function FinalAsk({ busy, onClose, onConfirm }: { busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const { strings } = useLanguage()
  const p = strings.profile
  useLockBodyScroll(true)
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-red-400/20 bg-gradient-to-b from-[#1a1216] via-[#0e0e15] to-[#0a0a10] p-5 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[Space_Grotesk] text-base font-bold text-white">
            <Trash2 size={16} className="text-red-300" />
            {p.deleteAccountFinalTitle}
          </h2>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label={p.cancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-neutral-400">{p.deleteAccountFinalBody}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
          >
            {p.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm font-bold text-red-100 transition-colors hover:bg-red-500/30 disabled:opacity-60"
          >
            {busy ? p.deleteAccountBusy : p.deleteAccountFinalButton}
          </button>
        </div>
      </div>
    </div>
  )
}
