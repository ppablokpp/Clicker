import { database } from './pool.js'

export const usersRepository = {
  // Runs once per session (from the sync-on-login call), so the streak math
  // being a bit repetitive in SQL here is fine — it's not on the hot path.
  async upsertFromClerk({ id, email, username, avatarUrl }) {
    const result = await database.query(
      `INSERT INTO users (id, email, username, avatar_url, current_streak, longest_streak, last_active_date)
       VALUES ($1, $2, $3, $4, 1, 1, CURRENT_DATE)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             username = EXCLUDED.username,
             avatar_url = EXCLUDED.avatar_url,
             current_streak = CASE
               WHEN users.last_active_date = CURRENT_DATE THEN users.current_streak
               WHEN users.last_active_date = CURRENT_DATE - 1 THEN users.current_streak + 1
               ELSE 1
             END,
             longest_streak = GREATEST(
               users.longest_streak,
               CASE
                 WHEN users.last_active_date = CURRENT_DATE THEN users.current_streak
                 WHEN users.last_active_date = CURRENT_DATE - 1 THEN users.current_streak + 1
                 ELSE 1
               END
             ),
             last_active_date = CURRENT_DATE,
             updated_at = now()
       RETURNING id, email, username, avatar_url, total_clicks, best_cps, current_streak, longest_streak,
                 active_powerup, active_powerup_expires_at, active_luck_powerup, active_luck_powerup_expires_at,
                 powerup_cooldown_until, luck_powerup_cooldown_until,
                 milestone_bonus_multiplier, created_at, cases_opened, gems, keys,
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
  // ahead of the Clerk profile sync never loses clicks.
  async incrementClicks(id, amount, peakCps = 0) {
    const result = await database.query(
      `INSERT INTO users (id, total_clicks, best_cps)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
         SET total_clicks = users.total_clicks + EXCLUDED.total_clicks,
             best_cps = GREATEST(users.best_cps, EXCLUDED.best_cps),
             updated_at = now()
       RETURNING total_clicks, best_cps`,
      [id, amount, peakCps],
    )
    return {
      totalClicks: Number(result.rows[0].total_clicks),
      bestCps: Number(result.rows[0].best_cps),
    }
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

  // Free case: costs clicks AND a key, repeatable infinitely (no daily
  // cooldown — the key itself is what limits how often this can happen).
  // The prize gets added back in the same update — to total_clicks or to
  // gems depending on `prize.currency`. `prize` is decided by the caller
  // (route) via the server-side weighted roll — never by the client.
  async spinDailyCase(id, cost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT total_clicks, keys FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.keys) < 1) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-keys' }
      }
      if (Number(user.total_clicks) < cost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const isGemPrize = prize.currency === 'gems'
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks - $2 + $3,
             gems = gems + $4,
             keys = keys - 1,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, keys`,
        [id, cost, isGemPrize ? 0 : prize.amount, isGemPrize ? prize.amount : 0],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        keys: Number(updated.rows[0].keys),
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

  async getLeaderboard(limit = 100) {
    const result = await database.query(
      `SELECT id, username, avatar_url, total_clicks
       FROM users
       WHERE total_clicks > 0
       ORDER BY total_clicks DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalClicks: Number(row.total_clicks),
    }))
  },
}
