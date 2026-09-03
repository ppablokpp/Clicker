import { Router } from 'express'
// Real-money (RevenueCat) route: deliberately Clerk's own getAuth, NOT the
// guest-capable wrapper. A purchase has to be tied to an account the buyer
// can actually recover — clearing this browser's storage must never be able
// to destroy something someone paid for — so an anon bearer token yields no
// userId here and the request 401s, which is what makes the frontend prompt
// a sign-in before charging anyone.
import { getAuth } from '@clerk/express'
import { permanentUpgradesRepository } from '../db/permanentUpgradesRepository.js'
import { MONEY_UPGRADE_CATALOG } from '../powerups/moneyUpgrades.js'
import { fetchSubscriber, ownedProductIds } from '../services/revenuecat.js'

export const moneyUpgradesRouter = Router()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

moneyUpgradesRouter.get('/', (_req, res) => {
  res.json(MONEY_UPGRADE_CATALOG)
})

// Called right after a purchase resolves client-side, and on every page
// load to self-heal (e.g. a purchase made from another device/session).
// Re-checks the real state with RevenueCat every time instead of trusting
// the client, then persists whatever's newly owned.
//
// `expectProductId`: right after a purchase, RevenueCat can take a moment
// to index the new transaction, so a subscriber lookup made immediately
// after purchase() resolves can still come back without it. When the
// caller tells us which product it just bought, we retry a few times
// instead of reporting a false "not owned".
moneyUpgradesRouter.post('/sync', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const expectProductId = req.body?.expectProductId
  const maxAttempts = expectProductId ? 4 : 1

  try {
    let purchased = new Set()
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const subscriber = await fetchSubscriber(userId)
      purchased = ownedProductIds(subscriber)
      if (!expectProductId || purchased.has(expectProductId) || attempt === maxAttempts) break
      await sleep(500 * attempt)
    }

    for (const upgrade of MONEY_UPGRADE_CATALOG) {
      if (purchased.has(upgrade.id)) {
        await permanentUpgradesRepository.grantIfMissing(userId, upgrade.id)
      }
    }

    const owned = await permanentUpgradesRepository.getOwned(userId)
    res.json({ owned })
  } catch (err) {
    console.error('No se pudo sincronizar con RevenueCat', err)
    res.status(502).json({ error: 'revenuecat-sync-failed' })
  }
})
