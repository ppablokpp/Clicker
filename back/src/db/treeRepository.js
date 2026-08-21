import { database } from './pool.js'
import { AUTOCLICK_NODE_ID, autoClickCost, AUTOCLICK_CPS_PER_LEVEL } from '../tree/autoClick.js'
import { LUCK_NODE_ID, luckCost, luckMultiplier } from '../tree/luck.js'
import { LUCK_CHANCE_NODE_ID, luckChanceCost, luckChanceValue } from '../tree/luckChance.js'
import { AUTO_LUCK_NODE_ID, autoLuckCost, autoLuckMultiplier, effectiveAutoClickCps } from '../tree/autoLuck.js'
import { AUTO_LUCK_CHANCE_NODE_ID, autoLuckChanceCost, autoLuckChanceValue } from '../tree/autoLuckChance.js'
import { MULTIPLIER_NODE_ID, multiplierCost, multiplierValue } from '../tree/multiplier.js'
import {
  LEGENDARY_EASE_NODE_ID,
  LEGENDARY_EASE_MAX_LEVEL,
  legendaryEaseCost,
  legendaryEaseStreakBase,
} from '../tree/legendaryEase.js'
import {
  LEGENDARY_GROWTH_NODE_ID,
  LEGENDARY_GROWTH_MAX_LEVEL,
  legendaryGrowthCost,
  legendaryGrowthBonusStep,
} from '../tree/legendaryGrowth.js'
import { AUTO_MULTIPLIER_NODE_ID, autoMultiplierCost, AUTO_MULTIPLIER_FACTOR } from '../tree/autoMultiplier.js'

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
        `SELECT level, last_tick_at, remainder, production FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0, production: 0 }
      const level = Number(node.level)
      // Sobrecarga bakes its ×1.25 straight into this running total instead
      // of being a formula applied on top of it — see autoMultiplier.js.
      const production = Number(node.production ?? 0)

      // Suerte's other child (Fortuna) and its own child (Azar) — read
      // before the accrual below since they change the effective cps that
      // accrual credits at.
      const luckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_NODE_ID],
      )
      const luckLevel = Number(luckRow.rows[0]?.level ?? 0)

      const luckChanceRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_CHANCE_NODE_ID],
      )
      const luckChanceLevel = Number(luckChanceRow.rows[0]?.level ?? 0)

      const autoLuckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_LUCK_NODE_ID],
      )
      const autoLuckLevel = Number(autoLuckRow.rows[0]?.level ?? 0)

      const autoLuckChanceRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_LUCK_CHANCE_NODE_ID],
      )
      const autoLuckChanceLevel = Number(autoLuckChanceRow.rows[0]?.level ?? 0)

      const currentCps = effectiveAutoClickCps(production, autoLuckLevel, autoLuckChanceValue(autoLuckChanceLevel))

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw = Number(node.remainder) + seconds * currentCps
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

      // Same plain level-counter shape as luck — the base click-value
      // multiplier has no per-second output either.
      const multiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTIPLIER_NODE_ID],
      )
      const multiplierLevel = Number(multiplierRow.rows[0]?.level ?? 0)

      // Multiplicador's two children — same plain level-counter shape,
      // just finite (see legendaryEase.js/legendaryGrowth.js for why).
      const legendaryEaseRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LEGENDARY_EASE_NODE_ID],
      )
      const legendaryEaseLevel = Number(legendaryEaseRow.rows[0]?.level ?? 0)

      const legendaryGrowthRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LEGENDARY_GROWTH_NODE_ID],
      )
      const legendaryGrowthLevel = Number(legendaryGrowthRow.rows[0]?.level ?? 0)

      // Sobrecarga — its own level only drives its cost/prereq; its actual
      // effect already lives inside `production` above.
      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)

      await client.query('COMMIT')
      return {
        autoClickLevel: level,
        // Fortuna/Azar still change what actually gets credited (see
        // currentCps above) — same as Suerte on regular clicks, that real
        // effect just never shows up in the displayed rate/total, only as
        // occasional bonus production over time. Sobrecarga, on the other
        // hand, is baked directly into `production`, which is real to begin
        // with — nothing to strip out here.
        autoClickCps: production,
        autoClickNextCost: autoClickCost(level),
        autoClickNextCps: production + AUTOCLICK_CPS_PER_LEVEL,
        luckLevel,
        luckChance: luckLevel > 0 ? luckChanceValue(luckChanceLevel) : 0,
        luckMultiplier: luckMultiplier(luckLevel),
        luckNextCost: luckCost(luckLevel),
        luckChanceLevel,
        luckChanceNextCost: luckChanceCost(luckChanceLevel),
        autoLuckLevel,
        autoLuckMultiplier: autoLuckMultiplier(autoLuckLevel),
        autoLuckNextCost: autoLuckCost(autoLuckLevel),
        autoLuckChanceLevel,
        autoLuckChance: autoLuckLevel > 0 ? autoLuckChanceValue(autoLuckChanceLevel) : 0,
        autoLuckChanceNextCost: autoLuckChanceCost(autoLuckChanceLevel),
        multiplierLevel,
        multiplierValue: multiplierValue(multiplierLevel),
        multiplierNextCost: multiplierCost(multiplierLevel),
        legendaryEaseLevel,
        legendaryStreakBase: legendaryEaseStreakBase(legendaryEaseLevel),
        legendaryEaseNextCost: legendaryEaseCost(legendaryEaseLevel),
        legendaryGrowthLevel,
        legendaryBonusStep: legendaryGrowthBonusStep(legendaryGrowthLevel),
        legendaryGrowthNextCost: legendaryGrowthCost(legendaryGrowthLevel),
        autoMultiplierLevel,
        autoMultiplierNextCost: autoMultiplierCost(autoMultiplierLevel),
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

      // Buying Suerte itself doesn't touch the chance node's own level, but
      // the chance is only ever nonzero once Suerte is owned, so the
      // response needs to reflect it turning on for the first time here.
      const luckChanceRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, LUCK_CHANCE_NODE_ID],
      )
      const luckChanceLevel = Number(luckChanceRow.rows[0]?.level ?? 0)

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        luckLevel: newLevel,
        luckChance: luckChanceValue(luckChanceLevel),
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
        `SELECT level, last_tick_at, remainder, production FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0, production: 0 }
      const level = Number(node.level)
      const production = Number(node.production ?? 0)

      // Fortuna/Azar affect the cps this credits at, same as accrueAndGetState.
      const autoLuckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_LUCK_NODE_ID],
      )
      const autoLuckLevel = Number(autoLuckRow.rows[0]?.level ?? 0)

      const autoLuckChanceRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_LUCK_CHANCE_NODE_ID],
      )
      const autoLuckChanceLevel = Number(autoLuckChanceRow.rows[0]?.level ?? 0)
      const autoLuckChance = autoLuckChanceValue(autoLuckChanceLevel)

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw = Number(node.remainder) + seconds * effectiveAutoClickCps(production, autoLuckLevel, autoLuckChance)
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

      // Flat +AUTOCLICK_CPS_PER_LEVEL on top of whatever production already
      // was — Sobrecarga's past multiplies stay baked into that starting
      // point, they don't apply again here (see autoMultiplier.js).
      const newProduction = production + AUTOCLICK_CPS_PER_LEVEL

      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, level, last_tick_at, remainder, production)
         VALUES ($1, $2, 1, now(), 0, $3)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE
           SET level = user_permanent_upgrades.level + 1,
               last_tick_at = COALESCE(user_permanent_upgrades.last_tick_at, now()),
               production = $3`,
        [userId, AUTOCLICK_NODE_ID, newProduction],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        autoClickLevel: newLevel,
        autoClickCps: newProduction,
        autoClickNextCost: autoClickCost(newLevel),
        autoClickNextCps: newProduction + AUTOCLICK_CPS_PER_LEVEL,
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

  // Same level-counter shape as buyLuckLevel/buyMultiplierLevel. Requires
  // Suerte (LUCK_NODE_ID) to already be owned — enforced by the reveal
  // cascade on the frontend (this node isn't even shown until then), but
  // checked here too since the client is never trusted.
  async buyLuckChanceLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const luckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, LUCK_NODE_ID],
      )
      if (Number(luckRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'luck-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_CHANCE_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = luckChanceCost(level)
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
        [userId, LUCK_CHANCE_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        luckChanceLevel: newLevel,
        luckChance: luckChanceValue(newLevel),
        luckChanceNextCost: luckChanceCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same level-counter shape as buyMultiplierLevel, but finite (capped at
  // LEGENDARY_EASE_MAX_LEVEL) and requires Multiplicador itself to already
  // be owned — enforced by the reveal cascade on the frontend, checked
  // again here since the client is never trusted.
  async buyLegendaryEaseLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const multiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, MULTIPLIER_NODE_ID],
      )
      if (Number(multiplierRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'multiplier-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LEGENDARY_EASE_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = legendaryEaseCost(level)
      if (cost === null) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'max-level' }
      }

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
        [userId, LEGENDARY_EASE_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        legendaryEaseLevel: newLevel,
        legendaryStreakBase: legendaryEaseStreakBase(newLevel),
        legendaryEaseNextCost: legendaryEaseCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same shape as buyLegendaryEaseLevel — Multiplicador's other child.
  async buyLegendaryGrowthLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const multiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, MULTIPLIER_NODE_ID],
      )
      if (Number(multiplierRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'multiplier-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LEGENDARY_GROWTH_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = legendaryGrowthCost(level)
      if (cost === null) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'max-level' }
      }

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
        [userId, LEGENDARY_GROWTH_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        legendaryGrowthLevel: newLevel,
        legendaryBonusStep: legendaryGrowthBonusStep(newLevel),
        legendaryGrowthNextCost: legendaryGrowthCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same level-counter shape as buyLuckLevel (infinite, no accrual of its
  // own) — Suerte's other child, so it requires Suerte to already be
  // owned, same check buyLuckChanceLevel does. Reports the freshly
  // boosted autoClickCps back so the UI updates immediately instead of
  // waiting for the next poll.
  async buyAutoLuckLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const luckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, LUCK_NODE_ID],
      )
      if (Number(luckRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'luck-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_LUCK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = autoLuckCost(level)
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
        [userId, AUTO_LUCK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        autoLuckLevel: newLevel,
        autoLuckMultiplier: autoLuckMultiplier(newLevel),
        autoLuckNextCost: autoLuckCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Fortuna's own child (Azar) — requires Fortuna itself to be owned, same
  // shape as buyAutoLuckLevel otherwise.
  async buyAutoLuckChanceLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const autoLuckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_LUCK_NODE_ID],
      )
      const autoLuckLevel = Number(autoLuckRow.rows[0]?.level ?? 0)
      if (autoLuckLevel === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'auto-luck-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_LUCK_CHANCE_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = autoLuckChanceCost(level)
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
        [userId, AUTO_LUCK_CHANCE_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        autoLuckChanceLevel: newLevel,
        autoLuckChance: autoLuckChanceValue(newLevel),
        autoLuckChanceNextCost: autoLuckChanceCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Sobrecarga — Multiplicador's other child. Same prereq/finite shape as
  // buyLegendaryEaseLevel/buyLegendaryGrowthLevel (requires Multiplicador
  // owned, capped at AUTO_MULTIPLIER_MAX_LEVEL), but unlike those it also
  // reaches into the auto-click node: it credits whatever auto-click has
  // produced since it was last read (same as buyAutoClickLevel does for
  // itself, so a purchase never discards idle progress), then multiplies
  // auto-click's `production` in place by AUTO_MULTIPLIER_FACTOR. That
  // multiply is a one-time event baked into the running total — it does
  // NOT change the formula, so later auto-click levels only add their flat
  // step on top from then on (see autoMultiplier.js).
  async buyAutoMultiplierLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const multiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, MULTIPLIER_NODE_ID],
      )
      if (Number(multiplierRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'multiplier-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = autoMultiplierCost(level)
      if (cost === null) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'max-level' }
      }

      const autoClickRow = await client.query(
        `SELECT level, last_tick_at, remainder, production FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const autoClickNode = autoClickRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0, production: 0 }
      const autoClickLevel = Number(autoClickNode.level)
      const production = Number(autoClickNode.production ?? 0)

      const autoLuckRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_LUCK_NODE_ID],
      )
      const autoLuckLevel = Number(autoLuckRow.rows[0]?.level ?? 0)

      const autoLuckChanceRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_LUCK_CHANCE_NODE_ID],
      )
      const autoLuckChanceLevel = Number(autoLuckChanceRow.rows[0]?.level ?? 0)
      const autoLuckChance = autoLuckChanceValue(autoLuckChanceLevel)

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (autoClickLevel > 0 && autoClickNode.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          autoClickNode.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw =
          Number(autoClickNode.remainder) + seconds * effectiveAutoClickCps(production, autoLuckLevel, autoLuckChance)
        const whole = Math.floor(raw)
        if (whole > 0) {
          const updated = await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2 WHERE id = $1 RETURNING total_clicks',
            [userId, whole],
          )
          totalClicks = Number(updated.rows[0].total_clicks)
        }
      }

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
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )

      const newProduction = production * AUTO_MULTIPLIER_FACTOR
      await client.query(
        `UPDATE user_permanent_upgrades SET production = $3 WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTOCLICK_NODE_ID, newProduction],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        autoMultiplierLevel: newLevel,
        autoMultiplierNextCost: autoMultiplierCost(newLevel),
        autoClickCps: newProduction,
        autoClickNextCps: newProduction + AUTOCLICK_CPS_PER_LEVEL,
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
