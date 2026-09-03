import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'

export const dailyKeyRouter = Router()

dailyKeyRouter.post('/claim', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await usersRepository.claimDailyKey(userId)
  if (!result.ok) {
    if (result.reason === 'already-claimed') return res.status(400).json({ error: 'already-claimed' })
    return res.status(400).json({ error: 'claim-failed' })
  }

  res.json({ keys: result.keys })
})
