import { isNativeApp, nativePlatform } from './native'

/**
 * Real-money purchases, wherever the app is running.
 *
 * Everything paid goes through RevenueCat, and the back verifies a purchase
 * by asking RevenueCat for the buyer's record (services/revenuecat.js) — it
 * never cares which store sold it. What differs is the client: on the web
 * it's RevenueCat's Web Billing SDK (`@revenuecat/purchases-js`) with its
 * own checkout; inside the native shell it's the platform's store — Google
 * Play Billing or Apple's StoreKit — through `@revenuecat/purchases-capacitor`,
 * which is what Apple and Google require for digital goods sold in an app.
 *
 * The purchase contexts only see this: prices for an offering, keyed by
 * product id, and a purchase that resolves to the transaction id the back
 * will look for. Product ids are the same in every store (RevenueCat
 * products map one Play/App Store/Web product each, all named alike), so
 * the catalogue the back serves matches everywhere.
 *
 * Keys: the web key as before; the Play and App Store keys are separate
 * RevenueCat "public" keys (`goog_…`, `appl_…`), only read in the shell.
 * Without the key for the current platform there is no store and nothing
 * is for sale — the same as the web today when its key is missing.
 */

export interface StorePrice {
  /** Localized, as the store shows it: "1,99 €". */
  formatted: string
  /** In millionths of the currency unit, for sorting and comparing. */
  micros: number
}

export interface StorePurchase {
  transactionId: string
}

/** The buyer backed out; not a failure to report. */
export class PurchaseCancelled extends Error {}

export interface Store {
  /** Prices of every product in an offering, keyed by product id. */
  loadPrices(offeringId: string): Promise<Record<string, StorePrice>>
  /** Runs the store's own purchase UI; resolves once paid. */
  purchase(offeringId: string, productId: string): Promise<StorePurchase>
}

const WEB_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined
const GOOGLE_KEY = import.meta.env.VITE_REVENUECAT_GOOGLE_KEY as string | undefined
const APPLE_KEY = import.meta.env.VITE_REVENUECAT_APPLE_KEY as string | undefined

/** Whether a store exists here at all, before any user is known. */
export function storeAvailable(): boolean {
  if (!isNativeApp()) return Boolean(WEB_KEY)
  return Boolean(nativePlatform() === 'ios' ? APPLE_KEY : GOOGLE_KEY)
}

let current: { userId: string; store: Store } | null = null

/**
 * The store for this user — configured once per user id (RevenueCat's
 * SDKs are singletons keyed on the app user id, which is the Clerk id so
 * web and app purchases merge into one record). `null` while signed out or
 * without a key for this platform.
 */
export async function getStore(userId: string | null | undefined): Promise<Store | null> {
  if (!userId || !storeAvailable()) return null
  if (current?.userId === userId) return current.store
  const store = isNativeApp() ? await nativeStore(userId) : await webStore(userId)
  current = { userId, store }
  return store
}

// ── the web: RevenueCat Web Billing ──
async function webStore(userId: string): Promise<Store> {
  const { Purchases, PurchasesError, ErrorCode } = await import('@revenuecat/purchases-js')
  type Package = import('@revenuecat/purchases-js').Package
  if (!Purchases.isConfigured()) {
    Purchases.configure({ apiKey: WEB_KEY!, appUserId: userId })
  } else if (Purchases.getSharedInstance().getAppUserId() !== userId) {
    await Purchases.getSharedInstance().changeUser(userId)
  }
  const purchases = Purchases.getSharedInstance()
  const packages = new Map<string, Package>()
  const load = async (offeringId: string) => {
    const offerings = await purchases.getOfferings({ offeringIdentifier: offeringId })
    const offering = offerings.all[offeringId]
    const prices: Record<string, StorePrice> = {}
    for (const pkg of offering?.availablePackages ?? []) {
      const product = pkg.webBillingProduct
      packages.set(`${offeringId}/${product.identifier}`, pkg)
      prices[product.identifier] = { formatted: product.price.formattedPrice, micros: product.price.amountMicros }
    }
    return prices
  }
  return {
    loadPrices: load,
    async purchase(offeringId, productId) {
      if (!packages.has(`${offeringId}/${productId}`)) await load(offeringId)
      const pkg = packages.get(`${offeringId}/${productId}`)
      if (!pkg) throw new Error('product-not-found')
      try {
        const result = await purchases.purchase({ rcPackage: pkg })
        return { transactionId: result.storeTransaction.storeTransactionId }
      } catch (err) {
        if (err instanceof PurchasesError && err.errorCode === ErrorCode.UserCancelledError) {
          throw new PurchaseCancelled()
        }
        throw err
      }
    },
  }
}

// ── the shell: Google Play / App Store through RevenueCat's native SDK ──
async function nativeStore(userId: string): Promise<Store> {
  const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor')
  type PurchasesPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage
  const apiKey = (nativePlatform() === 'ios' ? APPLE_KEY : GOOGLE_KEY)!
  const { isConfigured } = await Purchases.isConfigured()
  if (!isConfigured) {
    await Purchases.configure({ apiKey, appUserID: userId })
  } else {
    const { appUserID } = await Purchases.getAppUserID()
    if (appUserID !== userId) await Purchases.logIn({ appUserID: userId })
  }
  const packages = new Map<string, PurchasesPackage>()
  const load = async (offeringId: string) => {
    const offerings = await Purchases.getOfferings()
    const offering = offerings.all[offeringId]
    const prices: Record<string, StorePrice> = {}
    for (const pkg of offering?.availablePackages ?? []) {
      const product = pkg.product
      packages.set(`${offeringId}/${product.identifier}`, pkg)
      prices[product.identifier] = { formatted: product.priceString, micros: Math.round(product.price * 1_000_000) }
    }
    return prices
  }
  return {
    loadPrices: load,
    async purchase(offeringId, productId) {
      if (!packages.has(`${offeringId}/${productId}`)) await load(offeringId)
      const pkg = packages.get(`${offeringId}/${productId}`)
      if (!pkg) throw new Error('product-not-found')
      try {
        const result = await Purchases.purchasePackage({ aPackage: pkg })
        return { transactionId: result.transaction.transactionIdentifier }
      } catch (err) {
        if ((err as { code?: unknown })?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          throw new PurchaseCancelled()
        }
        throw err
      }
    },
  }
}
