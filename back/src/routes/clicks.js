import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { usersRepository } from '../db/usersRepository.js'
import { MAGNET_PROC_CHANCE } from '../powerups/magnets.js'

export const clicksRouter = Router()

// Generous headroom: with the higher multipliers now reachable (click
// powerups, permanent + timed luck, milestone bonuses all stacking) and a
// flush that got delayed a few seconds, legitimate bursts add up fast. The
// frontend chunks anything bigger than this into multiple requests, so this
// is purely an anti-abuse ceiling per request, not a hard cap on a session.
const MAX_CLICKS_PER_REQUEST = 5000
const MAX_CPS = 1000

clicksRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const totalClicks = await usersRepository.getTotalClicks(userId)
  res.json({ totalClicks })
})

clicksRouter.post('/increment', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const amount = Number(req.body?.amount)
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_CLICKS_PER_REQUEST) {
    return res.status(400).json({ error: 'Invalid amount' })
  }

  const rawPeakCps = Number(req.body?.peakCps) || 0
  const peakCps = Math.min(Math.max(rawPeakCps, 0), MAX_CPS)

  // The client's own local calendar date, so a user's streak/click-days
  // follow their timezone instead of the DB server's — repository clamps
  // it to within a day of the server date, so a malformed/missing value
  // just falls back to server time rather than erroring the request.
  const rawLocalDate = req.body?.localDate
  const clientDate = typeof rawLocalDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawLocalDate) ? rawLocalDate : null

  // Genuine screen taps only, always <= amount since each tap contributes
  // at least 1 to the (possibly multiplied) amount total — an invalid or
  // missing value falls back to amount rather than erroring the request,
  // for backward compatibility with any client that doesn't send it yet.
  const rawRealClicks = Number(req.body?.realClicks)
  const realClicks =
    Number.isInteger(rawRealClicks) && rawRealClicks >= 0 && rawRealClicks <= amount ? rawRealClicks : amount

  const { totalClicks, keys, gems } = await usersRepository.incrementClicks(
    userId,
    amount,
    peakCps,
    MAGNET_PROC_CHANCE,
    clientDate,
    realClicks,
  )
  res.json({ totalClicks, keys, gems })
})
