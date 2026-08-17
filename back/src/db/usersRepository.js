import { database } from './pool.js'

export const usersRepository = {
  async upsertFromClerk({ id, email, username, avatarUrl }) {
    const result = await database.query(
      `INSERT INTO users (id, email, username, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             username = EXCLUDED.username,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = now()
       RETURNING id, email, username, avatar_url, total_clicks, created_at`,
      [id, email, username, avatarUrl],
    )
    return result.rows[0]
  },

  async getById(id) {
    const result = await database.query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0] ?? null
  },

  async getTotalClicks(id) {
    const result = await database.query('SELECT total_clicks FROM users WHERE id = $1', [id])
    return Number(result.rows[0]?.total_clicks ?? 0)
  },

  // Upserts on the id alone (no email/username yet) so an increment that races
  // ahead of the Clerk profile sync never loses clicks.
  async incrementClicks(id, amount) {
    const result = await database.query(
      `INSERT INTO users (id, total_clicks)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE
         SET total_clicks = users.total_clicks + EXCLUDED.total_clicks,
             updated_at = now()
       RETURNING total_clicks`,
      [id, amount],
    )
    return Number(result.rows[0].total_clicks)
  },

  async getLeaderboard(limit = 100) {
    const result = await database.query(
      `SELECT id, username, avatar_url, total_clicks
       FROM users
       WHERE total_clicks > 0
       ORDER BY total_clicks DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalClicks: Number(row.total_clicks),
    }))
  },
}
