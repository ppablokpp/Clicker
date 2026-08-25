import { database } from './pool.js'
import { STAT_CATEGORIES, MILESTONE_REWARD_TIERS, getMilestoneTierIndex } from '../stats/config.js'
import { getPowerup } from '../powerups/catalog.js'

export const milestonesRepository = {
  async getClaimed(userId) {
    const result = await database.query(
      'SELECT category_key, milestone FROM user_milestone_claims WHERE user_id = $1',
      [userId],
    )
    return result.rows.map((row) => `${row.category_key}:${row.milestone}`)
  },

  // Verifies the stat threshold against a freshly locked row (never trusts
  // the client's own numbers), blocks double-claiming, and applies the
  // reward — all inside one transaction.
  async claim(userId, categoryKey, milestone) {
    const category = STAT_CATEGORIES[categoryKey]
    const tierIndex = getMilestoneTierIndex(categoryKey, milestone)
    if (!category || tierIndex === -1) {
      return { ok: false, reason: 'unknown-milestone' }
    }
    const reward = MILESTONE_REWARD_TIERS[tierIndex]

    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userResult = await client.query(
        `SELECT total_clicks, best_cps, longest_streak, milestone_bonus_multiplier
         FROM users WHERE id = $1 FOR UPDATE`,
        [userId],
      )
      const user = userResult.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const statValue = Number(user[category.statColumn])
      if (statValue < milestone) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-reached' }
      }

      const claimed = await client.query(
        'SELECT 1 FROM user_milestone_claims WHERE user_id = $1 AND category_key = $2 AND milestone = $3',
        [userId, categoryKey, milestone],
      )
      if (claimed.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-claimed' }
      }

      let updateResult
      if (reward.type === 'powerup') {
        const powerup = getPowerup(reward.powerupId)
        updateResult = await client.query(
          `UPDATE users
           SET active_powerup = $2,
               active_powerup_expires_at = now() + make_interval(secs => $3),
               updated_at = now()
           WHERE id = $1
           RETURNING total_clicks, active_powerup, active_powerup_expires_at, milestone_bonus_multiplier`,
          [userId, powerup.id, powerup.durationSeconds],
        )
      } else if (reward.type === 'clicks') {
        updateResult = await client.query(
          `UPDATE users
           SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2, updated_at = now()
           WHERE id = $1
           RETURNING total_clicks, active_powerup, active_powerup_expires_at, milestone_bonus_multiplier`,
          [userId, reward.amount],
        )
      } else {
        updateResult = await client.query(
          `UPDATE users
           SET milestone_bonus_multiplier = milestone_bonus_multiplier + $2, updated_at = now()
           WHERE id = $1
           RETURNING total_clicks, active_powerup, active_powerup_expires_at, milestone_bonus_multiplier`,
          [userId, reward.amount],
        )
      }

      await client.query(
        'INSERT INTO user_milestone_claims (user_id, category_key, milestone) VALUES ($1, $2, $3)',
        [userId, categoryKey, milestone],
      )

      await client.query('COMMIT')

      const row = updateResult.rows[0]
      return {
        ok: true,
        reward,
        totalClicks: Number(row.total_clicks),
        milestoneBonusMultiplier: Number(row.milestone_bonus_multiplier),
        activePowerup:
          reward.type === 'powerup'
            ? {
                id: row.active_powerup,
                multiplier: getPowerup(row.active_powerup)?.multiplier ?? 1,
                expiresAt: row.active_powerup_expires_at,
              }
            : null,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
