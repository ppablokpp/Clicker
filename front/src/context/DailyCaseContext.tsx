import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface DailyCasePrize {
  id: string
  amount: number
  weight: number
  /** 'clicks' (default) or 'gems' — which balance this prize's amount adds to. */
  currency?: 'clicks' | 'gems'
}

interface SpinResult {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  prizeCurrency?: 'clicks' | 'gems'
  /** Caller applies these to the visible counters once the reel animation reveals the prize — not before, or the total would spoil the result early. */
  totalClicks?: number
  gems?: number
  keys?: number
}

interface DailyCaseContextValue {
  catalog: DailyCasePrize[]
  cost: number
  keyCost: number
  isSpinning: boolean
  spin: () => Promise<SpinResult>
}

const DailyCaseContext = createContext<DailyCaseContextValue | null>(null)

// Free case: costs clicks and a key, repeatable infinitely — no daily
// cooldown, the key itself is what limits how often this can happen.
export function DailyCaseProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<DailyCasePrize[]>([])
  const [cost, setCost] = useState(0)
  const [keyCost, setKeyCost] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/daily-case`)
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data.prizes)
        setCost(data.cost)
        setKeyCost(data.keyCost)
      })
      .catch((err) => console.error('No se pudo cargar el cofre diario', err))
  }, [])

  const spin = useCallback(async (): Promise<SpinResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsSpinning(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/daily-case/spin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        return {
          ok: true,
          prizeId: data.prizeId,
          prizeAmount: data.prizeAmount,
          prizeCurrency: data.prizeCurrency,
          totalClicks: data.totalClicks,
          gems: data.gems,
          keys: data.keys,
        }
      }
      return { ok: false, error: data.error }
    } catch (err) {
      console.error('No se pudo abrir el cofre diario', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsSpinning(false)
    }
  }, [userId, getToken, promptSignIn])

  return (
    <DailyCaseContext.Provider value={{ catalog, cost, keyCost, isSpinning, spin }}>
      {children}
    </DailyCaseContext.Provider>
  )
}

export function useDailyCaseContext() {
  const ctx = useContext(DailyCaseContext)
  if (!ctx) throw new Error('useDailyCaseContext must be used within a DailyCaseProvider')
  return ctx
}
