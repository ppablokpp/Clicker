import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'
import { maxWagerForTier } from '../lib/trajectory'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface BattleOpponent {
  id: string
  username: string | null
  avatarUrl: string | null
  totalClicks: number
  /** Their equipped cosmetics; null for anyone who never customized. */
  astronautStyle: unknown
}

export type BattleStatus = 'awaiting_challenger' | 'awaiting_opponent' | 'opponent_accepted' | 'completed'

export interface BattleSummary {
  id: number
  role: 'challenger' | 'opponent'
  wager: number
  status: BattleStatus
  challengerTaps: number | null
  opponentTaps: number | null
  winnerId: string | null
  challengerUsername: string | null
  challengerAvatarUrl: string | null
  opponentUsername: string | null
  opponentAvatarUrl: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface BattleDetail {
  id: number
  role: 'challenger' | 'opponent'
  wager: number
  status: BattleStatus
  challengerTaps: number | null
  opponentTaps: number | null
  winnerId: string | null
  challengerUsername: string | null
  challengerAvatarUrl: string | null
  opponentUsername: string | null
  opponentAvatarUrl: string | null
}

interface BattlesContextValue {
  /** The rung the wager picker opens on. */
  wager: number
  /**
   * The wagers THIS player can duel for, ascending — the full ladder already
   * cut to their prestige tier's 1%-of-goal cap.
   */
  wagers: number[]
  durationSeconds: number
  opponents: BattleOpponent[]
  battles: BattleSummary[]
  isLoadingOpponents: boolean
  isLoadingBattles: boolean
  fetchOpponents: () => Promise<void>
  fetchBattles: () => Promise<void>
  getBattle: (battleId: number) => Promise<BattleDetail | null>
  challenge: (
    opponentId: string,
    chosenWager?: number,
  ) => Promise<{ ok: boolean; battleId?: number; error?: string }>
  accept: (battleId: number) => Promise<{ ok: boolean; error?: string }>
  submitScore: (
    battleId: number,
    taps: number,
  ) => Promise<{
    ok: boolean
    error?: string
    status?: BattleStatus
    didWin?: boolean
    isTie?: boolean
    challengerTaps?: number
  }>
}

const BattlesContext = createContext<BattlesContextValue | null>(null)

// Config is fetched once and cached at module scope — it's a fixed pair of
// numbers (wager/duration), not per-user state, so there's no reason to
// refetch it every mount the way opponents/battles do.
let cachedConfig: { wager: number; wagers: number[]; durationSeconds: number } | null = null

// Only used until /config answers. Kept in step with BATTLE_WAGERS in
// back/src/game/battles.js, which is the authority — a stale copy here just
// means the picker opens with the wrong rungs for one render.
const FALLBACK_WAGERS = [
  500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1e6, 5e6, 1e7, 5e7, 1e8,
  5e8, 1e9, 5e9, 1e10, 5e10, 1e11, 5e11, 1e12,
]

export function BattlesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks, flushNow, prestigeTier } = useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [wager, setWager] = useState(cachedConfig?.wager ?? 10_000)
  const [allWagers, setAllWagers] = useState<number[]>(cachedConfig?.wagers ?? FALLBACK_WAGERS)
  const [durationSeconds, setDurationSeconds] = useState(cachedConfig?.durationSeconds ?? 30)
  const [opponents, setOpponents] = useState<BattleOpponent[]>([])
  const [battles, setBattles] = useState<BattleSummary[]>([])
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(false)
  const [isLoadingBattles, setIsLoadingBattles] = useState(false)

  const ensureConfig = useCallback(async () => {
    if (cachedConfig) return
    try {
      const res = await fetch(`${API_URL}/api/battles/config`)
      if (res.ok) {
        const data = await res.json()
        const ladder: number[] = Array.isArray(data.wagers) && data.wagers.length > 0 ? data.wagers : FALLBACK_WAGERS
        cachedConfig = { wager: data.wager, wagers: ladder, durationSeconds: data.durationSeconds }
        setWager(data.wager)
        setAllWagers(ladder)
        setDurationSeconds(data.durationSeconds)
      }
    } catch (err) {
      console.error('No se pudo cargar la configuración de batallas', err)
    }
  }, [])

  const fetchOpponents = useCallback(async () => {
    if (!userId) return
    setIsLoadingOpponents(true)
    try {
      await ensureConfig()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/battles/opponents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setOpponents(await res.json())
    } catch (err) {
      console.error('No se pudieron cargar los rivales', err)
    } finally {
      setIsLoadingOpponents(false)
    }
  }, [userId, getToken, ensureConfig])

  const fetchBattles = useCallback(async () => {
    if (!userId) return
    setIsLoadingBattles(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/battles/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setBattles(await res.json())
    } catch (err) {
      console.error('No se pudieron cargar tus batallas', err)
    } finally {
      setIsLoadingBattles(false)
    }
  }, [userId, getToken])

  const getBattle = useCallback(
    async (battleId: number) => {
      if (!userId) return null
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/battles/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        return (await res.json()) as BattleDetail
      } catch (err) {
        console.error('No se pudo cargar la batalla', err)
        return null
      }
    },
    [userId, getToken],
  )

  const challenge = useCallback(
    async (opponentId: string, chosenWager?: number) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      try {
        // The wager is deducted in clicks, checked server-side against a
        // total that only advances on flush — force one first.
        await flushNow()
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/battles/challenge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ opponentId, wager: chosenWager ?? wager }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error ?? 'error' }
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        return { ok: true, battleId: data.battleId }
      } catch (err) {
        console.error('No se pudo lanzar el duelo', err)
        return { ok: false, error: 'error' }
      }
    },
    [userId, getToken, promptSignIn, syncTotalClicks, flushNow, wager],
  )

  const accept = useCallback(
    async (battleId: number) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      try {
        // Same as challenge above — the wager is deducted in clicks.
        await flushNow()
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/battles/${battleId}/accept`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error ?? 'error' }
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        return { ok: true }
      } catch (err) {
        console.error('No se pudo aceptar el duelo', err)
        return { ok: false, error: 'error' }
      }
    },
    [userId, getToken, promptSignIn, syncTotalClicks, flushNow],
  )

  const submitScore = useCallback(
    async (battleId: number, taps: number) => {
      if (!userId) return { ok: false, error: 'not-signed-in' }
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/battles/${battleId}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ taps }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error ?? 'error' }
        // A win pays out 2x the wager — refetch is simpler/safer here than
        // hand-computing the delta, since a tie refunds a different amount.
        return {
          ok: true,
          status: data.status,
          didWin: data.didWin,
          isTie: data.isTie,
          challengerTaps: data.challengerTaps,
        }
      } catch (err) {
        console.error('No se pudo enviar el resultado de la batalla', err)
        return { ok: false, error: 'error' }
      }
    },
    [userId, getToken],
  )

  // Cut to this player's tier here rather than server-side, so a prestige
  // takes effect the instant it's confirmed instead of waiting on a config
  // refetch — /config is cached for the whole session. The server re-checks
  // the same cap when the challenge actually lands, which is the check that
  // decides anything.
  const wagers = useMemo(
    () => allWagers.filter((w) => w <= maxWagerForTier(prestigeTier)),
    [allWagers, prestigeTier],
  )

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({
      wager,
      wagers,
      durationSeconds,
      opponents,
      battles,
      isLoadingOpponents,
      isLoadingBattles,
      fetchOpponents,
      fetchBattles,
      getBattle,
      challenge,
      accept,
      submitScore,
    }),
    [
      wager,
      wagers,
      durationSeconds,
      opponents,
      battles,
      isLoadingOpponents,
      isLoadingBattles,
      fetchOpponents,
      fetchBattles,
      getBattle,
      challenge,
      accept,
      submitScore,
    ],
  )

  return <BattlesContext.Provider value={value}>{children}</BattlesContext.Provider>
}

export function useBattlesContext() {
  const ctx = useContext(BattlesContext)
  if (!ctx) throw new Error('useBattlesContext must be used within a BattlesProvider')
  return ctx
}
