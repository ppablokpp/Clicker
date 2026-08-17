import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Próximas rutas: /api/clicks (registrar/leer clicks), /api/leaderboard,
// /api/leaderboard/monthly-winner, y el webhook de Clerk para sincronizar usuarios.

app.listen(PORT, () => {
  console.log(`Clicker API escuchando en http://localhost:${PORT}`)
})
