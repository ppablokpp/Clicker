import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { KEY_PACKS } from '../store/keyPacks.js'
import { fetchSubscriber } from '../services/revenuecat.js'

export const keyPacksRouter = Router()

keyPacksRouter.get('/', (_req, res) => {
  res.json(KEY_PACKS)
})

// Doesn't trust a client-supplied packId — instead it searches the
// subscriber's own non_subscriptions for whichever key-pack product
// actually contains this transaction, so the pack is derived from
// RevenueCat's own record, not from anything the client claims.
keyPacksRouter.post('/redeem', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const transactionId = req.body?.transactionId
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' })

  try {
    const subscriber = await fetchSubscriber(userId)
    const pack = KEY_PACKS.find((p) => {
      const purchases = subscriber?.non_subscriptions?.[p.id] ?? []
      return purchases.some((tx) => tx.store_transaction_id === transactionId || tx.id === transactionId)
    })
    if (!pack) return res.status(400).json({ error: 'transaction-not-found' })

    const result = await usersRepository.redeemKeyPack(userId, transactionId, pack)
    if (!result.ok) {
      if (result.reason === 'already-redeemed') return res.status(400).json({ error: 'already-redeemed' })
      return res.status(400).json({ error: 'redeem-failed' })
    }

    res.json({ keys: result.keys, packId: pack.id, packAmount: pack.amount })
  } catch (err) {
    console.error('No se pudo canjear la compra de llaves', err)
    res.status(502).json({ error: 'revenuecat-sync-failed' })
  }
})
