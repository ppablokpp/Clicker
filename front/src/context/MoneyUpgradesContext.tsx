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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined
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
  const [catalog, setCatalog] = useState<MoneyUpgradeDef[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const packagesRef = useRef<Record<string, Package>>({})

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

  const ensureConfigured = useCallback(() => {
    if (!userId || !REVENUECAT_PUBLIC_KEY) return null
    if (!Purchases.isConfigured()) {
      Purchases.configure({ apiKey: REVENUECAT_PUBLIC_KEY, appUserId: userId })
    }
    return Purchases.getSharedInstance()
  }, [userId])

  // Real, localized prices live in RevenueCat, not in our own catalog — our
  // backend only knows the gameplay numbers (chance/multiplier).
  useEffect(() => {
    if (!MONEY_UPGRADES_ENABLED || !userId || !REVENUECAT_PUBLIC_KEY) return
    let cancelled = false
    ;(async () => {
      try {
        const purchases = ensureConfigured()
        if (!purchases) return
        const offerings = await purchases.getOfferings({ offeringIdentifier: OFFERING_ID })
        const offering = offerings.all[OFFERING_ID]
        if (!offering || cancelled) return
        const nextPrices: Record<string, string> = {}
        for (const pkg of offering.availablePackages) {
          const productId = pkg.webBillingProduct.identifier
          packagesRef.current[productId] = pkg
          nextPrices[productId] = pkg.webBillingProduct.price.formattedPrice
        }
        if (!cancelled) setPrices(nextPrices)
      } catch (err) {
        console.error('No se pudieron cargar los precios de RevenueCat', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, ensureConfigured])

  const buy = useCallback(
    async (upgrade: MoneyUpgradeDef) => {
      if (!MONEY_UPGRADES_ENABLED) return { ok: false, error: 'disabled' }
      if (!userId) return { ok: false, error: 'not-signed-in' }
      const purchases = ensureConfigured()
      if (!purchases) return { ok: false, error: 'revenuecat-not-configured' }

      setBuyingId(upgrade.id)
      try {
        let pkg = packagesRef.current[upgrade.id]
        if (!pkg) {
          const offerings = await purchases.getOfferings({ offeringIdentifier: OFFERING_ID })
          const found = offerings.all[OFFERING_ID]?.availablePackages.find(
            (p) => p.webBillingProduct.identifier === upgrade.id,
          )
          if (found) pkg = found
        }
        if (!pkg) return { ok: false, error: 'product-not-found' }

        await purchases.purchase({ rcPackage: pkg })
        await sync(upgrade.id)
        return { ok: true }
      } catch (err) {
        if (err instanceof PurchasesError && err.errorCode === ErrorCode.UserCancelledError) {
          return { ok: false, error: 'cancelled' }
        }
        console.error('No se pudo completar la compra', err)
        return { ok: false, error: 'purchase-failed' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, ensureConfigured, sync],
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

  return (
    <MoneyUpgradesContext.Provider value={{ catalog, owned, bestOwned, prices, buyingId, buy }}>
      {children}
    </MoneyUpgradesContext.Provider>
  )
}

export function useMoneyUpgradesContext() {
  const ctx = useContext(MoneyUpgradesContext)
  if (!ctx) throw new Error('useMoneyUpgradesContext must be used within a MoneyUpgradesProvider')
  return ctx
}
