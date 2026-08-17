import { Pool, Client } from 'pg'

// Single pool reused across the whole app.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export const database = {
  pool,

  // Get a client from the pool for transactions or multiple queries.
  getClient: async () => {
    const client = await pool.connect()
    const originalRelease = client.release

    client.release = () => {
      client.release = originalRelease
      return client.release()
    }

    return client
  },

  query: (text, params) => pool.query(text, params),

  createStandaloneClient: () => {
    return new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  },
}
