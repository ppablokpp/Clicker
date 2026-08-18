// Server-to-server verification: we never trust the client's word that a
// purchase went through, we ask RevenueCat directly with the secret key.
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1'

export async function fetchSubscriber(appUserId) {
  const secretKey = process.env.REVENUECAT_SECRET_KEY
  if (!secretKey) throw new Error('REVENUECAT_SECRET_KEY is not set')

  const res = await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  if (!res.ok) {
    throw new Error(`RevenueCat subscriber lookup failed: ${res.status}`)
  }
  const data = await res.json()
  return data.subscriber
}

/** Product ids this subscriber has at least one real purchase record for. */
export function ownedProductIds(subscriber) {
  const nonSubscriptions = subscriber?.non_subscriptions ?? {}
  return new Set(
    Object.keys(nonSubscriptions).filter((productId) => nonSubscriptions[productId]?.length > 0),
  )
}
