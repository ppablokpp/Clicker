import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface PrestigeState {
  prestigePoints: number
  reactorLevel: number
  reactorValue: number
  reactorNextCost: number
}

interface PrestigeContextValue extends PrestigeState {
  isBuyingReactor: boolean
  buyReactor: () => Promise<{ ok: boolean; error?: string }>
  isResetting: boolean
  // pointsEarned on success — the caller (Home's confirm dialog) shows it,
  // then does a full reload so every other context refetches clean state
  // instead of this trying to manually zero out a dozen pieces of state.
  resetPrestige: () => Promise<{ ok: boolean; error?: string; pointsEarned?: number }>
}

const PrestigeContext = createContext<PrestigeContextValue | null>(null)

const EMPTY_STATE: PrestigeState = {
  prestigePoints: 0,
  reactorLevel: 0,
  reactorValue: 1,
  reactorNextCost: 5,
}

export function PrestigeProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const { flushNow } = useClickCounterContext()
  const [state, setState] = useState<PrestigeState>(EMPTY_STATE)
  const [isBuyingReactor, setIsBuyingReactor] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const fetchState = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/prestige/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setState({
          prestigePoints: data.prestigePoints,
          reactorLevel: data.reactorLevel,
          reactorValue: data.reactorValue,
          reactorNextCost: data.reactorNextCost,
        })
      }
    } catch (err) {
      console.error('No se pudo cargar el estado de prestigio', err)
    }
  }, [userId, getToken])

  useEffect(() => {
    if (!userId) return
    fetchState()
  }, [userId, fetchState])

  const buyReactor = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingReactor(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/prestige/reactor/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        reactorLevel: data.reactorLevel,
        reactorValue: data.reactorValue,
        reactorNextCost: data.reactorNextCost,
        prestigePoints: data.prestigePoints,
      }))
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar el Reactor', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingReactor(false)
    }
  }, [userId, getToken, promptSignIn])

  const resetPrestige = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsResetting(true)
    try {
      // Eligibility is checked server-side against objects_broken, which
      // (like total_clicks) only advances on flush — force one first so a
      // just-broken object from unflushed taps isn't wrongly rejected as
      // "nothing to prestige".
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/prestige/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      return { ok: true, pointsEarned: data.pointsEarned }
    } catch (err) {
      console.error('No se pudo reiniciar el prestigio', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsResetting(false)
    }
  }, [userId, getToken, promptSignIn, flushNow])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ ...state, isBuyingReactor, buyReactor, isResetting, resetPrestige }),
    [state, isBuyingReactor, buyReactor, isResetting, resetPrestige],
  )

  return <PrestigeContext.Provider value={value}>{children}</PrestigeContext.Provider>
}

export function usePrestigeContext() {
  const ctx = useContext(PrestigeContext)
  if (!ctx) throw new Error('usePrestigeContext must be used within a PrestigeProvider')
  return ctx
}
