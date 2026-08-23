import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface BattleOpponent {
  id: string
  username: string | null
  avatarUrl: string | null
  totalClicks: number
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
  wager: number
  durationSeconds: number
  opponents: BattleOpponent[]
  battles: BattleSummary[]
  isLoadingOpponents: boolean
  isLoadingBattles: boolean
  fetchOpponents: () => Promise<void>
  fetchBattles: () => Promise<void>
  getBattle: (battleId: number) => Promise<BattleDetail | null>
  challenge: (opponentId: string) => Promise<{ ok: boolean; battleId?: number; error?: string }>
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
let cachedConfig: { wager: number; durationSeconds: number } | null = null

export function BattlesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [wager, setWager] = useState(cachedConfig?.wager ?? 10_000)
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
        cachedConfig = { wager: data.wager, durationSeconds: data.durationSeconds }
        setWager(data.wager)
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
    async (opponentId: string) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/battles/challenge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ opponentId }),
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
    [userId, getToken, promptSignIn, syncTotalClicks],
  )

  const accept = useCallback(
    async (battleId: number) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      try {
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
    [userId, getToken, promptSignIn, syncTotalClicks],
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

  return (
    <BattlesContext.Provider
      value={{
        wager,
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
      }}
    >
      {children}
    </BattlesContext.Provider>
  )
}

export function useBattlesContext() {
  const ctx = useContext(BattlesContext)
  if (!ctx) throw new Error('useBattlesContext must be used within a BattlesProvider')
  return ctx
}
