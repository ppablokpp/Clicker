import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { prestigeRepository } from '../db/prestigeRepository.js'

export const prestigeRouter = Router()

prestigeRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const state = await prestigeRepository.getState(userId)
  if (!state) return res.status(404).json({ error: 'User not found' })
  res.json(state)
})

prestigeRouter.post('/reset', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await prestigeRepository.reset(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

prestigeRouter.post('/reactor/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await prestigeRepository.buyReactorLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})
