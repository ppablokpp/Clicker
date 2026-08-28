import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { eventsRepository } from '../db/eventsRepository.js'

export const eventsRouter = Router()

eventsRouter.post('/claim', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await eventsRepository.claimReward(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({ reward: result.reward, totalClicks: result.totalClicks })
})
