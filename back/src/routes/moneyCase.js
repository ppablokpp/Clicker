import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { pickWeightedPrize } from '../store/dailyCase.js'
import { fetchSubscriber } from '../services/revenuecat.js'

export const moneyCaseRouter = Router()

// Must match the RevenueCat product identifier exactly. Has to be a
// Consumable product in the dashboard — a Non-consumable would make
// RevenueCat itself reject a second purchase() call for the same user.
const MONEY_CASE_PRODUCT_ID = 'case_purchase'

// The client only tells us which transaction it just completed — we verify
// that transaction is real (and belongs to this product) against RevenueCat
// directly before rolling a prize and paying it out. Redeeming the same
// transaction twice is blocked by the DB (see usersRepository.redeemCasePurchase).
moneyCaseRouter.post('/redeem', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const transactionId = req.body?.transactionId
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' })

  try {
    const subscriber = await fetchSubscriber(userId)
    const purchases = subscriber?.non_subscriptions?.[MONEY_CASE_PRODUCT_ID] ?? []
    const isRealTransaction = purchases.some(
      (p) => p.store_transaction_id === transactionId || p.id === transactionId,
    )
    if (!isRealTransaction) return res.status(400).json({ error: 'transaction-not-found' })

    const prize = pickWeightedPrize()
    const result = await usersRepository.redeemCasePurchase(userId, transactionId, prize)
    if (!result.ok) {
      if (result.reason === 'already-redeemed') return res.status(400).json({ error: 'already-redeemed' })
      return res.status(400).json({ error: 'redeem-failed' })
    }

    res.json({
      totalClicks: result.totalClicks,
      gems: result.gems,
      prizeId: prize.id,
      prizeAmount: prize.amount,
      prizeCurrency: prize.currency,
    })
  } catch (err) {
    console.error('No se pudo canjear la compra del cofre', err)
    res.status(502).json({ error: 'revenuecat-sync-failed' })
  }
})
