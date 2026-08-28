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

  useEffect(() => {
    fetch(`${API_URL}/api/click-packs`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de packs de clicks', err))
  }, [])

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

  return <ClickPacksContext.Provider value={{ catalog, buyingId, buy }}>{children}</ClickPacksContext.Provider>
}

export function useClickPacksContext() {
  const ctx = useContext(ClickPacksContext)
  if (!ctx) throw new Error('useClickPacksContext must be used within a ClickPacksProvider')
  return ctx
}
