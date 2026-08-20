import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { CASE_PRIZES, DAILY_CASE_CHEST_COST, DAILY_CASE_KEY_COST, pickWeightedPrize } from '../store/dailyCase.js'

export const dailyCaseRouter = Router()

dailyCaseRouter.get('/', (_req, res) => {
  res.json({ chestCost: DAILY_CASE_CHEST_COST, keyCost: DAILY_CASE_KEY_COST, prizes: CASE_PRIZES })
})

// The prize is rolled here, server-side, right before spending the cost —
// the client only finds out what it won from this response, it never
// decides or previews the real result itself.
dailyCaseRouter.post('/spin', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickWeightedPrize()
  const result = await usersRepository.spinDailyCase(userId, DAILY_CASE_KEY_COST, prize)
  if (!result.ok) {
    if (result.reason === 'not-enough-keys') return res.status(400).json({ error: 'not-enough-keys' })
    if (result.reason === 'not-enough-chests') return res.status(400).json({ error: 'not-enough-chests' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({
    totalClicks: result.totalClicks,
    gems: result.gems,
    keys: result.keys,
    ownedChests: result.ownedChests,
    prizeId: prize.id,
    prizeAmount: prize.amount,
    prizeCurrency: prize.currency,
  })
})

// Buys one click-chest (no cooldown, capped at 10 owned at once) — a
// prerequisite for /spin's key-paid path. The gem-paid path (see
// gemCase.js) skips this entirely.
dailyCaseRouter.post('/buy-chest', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await usersRepository.buyClickChest(userId, DAILY_CASE_CHEST_COST)
  if (!result.ok) {
    if (result.reason === 'not-enough-clicks') return res.status(400).json({ error: 'not-enough-clicks' })
    if (result.reason === 'chest-limit-reached') return res.status(400).json({ error: 'chest-limit-reached' })
    return res.status(400).json({ error: 'purchase-failed' })
  }

  res.json({ totalClicks: result.totalClicks, ownedChests: result.ownedChests })
})
