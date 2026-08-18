import { database } from './pool.js'

export const usersRepository = {
  // Runs once per session (from the sync-on-login call), so the streak math
  // being a bit repetitive in SQL here is fine — it's not on the hot path.
  async upsertFromClerk({ id, email, username, avatarUrl }) {
    const result = await database.query(
      `INSERT INTO users (id, email, username, avatar_url, current_streak, longest_streak, last_active_date)
       VALUES ($1, $2, $3, $4, 1, 1, CURRENT_DATE)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             username = EXCLUDED.username,
             avatar_url = EXCLUDED.avatar_url,
             current_streak = CASE
               WHEN users.last_active_date = CURRENT_DATE THEN users.current_streak
               WHEN users.last_active_date = CURRENT_DATE - 1 THEN users.current_streak + 1
               ELSE 1
             END,
             longest_streak = GREATEST(
               users.longest_streak,
               CASE
                 WHEN users.last_active_date = CURRENT_DATE THEN users.current_streak
                 WHEN users.last_active_date = CURRENT_DATE - 1 THEN users.current_streak + 1
                 ELSE 1
               END
             ),
             last_active_date = CURRENT_DATE,
             updated_at = now()
       RETURNING id, email, username, avatar_url, total_clicks, best_cps, current_streak, longest_streak, created_at`,
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
  async incrementClicks(id, amount, peakCps = 0) {
    const result = await database.query(
      `INSERT INTO users (id, total_clicks, best_cps)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
         SET total_clicks = users.total_clicks + EXCLUDED.total_clicks,
             best_cps = GREATEST(users.best_cps, EXCLUDED.best_cps),
             updated_at = now()
       RETURNING total_clicks, best_cps`,
      [id, amount, peakCps],
    )
    return {
      totalClicks: Number(result.rows[0].total_clicks),
      bestCps: Number(result.rows[0].best_cps),
    }
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
