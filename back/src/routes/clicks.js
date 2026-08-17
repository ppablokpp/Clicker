import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'

export const clicksRouter = Router()

const MAX_CLICKS_PER_REQUEST = 500

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

  const totalClicks = await usersRepository.incrementClicks(userId, amount)
  res.json({ totalClicks })
})
