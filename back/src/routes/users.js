import { Router } from 'express'
import { getAuth, clerkClient } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { getPowerup } from '../powerups/catalog.js'
import { getTimedLuckPowerup } from '../powerups/timedLuckPowerups.js'
import { getMagnet } from '../powerups/magnets.js'

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
  const isMagnetActive =
    row.active_magnet && row.active_magnet_expires_at && new Date(row.active_magnet_expires_at) > new Date()
  const isMagnetOnCooldown =
    row.magnet_cooldown_until && new Date(row.magnet_cooldown_until) > new Date()

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
    totalClicks: Number(row.total_clicks),
    totalRealClicks: Number(row.total_real_clicks ?? 0),
    gems: Number(row.gems ?? 0),
    keys: Number(row.keys ?? 0),
    ownedClickChests: Number(row.owned_click_chests ?? 0),
    ownedGemChests: Number(row.owned_gem_chests ?? 0),
    keyClaimedToday: Boolean(row.key_claimed_today),
    bestCps: Number(row.best_cps),
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    casesOpened: Number(row.cases_opened ?? 0),
    milestoneBonusMultiplier: Number(row.milestone_bonus_multiplier ?? 1),
    tutorialCompleted: Boolean(row.tutorial_completed),
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
    activeMagnet: isMagnetActive
      ? {
          id: row.active_magnet,
          currency: getMagnet(row.active_magnet)?.currency ?? 'keys',
          expiresAt: row.active_magnet_expires_at,
        }
      : null,
    magnetCooldownUntil: isMagnetOnCooldown ? row.magnet_cooldown_until : null,
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

// Called once the onboarding tutorial finishes (or is skipped) — also
// re-fired every time it's manually replayed via the "?" button, which is
// harmless since it's just re-setting the same flag to true.
usersRouter.post('/tutorial-complete', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  await usersRepository.markTutorialCompleted(userId)
  res.json({ ok: true })
})

// Powers the stats-page calendar strip — every day the user clicked at
// least once.
usersRouter.get('/me/click-days', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const clickDays = await usersRepository.getClickDays(userId)
  res.json({ clickDays })
})

// Powers the Inventory modal — owned-but-not-yet-activated powerups/luck/
// magnets, as {itemId: quantity}. Names/costs/durations come from each
// catalog (already fetched separately), this is just the counts.
usersRouter.get('/me/inventory', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const inventory = await usersRepository.getInventory(userId)
  res.json({ inventory })
})
