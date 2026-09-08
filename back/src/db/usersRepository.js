import { database } from './pool.js'
import { applyObjectProgress } from '../game/spaceObjects.js'
import { TRAJECTORY_TIER_THRESHOLDS, TRAJECTORY_TIER_COUNT, prestigeTierMultiplier } from '../game/trajectory.js'
import { accrueProduction } from './treeRepository.js'

// Applies to both chest types â€” buying more than this just sits unopened,
// so it's a soft cap on hoarding rather than a scarcity mechanic.
const MAX_OWNED_CHESTS = 10

// Chest/pack prices and material payouts scale with prestige tier just like
// the tree (see treeRepository's scaleCost) â€” a chest that costs 1000 clicks
// or a case that pays out 3000 clicks at Amatista should cost/pay 5000/
// 15000 at Platino, since 1000 clicks means something completely different
// once every other number in the game has grown 5x. Keys and gems are left
// untouched everywhere â€” this only ever applies to a `clicks`-denominated
// amount (a cost paid in clicks, or a prize whose currency is 'clicks').
function scaleMaterialAmount(amount, prestigeTier) {
  return amount * prestigeTierMultiplier(Number(prestigeTier))
}

export const usersRepository = {
  // Runs once per session (from the sync-on-login call) â€” just profile
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
       RETURNING id, email, username, avatar_url, total_clicks, total_real_clicks, best_cps, current_streak, longest_streak,
                 active_powerup, active_powerup_expires_at, active_luck_powerup, active_luck_powerup_expires_at,
                 powerup_cooldown_until, luck_powerup_cooldown_until,
                 milestone_bonus_multiplier, created_at, cases_opened, gems, keys,
                 owned_click_chests, owned_gem_chests, tutorial_completed, astronaut_style,
                 (last_key_claim_date IS NOT NULL AND last_key_claim_date = CURRENT_DATE) AS key_claimed_today`,
      [id, email, username, avatarUrl],
    )
    return result.rows[0]
  },

  // Cosmetic only â€” see migration 035 for why the server stores these ids
  // without knowing what they mean. The caller has already validated the
  // shape; this just writes it.
  async updateAstronautStyle(id, style) {
    const result = await database.query(
      `UPDATE users SET astronaut_style = $2, updated_at = now() WHERE id = $1 RETURNING astronaut_style`,
      [id, style],
    )
    return result.rows[0]?.astronaut_style ?? null
  },

  // Creates the row a guest (`anon_<uuid>`) id needs to exist before any
  // other route can write child data against it â€” every child table's
  // `user_id` is a real foreign key to `users(id)`. No Clerk profile to
  // pull in here, unlike upsertFromClerk, so this is a bare insert: every
  // other column just takes its own schema DEFAULT, identical to what a
  // brand-new real account starts with too.
  async ensureAnonUser(id) {
    await database.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [id])
  },

  // Folds a guest session's progress into the account it just signed into,
  // or discards it â€” whichever is safe. Product decision (confirmed
  // explicitly, not assumed): if the Clerk account already has *any*
  // progress of its own â€” meaning it was signed into before, quite
  // possibly from a different device â€” that progress is never touched.
  // Only a genuinely fresh account (never clicked, ever) adopts the guest
  // data, wholesale. Returns whether it actually claimed anything.
  //
  // "Fresh" is checked against total_clicks/lifetime_platino rather than
  // "does a row exist" â€” /sync's own upsert means the Clerk row already
  // exists by the time this runs (the frontend always calls /sync first),
  // so existence alone can't distinguish a brand-new account from a
  // returning one.
  async claimAnonymousProgress(anonId, clerkId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(`SELECT * FROM users WHERE id = ANY($1) FOR UPDATE`, [[clerkId, anonId]])
      const clerkRow = rows.find((r) => r.id === clerkId)
      const anonRow = rows.find((r) => r.id === anonId)

      // Nothing to claim (the guest row was never created, or already
      // claimed once) or nowhere safe to attach it (frontend always syncs
      // before calling this â€” a missing Clerk row means that didn't
      // happen, so there's nothing to guess at here).
      if (!anonRow || !clerkRow) {
        await client.query('ROLLBACK')
        return false
      }

      const isFresh = Number(clerkRow.total_clicks) === 0 && Number(clerkRow.lifetime_platino) === 0
      if (!isFresh) {
        // Real progress already exists on this account â€” leave it exactly
        // as it is. The guest row is simply left behind: orphaned, but
        // harmless (nothing ever queries or displays a `anon_...` row
        // again once it's not the id in local storage anymore).
        await client.query('ROLLBACK')
        return false
      }

      // Re-point every child table's rows from the guest id to the real
      // one. The six tables where `user_id` is part of the primary key go
      // through an insert-or-skip-duplicate + delete â€” defends against a
      // same-key row already existing on the destination, even though
      // `isFresh` above already makes that practically impossible for an
      // account that's never clicked. The three purchase-log tables key on
      // their own transaction_id instead, so a plain UPDATE can never
      // collide regardless.
      await client.query(
        `INSERT INTO click_days (user_id, click_date)
         SELECT $2, click_date FROM click_days WHERE user_id = $1
         ON CONFLICT (user_id, click_date) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(
        `INSERT INTO user_inventory (user_id, item_id, quantity)
         SELECT $2, item_id, quantity FROM user_inventory WHERE user_id = $1
         ON CONFLICT (user_id, item_id) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(
        `INSERT INTO user_milestone_claims (user_id, category_key, milestone, claimed_at)
         SELECT $2, category_key, milestone, claimed_at FROM user_milestone_claims WHERE user_id = $1
         ON CONFLICT (milestone, category_key, user_id) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(
        `INSERT INTO user_permanent_upgrades (user_id, upgrade_id, purchased_at, level, last_tick_at, remainder)
         SELECT $2, upgrade_id, purchased_at, level, last_tick_at, remainder FROM user_permanent_upgrades WHERE user_id = $1
         ON CONFLICT (upgrade_id, user_id) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(
        `INSERT INTO user_prestige_upgrades (user_id, upgrade_id, level)
         SELECT $2, upgrade_id, level FROM user_prestige_upgrades WHERE user_id = $1
         ON CONFLICT (upgrade_id, user_id) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(
        `INSERT INTO user_task_claims (user_id, task_id, claimed_at)
         SELECT $2, task_id, claimed_at FROM user_task_claims WHERE user_id = $1
         ON CONFLICT (user_id, task_id) DO NOTHING`,
        [anonId, clerkId],
      )
      await client.query(`UPDATE redeemed_case_purchases SET user_id = $2 WHERE user_id = $1`, [anonId, clerkId])
      await client.query(`UPDATE redeemed_gem_purchases SET user_id = $2 WHERE user_id = $1`, [anonId, clerkId])
      await client.query(`UPDATE redeemed_key_purchases SET user_id = $2 WHERE user_id = $1`, [anonId, clerkId])
      // Every child row above is now either re-pointed or discarded as a
      // duplicate â€” safe to clear whatever's left under the guest id.
      await client.query(`DELETE FROM click_days WHERE user_id = $1`, [anonId])
      await client.query(`DELETE FROM user_inventory WHERE user_id = $1`, [anonId])
      await client.query(`DELETE FROM user_milestone_claims WHERE user_id = $1`, [anonId])
      await client.query(`DELETE FROM user_permanent_upgrades WHERE user_id = $1`, [anonId])
      await client.query(`DELETE FROM user_prestige_upgrades WHERE user_id = $1`, [anonId])
      await client.query(`DELETE FROM user_task_claims WHERE user_id = $1`, [anonId])

      // Fold the guest's own game-state columns onto the (still-fresh)
      // Clerk row â€” everything except identity/profile fields, which are
      // already correctly set from Clerk itself via /sync and must never
      // be overwritten by a guest row that never had any of them.
      await client.query(
        `UPDATE users AS u SET
           total_clicks = a.total_clicks,
           best_cps = a.best_cps,
           current_streak = a.current_streak,
           longest_streak = a.longest_streak,
           last_active_date = a.last_active_date,
           active_powerup = a.active_powerup,
           active_powerup_expires_at = a.active_powerup_expires_at,
           milestone_bonus_multiplier = a.milestone_bonus_multiplier,
           active_luck_powerup = a.active_luck_powerup,
           active_luck_powerup_expires_at = a.active_luck_powerup_expires_at,
           powerup_cooldown_until = a.powerup_cooldown_until,
           luck_powerup_cooldown_until = a.luck_powerup_cooldown_until,
           last_key_claim_date = a.last_key_claim_date,
           cases_opened = a.cases_opened,
           gems = a.gems,
           keys = a.keys,
           owned_click_chests = a.owned_click_chests,
           owned_gem_chests = a.owned_gem_chests,
           total_real_clicks = a.total_real_clicks,
           objects_broken = a.objects_broken,
           object_progress = a.object_progress,
           prestige_points = a.prestige_points,
           lifetime_platino = a.lifetime_platino,
           prestige_tier = a.prestige_tier,
           last_event_reward_at = a.last_event_reward_at,
           anomalies_neutralized = a.anomalies_neutralized,
           tutorial_completed = a.tutorial_completed,
           lucky_clicks_found = a.lucky_clicks_found,
           updated_at = now()
         FROM users AS a
         WHERE u.id = $1 AND a.id = $2`,
        [clerkId, anonId],
      )
      await client.query(`DELETE FROM users WHERE id = $1`, [anonId])

      await client.query('COMMIT')
      return true
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // The "already claimed today" flag is computed in SQL against CURRENT_DATE
  // rather than in JS â€” comparing a DATE column's parsed value against
  // "today" in JS risks a timezone mismatch with what the DB considers today.
  async getById(id) {
    const result = await database.query(
      `SELECT *, (last_key_claim_date IS NOT NULL AND last_key_claim_date = CURRENT_DATE) AS key_claimed_today
       FROM users WHERE id = $1`,
      [id],
    )
    return result.rows[0] ?? null
  },

  // Powers the initial /api/clicks/me sync â€” includes the space-object
  // progress alongside the currency total so a page refresh doesn't
  // visually reset the object back to 0 while the real state reloads.
  async getClickState(id) {
    const result = await database.query(
      'SELECT total_clicks, lifetime_platino, objects_broken, object_progress, prestige_tier, lucky_clicks_found FROM users WHERE id = $1',
      [id],
    )
    const row = result.rows[0]
    return {
      totalClicks: Number(row?.total_clicks ?? 0),
      lifetimePlatino: Number(row?.lifetime_platino ?? 0),
      objectsBroken: Number(row?.objects_broken ?? 0),
      objectProgress: Number(row?.object_progress ?? 0),
      prestigeTier: Number(row?.prestige_tier ?? 0),
      luckyClicksFound: Number(row?.lucky_clicks_found ?? 0),
    }
  },

  // Lightest possible read for scaling a shop catalog's material-denominated
  // numbers to the caller's tier before they've even opened it (see the
  // dailyCase/gemChest/clickPacks GET routes) â€” no FOR UPDATE, this never
  // participates in a write transaction.
  async getPrestigeTier(id) {
    const result = await database.query('SELECT prestige_tier FROM users WHERE id = $1', [id])
    return Number(result.rows[0]?.prestige_tier ?? 0)
  },

  // Trayectoria's manual prestige step â€” the player's confirmed tier
  // (prestige_tier) only ever advances here, never automatically just from
  // lifetime_platino crossing the next threshold, so they keep farming the
  // current tier's material for as long as they want past that point.
  // lifetime_platino itself is untouched (it never resets, by design â€” see
  // migration 028); total_clicks (the current, spendable platino) zeroes
  // out, same as a fresh tier's own extraction run starting at 0, and every
  // tree node's owned level resets to 0 too (DELETE, not just zeroing â€”
  // user_permanent_upgrades rows simply stop existing, same shape the old
  // Reactor reset used). Only *progress* resets: every node's own cost
  // curve and per-level output (tree/*.js) are pure functions of level, so
  // they're completely unaffected â€” next run costs and produces exactly
  // the same at level 1 as this run's level 1 did. user_prestige_upgrades
  // (the old Reactor) is a deliberately separate table (see migration 026)
  // so it's untouched by this DELETE, same as the old reset relied on.
  async confirmPrestige(userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      // lifetime_platino only advances when this runs (see
      // treeRepository.js's accrueProduction) â€” force it first so hitting
      // the next tier's threshold via unflushed drone production isn't
      // wrongly rejected as not-eligible.
      const accrued = await accrueProduction(client, userId)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const userRow = await client.query(
        'SELECT lifetime_platino, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const currentTier = Number(userRow.rows[0].prestige_tier)
      const nextTier = currentTier + 1
      if (nextTier >= TRAJECTORY_TIER_COUNT) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-maxed' }
      }

      const lifetimePlatino = Number(userRow.rows[0].lifetime_platino)
      const requiredPlatino = TRAJECTORY_TIER_THRESHOLDS[nextTier]
      if (lifetimePlatino < requiredPlatino) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-eligible' }
      }

      const updated = await client.query(
        `UPDATE users SET total_clicks = 0, prestige_tier = $2 WHERE id = $1
         RETURNING total_clicks, prestige_tier, lifetime_platino`,
        [userId, nextTier],
      )

      await client.query('DELETE FROM user_permanent_upgrades WHERE user_id = $1', [userId])

      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        prestigeTier: Number(updated.rows[0].prestige_tier),
        lifetimePlatino: Number(updated.rows[0].lifetime_platino),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Upserts on the id alone (no email/username yet) so an increment that races
  // ahead of the Clerk profile sync never loses clicks. Also marks today in
  // click_days (for the stats-page calendar) and updates the streak, all in
  // the same round trip:
  //   - today_check/yesterday_check read click_days BEFORE any write here,
  //     so they reflect "was today already marked by an earlier flush" and
  //     "was yesterday clicked at all".
  //   - the streak only moves the first time a given day is marked: already
  //     clicked today â†’ unchanged; clicked yesterday â†’ +1; otherwise â†’ reset
  //     to 1. A user's very first-ever click also lands in the "reset to 1"
  //     branch, since they'd have no click_days rows yet either.
  //   - day_marked runs last, selecting FROM updated purely to force it
  //     after the user upsert, so a brand-new user's very first click
  //     doesn't violate the FK before the row exists.
  //   - total_real_clicks tracks genuine screen taps only (always +1 per
  //     tap, regardless of multipliers/luck) â€” a separate stat from
  //     total_clicks, which is the multiplied economy value. The caller
  //     (routes/clicks.js) is responsible for capping realClicks <= amount.
  //
  // This used to also roll the magnets' per-click chance at keys and gems.
  // Magnets are gone: clicking was never meant to be a way to earn either of
  // those, and the roll was per unit of click *value* rather than per tap, so
  // once multipliers shipped a 10-second magnet was handing out ~100 gems.
  async incrementClicks(id, amount, peakCps = 0, clientDate = null, realClicks = 0, luckyHits = 0) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `WITH effective_date AS (
         -- The client sends its own local calendar date (e.g. UTC+2 at
         -- 00:30 is already "tomorrow" locally while the DB server is still
         -- on yesterday's UTC date) â€” trusted only within one day of the
         -- server's own date either way, since no real timezone offset can
         -- disagree by more than that, so a bogus value just falls back to
         -- CURRENT_DATE instead of letting a client fake an arbitrary day.
         SELECT CASE
           WHEN $4::date IS NOT NULL AND $4::date BETWEEN CURRENT_DATE - 1 AND CURRENT_DATE + 1
             THEN $4::date
           ELSE CURRENT_DATE
         END AS d
       ),
       today_check AS (
         SELECT EXISTS (
           SELECT 1 FROM click_days WHERE user_id = $1 AND click_date = (SELECT d FROM effective_date)
         ) AS clicked_today
       ),
       yesterday_check AS (
         SELECT EXISTS (
           SELECT 1 FROM click_days WHERE user_id = $1 AND click_date = (SELECT d FROM effective_date) - 1
         ) AS clicked_yesterday
       ),
       updated AS (
         INSERT INTO users (id, total_clicks, total_real_clicks, best_cps, current_streak, longest_streak, object_progress, lifetime_platino, lucky_clicks_found)
         VALUES ($1, $2, $5, $3, 1, 1, $2, $2, $6)
         ON CONFLICT (id) DO UPDATE
           SET total_clicks = users.total_clicks + EXCLUDED.total_clicks,
               lifetime_platino = users.lifetime_platino + EXCLUDED.lifetime_platino,
               total_real_clicks = users.total_real_clicks + EXCLUDED.total_real_clicks,
               lucky_clicks_found = users.lucky_clicks_found + EXCLUDED.lucky_clicks_found,
               best_cps = GREATEST(users.best_cps, EXCLUDED.best_cps),
               -- Same raw click amount that credits total_clicks also
               -- chips away at the current space object â€” see
               -- game/spaceObjects.js for the break-threshold loop applied
               -- to this in JS just below (objects_broken itself isn't
               -- touched here, only the running progress toward it).
               object_progress = users.object_progress + EXCLUDED.total_clicks,
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
         RETURNING total_clicks, lifetime_platino, total_real_clicks, best_cps, keys, gems, objects_broken, object_progress, lucky_clicks_found
       ),
       day_marked AS (
         INSERT INTO click_days (user_id, click_date)
         SELECT $1, (SELECT d FROM effective_date) FROM updated
         ON CONFLICT (user_id, click_date) DO NOTHING
       )
       SELECT total_clicks, lifetime_platino, total_real_clicks, best_cps, keys, gems, objects_broken, object_progress, lucky_clicks_found FROM updated`,
        [id, amount, peakCps, clientDate, realClicks, luckyHits],
      )

      const row = result.rows[0]
      const { objectsBroken, objectProgress, broken } = applyObjectProgress(
        Number(row.objects_broken),
        0,
        Number(row.object_progress),
      )
      if (broken > 0) {
        await client.query('UPDATE users SET objects_broken = $2, object_progress = $3 WHERE id = $1', [
          id,
          objectsBroken,
          objectProgress,
        ])
      }

      await client.query('COMMIT')
      return {
        totalClicks: Number(row.total_clicks),
        lifetimePlatino: Number(row.lifetime_platino),
        totalRealClicks: Number(row.total_real_clicks),
        bestCps: Number(row.best_cps),
        keys: Number(row.keys),
        gems: Number(row.gems),
        objectsBroken,
        objectProgress,
        luckyClicksFound: Number(row.lucky_clicks_found),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Every day the user has ever clicked at least once â€” powers the
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

  // Buying ANY tier locks the whole category (all 4 tiers) for an hour â€”
  // otherwise a powerup that's net-positive while actively clicking becomes
  // an infinite money printer (buy it back the instant it expires, forever).
  // Row-locked transaction so we can tell "on cooldown" apart from "can't
  // afford it" instead of just returning null for both. Buying no longer
  // activates anything â€” it just adds one to the owned count in
  // user_inventory (see activatePowerup below for the separate action that
  // actually starts the timer, called from the inventory).
  // `cost` comes in as the flat, tier-0 catalog value; scaled to the
  // buyer's own tier here when it's clicks-priced (the two gem-priced tiers
  // are left untouched, same rule as everywhere else â€” see
  // scaleMaterialAmount).
  async buyPowerup(id, powerupId, cost, currency = 'clicks') {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      // Credits pending drone production first â€” total_clicks only advances
      // when this runs (see treeRepository.js's accrueProduction), so a
      // click-priced tier could otherwise get wrongly rejected as
      // not-enough-clicks against a total that's up to 30s stale.
      const accrued = await accrueProduction(client, id)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const row = await client.query(
        'SELECT total_clicks, gems, powerup_cooldown_until, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      user.total_clicks = accrued.totalClicks
      user.prestige_tier = accrued.prestigeTier
      if (user.powerup_cooldown_until && new Date(user.powerup_cooldown_until) > new Date()) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'cooldown', cooldownUntil: user.powerup_cooldown_until }
      }
      // The top two tiers are gem-priced instead of click-priced â€” same
      // cooldown either way, just a different balance column to check/spend.
      const balanceColumn = currency === 'gems' ? 'gems' : 'total_clicks'
      const scaledCost = currency === 'gems' ? cost : scaleMaterialAmount(cost, user.prestige_tier)
      if (Number(user[balanceColumn]) < scaledCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: currency === 'gems' ? 'not-enough-gems' : 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET ${balanceColumn} = ${balanceColumn} - $2,
             powerup_cooldown_until = now() + interval '1 hour',
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, powerup_cooldown_until`,
        [id, scaledCost],
      )
      await client.query(
        `INSERT INTO user_inventory (user_id, item_id, quantity)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + 1`,
        [id, powerupId],
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

  // Consumes one owned unit of `powerupId` from the inventory and starts it
  // running â€” refuses if another click-multiplier tier is already active
  // (only one at a time per category, same as before) or if none are owned.
  async activatePowerup(id, powerupId, durationSeconds) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT active_powerup, active_powerup_expires_at FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const isActive =
        user.active_powerup && user.active_powerup_expires_at && new Date(user.active_powerup_expires_at) > new Date()
      if (isActive) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-active' }
      }

      const inv = await client.query(
        'SELECT quantity FROM user_inventory WHERE user_id = $1 AND item_id = $2 FOR UPDATE',
        [id, powerupId],
      )
      if (Number(inv.rows[0]?.quantity ?? 0) < 1) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-owned' }
      }

      await client.query(
        'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = $1 AND item_id = $2',
        [id, powerupId],
      )
      const updated = await client.query(
        `UPDATE users
         SET active_powerup = $2,
             active_powerup_expires_at = now() + make_interval(secs => $3),
             updated_at = now()
         WHERE id = $1
         RETURNING active_powerup, active_powerup_expires_at`,
        [id, powerupId, durationSeconds],
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
  // click-multiplier powerup and a timed luck powerup can run â€” and be on
  // cooldown â€” independently of each other. Buying only adds to inventory,
  // same as buyPowerup â€” see activateTimedLuckPowerup for activation.
  // Same tier-scaling rule as buyPowerup: clicks-priced tiers scale,
  // gem-priced tiers don't.
  async buyTimedLuckPowerup(id, powerupId, cost, currency = 'clicks') {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      // Credits pending drone production first â€” see buyPowerup's own
      // comment for why.
      const accrued = await accrueProduction(client, id)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const row = await client.query(
        'SELECT total_clicks, gems, luck_powerup_cooldown_until, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      user.total_clicks = accrued.totalClicks
      user.prestige_tier = accrued.prestigeTier
      if (user.luck_powerup_cooldown_until && new Date(user.luck_powerup_cooldown_until) > new Date()) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'cooldown', cooldownUntil: user.luck_powerup_cooldown_until }
      }
      // The top two tiers are gem-priced instead of click-priced â€” same
      // cooldown either way, just a different balance column to check/spend.
      const balanceColumn = currency === 'gems' ? 'gems' : 'total_clicks'
      const scaledCost = currency === 'gems' ? cost : scaleMaterialAmount(cost, user.prestige_tier)
      if (Number(user[balanceColumn]) < scaledCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: currency === 'gems' ? 'not-enough-gems' : 'not-enough-clicks' }
      }

      const updated = await client.query(
        `UPDATE users
         SET ${balanceColumn} = ${balanceColumn} - $2,
             luck_powerup_cooldown_until = now() + interval '1 hour',
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, luck_powerup_cooldown_until`,
        [id, scaledCost],
      )
      await client.query(
        `INSERT INTO user_inventory (user_id, item_id, quantity)
         VALUES ($1, $2, 1)
         ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + 1`,
        [id, powerupId],
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

  // Same idea as activatePowerup, in the active_luck_powerup slot.
  async activateTimedLuckPowerup(id, powerupId, durationSeconds) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT active_luck_powerup, active_luck_powerup_expires_at FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const isActive =
        user.active_luck_powerup &&
        user.active_luck_powerup_expires_at &&
        new Date(user.active_luck_powerup_expires_at) > new Date()
      if (isActive) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-active' }
      }

      const inv = await client.query(
        'SELECT quantity FROM user_inventory WHERE user_id = $1 AND item_id = $2 FOR UPDATE',
        [id, powerupId],
      )
      if (Number(inv.rows[0]?.quantity ?? 0) < 1) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-owned' }
      }

      await client.query(
        'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = $1 AND item_id = $2',
        [id, powerupId],
      )
      const updated = await client.query(
        `UPDATE users
         SET active_luck_powerup = $2,
             active_luck_powerup_expires_at = now() + make_interval(secs => $3),
             updated_at = now()
         WHERE id = $1
         RETURNING active_luck_powerup, active_luck_powerup_expires_at`,
        [id, powerupId, durationSeconds],
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

  // All owned (quantity > 0) inventory items for the "Inventory" modal â€”
  // returned as a plain {itemId: quantity} map, cross-referenced against
  // each powerup catalog on the frontend for names/costs/durations.
  async getInventory(id) {
    const result = await database.query(
      'SELECT item_id, quantity FROM user_inventory WHERE user_id = $1 AND quantity > 0',
      [id],
    )
    return Object.fromEntries(result.rows.map((r) => [r.item_id, Number(r.quantity)]))
  },

  // Once per calendar day, grants exactly one key â€” the same cooldown
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

  // Currency exchange, not a real purchase â€” gems in, clicks out, atomic.
  // gemCost is left as-is; the clicks side scales with prestige tier (see
  // scaleMaterialAmount) so a pack is always worth the same *relative* chunk
  // of material, whatever tier the buyer is on.
  async buyClickPack(id, pack) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT gems, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.gems) < pack.gemCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }

      const scaledClicks = scaleMaterialAmount(pack.clicks, user.prestige_tier)
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             lifetime_platino = lifetime_platino + $2,
             gems = gems - $3,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, scaledClicks, pack.gemCost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        clicksGranted: scaledClicks,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Free case: costs a key AND a previously-bought chest (see buyClickChest
  // below), repeatable infinitely â€” no daily cooldown, keys and owned
  // chests are what limit how often this can happen. The prize gets added
  // back in the same update â€” to total_clicks or to gems depending on
  // `prize.currency`. `prize` is decided by the caller (route) via the
  // server-side weighted roll â€” never by the client.
  async spinDailyCase(id, keyCost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query(
        'SELECT keys, owned_click_chests, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
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
      const prizeAmount = isGemPrize ? prize.amount : scaleMaterialAmount(prize.amount, user.prestige_tier)
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             lifetime_platino = lifetime_platino + $2,
             gems = gems + $3,
             keys = keys - $4,
             owned_click_chests = owned_click_chests - 1,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, keys, owned_click_chests`,
        [id, isGemPrize ? 0 : prizeAmount, isGemPrize ? prizeAmount : 0, keyCost],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        keys: Number(updated.rows[0].keys),
        ownedChests: Number(updated.rows[0].owned_click_chests),
        prizeAmount,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Every cosmetic this user has won, as "slot:itemId" keys.
  async getOwnedCosmetics(id) {
    const result = await database.query(
      'SELECT slot, item_id FROM user_cosmetics WHERE user_id = $1',
      [id],
    )
    return result.rows.map((r) => `${r.slot}:${r.item_id}`)
  },

  /**
   * Buys one or more cosmetics with gems and equips them in the same breath.
   *
   * One transaction for the whole basket, same reasoning as the chest bench:
   * the fitting room lets a player try on a complete look and buy it with one
   * button, so a partial success would charge for half an outfit and leave
   * the other half still locked under a preview they thought they'd bought.
   *
   * `items` is already validated and priced by the caller; the gem balance is
   * re-checked here inside the lock because the client's copy of it is always
   * one click flush behind.
   */
  async buyCosmetics(id, items, totalCost, styleUpdate) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      // Lock the row first so a concurrent purchase (two tabs, double tap)
      // can't read the same balance twice and spend it twice.
      const owned = await client.query(
        'SELECT slot, item_id FROM user_cosmetics WHERE user_id = $1 FOR UPDATE',
        [id],
      )
      const ownedKeys = new Set(owned.rows.map((r) => `${r.slot}:${r.item_id}`))
      if (items.some((item) => ownedKeys.has(`${item.slot}:${item.itemId}`))) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'already-owned' }
      }

      const spent = await client.query(
        'UPDATE users SET gems = gems - $2, updated_at = now() WHERE id = $1 AND gems >= $2 RETURNING gems',
        [id, totalCost],
      )
      if (spent.rowCount === 0) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-gems' }
      }

      for (const item of items) {
        await client.query(
          'INSERT INTO user_cosmetics (user_id, slot, item_id) VALUES ($1, $2, $3)',
          [id, item.slot, item.itemId],
        )
      }

      // Equipping is part of the purchase, not a second request: the player
      // is looking at the piece on their astronaut when they press buy, so
      // anything other than "it stays on" would read as the purchase failing.
      let astronautStyle = null
      if (styleUpdate) {
        const saved = await client.query(
          'UPDATE users SET astronaut_style = $2, updated_at = now() WHERE id = $1 RETURNING astronaut_style',
          [id, styleUpdate],
        )
        astronautStyle = saved.rows[0]?.astronaut_style ?? null
      }

      await client.query('COMMIT')
      return {
        ok: true,
        gems: Number(spent.rows[0].gems),
        owned: [...ownedKeys, ...items.map((item) => `${item.slot}:${item.itemId}`)],
        astronautStyle,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Opens a whole bench of chests at once, paying for the lot in keys and
  // nothing else â€” no owned-chest inventory to draw down, which is the point
  // of the bench (see store/chestBench.js).
  //
  // One transaction for the whole batch on purpose: five separate calls could
  // half-succeed, and a client that has already started five reels has no
  // sensible way to unwind the three that landed. Either the keys leave and
  // every prize is granted, or nothing happened.
  //
  // `plan` is [{ chest, kind, prize? }] in bench order. Currency prizes are
  // already rolled by the route; cosmetics are rolled here, because their
  // pool depends on what this user owns and that can only be read safely
  // under the same lock that's about to spend their keys.
  async openChestBatch(id, keyCost, plan, rollCosmetic) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT keys, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [id])
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(user.keys) < keyCost) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-keys' }
      }

      // No FOR UPDATE needed here: two concurrent pulls by the same user
      // already serialize on the users row locked above, and that's the only
      // race that could hand out the same piece twice.
      const ownedRows = await client.query(
        'SELECT slot, item_id FROM user_cosmetics WHERE user_id = $1',
        [id],
      )
      const owned = new Set(ownedRows.rows.map((r) => `${r.slot}:${r.item_id}`))

      const results = []
      for (const step of plan) {
        if (step.kind === 'cosmetic') {
          const item = rollCosmetic(step.chest, owned)
          if (!item) {
            // Nothing left in that chest for them. Fails the whole batch
            // rather than silently opening four of the five â€” the client
            // greys the chest out before this can normally happen, so
            // reaching here means the collection filled up mid-pull.
            await client.query('ROLLBACK')
            return { ok: false, reason: 'collection-complete' }
          }
          // Added to the set immediately so a second style chest in the same
          // batch can't roll what the first one just won.
          owned.add(`${item.slot}:${item.itemId}`)
          results.push({ chest: step.chest, kind: 'cosmetic', slot: item.slot, itemId: item.itemId })
        } else {
          // Material prizes scale to the opener's tier; gem prizes never do.
          // Scaled here rather than in the route because the tier is read
          // inside this same locked row â€” a prestige committed between the
          // two would otherwise pay out at the wrong multiplier.
          const { prize } = step
          const isGems = prize.currency === 'gems'
          results.push({
            chest: step.chest,
            kind: 'currency',
            prizeId: prize.id,
            currency: isGems ? 'gems' : 'clicks',
            prizeAmount: isGems ? prize.amount : scaleMaterialAmount(prize.amount, user.prestige_tier),
          })
        }
      }

      const won = results.filter((r) => r.kind === 'cosmetic')
      if (won.length > 0) {
        await client.query(
          `INSERT INTO user_cosmetics (user_id, slot, item_id)
           SELECT $1::text, * FROM UNNEST($2::text[], $3::text[])
           ON CONFLICT DO NOTHING`,
          [id, won.map((r) => r.slot), won.map((r) => r.itemId)],
        )
      }

      const clicksDelta = results.reduce(
        (sum, r) => (r.kind === 'currency' && r.currency === 'clicks' ? sum + r.prizeAmount : sum),
        0,
      )
      const gemsDelta = results.reduce(
        (sum, r) => (r.kind === 'currency' && r.currency === 'gems' ? sum + r.prizeAmount : sum),
        0,
      )

      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             lifetime_platino = lifetime_platino + $2,
             gems = gems + $3,
             keys = keys - $4,
             cases_opened = cases_opened + $5,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems, keys`,
        [id, clicksDelta, gemsDelta, keyCost, results.length],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        keys: Number(updated.rows[0].keys),
        results,
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Buys one click-chest for clicks â€” a prerequisite for spinDailyCase's
  // key-paid open path (the gem-paid path bypasses this entirely). `cost`
  // comes in as the flat, tier-0 constant; scaled to the buyer's own tier
  // here, same as every tree upgrade's cost.
  async buyClickChest(id, cost) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      // Credits pending drone production first â€” see buyPowerup's own
      // comment for why.
      const accrued = await accrueProduction(client, id)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const row = await client.query(
        'SELECT total_clicks, owned_click_chests, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      user.total_clicks = accrued.totalClicks
      user.prestige_tier = accrued.prestigeTier
      if (Number(user.owned_click_chests) >= MAX_OWNED_CHESTS) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'chest-limit-reached' }
      }
      const scaledCost = scaleMaterialAmount(cost, user.prestige_tier)
      if (Number(user.total_clicks) < scaledCost) {
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
        [id, scaledCost],
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

  // Paid, repeatable case purchase (consumable RevenueCat product â€” unlike
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

      const userRow = await client.query('SELECT prestige_tier FROM users WHERE id = $1 FOR UPDATE', [id])
      if (!userRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const isGemPrize = prize.currency === 'gems'
      const prizeAmount = isGemPrize ? prize.amount : scaleMaterialAmount(prize.amount, userRow.rows[0].prestige_tier)
      await client.query(
        'INSERT INTO redeemed_case_purchases (transaction_id, user_id, prize_id, prize_amount) VALUES ($1, $2, $3, $4)',
        [transactionId, id, prize.id, prizeAmount],
      )
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             lifetime_platino = lifetime_platino + $2,
             gems = gems + $3,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, isGemPrize ? 0 : prizeAmount, isGemPrize ? prizeAmount : 0],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        gems: Number(updated.rows[0].gems),
        prizeAmount,
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

  // Gem-paid case: no RevenueCat involved, no cooldown â€” just spends the
  // player's own gems (already won from other cases) for another roll.
  async spendGemsForCase(id, cost, prize) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      const row = await client.query('SELECT gems, prestige_tier FROM users WHERE id = $1 FOR UPDATE', [id])
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
      const prizeAmount = isGemPrize ? prize.amount : scaleMaterialAmount(prize.amount, user.prestige_tier)
      const updated = await client.query(
        `UPDATE users
         SET total_clicks = total_clicks + $2,
             lifetime_platino = lifetime_platino + $2,
             gems = gems - $3 + $4,
             cases_opened = cases_opened + 1,
             updated_at = now()
         WHERE id = $1
         RETURNING total_clicks, gems`,
        [id, isGemPrize ? 0 : prizeAmount, cost, isGemPrize ? prizeAmount : 0],
      )
      await client.query('COMMIT')
      return {
        ok: true,
        totalClicks: Number(updated.rows[0].total_clicks),
        prizeAmount,
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

  // Buys one gem-chest for clicks â€” a prerequisite for openGemChestWithKeys.
  // `cost` comes in as the flat, tier-0 constant; scaled to the buyer's own
  // tier here, same as buyClickChest.
  async buyGemChest(id, cost) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')
      // Credits pending drone production first â€” see buyPowerup's own
      // comment for why.
      const accrued = await accrueProduction(client, id)
      if (!accrued) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      const row = await client.query(
        'SELECT total_clicks, owned_gem_chests, prestige_tier FROM users WHERE id = $1 FOR UPDATE',
        [id],
      )
      const user = row.rows[0]
      if (!user) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      user.total_clicks = accrued.totalClicks
      user.prestige_tier = accrued.prestigeTier
      if (Number(user.owned_gem_chests) >= MAX_OWNED_CHESTS) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'chest-limit-reached' }
      }
      const scaledCost = scaleMaterialAmount(cost, user.prestige_tier)
      if (Number(user.total_clicks) < scaledCost) {
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
        [id, scaledCost],
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

  // Gem chest, paid with gems instead of keys â€” same prize table, no cooldown.
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

  // `sortBy` only ever picks between these two fixed column names â€” never
  // interpolates the raw query param â€” so there's no injection surface.
  // The 'clicks' tab ranks by lifetime_platino (all-time earned), not
  // total_clicks (spendable balance) â€” otherwise spending platino would
  // drop you down the board.
  async getLeaderboard(limit = 100, sortBy = 'clicks') {
    const column = sortBy === 'cps' ? 'best_cps' : 'lifetime_platino'
    // Guest (`anon_<uuid>`) rows never show here â€” playing without an
    // account stays off the record entirely, on purpose, until whoever's
    // behind it actually signs in.
    const result = await database.query(
      `SELECT id, username, avatar_url, lifetime_platino, best_cps, astronaut_style
       FROM users
       WHERE ${column} > 0 AND id !~ '^anon_'
       ORDER BY ${column} DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      lifetimePlatino: Number(row.lifetime_platino),
      bestCps: Number(row.best_cps),
      // Drives each row's little portrait â€” the point of storing cosmetics
      // server-side is that other players see the character you built, and
      // the leaderboard is where most of them will ever see it.
      astronautStyle: row.astronaut_style ?? null,
    }))
  },

  // Backs the public "visit this player's profile" page â€” anyone can open
  // it from a leaderboard row or a battle history entry, so this only ever
  // returns fields already visible on the leaderboard itself plus a couple
  // of read-only stats, nothing account-sensitive (no email, no click
  // buffer/currency balances). Rank is computed here rather than reusing
  // getLeaderboard's own row order, since a player outside the top 100
  // wouldn't have one there at all â€” this works for anyone with any score.
  async getPublicProfile(id) {
    const result = await database.query(
      `SELECT u.id, u.username, u.prestige_tier, u.lifetime_platino, u.best_cps, u.longest_streak,
              u.cases_opened, u.total_real_clicks, u.created_at, u.astronaut_style,
              (SELECT COUNT(*) + 1 FROM users WHERE lifetime_platino > u.lifetime_platino AND id !~ '^anon_') AS rank,
              (SELECT COUNT(*) FROM users WHERE lifetime_platino > 0 AND id !~ '^anon_') AS total_ranked
       FROM users u
       WHERE u.id = $1`,
      [id],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      username: row.username,
      prestigeTier: Number(row.prestige_tier ?? 0),
      lifetimePlatino: Number(row.lifetime_platino),
      bestCps: Number(row.best_cps),
      longestStreak: Number(row.longest_streak),
      casesOpened: Number(row.cases_opened ?? 0),
      totalRealClicks: Number(row.total_real_clicks ?? 0),
      createdAt: row.created_at,
      // What their astronaut is wearing, so a visitor sees the character
      // they actually built. Null means never customized â†’ default kit.
      astronautStyle: row.astronaut_style ?? null,
      // A score of 0 means never ranked â€” rank/total would otherwise show
      // a misleading "#1 of 1" for a player who has literally never clicked.
      rank: row.lifetime_platino > 0 ? Number(row.rank) : null,
      totalRanked: Number(row.total_ranked),
    }
  },

  // Idempotent on purpose â€” the "?" replay button re-fires this every time
  // the tutorial is manually re-watched, not just on the one real first-run.
  async markTutorialCompleted(id) {
    await database.query('UPDATE users SET tutorial_completed = true, updated_at = now() WHERE id = $1', [id])
  },
}
