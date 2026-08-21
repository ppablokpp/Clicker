import { database } from './pool.js'
import { AUTOCLICK_NODE_ID, autoClickCost, autoClickCps } from '../tree/autoClick.js'
import { LUCK_NODE_ID, LUCK_CHANCE, luckCost, luckMultiplier } from '../tree/luck.js'
import { MULTIPLIER_NODE_ID, multiplierCost, multiplierValue } from '../tree/multiplier.js'

export const treeRepository = {
  // Credits whatever the auto-click node has produced since it was last
  // read, then returns the up-to-date level/cps/totalClicks. Called before
  // every state read and every buy so the number is always current instead
  // of only updating on the tick that happens to run a query.
  async accrueAndGetState(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }

      const nodeRow = await client.query(
        `SELECT level, last_tick_at, remainder FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0 }
      const level = Number(node.level)

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw = Number(node.remainder) + seconds * autoClickCps(level)
        const whole = Math.floor(raw)
        const remainder = raw - whole

        if (whole > 0) {
          const updated = await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2 WHERE id = $1 RETURNING total_clicks',
            [userId, whole],
          )
          totalClicks = Number(updated.rows[0].total_clicks)
        }
        await client.query(
          `UPDATE user_permanent_upgrades SET last_tick_at = now(), remainder = $3
           WHERE user_id = $1 AND upgrade_id = $2`,
          [userId, AUTOCLICK_NODE_ID, remainder],
        )
      }

      // Luck (branch A) isn't a production node — just a level counter, no
      // accrual/tick needed, so this is a plain read alongside auto-click's.
      const luckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_NODE_ID],
      )
      const luckLevel = Number(luckRow.rows[0]?.level ?? 0)

      // Same plain level-counter shape as luck — the base click-value
      // multiplier has no per-second output either.
      const multiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTIPLIER_NODE_ID],
      )
      const multiplierLevel = Number(multiplierRow.rows[0]?.level ?? 0)

      await client.query('COMMIT')
      return {
        autoClickLevel: level,
        autoClickCps: autoClickCps(level),
        autoClickNextCost: autoClickCost(level),
        autoClickNextCps: autoClickCps(level + 1),
        luckLevel,
        luckChance: luckLevel > 0 ? LUCK_CHANCE : 0,
        luckMultiplier: luckMultiplier(luckLevel),
        luckNextCost: luckCost(luckLevel),
        multiplierLevel,
        multiplierValue: multiplierValue(multiplierLevel),
        multiplierNextCost: multiplierCost(multiplierLevel),
        totalClicks,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same level-counter shape as buyAutoClickLevel, minus the production
  // accrual (luck has no per-second output to credit before spending).
  async buyLuckLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = luckCost(level)
      const totalClicks = Number(userRow.rows[0].total_clicks)

      if (totalClicks < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2 WHERE id = $1 RETURNING total_clicks',
        [userId, cost],
      )

      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, level) VALUES ($1, $2, 1)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE SET level = user_permanent_upgrades.level + 1`,
        [userId, LUCK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        luckLevel: newLevel,
        luckChance: LUCK_CHANCE,
        luckMultiplier: luckMultiplier(newLevel),
        luckNextCost: luckCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Credits pending production first (so a purchase never discards idle
  // progress that happened between the last read and this click), then
  // spends clicks and bumps the level.
  async buyAutoClickLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level, last_tick_at, remainder FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0 }
      const level = Number(node.level)

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw = Number(node.remainder) + seconds * autoClickCps(level)
        const whole = Math.floor(raw)
        if (whole > 0) {
          const updated = await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2 WHERE id = $1 RETURNING total_clicks',
            [userId, whole],
          )
          totalClicks = Number(updated.rows[0].total_clicks)
        }
      }

      const cost = autoClickCost(level)
      if (totalClicks < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2 WHERE id = $1 RETURNING total_clicks',
        [userId, cost],
      )
      totalClicks = Number(spent.rows[0].total_clicks)

      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, level, last_tick_at, remainder)
         VALUES ($1, $2, 1, now(), 0)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE
           SET level = user_permanent_upgrades.level + 1,
               last_tick_at = COALESCE(user_permanent_upgrades.last_tick_at, now())`,
        [userId, AUTOCLICK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        autoClickLevel: newLevel,
        autoClickCps: autoClickCps(newLevel),
        autoClickNextCost: autoClickCost(newLevel),
        autoClickNextCps: autoClickCps(newLevel + 1),
        totalClicks,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same level-counter shape as buyLuckLevel — no production to accrue
  // before spending.
  async buyMultiplierLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTIPLIER_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = multiplierCost(level)
      const totalClicks = Number(userRow.rows[0].total_clicks)

      if (totalClicks < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2 WHERE id = $1 RETURNING total_clicks',
        [userId, cost],
      )

      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, level) VALUES ($1, $2, 1)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE SET level = user_permanent_upgrades.level + 1`,
        [userId, MULTIPLIER_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        multiplierLevel: newLevel,
        multiplierValue: multiplierValue(newLevel),
        multiplierNextCost: multiplierCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
