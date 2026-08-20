import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { MAGNET_CATALOG, getMagnet } from '../powerups/magnets.js'

export const magnetsRouter = Router()

magnetsRouter.get('/', (_req, res) => {
  res.json(MAGNET_CATALOG)
})

magnetsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const magnet = getMagnet(req.body?.magnetId)
  if (!magnet) return res.status(400).json({ error: 'Unknown magnet' })

  const result = await usersRepository.buyMagnet(userId, magnet.id, magnet.cost, magnet.durationSeconds)
  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return res.status(400).json({ error: 'cooldown', cooldownUntil: result.cooldownUntil })
    }
    return res.status(400).json({ error: 'Not enough clicks' })
  }

  res.json({
    totalClicks: Number(result.total_clicks),
    activeMagnet: {
      id: result.active_magnet,
      expiresAt: result.active_magnet_expires_at,
    },
    cooldownUntil: result.magnet_cooldown_until,
  })
})
