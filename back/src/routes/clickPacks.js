import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { CLICK_PACKS, getClickPack } from '../store/clickPacks.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

export const clickPacksRouter = Router()

// gemCost is left as-is; the clicks side scales with the caller's prestige
// tier (see usersRepository.buyClickPack, which does the same at purchase
// time) so the catalog always shows what a pack will actually pay out.
clickPacksRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const multiplier = userId ? prestigeTierMultiplier(await usersRepository.getPrestigeTier(userId)) : 1
  res.json(CLICK_PACKS.map((p) => ({ ...p, clicks: p.clicks * multiplier })))
})

clickPacksRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const pack = getClickPack(req.body?.packId)
  if (!pack) return res.status(400).json({ error: 'Unknown pack' })

  const result = await usersRepository.buyClickPack(userId, pack)
  if (!result.ok) {
    if (result.reason === 'not-enough-gems') return res.status(400).json({ error: 'not-enough-gems' })
    return res.status(400).json({ error: 'buy-failed' })
  }

  res.json({ totalClicks: result.totalClicks, gems: result.gems })
})
