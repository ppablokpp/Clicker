import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { permanentUpgradesRepository } from '../db/permanentUpgradesRepository.js'
import { FLEET_UPGRADE_CATALOG, getFleetUpgrade } from '../powerups/fleetUpgrades.js'

export const fleetUpgradesRouter = Router()

fleetUpgradesRouter.get('/', (_req, res) => {
  res.json(FLEET_UPGRADE_CATALOG)
})

// Deliberately no /me: both cores live in the same user_permanent_upgrades
// table, so /api/gem-upgrades/me already returns every owned id and the
// client picks out whichever ladder it is drawing.

// Same sequential gem spend as the gem core, sharing its repository — the
// two ladders differ only in what they multiply.
fleetUpgradesRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const upgrade = getFleetUpgrade(req.body?.upgradeId)
  if (!upgrade) return res.status(400).json({ error: 'Unknown upgrade' })

  const index = FLEET_UPGRADE_CATALOG.findIndex((u) => u.id === upgrade.id)
  const requiredPreviousId = index > 0 ? FLEET_UPGRADE_CATALOG[index - 1].id : null

  const result = await permanentUpgradesRepository.buyWithGems(userId, upgrade.id, upgrade.cost, requiredPreviousId)
  if (!result.ok) return res.status(400).json({ error: result.reason })

  res.json({ gems: result.gems })
})
