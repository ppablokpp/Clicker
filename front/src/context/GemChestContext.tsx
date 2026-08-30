import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface GemChestPrize {
  id: string
  amount: number
  weight: number
  currency?: 'clicks' | 'gems'
}

interface OpenResult {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  /** Caller applies these to the visible counters once the reel animation reveals the prize — not before, or the total would spoil the result early. */
  gems?: number
  keys?: number
}

interface BuyChestResult {
  ok: boolean
  error?: string
  totalClicks?: number
}

interface GemChestContextValue {
  catalog: GemChestPrize[]
  chestCost: number
  keyCost: number
  gemCost: number
  ownedChests: number
  isOpening: boolean
  isBuying: boolean
  openWithKeys: () => Promise<OpenResult>
  openWithGems: () => Promise<OpenResult>
  buyChest: () => Promise<BuyChestResult>
  // Re-pulls the catalog — chestCost scales with prestige tier server-side
  // (the gem prizes don't), so a tier change needs this re-fetched or the
  // Store keeps showing the pre-prestige cost for the rest of the session
  // (see Home.tsx's handleConfirmPrestige).
  refetchCatalog: () => void
}

const GemChestContext = createContext<GemChestContextValue | null>(null)

// Second case: no clicks involved to open, pays out gems, opens with either
// keys (requires owning a chest, bought separately with clicks) or gems
// (skips the owned-chest requirement entirely) — no RevenueCat, no cooldown.
export function GemChestProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<GemChestPrize[]>([])
  const [chestCost, setChestCost] = useState(0)
  const [keyCost, setKeyCost] = useState(0)
  const [gemCost, setGemCost] = useState(0)
  const [ownedChests, setOwnedChests] = useState(0)
  const [isOpening, setIsOpening] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  // Authenticated (not a plain anonymous fetch) so the backend can scale
  // chestCost to the caller's own prestige tier — signed-out visitors just
  // get the flat, tier-0 catalog back.
  const fetchCatalog = useCallback(() => {
    ;(async () => {
      try {
        const headers: Record<string, string> = {}
        if (userId) {
          const token = await getToken()
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(`${API_URL}/api/gem-chest`, { headers })
        const data = await res.json()
        setCatalog(data.prizes)
        setChestCost(data.chestCost)
        setKeyCost(data.keyCost)
        setGemCost(data.gemCost)
      } catch (err) {
        console.error('No se pudo cargar el cofre de gemas', err)
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
          if (typeof data.ownedGemChests === 'number') setOwnedChests(data.ownedGemChests)
        }
      } catch (err) {
        console.error('No se pudieron cargar los cofres de gemas', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const open = useCallback(
    async (path: 'open-with-keys' | 'open-with-gems'): Promise<OpenResult> => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setIsOpening(true)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/gem-chest/${path}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        if (typeof data.ownedChests === 'number') setOwnedChests(data.ownedChests)
        return { ok: true, prizeId: data.prizeId, prizeAmount: data.prizeAmount, gems: data.gems, keys: data.keys }
      } catch (err) {
        console.error('No se pudo abrir el cofre de gemas', err)
        return { ok: false, error: 'network' }
      } finally {
        setIsOpening(false)
      }
    },
    [userId, getToken, promptSignIn],
  )

  const openWithKeys = useCallback(() => open('open-with-keys'), [open])
  const openWithGems = useCallback(() => open('open-with-gems'), [open])

  const buyChest = useCallback(async (): Promise<BuyChestResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuying(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/gem-chest/buy-chest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error }

      if (typeof data.ownedChests === 'number') setOwnedChests(data.ownedChests)
      return { ok: true, totalClicks: data.totalClicks }
    } catch (err) {
      console.error('No se pudo comprar el cofre de gemas', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, getToken, promptSignIn])

  return (
    <GemChestContext.Provider
      value={{
        catalog,
        chestCost,
        keyCost,
        gemCost,
        ownedChests,
        isOpening,
        isBuying,
        openWithKeys,
        openWithGems,
        buyChest,
        refetchCatalog: fetchCatalog,
      }}
    >
      {children}
    </GemChestContext.Provider>
  )
}

export function useGemChestContext() {
  const ctx = useContext(GemChestContext)
  if (!ctx) throw new Error('useGemChestContext must be used within a GemChestProvider')
  return ctx
}
