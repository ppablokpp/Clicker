import { database } from './pool.js'
import { AUTOCLICK_NODE_ID, autoClickCost } from '../tree/autoClick.js'
import { LUCK_NODE_ID, luckCost, luckMultiplier } from '../tree/luck.js'
import { LUCK_CHANCE_NODE_ID, luckChanceCost, luckChanceValue } from '../tree/luckChance.js'
import { SCOUT_DRONE_NODE_ID, scoutDroneCost } from '../tree/scoutDrone.js'
import { SCOUT_FREQUENCY_NODE_ID, scoutFrequencyCost, scoutFrequencyValue } from '../tree/scoutFrequency.js'
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
import { ANOMALY_UNLOCK_NODE_ID, anomalyUnlockCost } from '../tree/anomalyUnlock.js'
import { ANOMALY_REWARD_NODE_ID, anomalyRewardCost, anomalyRewardValue } from '../tree/anomalyReward.js'
import { ANOMALY_FREQUENCY_NODE_ID, anomalyFrequencyCost, anomalyFrequencySeconds } from '../tree/anomalyFrequency.js'
import {
  OFFLINE_PRODUCTION_NODE_ID,
  offlineProductionCost,
  offlineProductionValue,
} from '../tree/offlineProduction.js'
import { applyObjectProgress } from '../game/spaceObjects.js'
import { PRESTIGE_REACTOR_NODE_ID, prestigeReactorValue } from '../game/prestige.js'
import { prestigeTierMultiplier } from '../game/trajectory.js'

// Every cost in the tree gets multiplied by 5**prestigeTier (see
// trajectory.js) — Amatista (tier 0) is untouched, each prestige after that
// is a full 5x head start. `cost` can be null (max level already reached),
// which must pass through unchanged rather than turning into `null * 5`.
function scaleCost(cost, prestigeTier) {
  return cost === null ? null : cost * prestigeTierMultiplier(Number(prestigeTier))
}

// Binary, not blended: a gap at or under this is just normal active play
// (the ~8s background poll, TreeContext.POLL_INTERVAL_MS, plus room for a
// slow round trip or a missed tick) and gets the full online rate for its
// entire length. A gap ABOVE this is genuinely "away", and gets the reduced
// Autonomía rate (offlineProduction.js) for its *entire* length too — not
// just the portion past the threshold. That second part matters: a blended
// "first N seconds free, only the rest reduced" version was tried first,
// but it silently comped a flat activeSeconds*cps bonus into every single
// away period, however long — for a short-ish absence that bonus dwarfed
// the actual reduced-rate portion, so the credited total barely resembled
// offlineRate × time-away at all (a 4-minute absence read as ~200 instead
// of the ~14 the displayed "Producción offline" rate implied). Binary
// avoids that: once you're classified as away, the number you see in
// Centro de mando times how long you were gone is the number you get.
const AWAY_THRESHOLD_SECONDS = 20

// Shared by accrueAndGetState and buyAutoClickLevel, which both run this
// exact same accrual math before doing anything else.
function accrueWhole(remainder, seconds, currentCps, offlineRate) {
  const rate = seconds > AWAY_THRESHOLD_SECONDS ? offlineRate : 1
  const raw = remainder + seconds * currentCps * rate
  const whole = Math.floor(raw)
  return { whole, remainder: raw - whole }
}

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
        'SELECT total_clicks, objects_broken, object_progress, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
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

      // Drones buscadores — a second, independent production unit (level IS
      // the count owned, same shape as Autoclick itself) plus Frecuencia,
      // its own flat per-unit cps booster (mirrors Sobrecarga's shape).
      const scoutDroneRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, SCOUT_DRONE_NODE_ID],
      )
      const scoutDroneLevel = Number(scoutDroneRow.rows[0]?.level ?? 0)

      const scoutFrequencyRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, SCOUT_FREQUENCY_NODE_ID],
      )
      const scoutFrequencyLevel = Number(scoutFrequencyRow.rows[0]?.level ?? 0)
      const scoutDroneRate = scoutFrequencyValue(scoutFrequencyLevel)

      // Sobrecarga — a flat per-drone cps rate (replacing the old flat 0.5),
      // so it feeds both the real accrual math below AND the displayed cps
      // returned further down. Still a pure formula: order-independent,
      // same as multiplying by any other node's value.
      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)
      const sobrecargaPerDroneRate =
        autoMultiplierValue(autoMultiplierLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier))

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

      // Autonomía — Sobrecarga's own child, scales down the accrual rate
      // applied to time spent genuinely away (see ACTIVE_WINDOW_SECONDS
      // above / accrueWhole below).
      const offlineProductionRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, OFFLINE_PRODUCTION_NODE_ID],
      )
      const offlineProductionLevel = Number(offlineProductionRow.rows[0]?.level ?? 0)
      const offlineRate = offlineProductionValue(offlineProductionLevel)

      // Regular drones and scout drones tick off the same shared timer
      // below (see AUTOCLICK_NODE_ID's last_tick_at/remainder) — simplest
      // way to accrue two independent production streams without a second
      // set of timer columns, since they always advance together anyway.
      const currentCps = (level * sobrecargaPerDroneRate + scoutDroneLevel * scoutDroneRate) * reactorMultiplier

      let totalClicks = Number(userRow.rows[0].total_clicks)
      // What this specific call just credited — the frontend uses this to
      // show a "your fleet extracted X while you were away" modal on the
      // very first fetch after the app mounts (not on every routine 8s
      // poll while already playing, which also runs through this same
      // accrual path and would otherwise pop the modal constantly).
      let creditedThisCall = 0

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const { whole, remainder } = accrueWhole(Number(node.remainder), seconds, currentCps, offlineRate)
        creditedThisCall = whole

        if (whole > 0) {
          const updated = await client.query(
            `UPDATE users
             SET total_clicks = total_clicks + $2, object_progress = object_progress + $2,
                 lifetime_platino = lifetime_platino + $2
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

      // Anomalías — root's own child, a one-time gate on the whole event
      // (see anomalyUnlock.js), forking into Extracción and Frecuencia.
      const anomalyUnlockRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_UNLOCK_NODE_ID],
      )
      const anomalyUnlockLevel = Number(anomalyUnlockRow.rows[0]?.level ?? 0)

      const anomalyRewardRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_REWARD_NODE_ID],
      )
      const anomalyRewardLevel = Number(anomalyRewardRow.rows[0]?.level ?? 0)

      const anomalyFrequencyRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_FREQUENCY_NODE_ID],
      )
      const anomalyFrequencyLevel = Number(anomalyFrequencyRow.rows[0]?.level ?? 0)

      await client.query('COMMIT')
      return {
        autoClickLevel: level,
        // Regular-drone cps only — scout drones are their own separate
        // stream below, kept apart so the "Drones" card never mixes the two
        // unit types' output.
        autoClickCps: level * sobrecargaPerDroneRate * reactorMultiplier,
        autoClickNextCost: scaleCost(autoClickCost(level), userRow.rows[0].prestige_tier),
        autoClickNextCps: (level + 1) * sobrecargaPerDroneRate * reactorMultiplier,
        luckLevel,
        luckChance: luckLevel > 0 ? luckChanceValue(luckChanceLevel) : 0,
        luckMultiplier: luckMultiplier(luckLevel),
        luckNextCost: scaleCost(luckCost(luckLevel), userRow.rows[0].prestige_tier),
        luckChanceLevel,
        luckChanceNextCost: scaleCost(luckChanceCost(luckChanceLevel), userRow.rows[0].prestige_tier),
        scoutDroneLevel,
        scoutDroneNextCost: scaleCost(scoutDroneCost(scoutDroneLevel), userRow.rows[0].prestige_tier),
        scoutDroneRate,
        scoutDroneCps: scoutDroneLevel * scoutDroneRate * reactorMultiplier,
        scoutFrequencyLevel,
        scoutFrequencyNextCost: scaleCost(scoutFrequencyCost(scoutFrequencyLevel), userRow.rows[0].prestige_tier),
        multiplierLevel,
        multiplierValue: multiplierValue(multiplierLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        multiplierNextValue: multiplierValue(multiplierLevel + 1) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        multiplierNextCost: scaleCost(multiplierCost(multiplierLevel), userRow.rows[0].prestige_tier),
        legendaryUnlockLevel,
        legendaryUnlockNextCost: scaleCost(legendaryUnlockCost(legendaryUnlockLevel), userRow.rows[0].prestige_tier),
        legendaryEaseLevel,
        legendaryStreakBase: legendaryEaseStreakBase(legendaryEaseLevel),
        legendaryEaseNextCost: scaleCost(legendaryEaseCost(legendaryEaseLevel), userRow.rows[0].prestige_tier),
        legendaryGrowthLevel,
        legendaryBonusStep: legendaryGrowthBonusStep(legendaryGrowthLevel),
        legendaryGrowthNextCost: scaleCost(legendaryGrowthCost(legendaryGrowthLevel), userRow.rows[0].prestige_tier),
        autoMultiplierLevel,
        autoMultiplierValue: sobrecargaPerDroneRate,
        autoMultiplierNextValue:
          autoMultiplierValue(autoMultiplierLevel + 1) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        autoMultiplierNextCost: scaleCost(autoMultiplierCost(autoMultiplierLevel), userRow.rows[0].prestige_tier),
        tapMultiplierLevel,
        tapMultiplierValue: tapMultiplierValue(tapMultiplierLevel),
        tapMultiplierNextCost: scaleCost(tapMultiplierCost(tapMultiplierLevel), userRow.rows[0].prestige_tier),
        multiShotLevel,
        multiShotValue: multiShotValue(multiShotLevel),
        multiShotNextCost: scaleCost(multiShotCost(multiShotLevel), userRow.rows[0].prestige_tier),
        anomalyUnlockLevel,
        anomalyUnlockNextCost: scaleCost(anomalyUnlockCost(anomalyUnlockLevel), userRow.rows[0].prestige_tier),
        anomalyRewardLevel,
        anomalyRewardValue: anomalyUnlockLevel > 0 ? anomalyRewardValue(anomalyRewardLevel) : 0,
        anomalyRewardNextCost: scaleCost(anomalyRewardCost(anomalyRewardLevel), userRow.rows[0].prestige_tier),
        anomalyFrequencyLevel,
        anomalyFrequencySeconds: anomalyFrequencySeconds(anomalyFrequencyLevel),
        anomalyFrequencyNextCost: scaleCost(anomalyFrequencyCost(anomalyFrequencyLevel), userRow.rows[0].prestige_tier),
        offlineProductionLevel,
        offlineProductionValue: offlineRate,
        offlineProductionNextCost: scaleCost(offlineProductionCost(offlineProductionLevel), userRow.rows[0].prestige_tier),
        totalClicks,
        objectsBroken,
        objectProgress,
        creditedThisCall,
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, LUCK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(luckCost(level), userRow.rows[0].prestige_tier)
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
        luckNextCost: scaleCost(luckCost(newLevel), userRow.rows[0].prestige_tier),
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
        'SELECT total_clicks, objects_broken, object_progress, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
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

      // Scout drones affect the cps this credits at, same as accrueAndGetState.
      const scoutDroneRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, SCOUT_DRONE_NODE_ID],
      )
      const scoutDroneLevel = Number(scoutDroneRow.rows[0]?.level ?? 0)

      const scoutFrequencyRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, SCOUT_FREQUENCY_NODE_ID],
      )
      const scoutFrequencyLevel = Number(scoutFrequencyRow.rows[0]?.level ?? 0)
      const scoutDroneRate = scoutFrequencyValue(scoutFrequencyLevel)

      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)
      const sobrecargaPerDroneRate =
        autoMultiplierValue(autoMultiplierLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier))

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorLevel = Number(reactorRow.rows[0]?.level ?? 0)
      const reactorMultiplier = prestigeReactorValue(reactorLevel)

      const offlineProductionRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, OFFLINE_PRODUCTION_NODE_ID],
      )
      const offlineRate = offlineProductionValue(Number(offlineProductionRow.rows[0]?.level ?? 0))

      let totalClicks = Number(userRow.rows[0].total_clicks)

      if (level > 0 && node.last_tick_at) {
        const elapsed = await client.query('SELECT EXTRACT(EPOCH FROM (now() - $1::timestamptz)) AS seconds', [
          node.last_tick_at,
        ])
        const seconds = Math.max(0, Number(elapsed.rows[0].seconds))
        const currentCps = (level * sobrecargaPerDroneRate + scoutDroneLevel * scoutDroneRate) * reactorMultiplier
        const { whole } = accrueWhole(Number(node.remainder), seconds, currentCps, offlineRate)
        if (whole > 0) {
          const updated = await client.query(
            `UPDATE users
             SET total_clicks = total_clicks + $2, object_progress = object_progress + $2,
                 lifetime_platino = lifetime_platino + $2
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

      const cost = scaleCost(autoClickCost(level), userRow.rows[0].prestige_tier)
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
        autoClickNextCost: scaleCost(autoClickCost(newLevel), userRow.rows[0].prestige_tier),
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

  // Tutorial-only: grants level 1 of the drone node for free, exactly once
  // — only when the node is still untouched (level 0), so replaying the
  // tutorial later (or a retried request) can never grant a second free
  // level. Deliberately skips the accrual pass buyAutoClickLevel does
  // (level 0 has never ticked, so there's nothing to credit) and the
  // cost/balance check + currency deduction, but otherwise mirrors it
  // closely so the response shape drops into the same frontend state-merge
  // unchanged.
  async grantAutoClickLevelFree(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query(
        'SELECT total_clicks, objects_broken, object_progress, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTOCLICK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      if (level > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-owned' }
      }

      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const autoMultiplierLevel = Number(autoMultiplierRow.rows[0]?.level ?? 0)
      const sobrecargaPerDroneRate =
        autoMultiplierValue(autoMultiplierLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier))

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorLevel = Number(reactorRow.rows[0]?.level ?? 0)
      const reactorMultiplier = prestigeReactorValue(reactorLevel)

      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, level, last_tick_at, remainder)
         VALUES ($1, $2, 1, now(), 0)
         ON CONFLICT (user_id, upgrade_id) DO UPDATE
           SET level = 1, last_tick_at = now()`,
        [userId, AUTOCLICK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = 1
      return {
        ok: true,
        autoClickLevel: newLevel,
        autoClickCps: newLevel * sobrecargaPerDroneRate * reactorMultiplier,
        autoClickNextCost: scaleCost(autoClickCost(newLevel), userRow.rows[0].prestige_tier),
        autoClickNextCps: (newLevel + 1) * sobrecargaPerDroneRate * reactorMultiplier,
        totalClicks: Number(userRow.rows[0].total_clicks),
        objectsBroken: Number(userRow.rows[0].objects_broken),
        objectProgress: Number(userRow.rows[0].object_progress),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTIPLIER_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(multiplierCost(level), userRow.rows[0].prestige_tier)
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
        multiplierValue: multiplierValue(newLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        multiplierNextValue: multiplierValue(newLevel + 1) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        multiplierNextCost: scaleCost(multiplierCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
      const cost = scaleCost(luckChanceCost(level), userRow.rows[0].prestige_tier)
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
        luckChanceNextCost: scaleCost(luckChanceCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
      const cost = scaleCost(legendaryUnlockCost(level), userRow.rows[0].prestige_tier)
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
        legendaryUnlockNextCost: scaleCost(legendaryUnlockCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
      const cost = scaleCost(legendaryEaseCost(level), userRow.rows[0].prestige_tier)
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
        legendaryEaseNextCost: scaleCost(legendaryEaseCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
      const cost = scaleCost(legendaryGrowthCost(level), userRow.rows[0].prestige_tier)
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
        legendaryGrowthNextCost: scaleCost(legendaryGrowthCost(newLevel), userRow.rows[0].prestige_tier),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Drones buscadores — same level-counter shape as buyAutoClickLevel
  // (level IS the count owned), no accrual of its own to credit here since
  // it shares Autoclick's timer (see accrueAndGetState). Now Sobrecarga's
  // child (Sobrecarga leads this branch), so it requires Sobrecarga owned,
  // same check shape as buyScoutFrequencyLevel. Reports the freshly
  // boosted scoutDroneCps back so the UI updates immediately.
  async buyScoutDroneLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      if (Number(autoMultiplierRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'overload-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, SCOUT_DRONE_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(scoutDroneCost(level), userRow.rows[0].prestige_tier)
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
        [userId, SCOUT_DRONE_NODE_ID],
      )

      const scoutFrequencyRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, SCOUT_FREQUENCY_NODE_ID],
      )
      const scoutDroneRate = scoutFrequencyValue(Number(scoutFrequencyRow.rows[0]?.level ?? 0))

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorMultiplier = prestigeReactorValue(Number(reactorRow.rows[0]?.level ?? 0))

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        scoutDroneLevel: newLevel,
        scoutDroneNextCost: scaleCost(scoutDroneCost(newLevel), userRow.rows[0].prestige_tier),
        scoutDroneRate,
        scoutDroneCps: newLevel * scoutDroneRate * reactorMultiplier,
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Frecuencia — Drones buscadores' own child, requires at least one scout
  // drone owned, same shape as buyAutoMultiplierLevel otherwise (finite,
  // reports the freshly boosted scoutDroneCps back since this per-unit
  // bonus is guaranteed and shows up in the displayed rate immediately).
  async buyScoutFrequencyLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const scoutDroneRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, SCOUT_DRONE_NODE_ID],
      )
      const scoutDroneLevel = Number(scoutDroneRow.rows[0]?.level ?? 0)
      if (scoutDroneLevel === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'scout-drone-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, SCOUT_FREQUENCY_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(scoutFrequencyCost(level), userRow.rows[0].prestige_tier)
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
        [userId, SCOUT_FREQUENCY_NODE_ID],
      )

      const reactorRow = await client.query(
        `SELECT level FROM user_prestige_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, PRESTIGE_REACTOR_NODE_ID],
      )
      const reactorMultiplier = prestigeReactorValue(Number(reactorRow.rows[0]?.level ?? 0))

      await client.query('COMMIT')
      const newLevel = level + 1
      const scoutDroneRate = scoutFrequencyValue(newLevel)
      return {
        ok: true,
        scoutFrequencyLevel: newLevel,
        scoutFrequencyNextCost: scaleCost(scoutFrequencyCost(newLevel), userRow.rows[0].prestige_tier),
        scoutDroneRate,
        scoutDroneCps: scoutDroneLevel * scoutDroneRate * reactorMultiplier,
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Sobrecarga — now leads Drones buscadores' branch itself (moved off
  // Multiplicador, since it boosts this branch's own drones, not the
  // regular ones), so it's root's own direct child, same as Autoclick/
  // Multidisparo — no prerequisite required. Finite (see autoMultiplier.js)
  // and reports the freshly boosted autoClickCps back too since this
  // per-drone bonus — unlike Fortuna/Azar — is guaranteed and shows up in
  // the displayed rate immediately.
  async buyAutoMultiplierLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(autoMultiplierCost(level), userRow.rows[0].prestige_tier)
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
      const sobrecargaPerDroneRate =
        autoMultiplierValue(newLevel) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier))
      return {
        ok: true,
        autoMultiplierLevel: newLevel,
        autoMultiplierValue: sobrecargaPerDroneRate,
        autoMultiplierNextValue:
          autoMultiplierValue(newLevel + 1) * prestigeTierMultiplier(Number(userRow.rows[0].prestige_tier)),
        autoMultiplierNextCost: scaleCost(autoMultiplierCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
      const cost = scaleCost(tapMultiplierCost(level), userRow.rows[0].prestige_tier)
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
        tapMultiplierNextCost: scaleCost(tapMultiplierCost(newLevel), userRow.rows[0].prestige_tier),
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

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, MULTI_SHOT_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(multiShotCost(level), userRow.rows[0].prestige_tier)
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
        multiShotNextCost: scaleCost(multiShotCost(newLevel), userRow.rows[0].prestige_tier),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Anomalías — root's own child (no prerequisite beyond root itself, same
  // tier as Suerte/Multidisparo), a one-time flat purchase (see
  // anomalyUnlock.js) that gates the whole "Anomalía" mini-event on
  // Home.tsx. Same level-counter shape as buyLegendaryUnlockLevel, just
  // always maxed after the first buy.
  async buyAnomalyUnlockLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_UNLOCK_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(anomalyUnlockCost(level), userRow.rows[0].prestige_tier)
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
        [userId, ANOMALY_UNLOCK_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        anomalyUnlockLevel: newLevel,
        anomalyUnlockNextCost: scaleCost(anomalyUnlockCost(newLevel), userRow.rows[0].prestige_tier),
        // Both children read as "unlocked" (5% / base 5 min) the instant
        // this is bought, even at their own level 0 — report them fresh so
        // the UI doesn't need a full refetch to show that.
        anomalyRewardValue: anomalyRewardValue(0),
        anomalyFrequencySeconds: anomalyFrequencySeconds(0),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Extracción — Anomalías' first child, same shape as buyLegendaryEaseLevel
  // (finite, requires the unlock node already owned).
  async buyAnomalyRewardLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
        return { ok: false, reason: 'anomaly-unlock-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_REWARD_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(anomalyRewardCost(level), userRow.rows[0].prestige_tier)
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
        [userId, ANOMALY_REWARD_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        anomalyRewardLevel: newLevel,
        anomalyRewardValue: anomalyRewardValue(newLevel),
        anomalyRewardNextCost: scaleCost(anomalyRewardCost(newLevel), userRow.rows[0].prestige_tier),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Frecuencia — Anomalías' other child, same shape as buyAnomalyRewardLevel.
  async buyAnomalyFrequencyLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
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
        return { ok: false, reason: 'anomaly-unlock-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, ANOMALY_FREQUENCY_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(anomalyFrequencyCost(level), userRow.rows[0].prestige_tier)
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
        [userId, ANOMALY_FREQUENCY_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        anomalyFrequencyLevel: newLevel,
        anomalyFrequencySeconds: anomalyFrequencySeconds(newLevel),
        anomalyFrequencyNextCost: scaleCost(anomalyFrequencyCost(newLevel), userRow.rows[0].prestige_tier),
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Autonomía — Sobrecarga's own child, same shape as buyScoutFrequencyLevel
  // (finite, requires Sobrecarga already owned).
  async buyOfflineProductionLevel(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const userRow = await client.query('SELECT total_clicks, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const autoMultiplierRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2`,
        [userId, AUTO_MULTIPLIER_NODE_ID],
      )
      if (Number(autoMultiplierRow.rows[0]?.level ?? 0) === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'overload-required' }
      }

      const nodeRow = await client.query(
        `SELECT level FROM user_permanent_upgrades WHERE user_id = $1 AND upgrade_id = $2 FOR UPDATE`,
        [userId, OFFLINE_PRODUCTION_NODE_ID],
      )
      const level = Number(nodeRow.rows[0]?.level ?? 0)
      const cost = scaleCost(offlineProductionCost(level), userRow.rows[0].prestige_tier)
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
        [userId, OFFLINE_PRODUCTION_NODE_ID],
      )

      await client.query('COMMIT')
      const newLevel = level + 1
      return {
        ok: true,
        offlineProductionLevel: newLevel,
        offlineProductionValue: offlineProductionValue(newLevel),
        offlineProductionNextCost: scaleCost(offlineProductionCost(newLevel), userRow.rows[0].prestige_tier),
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
