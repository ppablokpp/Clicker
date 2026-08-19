import { Router } from 'express'
import { usersRepository } from '../db/usersRepository.js'

export const leaderboardRouter = Router()

leaderboardRouter.get('/', async (req, res) => {
  try {
    const sortBy = req.query.sortBy === 'cps' ? 'cps' : 'clicks'
    const leaderboard = await usersRepository.getLeaderboard(100, sortBy)
    res.json(leaderboard)
  } catch (err) {
    console.error('Error fetching leaderboard', err)
    res.status(500).json({ error: 'Error fetching leaderboard' })
  }
})
