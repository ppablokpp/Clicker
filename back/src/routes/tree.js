import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { treeRepository } from '../db/treeRepository.js'

export const treeRouter = Router()

treeRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const state = await treeRepository.accrueAndGetState(userId)
  if (!state) return res.status(404).json({ error: 'User not found' })
  res.json(state)
})

treeRouter.post('/auto-click/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyAutoClickLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

// Tutorial-only: grants level 1 of the drone node for free — the repo
// function itself re-checks level === 0 server-side, so this can't be
// abused to double-grant even if called more than once.
treeRouter.post('/auto-click/tutorial-grant', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.grantAutoClickLevelFree(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/luck/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyLuckLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/multiplier/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyMultiplierLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/luck-chance/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyLuckChanceLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/legendary-unlock/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyLegendaryUnlockLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/legendary-ease/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyLegendaryEaseLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/legendary-growth/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyLegendaryGrowthLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/scout-drone/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyScoutDroneLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/scout-frequency/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyScoutFrequencyLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/auto-multiplier/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyAutoMultiplierLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/tap-multiplier/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyTapMultiplierLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/multi-shot/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyMultiShotLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/anomaly-unlock/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyAnomalyUnlockLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/anomaly-reward/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyAnomalyRewardLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/anomaly-frequency/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyAnomalyFrequencyLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})

treeRouter.post('/offline-production/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await treeRepository.buyOfflineProductionLevel(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})
