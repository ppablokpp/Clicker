import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { CLICK_PACKS, clickPackAmount, getClickPack } from '../store/clickPacks.js'

export const clickPacksRouter = Router()

// gemCost is left as-is; the clicks side is a slice of the caller's tier
// goal (see clickPackAmount — usersRepository.buyClickPack does the same at
// purchase time) so the catalog always shows what a pack will actually pay
// out. A guest is priced as Amatista.
clickPacksRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req)
  const tier = userId ? await usersRepository.getPrestigeTier(userId) : 0
  res.json(CLICK_PACKS.map((p) => ({ id: p.id, gemCost: p.gemCost, clicks: clickPackAmount(p, tier) })))
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
