import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { TIMED_LUCK_CATALOG, getTimedLuckPowerup } from '../powerups/timedLuckPowerups.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const timedLuckPowerupsRouter = Router()

// Only the clicks-priced tiers scale with the caller's prestige tier (see
// usersRepository.buyTimedLuckPowerup, which applies the same rule at
// purchase time) — the gem-priced tiers are left exactly as defined.
timedLuckPowerupsRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json(TIMED_LUCK_CATALOG.map((p) => (p.currency === 'gems' ? p : { ...p, cost: p.cost * multiplier })))
})

// Buying just adds one to the owned count — see /activate for what starts
// the timer.
timedLuckPowerupsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getTimedLuckPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.buyTimedLuckPowerup(userId, powerup.id, powerup.cost, powerup.currency)
  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return res.status(400).json({ error: 'cooldown', cooldownUntil: result.cooldownUntil })
    }
    if (result.reason === 'not-enough-gems') {
      return res.status(400).json({ error: 'Not enough gems' })
    }
    return res.status(400).json({ error: 'Not enough clicks' })
  }

  res.json({
    totalClicks: Number(result.total_clicks),
    gems: Number(result.gems),
    cooldownUntil: result.luck_powerup_cooldown_until,
  })
})

// Consumes one owned unit and actually starts it running.
timedLuckPowerupsRouter.post('/activate', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getTimedLuckPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.activateTimedLuckPowerup(userId, powerup.id, powerup.durationSeconds)
  if (!result.ok) {
    if (result.reason === 'already-active') return res.status(400).json({ error: 'already-active' })
    if (result.reason === 'not-owned') return res.status(400).json({ error: 'not-owned' })
    return res.status(400).json({ error: 'activate-failed' })
  }

  res.json({
    activeLuckPowerup: {
      id: result.active_luck_powerup,
      chance: powerup.chance,
      multiplier: powerup.multiplier,
      expiresAt: result.active_luck_powerup_expires_at,
    },
  })
})
