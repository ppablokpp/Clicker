import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { database } from './db/pool.js'
import { usersRouter } from './routes/users.js'
import { clicksRouter } from './routes/clicks.js'
import { leaderboardRouter } from './routes/leaderboard.js'
import { powerupsRouter } from './routes/powerups.js'

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

// Próxima ruta: /api/leaderboard/monthly-winner.

// Fly's proxy expects the app on 0.0.0.0, not just the IPv6/loopback default.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clicker API escuchando en http://localhost:${PORT}`)
})
