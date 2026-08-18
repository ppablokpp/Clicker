import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'

export const clicksRouter = Router()

// Generous headroom: with a x5 powerup stacked on the x2 speed combo (x10)
// and a flush that got delayed a few seconds, legitimate bursts add up fast.
const MAX_CLICKS_PER_REQUEST = 2000
const MAX_CPS = 1000

clicksRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const totalClicks = await usersRepository.getTotalClicks(userId)
  res.json({ totalClicks })
})

clicksRouter.post('/increment', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const amount = Number(req.body?.amount)
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_CLICKS_PER_REQUEST) {
    return res.status(400).json({ error: 'Invalid amount' })
  }

  const rawPeakCps = Number(req.body?.peakCps) || 0
  const peakCps = Math.min(Math.max(rawPeakCps, 0), MAX_CPS)

  const { totalClicks } = await usersRepository.incrementClicks(userId, amount, peakCps)
  res.json({ totalClicks })
})
