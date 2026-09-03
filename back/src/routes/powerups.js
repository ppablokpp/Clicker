import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { POWERUP_CATALOG, getPowerup } from '../powerups/catalog.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const powerupsRouter = Router()

// Only the clicks-priced tiers scale with the caller's prestige tier (see
// usersRepository.buyPowerup, which applies the same rule at purchase time)
// — the gem-priced tiers are left exactly as defined.
powerupsRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json(POWERUP_CATALOG.map((p) => (p.currency === 'gems' ? p : { ...p, cost: p.cost * multiplier })))
})

// Buying just adds one to the owned count — see /activate for what starts
// the timer.
powerupsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.buyPowerup(userId, powerup.id, powerup.cost, powerup.currency)
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
    cooldownUntil: result.powerup_cooldown_until,
  })
})

// Consumes one owned unit and actually starts it running.
powerupsRouter.post('/activate', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const powerup = getPowerup(req.body?.powerupId)
  if (!powerup) return res.status(400).json({ error: 'Unknown powerup' })

  const result = await usersRepository.activatePowerup(userId, powerup.id, powerup.durationSeconds)
  if (!result.ok) {
    if (result.reason === 'already-active') return res.status(400).json({ error: 'already-active' })
    if (result.reason === 'not-owned') return res.status(400).json({ error: 'not-owned' })
    return res.status(400).json({ error: 'activate-failed' })
  }

  res.json({
    activePowerup: {
      id: result.active_powerup,
      multiplier: powerup.multiplier,
      expiresAt: result.active_powerup_expires_at,
    },
  })
})
