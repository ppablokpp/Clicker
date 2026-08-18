import { database } from './pool.js'

export const permanentUpgradesRepository = {
  async getOwned(userId) {
    const result = await database.query(
      'SELECT upgrade_id FROM user_permanent_upgrades WHERE user_id = $1',
      [userId],
    )
    return result.rows.map((row) => row.upgrade_id)
  },

  // Real transaction: not-already-owned check, the balance deduction, and
  // the ownership row all have to succeed together or not at all.
  async buy(userId, upgradeId, cost) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const owned = await client.query(
        'SELECT 1 FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2',
        [userId, upgradeId],
      )
      if (owned.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-owned' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2, updated_at = now() WHERE id = $1 AND total_clicks >= $2 RETURNING total_clicks',
        [userId, cost],
      )
      if (spent.rowCount === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      await client.query(
        'INSERT INTO user_permanent_upgrades (user_id, upgrade_id) VALUES ($1, $2)',
        [userId, upgradeId],
      )

      await client.query('COMMIT')
      return { ok: true, totalClicks: Number(spent.rows[0].total_clicks) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
