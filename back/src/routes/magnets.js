import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { MAGNET_CATALOG, getMagnet } from '../powerups/magnets.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const magnetsRouter = Router()

// `currency` here is what a magnet's proc pays out (keys/gems), not what it
// costs — magnets are always bought with clicks (see usersRepository.
// buyMagnet), so cost always scales with the caller's prestige tier.
magnetsRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json(MAGNET_CATALOG.map((m) => ({ ...m, cost: m.cost * multiplier })))
})

// Buying just adds one to the owned count — see /activate for what starts
// the timer.
magnetsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const magnet = getMagnet(req.body?.magnetId)
  if (!magnet) return res.status(400).json({ error: 'Unknown magnet' })

  const result = await usersRepository.buyMagnet(userId, magnet.id, magnet.cost)
  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return res.status(400).json({ error: 'cooldown', cooldownUntil: result.cooldownUntil })
    }
    return res.status(400).json({ error: 'Not enough clicks' })
  }

  res.json({ totalClicks: Number(result.total_clicks), cooldownUntil: result.magnet_cooldown_until })
})

// Consumes one owned unit and actually starts it running.
magnetsRouter.post('/activate', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const magnet = getMagnet(req.body?.magnetId)
  if (!magnet) return res.status(400).json({ error: 'Unknown magnet' })

  const result = await usersRepository.activateMagnet(userId, magnet.id, magnet.durationSeconds)
  if (!result.ok) {
    if (result.reason === 'already-active') return res.status(400).json({ error: 'already-active' })
    if (result.reason === 'not-owned') return res.status(400).json({ error: 'not-owned' })
    return res.status(400).json({ error: 'activate-failed' })
  }

  res.json({
    activeMagnet: {
      id: result.active_magnet,
      currency: magnet.currency,
      expiresAt: result.active_magnet_expires_at,
    },
  })
})
