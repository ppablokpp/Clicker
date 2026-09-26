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
 *
 * A guest gets a store too, under an anonymous RevenueCat id, so the
 * shelves show their prices before anyone signs in; buying is what the
 * contexts gate on a session (a purchase must land on an account the
 * buyer can get back to), and it is the sign-in prompt they open instead.
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

let current: { userId: string | null; store: Store } | null = null

/** The id a guest's store runs under: no Clerk user, so RevenueCat's own. */
const GUEST = null

/**
 * The store for this user — configured once per user id (RevenueCat's
 * SDKs are singletons keyed on the app user id, which is the Clerk id so
 * web and app purchases merge into one record), anonymous for a guest.
 * `null` without a key for this platform.
 */
export async function getStore(userId: string | null | undefined): Promise<Store | null> {
  if (!storeAvailable()) return null
  const key = userId ?? GUEST
  if (current && current.userId === key) return current.store
  const store = isNativeApp() ? await nativeStore(key) : await webStore(key)
  current = { userId: key, store }
  return store
}

// ── the web: RevenueCat Web Billing ──

/** Where a guest browser keeps the id RevenueCat knows it by. */
const GUEST_ID_KEY = 'clankup_rc_guest_id'

/**
 * One anonymous id per browser, not one per call.
 *
 * RevenueCat's generator mints a fresh id every time it is asked, and a
 * guest builds the store once per shop context (gems, keys, the case, the
 * upgrades) on every visit — so asking it each time turned one visitor
 * into a handful of new customers a day, hundreds of them against a
 * couple of dozen real players. Kept in storage, a browser is one
 * customer. Nothing is bought under it (a guest is sent to sign in first);
 * it exists so prices can be read at all.
 */
function guestAppUserId(generate: () => string): string {
  try {
    const stored = localStorage.getItem(GUEST_ID_KEY)
    if (stored) return stored
    const fresh = generate()
    localStorage.setItem(GUEST_ID_KEY, fresh)
    return fresh
  } catch {
    // Private windows and blocked storage: back to one per call, which is
    // the old behaviour and still works.
    return generate()
  }
}

async function webStore(userId: string | null): Promise<Store> {
  const { Purchases, PurchasesError, ErrorCode } = await import('@revenuecat/purchases-js')
  type Package = import('@revenuecat/purchases-js').Package
  const appUserId = userId ?? guestAppUserId(Purchases.generateRevenueCatAnonymousAppUserId)
  if (!Purchases.isConfigured()) {
    Purchases.configure({ apiKey: WEB_KEY!, appUserId })
  } else if (Purchases.getSharedInstance().getAppUserId() !== appUserId) {
    await Purchases.getSharedInstance().changeUser(appUserId)
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
async function nativeStore(userId: string | null): Promise<Store> {
  const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor')
  type PurchasesPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage
  const apiKey = (nativePlatform() === 'ios' ? APPLE_KEY : GOOGLE_KEY)!
  const { isConfigured } = await Purchases.isConfigured()
  if (!isConfigured) {
    // no id for a guest: the SDK makes an anonymous one
    await Purchases.configure(userId ? { apiKey, appUserID: userId } : { apiKey })
  } else {
    const { appUserID } = await Purchases.getAppUserID()
    if (userId && appUserID !== userId) await Purchases.logIn({ appUserID: userId })
    else if (!userId && !appUserID.startsWith('$RCAnonymousID:')) await Purchases.logOut()
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
