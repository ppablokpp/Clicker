import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useGemsContext } from './GemsContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface ClickPackDef {
  id: string
  gemCost: number
  clicks: number
}

interface BuyResult {
  ok: boolean
  error?: string
}

interface ClickPacksContextValue {
  catalog: ClickPackDef[]
  buyingId: string | null
  buy: (pack: ClickPackDef) => Promise<BuyResult>
  // Re-pulls the catalog — the clicks side of each pack scales with
  // prestige tier server-side (see the route), so a tier change needs this
  // re-fetched or the Store keeps showing pre-prestige amounts for the rest
  // of the session (see Home.tsx's handleConfirmPrestige).
  refetchCatalog: () => void
}

const ClickPacksContext = createContext<ClickPacksContextValue | null>(null)

// Currency exchange, not a real purchase — gems in, clicks out. No
// RevenueCat involved.
export function ClickPacksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const { syncGems } = useGemsContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<ClickPackDef[]>([])
  const [buyingId, setBuyingId] = useState<string | null>(null)

  // Authenticated (not a plain anonymous fetch) so the backend can scale
  // each pack's clicks amount to the caller's own prestige tier —
  // signed-out visitors just get the flat, tier-0 catalog back.
  const fetchCatalog = useCallback(() => {
    ;(async () => {
      try {
        const headers: Record<string, string> = {}
        if (userId) {
          const token = await getToken()
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(`${API_URL}/api/click-packs`, { headers })
        setCatalog(await res.json())
      } catch (err) {
        console.error('No se pudo cargar el catálogo de packs de clicks', err)
      }
    })()
  }, [userId, getToken])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const buy = useCallback(
    async (pack: ClickPackDef): Promise<BuyResult> => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setBuyingId(pack.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/click-packs/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ packId: pack.id }),
        })
        const data = await res.json()
        if (res.ok) {
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
          if (typeof data.gems === 'number') syncGems(data.gems)
          playChestPurchase()
          return { ok: true }
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo comprar el pack de clicks', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncTotalClicks, syncGems, promptSignIn],
  )

  return (
    <ClickPacksContext.Provider value={{ catalog, buyingId, buy, refetchCatalog: fetchCatalog }}>
      {children}
    </ClickPacksContext.Provider>
  )
}

export function useClickPacksContext() {
  const ctx = useContext(ClickPacksContext)
  if (!ctx) throw new Error('useClickPacksContext must be used within a ClickPacksProvider')
  return ctx
}
