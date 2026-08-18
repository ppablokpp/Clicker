import { Medal, User } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useLeaderboard } from '../hooks/useLeaderboard'

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  2: 'text-neutral-300 border-neutral-300/30 bg-neutral-300/10',
  3: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
}

export function Leaderboard() {
  const { userId } = useAuth()
  const { leaderboard, isLoading } = useLeaderboard()

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
            Clasificación mundial
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Compite con el resto de jugadores por clicks.</p>
        </header>

        {!isLoading && leaderboard.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-neutral-500">
            Nadie ha dado clicks todavía. ¡Sé el primero!
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
                    ? 'border-violet-400/40 bg-violet-500/10'
                    : 'border-white/5 bg-white/[0.03]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    style ?? 'border-white/10 bg-white/5 text-neutral-400'
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
                  {entry.username ?? 'Jugador'}
                  {isLocalPlayer && (
                    <span className="ml-2 rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                      Tú
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-[Space_Grotesk] text-sm font-bold tabular-nums text-neutral-100">
                  {entry.totalClicks.toLocaleString('es-ES')}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
