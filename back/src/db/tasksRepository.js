import { database } from './pool.js'
import { TASKS } from '../tasks/config.js'

export const tasksRepository = {
  async getClaimed(userId) {
    const result = await database.query('SELECT task_id FROM user_task_claims WHERE user_id = $1', [userId])
    return result.rows.map((row) => row.task_id)
  },

  // Verifies the task's own tree-node level against a freshly locked row
  // (never trusts the client), blocks double-claiming, and credits the
  // reward — same shape as milestonesRepository.claim. Reward counts
  // toward lifetime_platino too, same as every other platino credit (see
  // migration 028) — it's new production, not a spend/refund.
  async claim(userId, taskId) {
    const task = TASKS.find((t) => t.id === taskId)
    if (!task) return { ok: false, reason: 'unknown-task' }

    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const nodeRow = await client.query(
        'SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE',
        [userId, task.nodeId],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      if (level < task.requiredLevel) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-reached' }
      }

      const claimed = await client.query(
        'SELECT 1 FROM user_task_claims WHERE user_id = $1 AND task_id = $2',
        [userId, taskId],
      )
      if (claimed.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-claimed' }
      }

      const updated = await client.query(
        `UPDATE users SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2, updated_at = now()
         WHERE id = $1
         RETURNING total_clicks`,
        [userId, task.reward],
      )

      await client.query('INSERT INTO user_task_claims (user_id, task_id) VALUES ($1, $2)', [userId, taskId])

      await client.query('COMMIT')
      return { ok: true, totalClicks: Number(updated.rows[0].total_clicks) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
