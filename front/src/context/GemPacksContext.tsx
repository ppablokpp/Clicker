import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Purchases, PurchasesError, ErrorCode, type Package } from '@revenuecat/purchases-js'
import { useGemsContext } from './GemsContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined
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
  const packagesRef = useRef<Record<string, Package>>({})

  useEffect(() => {
    fetch(`${API_URL}/api/gem-packs`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de packs de gemas', err))
  }, [])

  const ensureConfigured = useCallback(() => {
    if (!userId || !REVENUECAT_PUBLIC_KEY) return null
    if (!Purchases.isConfigured()) {
      Purchases.configure({ apiKey: REVENUECAT_PUBLIC_KEY, appUserId: userId })
    }
    return Purchases.getSharedInstance()
  }, [userId])

  useEffect(() => {
    if (!userId || !REVENUECAT_PUBLIC_KEY) return
    let cancelled = false
    ;(async () => {
      try {
        const purchases = ensureConfigured()
        if (!purchases) return
        const offerings = await purchases.getOfferings({ offeringIdentifier: OFFERING_ID })
        const offering = offerings.all[OFFERING_ID]
        if (!offering || cancelled) return
        const nextPrices: Record<string, string> = {}
        const nextAmounts: Record<string, number> = {}
        for (const pkg of offering.availablePackages) {
          const productId = pkg.webBillingProduct.identifier
          packagesRef.current[productId] = pkg
          nextPrices[productId] = pkg.webBillingProduct.price.formattedPrice
          nextAmounts[productId] = pkg.webBillingProduct.price.amountMicros
        }
        if (!cancelled) {
          setPrices(nextPrices)
          setPriceAmountsMicros(nextAmounts)
        }
      } catch (err) {
        console.error('No se pudieron cargar los precios de los packs de gemas', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, ensureConfigured])

  const buy = useCallback(
    async (pack: GemPackDef): Promise<BuyResult> => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      const purchases = ensureConfigured()
      if (!purchases) return { ok: false, error: 'revenuecat-not-configured' }

      setBuyingId(pack.id)
      try {
        let pkg = packagesRef.current[pack.id]
        if (!pkg) {
          const offerings = await purchases.getOfferings({ offeringIdentifier: OFFERING_ID })
          const found = offerings.all[OFFERING_ID]?.availablePackages.find(
            (p) => p.webBillingProduct.identifier === pack.id,
          )
          if (found) pkg = found
        }
        if (!pkg) return { ok: false, error: 'product-not-found' }

        const result = await purchases.purchase({ rcPackage: pkg })
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/gem-packs/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ transactionId: result.storeTransaction.storeTransactionId }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        if (typeof data.gems === 'number') syncGems(data.gems)
        playChestPurchase()
        return { ok: true }
      } catch (err) {
        if (err instanceof PurchasesError && err.errorCode === ErrorCode.UserCancelledError) {
          return { ok: false, error: 'cancelled' }
        }
        console.error('No se pudo completar la compra del pack de gemas', err)
        return { ok: false, error: 'purchase-failed' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, ensureConfigured, getToken, syncGems, promptSignIn],
  )

  return (
    <GemPacksContext.Provider value={{ catalog, prices, priceAmountsMicros, buyingId, buy }}>
      {children}
    </GemPacksContext.Provider>
  )
}

export function useGemPacksContext() {
  const ctx = useContext(GemPacksContext)
  if (!ctx) throw new Error('useGemPacksContext must be used within a GemPacksProvider')
  return ctx
}
