import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface OpenResult {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  prizeCurrency?: 'clicks' | 'gems'
  /** Caller applies these to the visible counters once the reel animation reveals the prize — not before, or the total would spoil the result early. */
  totalClicks?: number
  gems?: number
}

interface GemCaseContextValue {
  cost: number
  isOpening: boolean
  open: () => Promise<OpenResult>
}

const GemCaseContext = createContext<GemCaseContextValue | null>(null)

// Gem-paid case: no RevenueCat involved (spends gems the player already
// owns), no cooldown — repeatable exactly like the old money-case was.
export function GemCaseProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [cost, setCost] = useState(0)
  const [isOpening, setIsOpening] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/gem-case`)
      .then((r) => r.json())
      .then((data) => setCost(data.cost))
      .catch((err) => console.error('No se pudo cargar el cofre de gemas', err))
  }, [])

  const open = useCallback(async (): Promise<OpenResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsOpening(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/gem-case/open`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error }

      return {
        ok: true,
        prizeId: data.prizeId,
        prizeAmount: data.prizeAmount,
        prizeCurrency: data.prizeCurrency,
        totalClicks: data.totalClicks,
        gems: data.gems,
      }
    } catch (err) {
      console.error('No se pudo abrir el cofre de gemas', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsOpening(false)
    }
  }, [userId, getToken, promptSignIn])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(() => ({ cost, isOpening, open }), [cost, isOpening, open])
  return <GemCaseContext.Provider value={value}>{children}</GemCaseContext.Provider>
}

export function useGemCaseContext() {
  const ctx = useContext(GemCaseContext)
  if (!ctx) throw new Error('useGemCaseContext must be used within a GemCaseProvider')
  return ctx
}
