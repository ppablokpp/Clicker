import { useEffect, useState } from 'react'
import { Medal, Swords, User, X, Zap } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useLeaderboard, type LeaderboardSort } from '../hooks/useLeaderboard'
import { useLanguage } from '../context/LanguageContext'
import { PlatinumIcon } from '../components/PlatinumIcon'
import { useBattlesContext } from '../context/BattlesContext'
import { useClickCounterContext } from '../context/ClickCounterContext'

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  2: 'text-neutral-300 border-neutral-300/30 bg-neutral-300/10',
  3: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
}

export function Leaderboard() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<LeaderboardSort>('clicks')
  const { leaderboard, isLoading } = useLeaderboard(sortBy)
  const { language, strings } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const [showBattles, setShowBattles] = useState(false)

  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-28 pt-20 sm:px-6 sm:pb-24 sm:pt-24">
      <button
        onClick={() => setShowBattles(true)}
        aria-label={strings.battle.buttonLabel}
        className="fixed right-4 top-20 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-neutral-300 shadow-lg shadow-black/20 transition-colors hover:bg-white/[0.06] sm:right-6 sm:top-24"
      >
        <Swords size={16} />
      </button>

      {showBattles && <BattlesModal onClose={() => setShowBattles(false)} onNavigate={navigate} userId={userId ?? null} />}

      <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center sm:top-24">
        <div className="pointer-events-auto inline-flex items-center rounded-full border border-white/10 bg-[#0d0d14]/90 p-1 shadow-lg shadow-black/30 backdrop-blur-sm">
          <button
            onClick={() => setSortBy('clicks')}
            aria-label={strings.leaderboard.clicksTab}
            className={`flex w-16 items-center justify-center rounded-full py-2 transition-colors ${
              sortBy === 'clicks' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <PlatinumIcon size={19} />
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

      <div className="mx-auto max-w-2xl pt-16">
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
                      {entry.bestCps.toFixed(1)} <span className="text-xs font-medium opacity-60">t/s</span>
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

// Same green/red as Tree.tsx's LUCK_NODE_STYLE/LEGENDARY_NODE_STYLE, reused
// here so a duel win/loss reads with the same "flow" language as the tree.
const WIN_CARD_STYLE = 'border-green-400/25 bg-[#0f1f16]'
const LOSE_CARD_STYLE = 'border-red-400/25 bg-[#1f0d0d]'
const TIE_CARD_STYLE = 'border-white/5 bg-white/[0.02]'

function HistorySide({ avatarUrl, name, value }: { avatarUrl: string | null; name: string | null; value: number | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
          <User size={14} />
        </div>
      )}
      <span className="max-w-full truncate text-[11px] font-medium text-neutral-300">{name ?? '—'}</span>
      <span className="font-[Space_Grotesk] text-lg font-bold tabular-nums text-white">{value ?? 0}</span>
    </div>
  )
}

function BattlesModal({
  onClose,
  onNavigate,
  userId,
}: {
  onClose: () => void
  onNavigate: ReturnType<typeof useNavigate>
  userId: string | null
}) {
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const { wager, durationSeconds, battles, isLoadingBattles, fetchBattles, accept } = useBattlesContext()
  const { totalClicks } = useClickCounterContext()
  const [showPicker, setShowPicker] = useState(false)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [errorId, setErrorId] = useState<number | null>(null)

  useEffect(() => {
    fetchBattles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Both directions of "not resolved yet" — battles where I still need to
  // accept, and ones I sent that are waiting on the other player.
  const pending = battles.filter((b) => b.status === 'awaiting_opponent')
  const history = battles.filter((b) => b.status === 'completed')
  const canAfford = totalClicks >= wager

  async function handleAccept(battleId: number) {
    setAcceptingId(battleId)
    setErrorId(null)
    const res = await accept(battleId)
    if (res.ok) {
      onNavigate(`/batalla/${battleId}`, { state: { role: 'opponent' } })
    } else {
      setErrorId(battleId)
      setAcceptingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-white/10 bg-[#0d0d14] py-6 pl-6 pr-2 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300">
          <X size={16} />
        </button>

        <div className="mb-4 flex shrink-0 items-center gap-2 pr-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
            <Swords size={17} />
          </div>
          <p className="text-sm font-semibold text-white">{strings.battle.modalTitle}</p>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-4">
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-neutral-500">
              {strings.battle.description(wager.toLocaleString(locale), durationSeconds)}
            </p>

            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
            >
              <Swords size={15} />
              {strings.battle.newBattle}
            </button>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {strings.battle.incomingSection}
              </p>
              {!isLoadingBattles && pending.length === 0 && (
                <p className="text-sm text-neutral-500">{strings.battle.noIncoming}</p>
              )}
              <div className="flex flex-col gap-2">
                {pending.map((b) => {
                  const isMine = b.role === 'challenger'
                  const rivalName = (isMine ? b.opponentUsername : b.challengerUsername) ?? strings.leaderboard.fallbackName
                  const rivalAvatar = isMine ? b.opponentAvatarUrl : b.challengerAvatarUrl
                  return (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                    >
                      {rivalAvatar ? (
                        <img src={rivalAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
                          <User size={14} />
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">{rivalName}</span>
                      {isMine ? (
                        <span className="shrink-0 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-neutral-400">
                          {strings.battle.waitingForOpponent}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAccept(b.id)}
                          disabled={acceptingId === b.id || !canAfford}
                          aria-label={strings.battle.acceptButton(wager.toLocaleString(locale))}
                          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                            canAfford
                              ? 'border-violet-400/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15 disabled:opacity-50'
                              : 'border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <PlatinumIcon size={13} className="opacity-70" />
                            <span className="tabular-nums">{wager.toLocaleString(locale)}</span>
                          </span>
                        </button>
                      )}
                      {isMine && b.challengerTaps !== null && (
                        <span className="w-full text-[11px] text-neutral-500">
                          {strings.battle.yourTaps} <span className="font-semibold text-neutral-300">{b.challengerTaps}</span>
                        </span>
                      )}
                      {errorId === b.id && (
                        <span className="w-full text-[11px] text-red-300">{strings.battle.notEnoughPlatinum}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {strings.battle.historySection}
              </p>
              {!isLoadingBattles && history.length === 0 && (
                <p className="text-sm text-neutral-500">{strings.battle.noHistory}</p>
              )}
              <div className="flex flex-col gap-2">
                {history.map((b) => {
                  const isMine = b.role === 'challenger'
                  const myName = (isMine ? b.challengerUsername : b.opponentUsername) ?? strings.leaderboard.fallbackName
                  const myAvatar = isMine ? b.challengerAvatarUrl : b.opponentAvatarUrl
                  const myTaps = isMine ? b.challengerTaps : b.opponentTaps
                  const rivalName = (isMine ? b.opponentUsername : b.challengerUsername) ?? strings.leaderboard.fallbackName
                  const rivalAvatar = isMine ? b.opponentAvatarUrl : b.challengerAvatarUrl
                  const rivalTaps = isMine ? b.opponentTaps : b.challengerTaps
                  const isTie = b.winnerId === null
                  const didWin = b.winnerId === userId
                  const cardStyle = isTie ? TIE_CARD_STYLE : didWin ? WIN_CARD_STYLE : LOSE_CARD_STYLE
                  const resultLabel = isTie ? strings.battle.tieResult : didWin ? strings.battle.youWon : strings.battle.youLost
                  const resultColor = isTie ? 'text-neutral-400' : didWin ? 'text-green-300' : 'text-red-300'
                  return (
                    <div key={b.id} className={`rounded-xl border px-3 py-3 ${cardStyle}`}>
                      <p className={`mb-2 text-center text-[11px] font-semibold ${resultColor}`}>{resultLabel}</p>
                      <div className="flex items-center justify-center gap-2.5">
                        <HistorySide avatarUrl={myAvatar} name={myName} value={myTaps} />
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-neutral-500">VS</span>
                        <HistorySide avatarUrl={rivalAvatar} name={rivalName} value={rivalTaps} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <OpponentPickerModal onClose={() => setShowPicker(false)} onNavigate={onNavigate} />
      )}
    </div>
  )
}

function OpponentPickerModal({
  onClose,
  onNavigate,
}: {
  onClose: () => void
  onNavigate: ReturnType<typeof useNavigate>
}) {
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const { wager, opponents, isLoadingOpponents, fetchOpponents, challenge } = useBattlesContext()
  const { totalClicks } = useClickCounterContext()
  const [challengingId, setChallengingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const canAfford = totalClicks >= wager

  useEffect(() => {
    fetchOpponents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleChallenge(opponentId: string) {
    setChallengingId(opponentId)
    setErrorId(null)
    const res = await challenge(opponentId)
    if (res.ok && res.battleId) {
      onNavigate(`/batalla/${res.battleId}`, { state: { role: 'challenger' } })
    } else {
      setErrorId(opponentId)
      setChallengingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-white/10 bg-[#0d0d14] py-6 pl-6 pr-2 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300">
          <X size={16} />
        </button>

        <p className="mb-4 shrink-0 pr-4 text-sm font-semibold text-white">{strings.battle.pickOpponent}</p>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-4">
          <div className="flex flex-col gap-2">
            {!isLoadingOpponents && opponents.length === 0 && (
              <p className="text-sm text-neutral-500">{strings.leaderboard.empty}</p>
            )}
            {opponents.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                {o.avatarUrl ? (
                  <img src={o.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-500">
                    <User size={14} />
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">
                  {o.username ?? strings.leaderboard.fallbackName}
                </span>
                <button
                  onClick={() => handleChallenge(o.id)}
                  disabled={challengingId === o.id || !canAfford}
                  aria-label={strings.battle.challengeButton(wager.toLocaleString(locale))}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    canAfford
                      ? 'border-violet-400/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15 disabled:opacity-50'
                      : 'border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <PlatinumIcon size={13} className="opacity-70" />
                    <span className="tabular-nums">{wager.toLocaleString(locale)}</span>
                  </span>
                </button>
                {errorId === o.id && (
                  <span className="w-full text-[11px] text-red-300">{strings.battle.notEnoughPlatinum}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
