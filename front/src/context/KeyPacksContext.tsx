import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Purchases, PurchasesError, ErrorCode, type Package } from '@revenuecat/purchases-js'
import { useKeysContext } from './KeysContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined
const OFFERING_ID = 'keys'

export interface KeyPackDef {
  id: string
  amount: number
}

interface BuyResult {
  ok: boolean
  error?: string
}

interface KeyPacksContextValue {
  catalog: KeyPackDef[]
  /** Real, localized prices from RevenueCat, keyed by pack id. Empty until loaded. */
  prices: Record<string, string>
  /** Raw price in currency micro-units, keyed by pack id — lets the UI compute per-unit savings without parsing the formatted string. */
  priceAmountsMicros: Record<string, number>
  buyingId: string | null
  buy: (pack: KeyPackDef) => Promise<BuyResult>
}

const KeyPacksContext = createContext<KeyPacksContextValue | null>(null)

// Real money via RevenueCat's `keys` offering — each product is Consumable
// and repeatable (buying key packs isn't a one-time unlock like the old
// permanent upgrades were).
export function KeyPacksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncKeys } = useKeysContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<KeyPackDef[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [priceAmountsMicros, setPriceAmountsMicros] = useState<Record<string, number>>({})
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const packagesRef = useRef<Record<string, Package>>({})

  useEffect(() => {
    fetch(`${API_URL}/api/key-packs`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de packs de llaves', err))
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
        console.error('No se pudieron cargar los precios de los packs de llaves', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, ensureConfigured])

  const buy = useCallback(
    async (pack: KeyPackDef): Promise<BuyResult> => {
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
        const res = await fetch(`${API_URL}/api/key-packs/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ transactionId: result.storeTransaction.storeTransactionId }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        if (typeof data.keys === 'number') syncKeys(data.keys)
        playChestPurchase()
        return { ok: true }
      } catch (err) {
        if (err instanceof PurchasesError && err.errorCode === ErrorCode.UserCancelledError) {
          return { ok: false, error: 'cancelled' }
        }
        console.error('No se pudo completar la compra del pack de llaves', err)
        return { ok: false, error: 'purchase-failed' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, ensureConfigured, getToken, syncKeys, promptSignIn],
  )

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ catalog, prices, priceAmountsMicros, buyingId, buy }),
    [catalog, prices, priceAmountsMicros, buyingId, buy],
  )

  return <KeyPacksContext.Provider value={value}>{children}</KeyPacksContext.Provider>
}

export function useKeyPacksContext() {
  const ctx = useContext(KeyPacksContext)
  if (!ctx) throw new Error('useKeyPacksContext must be used within a KeyPacksProvider')
  return ctx
}
