import { database } from './pool.js'
import { BATTLE_WAGER } from '../game/battles.js'

export const battlesRepository = {
  // The "pick an opponent" list — same shape as the leaderboard query,
  // just excluding yourself. No friends/search system yet, so this is
  // literally "everyone", ranked by platino same as the real leaderboard.
  async listOpponents(userId, limit = 50) {
    const result = await database.query(
      `SELECT id, username, avatar_url, total_clicks FROM users
       WHERE id != $1
       ORDER BY total_clicks DESC
       LIMIT $2`,
      [userId, limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalClicks: Number(row.total_clicks),
    }))
  },

  // Every battle you're part of, either side, most recent first — covers
  // both "things I can act on" (incoming challenges to accept) and "things
  // that already happened" (so a challenger eventually finds out they won
  // or lost) in one query.
  async listMine(userId, limit = 30) {
    const result = await database.query(
      `SELECT b.id, b.challenger_id, b.opponent_id, b.wager, b.status,
              b.challenger_taps, b.opponent_taps, b.winner_id, b.created_at, b.resolved_at,
              uc.username AS challenger_username, uc.avatar_url AS challenger_avatar_url,
              uo.username AS opponent_username, uo.avatar_url AS opponent_avatar_url
       FROM battles b
       JOIN users uc ON uc.id = b.challenger_id
       JOIN users uo ON uo.id = b.opponent_id
       WHERE b.challenger_id = $1 OR b.opponent_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2`,
      [userId, limit],
    )
    return result.rows.map((row) => ({
      id: row.id,
      role: row.challenger_id === userId ? 'challenger' : 'opponent',
      wager: Number(row.wager),
      status: row.status,
      challengerTaps: row.challenger_taps === null ? null : Number(row.challenger_taps),
      opponentTaps: row.opponent_taps === null ? null : Number(row.opponent_taps),
      winnerId: row.winner_id,
      challengerUsername: row.challenger_username,
      challengerAvatarUrl: row.challenger_avatar_url,
      opponentUsername: row.opponent_username,
      opponentAvatarUrl: row.opponent_avatar_url,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }))
  },

  // Single battle, scoped to a participant — lets the Battle screen
  // recover its own role/state after a refresh instead of only trusting
  // client-side navigation state (which a hard reload would lose).
  async getById(battleId, userId) {
    const result = await database.query(
      `SELECT b.*, uc.username AS challenger_username, uc.avatar_url AS challenger_avatar_url,
              uo.username AS opponent_username, uo.avatar_url AS opponent_avatar_url
       FROM battles b
       JOIN users uc ON uc.id = b.challenger_id
       JOIN users uo ON uo.id = b.opponent_id
       WHERE b.id = $1 AND (b.challenger_id = $2 OR b.opponent_id = $2)`,
      [battleId, userId],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      role: row.challenger_id === userId ? 'challenger' : 'opponent',
      wager: Number(row.wager),
      status: row.status,
      challengerTaps: row.challenger_taps === null ? null : Number(row.challenger_taps),
      opponentTaps: row.opponent_taps === null ? null : Number(row.opponent_taps),
      winnerId: row.winner_id,
      challengerUsername: row.challenger_username,
      challengerAvatarUrl: row.challenger_avatar_url,
      opponentUsername: row.opponent_username,
      opponentAvatarUrl: row.opponent_avatar_url,
    }
  },

  // Challenger pays the wager up front, right when they issue the
  // challenge — before they've even played their own round. If they never
  // finish that round the wager just sits spent with no result, same as
  // any other purchase; there's no separate "cancel and refund" path yet.
  async createChallenge(challengerId, opponentId) {
    if (challengerId === opponentId) {
      return { ok: false, reason: 'cannot-challenge-self' }
    }
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const opponentRow = await client.query('SELECT id FROM users WHERE id = $1', [opponentId])
      if (!opponentRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'opponent-not-found' }
      }

      const challengerRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [
        challengerId,
      ])
      if (!challengerRow.rows[0]) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (Number(challengerRow.rows[0].total_clicks) < BATTLE_WAGER) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2 WHERE id = $1 RETURNING total_clicks',
        [challengerId, BATTLE_WAGER],
      )

      const battle = await client.query(
        `INSERT INTO battles (challenger_id, opponent_id, wager, status)
         VALUES ($1, $2, $3, 'awaiting_challenger')
         RETURNING id`,
        [challengerId, opponentId, BATTLE_WAGER],
      )

      await client.query('COMMIT')
      return {
        ok: true,
        battleId: battle.rows[0].id,
        totalClicks: Number(spent.rows[0].total_clicks),
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Opponent pays their own wager into the same battle — separate step
  // from playing the round, so the charge is never lost if the round
  // itself gets interrupted (browser closed mid-battle, etc.).
  async acceptChallenge(battleId, userId) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const battleRow = await client.query('SELECT * FROM battles WHERE id = $1 FOR UPDATE', [battleId])
      const battle = battleRow.rows[0]
      if (!battle) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }
      if (battle.opponent_id !== userId) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-your-battle' }
      }
      if (battle.status !== 'awaiting_opponent') {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'wrong-state' }
      }

      const userRow = await client.query('SELECT total_clicks FROM users WHERE id = $1 FOR UPDATE', [userId])
      if (Number(userRow.rows[0].total_clicks) < Number(battle.wager)) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-enough-clicks' }
      }

      const spent = await client.query(
        'UPDATE users SET total_clicks = total_clicks - $2 WHERE id = $1 RETURNING total_clicks',
        [userId, battle.wager],
      )

      await client.query(`UPDATE battles SET status = 'opponent_accepted' WHERE id = $1`, [battleId])

      await client.query('COMMIT')
      return { ok: true, totalClicks: Number(spent.rows[0].total_clicks) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // Records whichever side's round just ended. The challenger's submission
  // just advances the state (now visible to the opponent); the opponent's
  // submission is the one that actually resolves the battle — ties refund
  // both wagers back rather than picking an arbitrary winner.
  async submitScore(battleId, userId, taps) {
    const client = await database.getClient()
    try {
      await client.query('BEGIN')

      const battleRow = await client.query('SELECT * FROM battles WHERE id = $1 FOR UPDATE', [battleId])
      const battle = battleRow.rows[0]
      if (!battle) {
        await client.query('ROLLBACK')
        return { ok: false, reason: 'not-found' }
      }

      const roundedTaps = Math.max(0, Math.floor(taps))

      if (battle.challenger_id === userId) {
        if (battle.status !== 'awaiting_challenger') {
          await client.query('ROLLBACK')
          return { ok: false, reason: 'wrong-state' }
        }
        await client.query(
          `UPDATE battles SET challenger_taps = $2, status = 'awaiting_opponent' WHERE id = $1`,
          [battleId, roundedTaps],
        )
        await client.query('COMMIT')
        return { ok: true, status: 'awaiting_opponent', taps: roundedTaps }
      }

      if (battle.opponent_id === userId) {
        if (battle.status !== 'opponent_accepted') {
          await client.query('ROLLBACK')
          return { ok: false, reason: 'wrong-state' }
        }

        const challengerTaps = Number(battle.challenger_taps)
        const wager = Number(battle.wager)
        let winnerId = null
        if (roundedTaps > challengerTaps) {
          winnerId = battle.opponent_id
        } else if (challengerTaps > roundedTaps) {
          winnerId = battle.challenger_id
        }

        if (winnerId) {
          await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2 WHERE id = $1',
            [winnerId, wager * 2],
          )
        } else {
          // Tie — refund both wagers rather than letting the pot vanish.
          await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2 WHERE id = $1',
            [battle.challenger_id, wager],
          )
          await client.query(
            'UPDATE users SET total_clicks = total_clicks + $2, lifetime_platino = lifetime_platino + $2 WHERE id = $1',
            [battle.opponent_id, wager],
          )
        }

        await client.query(
          `UPDATE battles
           SET opponent_taps = $2, status = 'completed', winner_id = $3, resolved_at = now()
           WHERE id = $1`,
          [battleId, roundedTaps, winnerId],
        )

        await client.query('COMMIT')
        return {
          ok: true,
          status: 'completed',
          taps: roundedTaps,
          challengerTaps,
          winnerId,
          didWin: winnerId === userId,
          isTie: winnerId === null,
        }
      }

      await client.query('ROLLBACK')
      return { ok: false, reason: 'not-your-battle' }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}
