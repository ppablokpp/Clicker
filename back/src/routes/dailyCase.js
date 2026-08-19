import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { CASE_PRIZES, DAILY_CASE_COST, pickWeightedPrize } from '../store/dailyCase.js'

export const dailyCaseRouter = Router()

dailyCaseRouter.get('/', (_req, res) => {
  res.json({ cost: DAILY_CASE_COST, prizes: CASE_PRIZES })
})

// The prize is rolled here, server-side, right before spending the cost —
// the client only finds out what it won from this response, it never
// decides or previews the real result itself.
dailyCaseRouter.post('/spin', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickWeightedPrize()
  const result = await usersRepository.spinDailyCase(userId, DAILY_CASE_COST, prize.amount)
  if (!result.ok) {
    if (result.reason === 'cooldown') return res.status(400).json({ error: 'cooldown' })
    return res.status(400).json({ error: 'Not enough clicks' })
  }

  res.json({ totalClicks: result.totalClicks, prizeId: prize.id, prizeAmount: prize.amount })
})
