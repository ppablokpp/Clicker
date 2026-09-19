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
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
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

  // The price comes from whichever store sells here (lib/store): the web's
  // checkout in a browser, Google Play / the App Store inside the app.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const store = await getStore(userId)
        if (!store) return
        const listed = await store.loadPrices(OFFERING_ID)
        const price = listed[PRODUCT_ID]
        if (!cancelled && price) setPrice(price.formatted)
      } catch (err) {
        console.error('No se pudo cargar el precio del cofre de pago', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const buy = useCallback(async (): Promise<BuyResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    const store = await getStore(userId)
    if (!store) return { ok: false, error: 'revenuecat-not-configured' }

    setIsBuying(true)
    try {
      const result = await store.purchase(OFFERING_ID, PRODUCT_ID)
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/money-case/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: result.transactionId }),
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
      if (err instanceof PurchaseCancelled) return { ok: false, error: 'cancelled' }
      if ((err as Error).message === 'product-not-found') return { ok: false, error: 'product-not-found' }
      console.error('No se pudo completar la compra del cofre', err)
      return { ok: false, error: 'purchase-failed' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, getToken, promptSignIn])

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
