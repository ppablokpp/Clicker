import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { tasksRepository } from '../db/tasksRepository.js'

export const tasksRouter = Router()

tasksRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const claimed = await tasksRepository.getClaimed(userId)
  res.json({ claimed })
})

tasksRouter.post('/claim', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { taskId } = req.body ?? {}
  if (typeof taskId !== 'string') return res.status(400).json({ error: 'Invalid request' })

  const result = await tasksRepository.claim(userId, taskId)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({ totalClicks: result.totalClicks })
})
