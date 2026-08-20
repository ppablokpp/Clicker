import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { database } from './db/pool.js'
import { usersRouter } from './routes/users.js'
import { clicksRouter } from './routes/clicks.js'
import { leaderboardRouter } from './routes/leaderboard.js'
import { powerupsRouter } from './routes/powerups.js'
import { timedLuckPowerupsRouter } from './routes/timedLuckPowerups.js'
import { magnetsRouter } from './routes/magnets.js'
import { upgradesRouter } from './routes/upgrades.js'
import { milestonesRouter } from './routes/milestones.js'
import { dailyCaseRouter } from './routes/dailyCase.js'
import { dailyKeyRouter } from './routes/dailyKey.js'
import { moneyCaseRouter } from './routes/moneyCase.js'
import { gemCaseRouter } from './routes/gemCase.js'
import { gemChestRouter } from './routes/gemChest.js'
import { moneyUpgradesRouter } from './routes/moneyUpgrades.js'
import { gemUpgradesRouter } from './routes/gemUpgrades.js'
import { clickPacksRouter } from './routes/clickPacks.js'
import { keyPacksRouter } from './routes/keyPacks.js'
import { gemPacksRouter } from './routes/gemPacks.js'

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
]

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(clerkMiddleware())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/health/db', async (_req, res) => {
  try {
    const result = await database.query('SELECT NOW()')
    res.json({ status: 'ok', serverTime: result.rows[0].now })
  } catch (err) {
    console.error('DB health check failed', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.use('/api/users', usersRouter)
app.use('/api/clicks', clicksRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/powerups', powerupsRouter)
app.use('/api/timed-luck-powerups', timedLuckPowerupsRouter)
app.use('/api/magnets', magnetsRouter)
app.use('/api/upgrades', upgradesRouter)
app.use('/api/milestones', milestonesRouter)
app.use('/api/daily-case', dailyCaseRouter)
app.use('/api/daily-key', dailyKeyRouter)
app.use('/api/money-case', moneyCaseRouter)
app.use('/api/gem-case', gemCaseRouter)
app.use('/api/gem-chest', gemChestRouter)
app.use('/api/money-upgrades', moneyUpgradesRouter)
app.use('/api/gem-upgrades', gemUpgradesRouter)
app.use('/api/click-packs', clickPacksRouter)
app.use('/api/key-packs', keyPacksRouter)
app.use('/api/gem-packs', gemPacksRouter)

// Próxima ruta: /api/leaderboard/monthly-winner.

// Fly's proxy expects the app on 0.0.0.0, not just the IPv6/loopback default.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clicker API escuchando en http://localhost:${PORT}`)
})
