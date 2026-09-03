import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import {
  GEM_CHEST_CHEST_COST,
  GEM_CHEST_KEY_COST,
  GEM_CHEST_GEM_COST,
  GEM_CHEST_PRIZES,
  pickGemChestPrize,
} from '../store/gemChest.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const gemChestRouter = Router()

// Only chestCost is clicks-denominated (paid to buy the chest itself), so
// only it scales with the caller's prestige tier — the prizes are gems
// through and through, left exactly as defined (see usersRepository's
// openGemChestWithKeys/openGemChestWithGems, which never scale them either).
gemChestRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json({
    chestCost: GEM_CHEST_CHEST_COST * multiplier,
    keyCost: GEM_CHEST_KEY_COST,
    gemCost: GEM_CHEST_GEM_COST,
    prizes: GEM_CHEST_PRIZES,
  })
})

gemChestRouter.post('/open-with-keys', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickGemChestPrize()
  const result = await usersRepository.openGemChestWithKeys(userId, GEM_CHEST_KEY_COST, prize)
  if (!result.ok) {
    if (result.reason === 'not-enough-keys') return res.status(400).json({ error: 'not-enough-keys' })
    if (result.reason === 'not-enough-chests') return res.status(400).json({ error: 'not-enough-chests' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({
    keys: result.keys,
    gems: result.gems,
    ownedChests: result.ownedChests,
    prizeId: prize.id,
    prizeAmount: prize.amount,
  })
})

// Buys one gem-chest (no cooldown, capped at 10 owned at once) — a
// prerequisite for /open-with-keys. /open-with-gems skips this entirely.
gemChestRouter.post('/buy-chest', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await usersRepository.buyGemChest(userId, GEM_CHEST_CHEST_COST)
  if (!result.ok) {
    if (result.reason === 'not-enough-clicks') return res.status(400).json({ error: 'not-enough-clicks' })
    if (result.reason === 'chest-limit-reached') return res.status(400).json({ error: 'chest-limit-reached' })
    return res.status(400).json({ error: 'purchase-failed' })
  }

  res.json({ totalClicks: result.totalClicks, ownedChests: result.ownedChests })
})

gemChestRouter.post('/open-with-gems', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const prize = pickGemChestPrize()
  const result = await usersRepository.openGemChestWithGems(userId, GEM_CHEST_GEM_COST, prize)
  if (!result.ok) {
    if (result.reason === 'not-enough-gems') return res.status(400).json({ error: 'not-enough-gems' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({ gems: result.gems, prizeId: prize.id, prizeAmount: prize.amount })
})
