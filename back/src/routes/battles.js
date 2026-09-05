import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { battlesRepository } from '../db/battlesRepository.js'
import { BATTLE_WAGER, BATTLE_WAGERS, BATTLE_DURATION_SECONDS, isWagerRung } from '../game/battles.js'

export const battlesRouter = Router()

// `wager` is still here as the default/opening rung — it predates the ladder
// and a client that hasn't shipped the picker yet reads only this one.
battlesRouter.get('/config', (_req, res) => {
  res.json({
    wager: BATTLE_WAGER,
    wagers: BATTLE_WAGERS,
    durationSeconds: BATTLE_DURATION_SECONDS,
  })
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

  // Validated against the ladder, not a range — a wager that isn't one of the
  // rungs is rejected outright rather than clamped, since there's no honest
  // client that could produce one. The per-tier cap is checked further in,
  // inside the transaction, where the challenger's prestige tier is read
  // under the same lock that spends their material.
  const wager = req.body?.wager === undefined ? BATTLE_WAGER : Number(req.body.wager)
  if (!isWagerRung(wager)) return res.status(400).json({ error: 'invalid-wager' })

  const result = await battlesRepository.createChallenge(userId, opponentId, wager)
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
