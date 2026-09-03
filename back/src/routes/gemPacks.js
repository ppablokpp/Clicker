import { Router } from 'express'
// Real-money (RevenueCat) route: deliberately Clerk's own getAuth, NOT the
// guest-capable wrapper. A purchase has to be tied to an account the buyer
// can actually recover — clearing this browser's storage must never be able
// to destroy something someone paid for — so an anon bearer token yields no
// userId here and the request 401s, which is what makes the frontend prompt
// a sign-in before charging anyone.
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { GEM_PACKS } from '../store/gemPacks.js'
import { fetchSubscriber } from '../services/revenuecat.js'

export const gemPacksRouter = Router()

gemPacksRouter.get('/', (_req, res) => {
  res.json(GEM_PACKS)
})

// Same "derive the pack from RevenueCat's own record" approach as keyPacks.
gemPacksRouter.post('/redeem', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const transactionId = req.body?.transactionId
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' })

  try {
    const subscriber = await fetchSubscriber(userId)
    const pack = GEM_PACKS.find((p) => {
      const purchases = subscriber?.non_subscriptions?.[p.id] ?? []
      return purchases.some((tx) => tx.store_transaction_id === transactionId || tx.id === transactionId)
    })
    if (!pack) return res.status(400).json({ error: 'transaction-not-found' })

    const result = await usersRepository.redeemGemPack(userId, transactionId, pack)
    if (!result.ok) {
      if (result.reason === 'already-redeemed') return res.status(400).json({ error: 'already-redeemed' })
      return res.status(400).json({ error: 'redeem-failed' })
    }

    res.json({ gems: result.gems, packId: pack.id, packAmount: pack.amount })
  } catch (err) {
    console.error('No se pudo canjear la compra de gemas', err)
    res.status(502).json({ error: 'revenuecat-sync-failed' })
  }
})
