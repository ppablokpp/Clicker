import { database } from './pool.js'
import { EVENT_MIN_INTERVAL_SECONDS } from '../events/config.js'
import { ANOMALY_UNLOCK_NODE_ID } from '../tree/anomalyUnlock.js'
import { ANOMALY_REWARD_NODE_ID, anomalyRewardValue } from '../tree/anomalyReward.js'
import { TRAJECTORY_TIER_THRESHOLDS } from '../game/trajectory.js'

/**
 * Ceiling on one Anomalía payout, as a fraction of the tier's own goal.
 *
 * Extracción pays a percentage of whatever you are holding, which is fine
 * mid-run and absurd right before a prestige: a player sitting on a full
 * tier's worth of material could take a tenth of the next asteroid off a
 * single 15-second minigame. The cap is randomised across a small band so a
 * capped payout still reads as a roll rather than as the same flat number
 * every time you are rich.
 */
const ANOMALY_CAP_MIN_PCT = 0.04
const ANOMALY_CAP_MAX_PCT = 0.05

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
        'SELECT total_clicks, last_event_reward_at, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
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
      // The node's own percentage still decides the payout; the cap only
      // bites when you are holding a large fraction of the tier already.
      const goal = TRAJECTORY_TIER_THRESHOLDS[Number(userRow.rows[0].prestige_tier) + 1]
      const capPct = ANOMALY_CAP_MIN_PCT + Math.random() * (ANOMALY_CAP_MAX_PCT - ANOMALY_CAP_MIN_PCT)
      const cap = goal ? goal * capPct : Infinity
      const reward = Math.floor(Math.min(totalClicks * anomalyRewardValue(anomalyRewardLevel), cap))
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
