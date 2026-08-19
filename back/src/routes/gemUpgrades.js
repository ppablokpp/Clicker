import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { permanentUpgradesRepository } from '../db/permanentUpgradesRepository.js'
import { MONEY_UPGRADE_CATALOG, getMoneyUpgrade } from '../powerups/moneyUpgrades.js'

export const gemUpgradesRouter = Router()

gemUpgradesRouter.get('/', (_req, res) => {
  res.json(MONEY_UPGRADE_CATALOG)
})

gemUpgradesRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const owned = await permanentUpgradesRepository.getOwned(userId)
  res.json({ owned })
})

// No RevenueCat involved — same sequential-tier gem spend as gem-case,
// reusing the same user_permanent_upgrades table the (now unused)
// RevenueCat version wrote to.
gemUpgradesRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const upgrade = getMoneyUpgrade(req.body?.upgradeId)
  if (!upgrade) return res.status(400).json({ error: 'Unknown upgrade' })

  const index = MONEY_UPGRADE_CATALOG.findIndex((u) => u.id === upgrade.id)
  const requiredPreviousId = index > 0 ? MONEY_UPGRADE_CATALOG[index - 1].id : null

  const result = await permanentUpgradesRepository.buyWithGems(userId, upgrade.id, upgrade.cost, requiredPreviousId)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({ gems: result.gems })
})
