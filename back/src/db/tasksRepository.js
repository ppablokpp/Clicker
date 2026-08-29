import { database } from './pool.js'
import { TASKS } from '../tasks/config.js'

// Allowlisted explicitly rather than interpolating task.counterField
// straight into SQL — it only ever comes from our own config today, but a
// column name should never be built from anything less than a fixed list.
const COUNTER_COLUMNS = {
  anomalies_neutralized: 'anomalies_neutralized',
}

export const tasksRepository = {
  async getClaimed(userId) {
    const result = await database.query('SELECT task_id FROM user_task_claims WHERE user_id = $1', [userId])
    return result.rows.map((row) => row.task_id)
  },

  // Progress for every 'counter'-type task's own field, read once and
  // handed to the frontend alongside `claimed` — 'node-level' tasks don't
  // need this, their progress already comes from the tree's own live state.
  async getCounters(userId) {
    const result = await database.query(
      'SELECT anomalies_neutralized FROM users WHERE id = $1',
      [userId],
    )
    const row = result.rows[0]
    return { anomalies_neutralized: Number(row?.anomalies_neutralized ?? 0) }
  },

  // Verifies the task's own completion condition against a freshly locked
  // row (never trusts the client), blocks double-claiming, and credits the
  // reward — same shape as milestonesRepository.claim. Reward counts
  // toward lifetime_platino too, same as every other platino credit (see
  // migration 028) — it's new production, not a spend/refund.
  async claim(userId, taskId) {
    const task = TASKS.find((t) => t.id === taskId)
    if (!task) return { ok: false, reason: 'unknown-task' }

    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      let reached
      if (task.type === 'counter') {
        const column = COUNTER_COLUMNS[task.counterField]
        if (!column) {
          await client.query('ROLLBACK')
          return { ok: false, reason: 'unknown-task' }
        }
        const row = await client.query(`SELECT ${column} FROM users WHERE id = $1 FOR UPDATE`, [userId])
        reached = Number(row.rows[0]?.[column] ?? 0) >= task.requiredCount
      } else {
        const nodeRow = await client.query(
          'SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE',
          [userId, task.nodeId],
        )
        const level = Number(nodeRow.rows[0]?.level ?? 0)
        reached = level >= task.requiredLevel
      }

      if (!reached) {
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
