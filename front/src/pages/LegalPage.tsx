import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/** Where a player writes to about their data or the terms. */
export const LEGAL_CONTACT_EMAIL = 'soporteclankup@gmail.com'

// The privacy policy and the terms of use, one page each, opened from the
// profile's settings sheet (and reachable by URL, which is what the stores
// ask for). Plain reading pages: the same back arrow the public profile
// uses, a title, the date, and the sections in order.
export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const legal = strings.legal
  const title = kind === 'privacy' ? legal.privacyTitle : legal.termsTitle
  const sections = kind === 'privacy' ? legal.privacy : legal.terms

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-16 pt-16 sm:pt-20">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/estadisticas'))}
        aria-label={strings.profile.backButton}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      <h1 className="font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-1 text-xs text-neutral-500">{legal.updated}</p>

      <div className="mt-6 flex flex-col gap-6">
        {sections.map((section) => (
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
    </div>
  )
}
