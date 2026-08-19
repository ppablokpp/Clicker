import { Router } from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { getPowerup } from '../powerups/catalog.js'
import { getTimedLuckPowerup } from '../powerups/timedLuckPowerups.js'

export const usersRouter = Router()

function toPublicUser(row) {
  const isPowerupActive =
    row.active_powerup && row.active_powerup_expires_at && new Date(row.active_powerup_expires_at) > new Date()
  const isLuckPowerupActive =
    row.active_luck_powerup &&
    row.active_luck_powerup_expires_at &&
    new Date(row.active_luck_powerup_expires_at) > new Date()
  const isPowerupOnCooldown =
    row.powerup_cooldown_until && new Date(row.powerup_cooldown_until) > new Date()
  const isLuckPowerupOnCooldown =
    row.luck_powerup_cooldown_until && new Date(row.luck_powerup_cooldown_until) > new Date()

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
    totalClicks: Number(row.total_clicks),
    bestCps: Number(row.best_cps),
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    casesOpened: Number(row.cases_opened ?? 0),
    milestoneBonusMultiplier: Number(row.milestone_bonus_multiplier ?? 1),
    activePowerup: isPowerupActive
      ? {
          id: row.active_powerup,
          multiplier: getPowerup(row.active_powerup)?.multiplier ?? 1,
          expiresAt: row.active_powerup_expires_at,
        }
      : null,
    activeLuckPowerup: isLuckPowerupActive
      ? {
          id: row.active_luck_powerup,
          chance: getTimedLuckPowerup(row.active_luck_powerup)?.chance ?? 0,
          multiplier: getTimedLuckPowerup(row.active_luck_powerup)?.multiplier ?? 1,
          expiresAt: row.active_luck_powerup_expires_at,
        }
      : null,
    powerupCooldownUntil: isPowerupOnCooldown ? row.powerup_cooldown_until : null,
    luckPowerupCooldownUntil: isLuckPowerupOnCooldown ? row.luck_powerup_cooldown_until : null,
    dailyCaseAvailable: !row.spun_case_today,
  }
}

// Called once from the frontend right after a successful Clerk sign-in.
// Mirrors the Clerk user into our own `users` table, keyed by the Clerk id,
// and bumps the daily streak (see usersRepository.upsertFromClerk).
usersRouter.post('/sync', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId)
    const user = await usersRepository.upsertFromClerk({
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      username: clerkUser.username ?? clerkUser.firstName ?? null,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    res.json(toPublicUser(user))
  } catch (err) {
    console.error('Error syncing user', err)
    res.status(500).json({ error: 'Error syncing user' })
  }
})

usersRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await usersRepository.getById(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(toPublicUser(user))
})
