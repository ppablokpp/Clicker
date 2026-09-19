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
const OFFERING_ID = 'permanent_upgrades'

// The Store UI for buying new tiers is commented out (nobody else should be
// able to purchase yet), but this stays on so already-owned tiers keep
// loading and applying normally. Requires the backend's /api/money-upgrades
// routes to actually be deployed — otherwise these calls 404.
const MONEY_UPGRADES_ENABLED = true

export interface MoneyUpgradeDef {
  id: string
  multiplier: number
}

interface MoneyUpgradesContextValue {
  catalog: MoneyUpgradeDef[]
  owned: Set<string>
  /** Not cumulative — only your single highest-tier owned upgrade applies, as a flat multiplier on every click. */
  bestOwned: MoneyUpgradeDef | null
  /** Real, localized prices from RevenueCat, keyed by upgrade id. Empty until loaded. */
  prices: Record<string, string>
  buyingId: string | null
  buy: (upgrade: MoneyUpgradeDef) => Promise<{ ok: boolean; error?: string }>
}

const MoneyUpgradesContext = createContext<MoneyUpgradesContextValue | null>(null)

export function MoneyUpgradesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<MoneyUpgradeDef[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    if (!MONEY_UPGRADES_ENABLED) return
    fetch(`${API_URL}/api/money-upgrades`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de mejoras premium', err))
  }, [])

  // Re-checks ownership against RevenueCat (server-verified) — called on
  // load to self-heal and again right after a purchase resolves.
  // `expectProductId`: passed right after a purchase so the backend can
  // retry if RevenueCat hasn't indexed the new transaction yet.
  const sync = useCallback(
    async (expectProductId?: string) => {
      if (!userId || !MONEY_UPGRADES_ENABLED) return
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/money-upgrades/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ expectProductId }),
        })
        if (res.ok) {
          const data = await res.json()
          setOwned(new Set(data.owned))
        }
      } catch (err) {
        console.error('No se pudieron sincronizar tus mejoras premium', err)
      }
    },
    [userId, getToken],
  )

  useEffect(() => {
    sync()
  }, [sync])

  // Real, localized prices live in the store (lib/store), not in our own
  // catalog — our backend only knows the gameplay numbers (chance/multiplier).
  useEffect(() => {
    if (!MONEY_UPGRADES_ENABLED) return
    let cancelled = false
    ;(async () => {
      try {
        const store = await getStore(userId)
        if (!store) return
        const listed = await store.loadPrices(OFFERING_ID)
        if (cancelled) return
        const nextPrices: Record<string, string> = {}
        for (const [productId, price] of Object.entries(listed)) nextPrices[productId] = price.formatted
        setPrices(nextPrices)
      } catch (err) {
        console.error('No se pudieron cargar los precios de RevenueCat', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const buy = useCallback(
    async (upgrade: MoneyUpgradeDef) => {
      if (!MONEY_UPGRADES_ENABLED) return { ok: false, error: 'disabled' }
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      const store = await getStore(userId)
      if (!store) return { ok: false, error: 'revenuecat-not-configured' }

      setBuyingId(upgrade.id)
      try {
        await store.purchase(OFFERING_ID, upgrade.id)
        await sync(upgrade.id)
        return { ok: true }
      } catch (err) {
        if (err instanceof PurchaseCancelled) return { ok: false, error: 'cancelled' }
        if ((err as Error).message === 'product-not-found') return { ok: false, error: 'product-not-found' }
        console.error('No se pudo completar la compra', err)
        return { ok: false, error: 'purchase-failed' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, sync, promptSignIn],
  )

  const bestOwned = useMemo(() => {
    let best: MoneyUpgradeDef | null = null
    for (const upgrade of catalog) {
      if (owned.has(upgrade.id) && (!best || upgrade.multiplier > best.multiplier)) {
        best = upgrade
      }
    }
    return best
  }, [catalog, owned])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ catalog, owned, bestOwned, prices, buyingId, buy }),
    [catalog, owned, bestOwned, prices, buyingId, buy],
  )

  return <MoneyUpgradesContext.Provider value={value}>{children}</MoneyUpgradesContext.Provider>
}

export function useMoneyUpgradesContext() {
  const ctx = useContext(MoneyUpgradesContext)
  if (!ctx) throw new Error('useMoneyUpgradesContext must be used within a MoneyUpgradesProvider')
  return ctx
}
