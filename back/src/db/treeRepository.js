import { database } from './pool.js'
import { AUTOCLICK_NODE_ID, autoClickCost } from '../tree/autoClick.js'
import { LUCK_NODE_ID, luckCost, luckMultiplier } from '../tree/luck.js'
import { LUCK_CHANCE_NODE_ID, luckChanceCost, luckChanceValue } from '../tree/luckChance.js'
import { AUTO_LUCK_NODE_ID, autoLuckCost, autoLuckMultiplier, effectiveAutoClickCps } from '../tree/autoLuck.js'
import { AUTO_LUCK_CHANCE_NODE_ID, autoLuckChanceCost, autoLuckChanceValue } from '../tree/autoLuckChance.js'
import { MULTIPLIER_NODE_ID, multiplierCost, multiplierValue } from '../tree/multiplier.js'
import { LEGENDARY_UNLOCK_NODE_ID, legendaryUnlockCost } from '../tree/legendaryUnlock.js'
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
import { AUTO_MULTIPLIER_NODE_ID, autoMultiplierCost, autoMultiplierValue } from '../tree/autoMultiplier.js'
import { TAP_MULTIPLIER_NODE_ID, tapMultiplierCost, tapMultiplierValue } from '../tree/tapMultiplier.js'
import { MULTI_SHOT_NODE_ID, multiShotCost, multiShotValue } from '../tree/multiShot.js'
import { applyObjectProgress } from '../game/spaceObjects.js'
import { PRESTIGE_REACTOR_NODE_ID, prestigeReactorValue } from '../game/prestige.js'

export const treeRepository = {
  // Credits whatever the auto-click node has produced since it was last
  // read, then returns the up-to-date level/cps/totalClicks. Called before
  // every state read and every buy so the number is always current instead
  // of only updating on the tick that happens to run a query.
  async accrueAndGetState(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query(
        'SELECT total_clicks, objects_broken, object_progress FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }
      let objectsBroken = Number(userRow.rows[0].objects_broken)
      let objectProgress = Number(userRow.rows[0].object_progress)

      const nodeRow = await client.query(
        `SELECT level, last_tick_at, remainder FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0 }
      const level = Number(node.level)

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

      // Sobrecarga — a flat per-drone cps rate (replacing the old flat 0.5),
      // so it feeds both the real accrual math below AND the displayed cps
      // returned further down. Still a pure formula: order-independent,
      // same as multiplying by any other node's value.
      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)
      const sobrecargaPerDroneRate = autoMultiplierValue(autoMultiplierLevel)

      // Reactor — the one prestige upgrade so far, a permanent ×multiplier
      // that survives every reset. Lives in its own table (never touched by
      // the reset's DELETE FROM user_permanent_upgrades — see migration
      // 026), applied the same way Sobrecarga is: real accrual AND display.
      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorLevel = Number(reactorRow.rows[0]?.level ?? 0)
      const reactorMultiplier = prestigeReactorValue(reactorLevel)

      const currentCps =
        effectiveAutoClickCps(level * sobrecargaPerDroneRate, autoLuckLevel, autoLuckChanceValue(autoLuckChanceLevel)) *
        reactorMultiplier

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
            `UPDATE users SET total_clicks = total_clicks + $2, object_progress = object_progress + $2
             WHERE id = $1 RETURNING total_clicks, objects_broken, object_progress`,
            [userId, whole],
          )
          totalClicks = Number(updated.rows[0].total_clicks)
          const objectResult = applyObjectProgress(
            Number(updated.rows[0].objects_broken),
            0,
            Number(updated.rows[0].object_progress),
          )
          objectsBroken = objectResult.objectsBroken
          objectProgress = objectResult.objectProgress
          if (objectResult.broken > 0) {
            await client.query('UPDATE users SET objects_broken = $2, object_progress = $3 WHERE id = $1', [
              userId,
              objectsBroken,
              objectProgress,
            ])
          }
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

      // Modo Legendario — a one-time gate on the Legendary heat tier
      // itself (see legendaryUnlock.js). Reflejos/Impulso hang off this
      // instead of Productividad directly now.
      const legendaryUnlockRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LEGENDARY_UNLOCK_NODE_ID],
      )
      const legendaryUnlockLevel = Number(legendaryUnlockRow.rows[0]?.level ?? 0)

      // Modo Legendario's two children — same plain level-counter shape,
      // finite (see legendaryEase.js/legendaryGrowth.js for why).
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

      // Multiplicador — Productividad's third child, same plain
      // level-counter shape, infinite like Productividad itself.
      const tapMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, TAP_MULTIPLIER_NODE_ID],
      )
      const tapMultiplierLevel = Number(tapMultiplierRow.rows[0]?.level ?? 0)

      // Multidisparo — root's own child, same plain level-counter shape,
      // finite like the Legendary pair (see multiShot.js).
      const multiShotRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTI_SHOT_NODE_ID],
      )
      const multiShotLevel = Number(multiShotRow.rows[0]?.level ?? 0)

      await client.query('COMMIT')
      return {
        autoClickLevel: level,
        // Fortuna/Azar still change what actually gets credited (see
        // currentCps above) — same as Suerte on regular clicks, that real
        // effect just never shows up in the displayed rate/total, only as
        // occasional bonus production over time. Sobrecarga, on the other
        // hand, is a guaranteed per-drone bonus, so it's baked into the
        // displayed number directly.
        autoClickCps: level * sobrecargaPerDroneRate * reactorMultiplier,
        autoClickNextCost: autoClickCost(level),
        autoClickNextCps: (level + 1) * sobrecargaPerDroneRate * reactorMultiplier,
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
        legendaryUnlockLevel,
        legendaryUnlockNextCost: legendaryUnlockCost(legendaryUnlockLevel),
        legendaryEaseLevel,
        legendaryStreakBase: legendaryEaseStreakBase(legendaryEaseLevel),
        legendaryEaseNextCost: legendaryEaseCost(legendaryEaseLevel),
        legendaryGrowthLevel,
        legendaryBonusStep: legendaryGrowthBonusStep(legendaryGrowthLevel),
        legendaryGrowthNextCost: legendaryGrowthCost(legendaryGrowthLevel),
        autoMultiplierLevel,
        autoMultiplierValue: sobrecargaPerDroneRate,
        autoMultiplierNextCost: autoMultiplierCost(autoMultiplierLevel),
        tapMultiplierLevel,
        tapMultiplierValue: tapMultiplierValue(tapMultiplierLevel),
        tapMultiplierNextCost: tapMultiplierCost(tapMultiplierLevel),
        multiShotLevel,
        multiShotValue: multiShotValue(multiShotLevel),
        multiShotNextCost: multiShotCost(multiShotLevel),
        totalClicks,
        objectsBroken,
        objectProgress,
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

      const userRow = await client.query(
        'SELECT total_clicks, objects_broken, object_progress FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      let objectsBroken = Number(userRow.rows[0].objects_broken)
      let objectProgress = Number(userRow.rows[0].object_progress)

      const nodeRow = await client.query(
        `SELECT level, last_tick_at, remainder FROM user_permanent_upgrades
         WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const node = nodeRow.rows[0] ?? { level: 0, last_tick_at: null, remainder: 0 }
      const level = Number(node.level)

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

      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)
      const sobrecargaPerDroneRate = autoMultiplierValue(autoMultiplierLevel)

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorLevel = Number(reactorRow.rows[0]?.level ?? 0)
      const reactorMultiplier = prestigeReactorValue(reactorLevel)

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const raw =
          Number(node.remainder) +
          seconds *
            effectiveAutoClickCps(level * sobrecargaPerDroneRate, autoLuckLevel, autoLuckChance) *
            reactorMultiplier
        const whole = Math.floor(raw)
        if (whole > 0) {
          const updated = await client.query(
            `UPDATE users SET total_clicks = total_clicks + $2, object_progress = object_progress + $2
             WHERE id = $1 RETURNING total_clicks, objects_broken, object_progress`,
            [userId, whole],
          )
          totalClicks = Number(updated.rows[0].total_clicks)
          const objectResult = applyObjectProgress(
            Number(updated.rows[0].objects_broken),
            0,
            Number(updated.rows[0].object_progress),
          )
          objectsBroken = objectResult.objectsBroken
          objectProgress = objectResult.objectProgress
          if (objectResult.broken > 0) {
            await client.query('UPDATE users SET objects_broken = $2, object_progress = $3 WHERE id = $1', [
              userId,
              objectsBroken,
              objectProgress,
            ])
          }
        }
      }

      const cost = autoClickCost(level)
      if (cost === null) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'max-level' }
      }
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
        autoClickCps: newLevel * sobrecargaPerDroneRate * reactorMultiplier,
        autoClickNextCost: autoClickCost(newLevel),
        autoClickNextCps: (newLevel + 1) * sobrecargaPerDroneRate * reactorMultiplier,
        totalClicks,
        objectsBroken,
        objectProgress,
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

  // Modo Legendario — Productividad's own child, a one-time flat purchase
  // (see legendaryUnlock.js) that gates the Legendary heat tier on
  // Home.tsx. Same level-counter shape as everything else, just always
  // maxed after the first buy.
  async buyLegendaryUnlockLevel(userId) {
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
        [userId, LEGENDARY_UNLOCK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = legendaryUnlockCost(level)
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
        [userId, LEGENDARY_UNLOCK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        legendaryUnlockLevel: newLevel,
        legendaryUnlockNextCost: legendaryUnlockCost(newLevel),
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
  // LEGENDARY_EASE_MAX_LEVEL) and requires Modo Legendario itself to
  // already be owned — enforced by the reveal cascade on the frontend,
  // checked again here since the client is never trusted.
  async buyLegendaryEaseLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const legendaryUnlockRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, LEGENDARY_UNLOCK_NODE_ID],
      )
      if (Number(legendaryUnlockRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'legendary-unlock-required' }
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

  // Same shape as buyLegendaryEaseLevel — Modo Legendario's other child.
  async buyLegendaryGrowthLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const legendaryUnlockRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, LEGENDARY_UNLOCK_NODE_ID],
      )
      if (Number(legendaryUnlockRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'legendary-unlock-required' }
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

  // Sobrecarga — Multiplicador's other child. Requires Multiplicador owned,
  // same check buyLegendaryEaseLevel/buyLegendaryGrowthLevel do. Finite
  // (see autoMultiplier.js) and reports the freshly boosted autoClickCps
  // back too since this per-drone bonus — unlike Fortuna/Azar — is
  // guaranteed and shows up in the displayed rate immediately.
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
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )

      // Reload the autoclick node so the returned cps reflects Sobrecarga's
      // new level immediately, without needing a full accrue-and-credit pass.
      const autoClickRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const autoClickLevel = Number(autoClickRow.rows[0]?.level ?? 0)

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorMultiplier = prestigeReactorValue(Number(reactorRow.rows[0]?.level ?? 0))

      await client.query('COMMIT')
      const newLevel = level + 1
      const sobrecargaPerDroneRate = autoMultiplierValue(newLevel)
      return {
        ok: true,
        autoMultiplierLevel: newLevel,
        autoMultiplierValue: sobrecargaPerDroneRate,
        autoMultiplierNextCost: autoMultiplierCost(newLevel),
        autoClickCps: autoClickLevel * sobrecargaPerDroneRate * reactorMultiplier,
        autoClickNextCps: (autoClickLevel + 1) * sobrecargaPerDroneRate * reactorMultiplier,
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Multiplicador — Productividad's third child, same level-counter shape
  // as buyMultiplierLevel (infinite, no accrual of its own), but requires
  // Productividad itself to already be owned, same check
  // buyLegendaryEaseLevel/buyLegendaryGrowthLevel/buyAutoMultiplierLevel do.
  async buyTapMultiplierLevel(userId) {
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
        [userId, TAP_MULTIPLIER_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = tapMultiplierCost(level)
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
        [userId, TAP_MULTIPLIER_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        tapMultiplierLevel: newLevel,
        tapMultiplierValue: tapMultiplierValue(newLevel),
        tapMultiplierNextCost: tapMultiplierCost(newLevel),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Multidisparo — root's own child (no prerequisite beyond root itself,
  // same tier as Suerte/Productividad), finite like buyLegendaryEaseLevel.
  async buyMultiShotLevel(userId) {
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
        [userId, MULTI_SHOT_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = multiShotCost(level)
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
        [userId, MULTI_SHOT_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        multiShotLevel: newLevel,
        multiShotValue: multiShotValue(newLevel),
        multiShotNextCost: multiShotCost(newLevel),
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
