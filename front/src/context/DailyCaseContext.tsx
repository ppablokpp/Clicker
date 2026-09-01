import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
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

interface BuyChestResult {
  ok: boolean
  error?: string
  totalClicks?: number
}

interface DailyCaseContextValue {
  catalog: DailyCasePrize[]
  chestCost: number
  keyCost: number
  ownedChests: number
  isSpinning: boolean
  isBuying: boolean
  spin: () => Promise<SpinResult>
  buyChest: () => Promise<BuyChestResult>
  // Re-pulls the catalog — chestCost and the clicks-denominated prizes scale
  // with prestige tier server-side (see the route), so a tier change needs
  // this re-fetched or the Store keeps showing pre-prestige numbers for the
  // rest of the session (see Home.tsx's handleConfirmPrestige).
  refetchCatalog: () => void
}

const DailyCaseContext = createContext<DailyCaseContextValue | null>(null)

// Free case: the chest itself is bought with clicks, then opened with a key
// — repeatable infinitely, no daily cooldown, keys and owned chests are
// what limit how often this can happen.
export function DailyCaseProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const { flushNow } = useClickCounterContext()
  const [catalog, setCatalog] = useState<DailyCasePrize[]>([])
  const [chestCost, setChestCost] = useState(0)
  const [keyCost, setKeyCost] = useState(0)
  const [ownedChests, setOwnedChests] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  // Authenticated (not a plain anonymous fetch) so the backend can scale
  // chestCost and the clicks-denominated prizes to the caller's own prestige
  // tier — signed-out visitors just get the flat, tier-0 catalog back.
  const fetchCatalog = useCallback(() => {
    ;(async () => {
      try {
        const headers: Record<string, string> = {}
        if (userId) {
          const token = await getToken()
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(`${API_URL}/api/daily-case`, { headers })
        const data = await res.json()
        setCatalog(data.prizes)
        setChestCost(data.chestCost)
        setKeyCost(data.keyCost)
      } catch (err) {
        console.error('No se pudo cargar el cofre diario', err)
      }
    })()
  }, [userId, getToken])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (typeof data.ownedClickChests === 'number') setOwnedChests(data.ownedClickChests)
        }
      } catch (err) {
        console.error('No se pudieron cargar los cofres de clicks', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

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
        if (typeof data.ownedChests === 'number') setOwnedChests(data.ownedChests)
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

  const buyChest = useCallback(async (): Promise<BuyChestResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuying(true)
    try {
      // Chest cost is clicks-denominated and checked server-side against a
      // total that only advances on flush — force one first.
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/daily-case/buy-chest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error }

      if (typeof data.ownedChests === 'number') setOwnedChests(data.ownedChests)
      return { ok: true, totalClicks: data.totalClicks }
    } catch (err) {
      console.error('No se pudo comprar el cofre de clicks', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, getToken, promptSignIn, flushNow])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ catalog, chestCost, keyCost, ownedChests, isSpinning, isBuying, spin, buyChest, refetchCatalog: fetchCatalog }),
    [catalog, chestCost, keyCost, ownedChests, isSpinning, isBuying, spin, buyChest, fetchCatalog],
  )

  return <DailyCaseContext.Provider value={value}>{children}</DailyCaseContext.Provider>
}

export function useDailyCaseContext() {
  const ctx = useContext(DailyCaseContext)
  if (!ctx) throw new Error('useDailyCaseContext must be used within a DailyCaseProvider')
  return ctx
}
