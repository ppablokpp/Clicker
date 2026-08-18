import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { permanentUpgradesRepository } from '../db/permanentUpgradesRepository.js'
import { PERMANENT_UPGRADE_CATALOG, getPermanentUpgrade } from '../powerups/permanentUpgrades.js'

export const upgradesRouter = Router()

upgradesRouter.get('/', (_req, res) => {
  res.json(PERMANENT_UPGRADE_CATALOG)
})

upgradesRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const owned = await permanentUpgradesRepository.getOwned(userId)
  res.json({ owned })
})

upgradesRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const upgrade = getPermanentUpgrade(req.body?.upgradeId)
  if (!upgrade) return res.status(400).json({ error: 'Unknown upgrade' })

  // Tiers unlock small -> large, one at a time.
  const index = PERMANENT_UPGRADE_CATALOG.findIndex((u) => u.id === upgrade.id)
  const requiredPreviousId = index > 0 ? PERMANENT_UPGRADE_CATALOG[index - 1].id : null

  const result = await permanentUpgradesRepository.buy(userId, upgrade.id, upgrade.cost, requiredPreviousId)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({ totalClicks: result.totalClicks })
})
