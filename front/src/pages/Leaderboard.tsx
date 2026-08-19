import { useState } from 'react'
import { Medal, User, MousePointerClick, Zap } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useLeaderboard, type LeaderboardSort } from '../hooks/useLeaderboard'
import { useLanguage } from '../context/LanguageContext'

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  2: 'text-neutral-300 border-neutral-300/30 bg-neutral-300/10',
  3: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
}

export function Leaderboard() {
  const { userId } = useAuth()
  const [sortBy, setSortBy] = useState<LeaderboardSort>('clicks')
  const { leaderboard, isLoading } = useLeaderboard(sortBy)
  const { language, strings } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setSortBy('clicks')}
              aria-label={strings.leaderboard.clicksTab}
              className={`flex w-16 items-center justify-center rounded-full py-2 transition-colors ${
                sortBy === 'clicks' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <MousePointerClick size={16} />
            </button>
            <button
              onClick={() => setSortBy('cps')}
              aria-label={strings.leaderboard.cpsTab}
              className={`flex w-16 items-center justify-center rounded-full py-2 transition-colors ${
                sortBy === 'cps' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Zap size={16} />
            </button>
          </div>
        </div>

        {!isLoading && leaderboard.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-neutral-500">
            {strings.leaderboard.empty}
          </p>
        )}

        <ol className="scroll-thin flex flex-col gap-2">
          {leaderboard.map((entry, i) => {
            const rank = i + 1
            const style = RANK_STYLES[rank]
            const isLocalPlayer = entry.id === userId
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  isLocalPlayer
                    ? 'border-violet-400/20 bg-violet-500/[0.07]'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    style ?? 'border-white/5 bg-white/[0.03] text-neutral-400'
                  }`}
                >
                  {rank <= 3 ? <Medal size={15} /> : rank}
                </div>

                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
                    <User size={14} />
                  </div>
                )}

                <span
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${
                    isLocalPlayer ? 'text-violet-200' : 'text-neutral-200'
                  }`}
                >
                  {entry.username ?? strings.leaderboard.fallbackName}
                  {isLocalPlayer && (
                    <span className="ml-2 rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                      {strings.leaderboard.you}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-[Space_Grotesk] text-sm font-bold tabular-nums text-neutral-100">
                  {sortBy === 'cps' ? (
                    <>
                      {entry.bestCps.toFixed(1)} <span className="text-xs font-medium opacity-60">c/s</span>
                    </>
                  ) : (
                    entry.totalClicks.toLocaleString(locale)
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
