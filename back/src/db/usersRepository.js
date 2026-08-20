import { database } from './pool.js'

// Applies to both chest types — buying more than this just sits unopened,
// so it's a soft cap on hoarding rather than a scarcity mechanic.
const MAX_OWNED_CHESTS = 10

export const usersRepository = {
  // Runs once per session (from the sync-on-login call) — just profile
  // fields. The streak is entirely driven by actual click activity now
  // (see incrementClicks), not by login days, so this doesn't touch it.
  async upsertFromClerk({ id, email, username, avatarUrl }) {
    const result = await database.query(
      `INSERT INTO users (id, email, username, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             username = EXCLUDED.username,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = now()
       RETURNING id, email, username, avatar_url, total_clicks, best_cps, current_streak, longest_streak,
                 active_powerup, active_powerup_expires_at, active_luck_powerup, active_luck_powerup_expires_at,
                 powerup_cooldown_until, luck_powerup_cooldown_until,
                 milestone_bonus_multiplier, created_at, cases_opened, gems, keys,
                 owned_click_chests, owned_gem_chests,
                 (last_key_claim_date IS NOT NULL AND last_key_claim_date = CURRENT_DATE) AS key_claimed_today`,
      [id, email, username, avatarUrl],
    )
    return result.rows[0]
  },

  // The "already claimed today" flag is computed in SQL against CURRENT_DATE
  // rather than in JS — comparing a DATE column's parsed value against
  // "today" in JS risks a timezone mismatch with what the DB considers today.
  async getById(id) {
    const result = await database.query(
      `SELECT *, (last_key_claim_date IS NOT NULL AND last_key_claim_date = CURRENT_DATE) AS key_claimed_today
       FROM users WHERE id = $1`,
      [id],
    )
    return result.rows[0] ?? null
  },

  async getTotalClicks(id) {
    const result = await database.query('SELECT total_clicks FROM users WHERE id = $1', [id])
    return Number(result.rows[0]?.total_clicks ?? 0)
  },

  // Upserts on the id alone (no email/username yet) so an increment that races
  // ahead of the Clerk profile sync never loses clicks. Also marks today in
  // click_days (for the stats-page calendar), updates the streak, and rolls
  // any active magnet's per-click proc, all in the same round trip:
  //   - today_check/yesterday_check read click_days BEFORE any write here,
  //     so they reflect "was today already marked by an earlier flush" and
  //     "was yesterday clicked at all".
  //   - the streak only moves the first time a given day is marked: already
  //     clicked today → unchanged; clicked yesterday → +1; otherwise → reset
  //     to 1. A user's very first-ever click also lands in the "reset to 1"
  //     branch, since they'd have no click_days rows yet either.
  //   - magnet_procs reads whichever magnet (if any) is currently active and
  //     not yet expired, and rolls `amount` independent Bernoulli(procChance)
  //     trials for it via generate_series — cheap even at the 5000-click
  //     request cap, and keeps the roll server-authoritative (never trust
  //     the client to just claim a proc happened).
  //   - day_marked runs last, selecting FROM updated purely to force it
  //     after the user upsert, so a brand-new user's very first click
  //     doesn't violate the FK before the row exists.
  async incrementClicks(id, amount, peakCps = 0, magnetProcChance = 0) {
    const result = await database.query(
      `WITH today_check AS (
         SELECT EXISTS (
           SELECT 1 FROM click_days WHERE user_id = $1 AND click_date = CURRENT_DATE
         ) AS clicked_today
       ),
       yesterday_check AS (
         SELECT EXISTS (
           SELECT 1 FROM click_days WHERE user_id = $1 AND click_date = CURRENT_DATE - 1
         ) AS clicked_yesterday
       ),
       magnet_state AS (
         SELECT active_magnet, active_magnet_expires_at FROM users WHERE id = $1
       ),
       magnet_procs AS (
         SELECT
           CASE WHEN (SELECT active_magnet FROM magnet_state) = 'key_magnet'
                     AND (SELECT active_magnet_expires_at FROM magnet_state) > now()
             THEN (SELECT count(*) FROM generate_series(1, $4::int) WHERE random() < $5)
             ELSE 0 END AS key_procs,
           CASE WHEN (SELECT active_magnet FROM magnet_state) = 'gem_magnet'
                     AND (SELECT active_magnet_expires_at FROM magnet_state) > now()
             THEN (SELECT count(*) FROM generate_series(1, $4::int) WHERE random() < $5)
             ELSE 0 END AS gem_procs
       ),
       updated AS (
         INSERT INTO users (id, total_clicks, best_cps, current_streak, longest_streak)
         VALUES ($1, $2, $3, 1, 1)
         ON CONFLICT (id) DO UPDATE
           SET total_clicks = users.total_clicks + EXCLUDED.total_clicks,
               best_cps = GREATEST(users.best_cps, EXCLUDED.best_cps),
               keys = users.keys + (SELECT key_procs FROM magnet_procs),
               gems = users.gems + (SELECT gem_procs FROM magnet_procs),
               current_streak = CASE
                 WHEN (SELECT clicked_today FROM today_check) THEN users.current_streak
                 WHEN (SELECT clicked_yesterday FROM yesterday_check) THEN users.current_streak + 1
                 ELSE 1
               END,
               longest_streak = GREATEST(
                 users.longest_streak,
                 CASE
                   WHEN (SELECT clicked_today FROM today_check) THEN users.current_streak
                   WHEN (SELECT clicked_yesterday FROM yesterday_check) THEN users.current_streak + 1
                   ELSE 1
                 END
               ),
               updated_at = now()
         RETURNING total_clicks, best_cps, keys, gems
       ),
       day_marked AS (
         INSERT INTO click_days (user_id, click_date)
         SELECT $1, CURRENT_DATE FROM updated
         ON CONFLICT (user_id, click_date) DO NOTHING
       )
       SELECT total_clicks, best_cps, keys, gems FROM updated`,
      [id, amount, peakCps, amount, magnetProcChance],
    )
    return {
      totalClicks: Number(result.rows[0].total_clicks),
      bestCps: Number(result.rows[0].best_cps),
      keys: Number(result.rows[0].keys),
      gems: Number(result.rows[0].gems),
    }
  },

  // Every day the user has ever clicked at least once — powers the
  // stats-page calendar strip, which scrolls all the way back to the
  // earliest one. Dates come back as plain 'YYYY-MM-DD' text straight from
  // SQL rather than parsed JS Dates, to avoid any timezone-shifting round
  // trip through the pg driver.
  async getClickDays(id) {
    const result = await database.query(
      `SELECT to_char(click_date, 'YYYY-MM-DD') AS click_date
       FROM click_days
       WHERE user_id = $1
       ORDER BY click_date ASC`,
      [id],
    )
    return result.rows.map((r) => r.click_date)
  },

  // Buying ANY tier locks the whole category (all 4 tiers) for an hour —
  // otherwise a powerup that's net-positive while actively clicking becomes
  // an infinite money printer (buy it back the instant it expires, forever).
  // Row-locked transaction so we can tell "on cooldown" apart from "can't
  // afford it" instead of just returning null for both.
  async buyPowerup(id, powerupId, cost, durationSeconds) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT total_clicks, powerup_cooldown_until FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (user.powerup_cooldown_until && new Date(user.powerup_cooldown_until) > new Date()) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'cooldown', cooldownUntil: user.powerup_cooldown_until }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2,
             active_powerup = $3,
             active_powerup_expires_at = now() + make_interval(secs => $4),
             powerup_cooldown_until = now() + interval '1 hour',
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, active_powerup, active_powerup_expires_at, powerup_cooldown_until`,
        [id, cost, powerupId, durationSeconds],
      )
      await client.query('COMMIT')
      return { ok: true, ...updated.rows[0] }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same cooldown-locked pattern as buyPowerup, in the separate
  // active_luck_powerup slot (and its own cooldown column) so a
  // click-multiplier powerup and a timed luck powerup can run — and be on
  // cooldown — independently of each other.
  async buyTimedLuckPowerup(id, powerupId, cost, durationSeconds) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT total_clicks, luck_powerup_cooldown_until FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (user.luck_powerup_cooldown_until && new Date(user.luck_powerup_cooldown_until) > new Date()) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'cooldown', cooldownUntil: user.luck_powerup_cooldown_until }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2,
             active_luck_powerup = $3,
             active_luck_powerup_expires_at = now() + make_interval(secs => $4),
             luck_powerup_cooldown_until = now() + interval '1 hour',
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, active_luck_powerup, active_luck_powerup_expires_at, luck_powerup_cooldown_until`,
        [id, cost, powerupId, durationSeconds],
      )
      await client.query('COMMIT')
      return { ok: true, ...updated.rows[0] }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same cooldown-locked pattern again, in its own active_magnet slot — a
  // key magnet and a gem magnet share one cooldown (buying either locks
  // both), independent of the click-multiplier and luck-powerup slots. The
  // actual per-click proc roll happens in incrementClicks below, not here —
  // this just flips the flag on.
  async buyMagnet(id, magnetId, cost, durationSeconds) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT total_clicks, magnet_cooldown_until FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (user.magnet_cooldown_until && new Date(user.magnet_cooldown_until) > new Date()) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'cooldown', cooldownUntil: user.magnet_cooldown_until }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2,
             active_magnet = $3,
             active_magnet_expires_at = now() + make_interval(secs => $4),
             magnet_cooldown_until = now() + interval '1 hour',
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, active_magnet, active_magnet_expires_at, magnet_cooldown_until`,
        [id, cost, magnetId, durationSeconds],
      )
      await client.query('COMMIT')
      return { ok: true, ...updated.rows[0] }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Once per calendar day, grants exactly one key — the same cooldown
  // mechanic the free case used to have, just moved here so the case itself
  // stays freely repeatable and keys are what's actually rationed.
  async claimDailyKey(id) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        `SELECT (last_key_claim_date IS NOT NULL AND last_key_claim_date = CURRENT_DATE) AS claimed_today
         FROM users WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (user.claimed_today) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-claimed' }
      }

      const updated = await client.query(
        `UPDATE users
         SET keys = keys + 1,
             last_key_claim_date = CURRENT_DATE,
             updated_at = now()
         WHERE id = $1
         RETURNING keys`,
        [id],
      )
      await client.query('COMMIT')
      return { ok: true, keys: Number(updated.rows[0].keys) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Currency exchange, not a real purchase — gems in, clicks out, atomic.
  async buyClickPack(id, pack) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT gems FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.gems) < pack.gemCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             gems = gems - $3,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, pack.clicks, pack.gemCost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Free case: costs a key AND a previously-bought chest (see buyClickChest
  // below), repeatable infinitely — no daily cooldown, keys and owned
  // chests are what limit how often this can happen. The prize gets added
  // back in the same update — to total_clicks or to gems depending on
  // `prize.currency`. `prize` is decided by the caller (route) via the
  // server-side weighted roll — never by the client.
  async spinDailyCase(id, keyCost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT keys, owned_click_chests FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.keys) < keyCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-keys' }
      }
      if (Number(user.owned_click_chests) < 1) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-chests' }
      }

      const isGemPrize = prize.currency === 'gems'
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             gems = gems + $3,
             keys = keys - $4,
             owned_click_chests = owned_click_chests - 1,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, keys, owned_click_chests`,
        [id, isGemPrize ? 0 : prize.amount, isGemPrize ? prize.amount : 0, keyCost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        keys: Number(updated.rows[0].keys),
        ownedChests: Number(updated.rows[0].owned_click_chests),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Buys one click-chest for clicks — a prerequisite for spinDailyCase's
  // key-paid open path (the gem-paid path bypasses this entirely).
  async buyClickChest(id, cost) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT total_clicks, owned_click_chests FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.owned_click_chests) >= MAX_OWNED_CHESTS) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'chest-limit-reached' }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2,
             owned_click_chests = owned_click_chests + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, owned_click_chests`,
        [id, cost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        ownedChests: Number(updated.rows[0].owned_click_chests),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Paid, repeatable case purchase (consumable RevenueCat product — unlike
  // the daily one, no cooldown). `transactionId` is the RevenueCat store
  // transaction id, already verified as real by the route before calling
  // this; the PRIMARY KEY on redeemed_case_purchases is what actually stops
  // the same purchase being redeemed twice (e.g. a retried request).
  async redeemCasePurchase(id, transactionId, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const existing = await client.query(
        'SELECT 1 FROM redeemed_case_purchases WHERE transaction_id = $1',
        [transactionId],
      )
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-redeemed' }
      }

      await client.query(
        'INSERT INTO redeemed_case_purchases (transaction_id, user_id, prize_id, prize_amount) VALUES ($1, $2, $3, $4)',
        [transactionId, id, prize.id, prize.amount],
      )
      const isGemPrize = prize.currency === 'gems'
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             gems = gems + $3,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, isGemPrize ? 0 : prize.amount, isGemPrize ? prize.amount : 0],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Real-money key pack (consumable RevenueCat product, repeatable).
  // `transactionId` already verified as real by the route before calling
  // this; the PRIMARY KEY on redeemed_key_purchases stops the same
  // purchase being redeemed twice.
  async redeemKeyPack(id, transactionId, pack) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const existing = await client.query(
        'SELECT 1 FROM redeemed_key_purchases WHERE transaction_id = $1',
        [transactionId],
      )
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-redeemed' }
      }

      await client.query(
        'INSERT INTO redeemed_key_purchases (transaction_id, user_id, pack_id, amount) VALUES ($1, $2, $3, $4)',
        [transactionId, id, pack.id, pack.amount],
      )
      const updated = await client.query(
        'UPDATE users SET keys = keys + $2, updated_at = now() WHERE id = $1 RETURNING keys',
        [id, pack.amount],
      )
      await client.query('COMMIT')
      return { ok: true, keys: Number(updated.rows[0].keys) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Same as redeemKeyPack but for gem packs.
  async redeemGemPack(id, transactionId, pack) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const existing = await client.query(
        'SELECT 1 FROM redeemed_gem_purchases WHERE transaction_id = $1',
        [transactionId],
      )
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-redeemed' }
      }

      await client.query(
        'INSERT INTO redeemed_gem_purchases (transaction_id, user_id, pack_id, amount) VALUES ($1, $2, $3, $4)',
        [transactionId, id, pack.id, pack.amount],
      )
      const updated = await client.query(
        'UPDATE users SET gems = gems + $2, updated_at = now() WHERE id = $1 RETURNING gems',
        [id, pack.amount],
      )
      await client.query('COMMIT')
      return { ok: true, gems: Number(updated.rows[0].gems) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Gem-paid case: no RevenueCat involved, no cooldown — just spends the
  // player's own gems (already won from other cases) for another roll.
  async spendGemsForCase(id, cost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT gems FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.gems) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }

      const isGemPrize = prize.currency === 'gems'
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             gems = gems - $3 + $4,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, isGemPrize ? 0 : prize.amount, cost, isGemPrize ? prize.amount : 0],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Gem chest, paid with keys: spends keys AND a previously-bought chest
  // (see buyGemChest below), always pays out gems. The gem-paid variant
  // further down bypasses the owned-chest requirement entirely.
  async openGemChestWithKeys(id, keyCost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT keys, owned_gem_chests FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.keys) < keyCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-keys' }
      }
      if (Number(user.owned_gem_chests) < 1) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-chests' }
      }

      const updated = await client.query(
        `UPDATE users
         SET keys = keys - $2,
             gems = gems + $3,
             owned_gem_chests = owned_gem_chests - 1,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING keys, gems, owned_gem_chests`,
        [id, keyCost, prize.amount],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        keys: Number(updated.rows[0].keys),
        gems: Number(updated.rows[0].gems),
        ownedChests: Number(updated.rows[0].owned_gem_chests),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Buys one gem-chest for clicks — a prerequisite for openGemChestWithKeys.
  async buyGemChest(id, cost) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT total_clicks, owned_gem_chests FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.owned_gem_chests) >= MAX_OWNED_CHESTS) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'chest-limit-reached' }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2,
             owned_gem_chests = owned_gem_chests + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, owned_gem_chests`,
        [id, cost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        ownedChests: Number(updated.rows[0].owned_gem_chests),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Gem chest, paid with gems instead of keys — same prize table, no cooldown.
  async openGemChestWithGems(id, gemCost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT gems FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.gems) < gemCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }

      const updated = await client.query(
        `UPDATE users
         SET gems = gems - $2 + $3,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING gems`,
        [id, gemCost, prize.amount],
      )
      await client.query('COMMIT')
      return { ok: true, gems: Number(updated.rows[0].gems) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // `sortBy` only ever picks between these two fixed column names — never
  // interpolates the raw query param — so there's no injection surface.
  async getLeaderboard(limit = 100, sortBy = 'clicks') {
    const column = sortBy === 'cps' ? 'best_cps' : 'total_clicks'
    const result = await database.query(
      `SELECT id, username, avatar_url, total_clicks, best_cps
       FROM users
       WHERE ${column} > 0
       ORDER BY ${column} DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalClicks: Number(row.total_clicks),
      bestCps: Number(row.best_cps),
    }))
  },
}
