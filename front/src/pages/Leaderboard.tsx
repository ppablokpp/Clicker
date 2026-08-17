import { useMemo } from 'react'
import { Crown, Medal } from 'lucide-react'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { usePlayer } from '../hooks/usePlayer'
import { MOCK_LEADERBOARD, MOCK_MONTHLY_WINNER } from '../data/mockLeaderboard'

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  2: 'text-neutral-300 border-neutral-300/30 bg-neutral-300/10',
  3: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
}

export function Leaderboard() {
  const { totalClicks } = useClickCounterContext()
  const { name } = usePlayer()

  const ranked = useMemo(() => {
    const entries = [
      ...MOCK_LEADERBOARD,
      { name, clicks: totalClicks, isLocalPlayer: true },
    ]
    return entries.sort((a, b) => b.clicks - a.clicks)
  }, [name, totalClicks])

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-24 pt-6 sm:px-6 sm:pb-10 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">
            Clasificación mundial
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Datos de ejemplo — se conectará a la base de datos real próximamente.
          </p>
        </header>

        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/5 to-transparent p-4 sm:p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 sm:h-14 sm:w-14">
            <Crown size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-300/80">
              Ganador de {MOCK_MONTHLY_WINNER.month}
            </p>
            <p className="truncate text-lg font-bold text-white">{MOCK_MONTHLY_WINNER.name}</p>
            <p className="text-sm text-neutral-400">
              {MOCK_MONTHLY_WINNER.clicks.toLocaleString('es-ES')} clicks
            </p>
          </div>
        </div>

        <ol className="scroll-thin flex flex-col gap-2">
          {ranked.map((entry, i) => {
            const rank = i + 1
            const style = RANK_STYLES[rank]
            return (
              <li
                key={`${entry.name}-${i}`}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  entry.isLocalPlayer
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
                <span
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${
                    entry.isLocalPlayer ? 'text-violet-200' : 'text-neutral-200'
                  }`}
                >
                  {entry.name}
                  {entry.isLocalPlayer && (
                    <span className="ml-2 rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                      Tú
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-[Space_Grotesk] text-sm font-bold tabular-nums text-neutral-100">
                  {entry.clicks.toLocaleString('es-ES')}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
