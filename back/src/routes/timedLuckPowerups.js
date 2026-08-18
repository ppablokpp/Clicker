import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { TIMED_LUCK_CATALOG, getTimedLuckPowerup } from '../powerups/timedLuckPowerups.js'

export const timedLuckPowerupsRouter = Router()

timedLuckPowerupsRouter.get('/', (_req, res) => {
  res.json(TIMED_LUCK_CATALOG)
})

timedLuckPowerupsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getTimedLuckPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.buyTimedLuckPowerup(
    userId,
    powerup.id,
    powerup.cost,
    powerup.durationSeconds,
  )
  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return res.status(400).json({ error: 'cooldown', cooldownUntil: result.cooldownUntil })
    }
    return res.status(400).json({ error: 'Not enough clicks' })
  }

  res.json({
    totalClicks: Number(result.total_clicks),
    activeLuckPowerup: {
      id: result.active_luck_powerup,
      chance: powerup.chance,
      multiplier: powerup.multiplier,
      expiresAt: result.active_luck_powerup_expires_at,
    },
    cooldownUntil: result.luck_powerup_cooldown_until,
  })
})
