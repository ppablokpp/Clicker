import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { POWERUP_CATALOG, getPowerup } from '../powerups/catalog.js'

export const powerupsRouter = Router()

powerupsRouter.get('/', (_req, res) => {
  res.json(POWERUP_CATALOG)
})

powerupsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.buyPowerup(userId, powerup.id, powerup.cost, powerup.durationSeconds)
  if (!result) return res.status(400).json({ error: 'Not enough clicks' })

  res.json({
    totalClicks: Number(result.total_clicks),
    activePowerup: {
      id: result.active_powerup,
      multiplier: powerup.multiplier,
      expiresAt: result.active_powerup_expires_at,
    },
  })
})
