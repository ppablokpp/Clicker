import { Router } from 'express'
import { usersRepository } from '../db/usersRepository.js'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (_req, res) => {
  try {
    const leaderboard = await usersRepository.getLeaderboard()
    res.json(leaderboard)
  } catch (err) {
    console.error('Error fetching leaderboard', err)
    res.status(500).json({ error: 'Error fetching leaderboard' })
  }
})
