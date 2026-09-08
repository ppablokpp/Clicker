import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { BENCH_CHESTS, MAX_CHESTS_PER_PULL, isBenchChest } from '../store/chestBench.js'
import { rollCosmetic } from '../store/cosmetics.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const chestsRouter = Router()

// Prices and the material-denominated prize amounts scale with the caller's
// prestige tier, same as every other clicks-priced thing in the store. Keys
// and gems never scale.
chestsRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  const owned = userId
    ? await usersRepository.getOwnedChests(userId)
    : { material: 0, gems: 0, style: 0, styleRare: 0 }
  res.json({
    maxPerPull: MAX_CHESTS_PER_PULL,
    owned,
    chests: Object.fromEntries(
      Object.entries(BENCH_CHESTS).map(([id, chest]) => [
        id,
        {
          kind: chest.kind,
          keyCost: chest.keyCost,
          prizes: (chest.prizes ?? []).map((p) =>
            p.currency === 'gems' ? p : { ...p, amount: p.amount * multiplier },
          ),
        },
      ]),
    ),
  })
})

// What the caller already owns, so the client can grey out a style chest
// whose pool it has emptied instead of letting them press a button that can
// only fail.
chestsRouter.get('/cosmetics', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.json({ owned: [] })
  res.json({ owned: await usersRepository.getOwnedCosmetics(userId) })
})

// One batch, one transaction. The body names which chests to open, in the
// order the client has them on the bench, and the response comes back in that
// same order so each reel lands on its own prize.
chestsRouter.post('/open', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const chests = req.body?.chests
  if (!Array.isArray(chests) || chests.length === 0) {
    return res.status(400).json({ error: 'no-chests' })
  }
  if (chests.length > MAX_CHESTS_PER_PULL) {
    return res.status(400).json({ error: 'too-many-chests' })
  }
  if (!chests.every(isBenchChest)) {
    return res.status(400).json({ error: 'unknown-chest' })
  }

  // Currency prizes are rolled here, before anything is spent — the client
  // never decides a prize, same rule as every other case in the store.
  // Cosmetics can't be rolled yet: their pool depends on what the user owns,
  // which is only safe to read inside the transaction's own lock.
  const plan = chests.map((id) => {
    const chest = BENCH_CHESTS[id]
    return chest.kind === 'currency'
      ? { chest: id, kind: 'currency', keyCost: chest.keyCost, prize: chest.roll() }
      : { chest: id, kind: 'cosmetic', keyCost: chest.keyCost }
  })
  const keyCost = chests.reduce((sum, id) => sum + BENCH_CHESTS[id].keyCost, 0)

  const result = await usersRepository.openChestBatch(userId, keyCost, plan, rollCosmetic)
  if (!result.ok) {
    if (result.reason === 'not-enough-keys') return res.status(400).json({ error: 'not-enough-keys' })
    if (result.reason === 'collection-complete') return res.status(400).json({ error: 'collection-complete' })
    return res.status(400).json({ error: 'open-failed' })
  }

  res.json({
    keys: result.keys,
    ownedStyleChests: result.ownedStyleChests,
    ownedStyleRareChests: result.ownedStyleRareChests,
    ownedChests: await usersRepository.getOwnedChests(userId),
    totalClicks: result.totalClicks,
    gems: result.gems,
    keyCost,
    results: result.results,
  })
})
