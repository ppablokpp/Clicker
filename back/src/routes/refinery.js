import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { refineryRepository } from '../db/refineryRepository.js'

export const refineryRouter = Router()

// The current tier's core. Reading it also finishes a repair whose time is
// up — see refineryRepository.settle — so this is what the front calls when
// its countdown ends.
refineryRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const state = await refineryRepository.getState(userId)
  if (!state) return res.status(404).json({ error: 'User not found' })
  res.json(state)
})

// Start smelting the next small core. Spends mineral, like a tree buy.
refineryRouter.post('/start', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await refineryRepository.start(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

// Finish the smelt under way for gems.
refineryRouter.post('/finish', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await refineryRepository.finish(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})
