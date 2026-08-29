import { database } from './pool.js'
import { EVENT_MIN_INTERVAL_SECONDS } from '../events/config.js'
import { ANOMALY_UNLOCK_NODE_ID } from '../tree/anomalyUnlock.js'
import { ANOMALY_REWARD_NODE_ID, anomalyRewardValue } from '../tree/anomalyReward.js'

export const eventsRepository = {
  // Pays out anomalyRewardValue(level) of whatever total_clicks is *right
  // now* — the player's current, spendable material, not lifetime_platino
  // (which never resets and shouldn't be inflated by a repeatable mini-
  // event). Gated by last_event_reward_at instead of trusting the client's
  // own "I finished the challenge" claim, since there's no way to verify
  // 100 real taps happened in 15s without a per-tap round trip. Also
  // requires Anomalías itself owned — the client already won't spawn the
  // event without it, but the client is never trusted for a payout.
  async claimReward(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query(
        'SELECT total_clicks, last_event_reward_at FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const anomalyUnlockRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, ANOMALY_UNLOCK_NODE_ID],
      )
      if (Number(anomalyUnlockRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-unlocked' }
      }

      const lastAt = userRow.rows[0].last_event_reward_at
      if (lastAt) {
        const secondsSince = (Date.now() - new Date(lastAt).getTime()) / 1000
        if (secondsSince < EVENT_MIN_INTERVAL_SECONDS) {
          await client.query('ROLLBACK')
          return { ok: false, reason: 'too-soon' }
        }
      }

      const anomalyRewardRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, ANOMALY_REWARD_NODE_ID],
      )
      const anomalyRewardLevel = Number(anomalyRewardRow.rows[0]?.level ?? 0)

      const totalClicks = Number(userRow.rows[0].total_clicks)
      const reward = Math.floor(totalClicks * anomalyRewardValue(anomalyRewardLevel))
      if (reward <= 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'nothing-to-reward' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2,
             last_event_reward_at = now(), anomalies_neutralized = anomalies_neutralized + 1, updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, anomalies_neutralized`,
        [userId, reward],
      )

      await client.query('COMMIT')
      return {
        ok: true,
        reward,
        totalClicks: Number(updated.rows[0].total_clicks),
        anomaliesNeutralized: Number(updated.rows[0].anomalies_neutralized),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
