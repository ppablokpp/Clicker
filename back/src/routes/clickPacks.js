import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { CLICK_PACKS, getClickPack } from '../store/clickPacks.js'

export const clickPacksRouter = Router()

clickPacksRouter.get('/', (_req, res) => {
  res.json(CLICK_PACKS)
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
