import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { milestonesRepository } from '../db/milestonesRepository.js'

export const milestonesRouter = Router()

milestonesRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const claimed = await milestonesRepository.getClaimed(userId)
  res.json({ claimed })
})

milestonesRouter.post('/claim', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { categoryKey, milestone } = req.body ?? {}
  if (typeof categoryKey !== 'string' || !Number.isInteger(milestone)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const result = await milestonesRepository.claim(userId, categoryKey, milestone)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({
    totalClicks: result.totalClicks,
    milestoneBonusMultiplier: result.milestoneBonusMultiplier,
    activePowerup: result.activePowerup,
  })
})
