import { database } from './pool.js'
import { PRESTIGE_REACTOR_NODE_ID, prestigeReactorCost, prestigeReactorValue } from '../game/prestige.js'
import { accrueProduction } from './treeRepository.js'

export const prestigeRepository = {
  // Powers the initial sync — current lifetime points plus the Reactor's
  // level/value/cost, same shape a tree-node read would have.
  async getState(userId) {
    const userRow = await database.query('SELECT prestige_points FROM users WHERE id = $1', [userId])
    if (!userRow.rows[0]) return null
    const nodeRow = await database.query(
      `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
      [userId, PRESTIGE_REACTOR_NODE_ID],
    )
    const reactorLevel = Number(nodeRow.rows[0]?.level ?? 0)
    return {
      prestigePoints: Number(userRow.rows[0].prestige_points),
      reactorLevel,
      reactorValue: prestigeReactorValue(reactorLevel),
      reactorNextCost: prestigeReactorCost(reactorLevel),
    }
  },

  // The actual reset: banks 1 prestige point per space object broken this
  // run, zeroes platino and every regular tree level, and leaves prestige
  // points/upgrades untouched (they live outside user_permanent_upgrades
  // entirely — see migration 026). Refuses to fire on 0 objects broken so
  // an accidental double-tap can't zero out a run for nothing.
  async reset(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      // objects_broken only advances when this runs (see
      // treeRepository.js's accrueProduction) — force it first so an object
      // that just broke from unflushed drone production doesn't wrongly
      // read as "nothing to prestige".
      const accrued = await accrueProduction(client, userId)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const pointsEarned = accrued.objectsBroken
      if (pointsEarned <= 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'nothing-to-prestige' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = 0, objects_broken = 0, object_progress = 0,
             prestige_points = prestige_points + $2
         WHERE id = $1
         RETURNING prestige_points`,
        [userId, pointsEarned],
      )

      await client.query('DELETE FROM user_permanent_upgrades WHERE user_id = $1', [userId])

      await client.query('COMMIT')
      return {
        ok: true,
        pointsEarned,
        prestigePoints: Number(updated.rows[0].prestige_points),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same level-counter shape as the simplest tree nodes (buyLuckLevel etc.)
  // — infinite, no accrual, just spends prestige points instead of platino.
  async buyReactorLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT prestige_points FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = prestigeReactorCost(level)
      const points = Number(userRow.rows[0].prestige_points)

      if (points < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-points' }
      }

      const spent = await client.query(
        'UPDATE users SET prestige_points = prestige_points - $2 WHERE id = $1 RETURNING prestige_points',
        [userId, cost],
      )

      await client.query(
        `INSERT INTO user_prestige_upgrades (user_id, upgrade_id, level) VALUES ($1, $2, 1)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE SET level = user_prestige_upgrades.level + 1`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        reactorLevel: newLevel,
        reactorValue: prestigeReactorValue(newLevel),
        reactorNextCost: prestigeReactorCost(newLevel),
        prestigePoints: Number(spent.rows[0].prestige_points),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
