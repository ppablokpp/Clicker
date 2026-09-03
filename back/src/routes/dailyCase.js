import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { CASE_PRIZES, DAILY_CASE_CHEST_COST, DAILY_CASE_KEY_COST, pickWeightedPrize } from '../store/dailyCase.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const dailyCaseRouter = Router()

// Chest cost and the (clicks-denominated) prize amounts scale with the
// caller's prestige tier — same ×5-per-tier rule as the tree — so the
// catalog shown here always matches what /buy-chest and /spin actually
// charge/pay (see usersRepository.buyClickChest/spinDailyCase). Keys stay
// flat, and so does any prize whose currency isn't 'clicks'.
dailyCaseRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json({
    chestCost: DAILY_CASE_CHEST_COST * multiplier,
    keyCost: DAILY_CASE_KEY_COST,
    prizes: CASE_PRIZES.map((p) => (p.currency === 'clicks' ? { ...p, amount: p.amount * multiplier } : p)),
  })
})

// The prize is rolled here, server-side, right before spending the cost —
// the client only finds out what it won from this response, it never
// decides or previews the real result itself.
dailyCaseRouter.post('/spin', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickWeightedPrize()
  const result = await usersRepository.spinDailyCase(userId, DAILY_CASE_KEY_COST, prize)
  if (!result.ok) {
    if (result.reason === 'not-enough-keys') return res.status(400).json({ error: 'not-enough-keys' })
    if (result.reason === 'not-enough-chests') return res.status(400).json({ error: 'not-enough-chests' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({
    totalClicks: result.totalClicks,
    gems: result.gems,
    keys: result.keys,
    ownedChests: result.ownedChests,
    prizeId: prize.id,
    // The real, possibly-scaled amount actually credited (see
    // usersRepository.spinDailyCase) — not the flat, tier-0 `prize.amount`
    // rolled above.
    prizeAmount: result.prizeAmount,
    prizeCurrency: prize.currency,
  })
})

// Buys one click-chest (no cooldown, capped at 10 owned at once) — a
// prerequisite for /spin's key-paid path. The gem-paid path (see
// gemCase.js) skips this entirely.
dailyCaseRouter.post('/buy-chest', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await usersRepository.buyClickChest(userId, DAILY_CASE_CHEST_COST)
  if (!result.ok) {
    if (result.reason === 'not-enough-clicks') return res.status(400).json({ error: 'not-enough-clicks' })
    if (result.reason === 'chest-limit-reached') return res.status(400).json({ error: 'chest-limit-reached' })
    return res.status(400).json({ error: 'purchase-failed' })
  }

  res.json({ totalClicks: result.totalClicks, ownedChests: result.ownedChests })
})
