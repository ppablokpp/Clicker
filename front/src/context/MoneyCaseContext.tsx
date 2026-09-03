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
// Real money (RevenueCat): Clerk's own useAuth, NOT the guest-capable
// useAppAuth. A purchase must be attached to an account the buyer can
// recover — tying one to a browser-local guest id would mean clearing site
// data destroys something they paid for. With no session `userId` is null,
// so `buy` below takes its existing not-signed-in branch and prompts a
// sign-in instead of charging anyone. The matching backend routes reject an
// anon token outright for the same reason.
import { useAuth } from '@clerk/clerk-react'
import { Purchases, PurchasesError, ErrorCode, type Package } from '@revenuecat/purchases-js'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined
const OFFERING_ID = 'case_purchases'
const PRODUCT_ID = 'case_purchase'

interface BuyResult {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  prizeCurrency?: 'clicks' | 'gems'
  /** Caller applies these to the visible counters once the reel animation reveals the prize — not before, or the total would spoil the result early. */
  totalClicks?: number
  gems?: number
}

interface MoneyCaseContextValue {
  /** Real, localized price from RevenueCat. Empty until loaded. */
  price: string
  isBuying: boolean
  buy: () => Promise<BuyResult>
}

const MoneyCaseContext = createContext<MoneyCaseContextValue | null>(null)

export function MoneyCaseProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [price, setPrice] = useState('')
  const [isBuying, setIsBuying] = useState(false)
  const packageRef = useRef<Package | null>(null)

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
        const pkg = offering.availablePackages.find(
          (p) => p.webBillingProduct.identifier === PRODUCT_ID,
        )
        if (!pkg) return
        packageRef.current = pkg
        if (!cancelled) setPrice(pkg.webBillingProduct.price.formattedPrice)
      } catch (err) {
        console.error('No se pudo cargar el precio del cofre de pago', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, ensureConfigured])

  const buy = useCallback(async (): Promise<BuyResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    const purchases = ensureConfigured()
    if (!purchases) return { ok: false, error: 'revenuecat-not-configured' }

    setIsBuying(true)
    try {
      let pkg = packageRef.current
      if (!pkg) {
        const offerings = await purchases.getOfferings({ offeringIdentifier: OFFERING_ID })
        const found = offerings.all[OFFERING_ID]?.availablePackages.find(
          (p) => p.webBillingProduct.identifier === PRODUCT_ID,
        )
        if (found) pkg = found
      }
      if (!pkg) return { ok: false, error: 'product-not-found' }

      const result = await purchases.purchase({ rcPackage: pkg })
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/money-case/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: result.storeTransaction.storeTransactionId }),
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
      if (err instanceof PurchasesError && err.errorCode === ErrorCode.UserCancelledError) {
        return { ok: false, error: 'cancelled' }
      }
      console.error('No se pudo completar la compra del cofre', err)
      return { ok: false, error: 'purchase-failed' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, ensureConfigured, getToken, promptSignIn])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(() => ({ price, isBuying, buy }), [price, isBuying, buy])

  return <MoneyCaseContext.Provider value={value}>{children}</MoneyCaseContext.Provider>
}

export function useMoneyCaseContext() {
  const ctx = useContext(MoneyCaseContext)
  if (!ctx) throw new Error('useMoneyCaseContext must be used within a MoneyCaseProvider')
  return ctx
}
