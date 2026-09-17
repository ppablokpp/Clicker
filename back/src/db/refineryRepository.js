import { database } from './pool.js'
import { accrueProduction } from './treeRepository.js'
import { CORES_PER_TIER, coreCost, coreSeconds, finishGemCost } from '../game/refinery.js'
import { TRAJECTORY_TIER_COUNT } from '../game/trajectory.js'

/**
 * A repair in flight finishes on the server's clock, not on a request: any
 * read that finds `started_at` older than the core's duration counts the
 * core as done and clears the start. So there is no "collect" — the front
 * just re-reads when its own countdown ends, and the answer is already
 * final. Called inside the caller's transaction, with the row locked.
 */
export async function settle(client, userId, tier) {
  // One clock for everything: the database's. `started_at` was stamped by
  // it, so it is compared against it — the app server's own clock can be
  // seconds off, which with short cores meant a core finishing the moment
  // it started. `clock_timestamp()` rather than `now()`, which is frozen at
  // the start of the transaction.
  const clock = await client.query('SELECT clock_timestamp() AS db_now')
  const dbNow = new Date(clock.rows[0].db_now)
  const row = await client.query(
    `SELECT repaired, started_at FROM user_core_repairs WHERE user_id = $1 AND tier = $2 FOR UPDATE`,
    [userId, tier],
  )
  if (!row.rows[0]) return { repaired: 0, startedAt: null, now: dbNow }
  let { repaired, started_at: startedAt } = row.rows[0]
  repaired = Number(repaired)
  if (startedAt && repaired < CORES_PER_TIER) {
    const doneAt = new Date(startedAt).getTime() + coreSeconds(repaired, tier) * 1000
    if (dbNow.getTime() >= doneAt) {
      repaired += 1
      startedAt = null
      await client.query(`UPDATE user_core_repairs SET repaired = $3, started_at = NULL WHERE user_id = $1 AND tier = $2`, [
        userId,
        tier,
        repaired,
      ])
    }
  }
  return { repaired, startedAt: startedAt ? new Date(startedAt).toISOString() : null, now: dbNow }
}

/** The first capsule of the tier the player is on — nothing loaded on it
 *  yet — is on the house until the station tutorial has run: it is the one
 *  that tutorial makes the player smelt, and an account that meets the
 *  tutorial further along (it ships to accounts already on later tiers)
 *  can't be counted on to afford that tier's price. */
function firstCapsuleFree(tier, repaired, stationTutorialCompleted) {
  return repaired === 0 && !stationTutorialCompleted
}

/** Every tier's count of loaded capsules, in tier order. A tier the player
 *  has already left counts as whole whatever its row says: leaving one now
 *  takes a whole core, and anyone past it from before the Refinería
 *  existed is owed the cores they never had the chance to load. */
async function allCores(client, userId, currentTier) {
  const rows = await client.query('SELECT tier, repaired FROM user_core_repairs WHERE user_id = $1', [userId])
  const cores = Array.from({ length: TRAJECTORY_TIER_COUNT }, (_, i) => (i < currentTier ? CORES_PER_TIER : 0))
  for (const r of rows.rows) {
    if (r.tier >= 0 && r.tier < cores.length) cores[r.tier] = Math.max(cores[r.tier], Number(r.repaired))
  }
  return cores
}

function shape(tier, state, cores) {
  const done = state.repaired >= CORES_PER_TIER
  return {
    tier,
    cores,
    repaired: state.repaired,
    total: CORES_PER_TIER,
    startedAt: state.startedAt,
    nextCost: done ? null : coreCost(state.repaired, tier),
    nextSeconds: done ? null : coreSeconds(state.repaired, tier),
    // The database's clock — the one `startedAt` is on — so the front can
    // count down without trusting its own.
    now: state.now.toISOString(),
  }
}

export const refineryRepository = {
  /** The core of the tier the player is on. */
  async getState(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const userRow = await client.query('SELECT prestige_tier, station_tutorial_completed FROM users WHERE id = $1', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }
      const tier = Number(userRow.rows[0].prestige_tier)
      const state = await settle(client, userId, tier)
      const cores = await allCores(client, userId, tier)
      await client.query('COMMIT')
      return { ...shape(tier, state, cores), nextFree: firstCapsuleFree(tier, state.repaired, userRow.rows[0].station_tutorial_completed) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  /**
   * Starts the next small core of the current tier: takes its cost off the
   * balance and stamps the clock. Same shape as a tree buy — production is
   * accrued first so the balance checked is the one the player sees, and
   * the whole thing is one transaction under FOR UPDATE.
   */
  async start(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const accrued = await accrueProduction(client, userId)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const userRow = await client.query(
        'SELECT total_clicks, prestige_tier, station_tutorial_completed FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      const tier = Number(userRow.rows[0].prestige_tier)
      await client.query(
        `INSERT INTO user_core_repairs (user_id, tier) VALUES ($1, $2) ON CONFLICT (user_id, tier) DO NOTHING`,
        [userId, tier],
      )
      const state = await settle(client, userId, tier)
      if (state.repaired >= CORES_PER_TIER) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'core-complete' }
      }
      if (state.startedAt) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-smelting' }
      }
      // The first capsule ever is free: the station tutorial makes the
      // player smelt it, and a player who just bought their fifth drone
      // can't be counted on to afford it.
      const free = firstCapsuleFree(tier, state.repaired, userRow.rows[0].station_tutorial_completed)
      const cost = free ? 0 : coreCost(state.repaired, tier)
      if (Number(userRow.rows[0].total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }
      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2, updated_at = now() WHERE id = $1 RETURNING total_clicks',
        [userId, cost],
      )
      await client.query(`UPDATE user_core_repairs SET started_at = clock_timestamp() WHERE user_id = $1 AND tier = $2`, [userId, tier])
      const after = await settle(client, userId, tier)
      const cores = await allCores(client, userId, tier)
      await client.query('COMMIT')
      return { ok: true, ...shape(tier, after, cores), nextFree: false, totalClicks: Number(spent.rows[0].total_clicks) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  /**
   * Pays gems to finish the smelt that is under way. The price is set by the
   * seconds left on the database's clock, so it is the same number the
   * front printed a moment ago (give or take a tick, and a tick is free).
   */
  async finish(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const userRow = await client.query('SELECT gems, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const tier = Number(userRow.rows[0].prestige_tier)
      const state = await settle(client, userId, tier)
      if (!state.startedAt) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-smelting' }
      }
      const doneAt = new Date(state.startedAt).getTime() + coreSeconds(state.repaired, tier) * 1000
      const secondsLeft = Math.max(0, Math.ceil((doneAt - state.now.getTime()) / 1000))
      const cost = finishGemCost(secondsLeft)
      if (Number(userRow.rows[0].gems) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }
      const paid = await client.query('UPDATE users SET gems = gems - $2, updated_at = now() WHERE id = $1 RETURNING gems', [userId, cost])
      await client.query(
        `UPDATE user_core_repairs SET repaired = LEAST(${CORES_PER_TIER}, repaired + 1), started_at = NULL WHERE user_id = $1 AND tier = $2`,
        [userId, tier],
      )
      const after = await settle(client, userId, tier)
      const cores = await allCores(client, userId, tier)
      await client.query('COMMIT')
      return { ok: true, ...shape(tier, after, cores), gems: Number(paid.rows[0].gems), gemsSpent: cost }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
