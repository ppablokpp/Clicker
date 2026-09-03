import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Crown } from 'lucide-react'
import { AstronautAvatar } from '../components/AstronautAvatar'
import { useLanguage } from '../context/LanguageContext'
import { formatPlatino } from '../lib/formatPlatino'
import { normalizeStyle } from '../lib/astronautStyleApi'
import { STAT_CATEGORIES } from '../stats/config'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface PublicProfileData {
  id: string
  username: string | null
  lifetimePlatino: number
  bestCps: number
  longestStreak: number
  casesOpened: number
  totalRealClicks: number
  createdAt: string
  rank: number | null
  totalRanked: number
  /** Their equipped cosmetics; null for anyone who never customized. */
  astronautStyle: unknown
}

// The "visit someone else's profile" page — same character/name layout as
// your own Profile.tsx, but read-only (no settings gear, no tappable
// username) and fed by the public /api/users/:id/public endpoint instead of
// Clerk's own useUser(), since there's no session to read someone else's
// account off of. Opened from tapping a leaderboard row.
export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setStatus('loading')
    setProfile(null)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}/public`)
        if (!res.ok) throw new Error('not found')
        const data: PublicProfileData = await res.json()
        if (!cancelled) {
          setProfile(data)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('not-found')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const joinedLabel = profile
    ? strings.profile.joinedOn(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(profile.createdAt)))
    : null

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center px-4 pb-12 pt-14 sm:pb-16 sm:pt-16">
      <button
        onClick={() => navigate(-1)}
        aria-label={strings.profile.backButton}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:left-6 sm:top-6"
      >
        <ChevronLeft size={18} />
      </button>

      {status === 'not-found' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-semibold text-white">{strings.profile.notFoundTitle}</p>
          <p className="text-sm text-neutral-500">{strings.profile.notFoundBody}</p>
        </div>
      )}

      {status !== 'not-found' && (
        <>
          {/* Their character, not the default one — the whole point of
              storing the cosmetics server-side is that a visitor sees what
              this player actually built. */}
          <div className={`mt-6 transition-opacity ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
            <AstronautAvatar styleIds={normalizeStyle(profile?.astronautStyle)} />
          </div>

          <p className="mt-8 min-h-[2.25rem] font-[Space_Grotesk] text-2xl font-bold tracking-tight text-white">
            {profile ? `@${profile.username ?? '—'}` : ''}
          </p>
          {joinedLabel && <p className="mt-1 text-xs text-neutral-500">{joinedLabel}</p>}

          {profile && (
            <>
              <div className="mt-6 w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  {strings.profile.rankLabel}
                </p>
                {profile.rank ? (
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-[Space_Grotesk] text-lg font-bold text-violet-300/60">#</span>
                    <span className="bg-gradient-to-br from-violet-200 via-violet-300 to-fuchsia-400 bg-clip-text font-[Space_Grotesk] text-4xl font-bold leading-none tabular-nums text-transparent">
                      {profile.rank}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500">
                      {strings.profile.rankOf(profile.totalRanked.toLocaleString(locale))}
                      {' · '}
                      {formatPlatino(profile.lifetimePlatino, language)}
                    </span>
                    {profile.rank === 1 && <Crown size={16} className="ml-1 text-yellow-300/90" />}
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm text-neutral-600">{strings.profile.rankUnranked}</p>
                )}
              </div>

              <div className="mt-3 grid w-full grid-cols-2 gap-3">
                {STAT_CATEGORIES.map(({ key, icon: Icon, color }) => {
                  const value =
                    key === 'totalClicks'
                      ? profile.totalRealClicks
                      : key === 'bestCps'
                        ? profile.bestCps
                        : key === 'longestStreak'
                          ? profile.longestStreak
                          : profile.casesOpened
                  const category = strings.stats.categories[key]
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center"
                    >
                      <Icon size={16} className={color} />
                      <span className="font-[Space_Grotesk] text-lg font-bold tabular-nums text-white">
                        {(key === 'bestCps' ? value.toFixed(1) : Math.floor(value).toLocaleString(locale))}
                      </span>
                      <span className="text-[11px] text-neutral-500">{category.label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
