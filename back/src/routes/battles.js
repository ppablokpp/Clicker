import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { battlesRepository } from '../db/battlesRepository.js'
import { BATTLE_WAGER, BATTLE_DURATION_SECONDS } from '../game/battles.js'

export const battlesRouter = Router()

battlesRouter.get('/config', (_req, res) => {
  res.json({ wager: BATTLE_WAGER, durationSeconds: BATTLE_DURATION_SECONDS })
})

battlesRouter.get('/opponents', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const opponents = await battlesRepository.listOpponents(userId)
  res.json(opponents)
})

battlesRouter.get('/mine', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const battles = await battlesRepository.listMine(userId)
  res.json(battles)
})

battlesRouter.get('/:id', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const battleId = Number(req.params.id)
  if (!Number.isInteger(battleId)) return res.status(400).json({ error: 'invalid battle id' })

  const battle = await battlesRepository.getById(battleId, userId)
  if (!battle) return res.status(404).json({ error: 'not-found' })
  res.json(battle)
})

battlesRouter.post('/challenge', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const opponentId = req.body?.opponentId
  if (typeof opponentId !== 'string' || !opponentId) {
    return res.status(400).json({ error: 'opponentId required' })
  }

  const result = await battlesRepository.createChallenge(userId, opponentId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

battlesRouter.post('/:id/accept', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const battleId = Number(req.params.id)
  if (!Number.isInteger(battleId)) return res.status(400).json({ error: 'invalid battle id' })

  const result = await battlesRepository.acceptChallenge(battleId, userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

battlesRouter.post('/:id/submit', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const battleId = Number(req.params.id)
  if (!Number.isInteger(battleId)) return res.status(400).json({ error: 'invalid battle id' })
  const taps = Number(req.body?.taps)
  if (!Number.isFinite(taps) || taps < 0) return res.status(400).json({ error: 'invalid taps' })

  const result = await battlesRepository.submitScore(battleId, userId, taps)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})
