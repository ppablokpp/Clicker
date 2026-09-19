import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
// Real money (RevenueCat): Clerk's own useAuth, NOT the guest-capable
// useAppAuth. A purchase must be attached to an account the buyer can
// recover — tying one to a browser-local guest id would mean clearing site
// data destroys something they paid for. With no session `userId` is null,
// so `buy` below takes its existing not-signed-in branch and prompts a
// sign-in instead of charging anyone. The matching backend routes reject an
// anon token outright for the same reason.
import { useAuth } from '@clerk/clerk-react'
import { getStore, PurchaseCancelled } from '../lib/store'
import { useGemsContext } from './GemsContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const OFFERING_ID = 'gems'

export interface GemPackDef {
  id: string
  amount: number
}

interface BuyResult {
  ok: boolean
  error?: string
}

interface GemPacksContextValue {
  catalog: GemPackDef[]
  /** Real, localized prices from RevenueCat, keyed by pack id. Empty until loaded. */
  prices: Record<string, string>
  /** Raw price in currency micro-units, keyed by pack id — lets the UI compute per-unit savings without parsing the formatted string. */
  priceAmountsMicros: Record<string, number>
  buyingId: string | null
  buy: (pack: GemPackDef) => Promise<BuyResult>
}

const GemPacksContext = createContext<GemPacksContextValue | null>(null)

// Real money via RevenueCat's `gems` offering — same shape as KeyPacksContext.
export function GemPacksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncGems } = useGemsContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<GemPackDef[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [priceAmountsMicros, setPriceAmountsMicros] = useState<Record<string, number>>({})
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/gem-packs`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de packs de gemas', err))
  }, [])

  // Prices come from whichever store sells here (lib/store): the web's
  // checkout in a browser, Google Play / the App Store inside the app.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const store = await getStore(userId)
        if (!store) return
        const listed = await store.loadPrices(OFFERING_ID)
        if (cancelled) return
        const nextPrices: Record<string, string> = {}
        const nextAmounts: Record<string, number> = {}
        for (const [productId, price] of Object.entries(listed)) {
          nextPrices[productId] = price.formatted
          nextAmounts[productId] = price.micros
        }
        setPrices(nextPrices)
        setPriceAmountsMicros(nextAmounts)
      } catch (err) {
        console.error('No se pudieron cargar los precios de los packs de gemas', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const buy = useCallback(
    async (pack: GemPackDef): Promise<BuyResult> => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      const store = await getStore(userId)
      if (!store) return { ok: false, error: 'revenuecat-not-configured' }

      setBuyingId(pack.id)
      try {
        const result = await store.purchase(OFFERING_ID, pack.id)
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/gem-packs/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ transactionId: result.transactionId }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        if (typeof data.gems === 'number') syncGems(data.gems)
        playChestPurchase()
        return { ok: true }
      } catch (err) {
        if (err instanceof PurchaseCancelled) return { ok: false, error: 'cancelled' }
        if ((err as Error).message === 'product-not-found') return { ok: false, error: 'product-not-found' }
        console.error('No se pudo completar la compra del pack de gemas', err)
        return { ok: false, error: 'purchase-failed' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncGems, promptSignIn],
  )

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ catalog, prices, priceAmountsMicros, buyingId, buy }),
    [catalog, prices, priceAmountsMicros, buyingId, buy],
  )

  return <GemPacksContext.Provider value={value}>{children}</GemPacksContext.Provider>
}

export function useGemPacksContext() {
  const ctx = useContext(GemPacksContext)
  if (!ctx) throw new Error('useGemPacksContext must be used within a GemPacksProvider')
  return ctx
}
