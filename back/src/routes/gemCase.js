import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { GEM_CASE_COST, pickWeightedPrize } from '../store/dailyCase.js'

export const gemCaseRouter = Router()

gemCaseRouter.get('/', (_req, res) => {
  res.json({ cost: GEM_CASE_COST })
})

// No RevenueCat involved — this just spends gems the player already has
// (won from other cases), so there's nothing external to verify, unlike
// the money-case route. Repeatable, no cooldown.
gemCaseRouter.post('/open', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickWeightedPrize()
  const result = await usersRepository.spendGemsForCase(userId, GEM_CASE_COST, prize)
  if (!result.ok) {
    if (result.reason === 'not-enough-gems') return res.status(400).json({ error: 'not-enough-gems' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({
    totalClicks: result.totalClicks,
    gems: result.gems,
    prizeId: prize.id,
    prizeAmount: prize.amount,
    prizeCurrency: prize.currency,
  })
})
