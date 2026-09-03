import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { MAGNET_PROC_CHANCE } from '../powerups/magnets.js'

export const clicksRouter = Router()

// Generous headroom: with the higher multipliers now reachable (click
// powerups, permanent + timed luck, milestone bonuses all stacking) and a
// flush that got delayed a few seconds, legitimate bursts add up fast. The
// frontend chunks anything bigger than this into multiple requests, so this
// is purely an anti-abuse ceiling per request, not a hard cap on a session.
// Was 5000, sized for the old 1s flush cadence — scaled up 30x to match the
// client's own flush interval going from 1s to 30s (see useClickCounter.ts),
// so a normal active session at high multipliers still fits in a single
// chunk instead of routinely needing several back to back.
const MAX_CLICKS_PER_REQUEST = 150_000
const MAX_CPS = 1000

clicksRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const state = await usersRepository.getClickState(userId)
  res.json(state)
})

clicksRouter.post('/increment', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // Whole number today, but not guaranteed forever — a future click-value
  // upgrade (e.g. a x1.5 multiplier) can make this fractional, so only
  // finiteness/range is enforced here, not integer-ness. total_clicks
  // itself stores the fraction (see migration 022); only what's ever
  // *displayed* has to be a whole number, and that's a front-end concern.
  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount < 1 || amount > MAX_CLICKS_PER_REQUEST) {
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

  // How many of those real taps actually rolled a Destello (see Home.tsx's
  // isLucky) — always <= realClicks for the same reason realClicks <=
  // amount above; an invalid/missing value just falls back to 0 rather than
  // erroring, for the same backward-compatibility reason.
  const rawLuckyHits = Number(req.body?.luckyHits)
  const luckyHits =
    Number.isInteger(rawLuckyHits) && rawLuckyHits >= 0 && rawLuckyHits <= realClicks ? rawLuckyHits : 0

  const { totalClicks, lifetimePlatino, keys, gems, objectsBroken, objectProgress, luckyClicksFound } =
    await usersRepository.incrementClicks(userId, amount, peakCps, MAGNET_PROC_CHANCE, clientDate, realClicks, luckyHits)
  res.json({ totalClicks, lifetimePlatino, keys, gems, objectsBroken, objectProgress, luckyClicksFound })
})

// Trayectoria's manual prestige confirm — advances prestige_tier by one and
// zeroes total_clicks, but only once lifetime_platino has actually cleared
// the next tier's own threshold (re-checked server-side, never trusting the
// client's own idea of eligibility).
clicksRouter.post('/prestige', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const result = await usersRepository.confirmPrestige(userId)
  if (!result.ok) return res.status(400).json({ error: result.reason })
  res.json(result)
})
