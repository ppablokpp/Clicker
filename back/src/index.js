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
import { milestonesRouter } from './routes/milestones.js'
import { tasksRouter } from './routes/tasks.js'
import { eventsRouter } from './routes/events.js'
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
import { treeRouter } from './routes/tree.js'
import { prestigeRouter } from './routes/prestige.js'
import { battlesRouter } from './routes/battles.js'

// Safety net for the whole process, not just one route: Express 4 never
// catches a rejected promise thrown from an `async (req, res) => {...}`
// handler on its own, and Node (15+) terminates the entire process on any
// unhandled rejection by default — one bad query in ANY route (a lot of
// them still have no try/catch of their own; a real gap, but a much
// bigger, separate cleanup than this) was silently taking down every
// other in-flight request too, including totally unrelated ones, until
// `node --watch` happened to pick up an unrelated file save and restart
// it. This is what actually explains "the leaderboard works, then doesn't,
// then does again" — the specific route that failed almost never matters,
// the process dying under it does. Logging and moving on, instead of
// crashing, is strictly better than the previous behavior even though the
// *ideal* fix is still to catch each error at its own route so the
// request that triggered it gets a clean 500 instead of hanging.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (kept process alive)', err)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (kept process alive)', err)
})

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
app.use('/api/milestones', milestonesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/events', eventsRouter)
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
app.use('/api/tree', treeRouter)
app.use('/api/prestige', prestigeRouter)
app.use('/api/battles', battlesRouter)

// Próxima ruta: /api/leaderboard/monthly-winner.

// Fly's proxy expects the app on 0.0.0.0, not just the IPv6/loopback default.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clicker API escuchando en http://localhost:${PORT}`)
})
