import { Router } from 'express'
import { getAuth as getClerkAuth, clerkClient } from '@clerk/express'
import { getAuth, isAnonId } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { getPowerup } from '../powerups/catalog.js'
import { getTimedLuckPowerup } from '../powerups/timedLuckPowerups.js'
import { getMagnet } from '../powerups/magnets.js'

export const usersRouter = Router()

// Clerk's own instance settings (Configure → Email, Phone, Username):
// minimum 4 characters, no extended/accented characters, no purely numeric
// usernames. Clerk's own maximum is 64 — capped tighter here at 20 as this
// app's own product choice, since a display name that long doesn't fit
// anywhere it's actually shown (leaderboard rows, the profile header).
const USERNAME_MIN = 4
const USERNAME_MAX = 20

// Cosmetic slots the astronaut has. Kept as a bare allow-list because the
// server deliberately doesn't know what any given *option id* means — see
// migration 035: the catalogue lives in the client
// (front/src/lib/astronautStyles.ts), which already falls back to a slot's
// default for an id it doesn't recognise. So this validates shape (known
// slot, short plain id) and nothing more, which is what keeps retuning or
// renaming a colourway a frontend-only change.
const ASTRONAUT_SLOTS = [
  'helmet',
  'suit',
  'boots',
  'belt',
  'bracelet',
  'accent',
  'antenna',
  'pack',
  'trail',
  'badge',
  'pet',
  'pet2',
]
const STYLE_ID_RE = /^[a-z0-9_-]{1,32}$/

function parseAstronautStyle(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const out = {}
  for (const [slot, id] of Object.entries(input)) {
    if (!ASTRONAUT_SLOTS.includes(slot)) return null
    if (typeof id !== 'string' || !STYLE_ID_RE.test(id)) return null
    out[slot] = id
  }
  return out
}

function toPublicUser(row) {
  const isPowerupActive =
    row.active_powerup && row.active_powerup_expires_at && new Date(row.active_powerup_expires_at) > new Date()
  const isLuckPowerupActive =
    row.active_luck_powerup &&
    row.active_luck_powerup_expires_at &&
    new Date(row.active_luck_powerup_expires_at) > new Date()
  const isPowerupOnCooldown =
    row.powerup_cooldown_until && new Date(row.powerup_cooldown_until) > new Date()
  const isLuckPowerupOnCooldown =
    row.luck_powerup_cooldown_until && new Date(row.luck_powerup_cooldown_until) > new Date()
  const isMagnetActive =
    row.active_magnet && row.active_magnet_expires_at && new Date(row.active_magnet_expires_at) > new Date()
  const isMagnetOnCooldown =
    row.magnet_cooldown_until && new Date(row.magnet_cooldown_until) > new Date()

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
    totalClicks: Number(row.total_clicks),
    totalRealClicks: Number(row.total_real_clicks ?? 0),
    gems: Number(row.gems ?? 0),
    keys: Number(row.keys ?? 0),
    ownedClickChests: Number(row.owned_click_chests ?? 0),
    ownedGemChests: Number(row.owned_gem_chests ?? 0),
    keyClaimedToday: Boolean(row.key_claimed_today),
    bestCps: Number(row.best_cps),
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    casesOpened: Number(row.cases_opened ?? 0),
    milestoneBonusMultiplier: Number(row.milestone_bonus_multiplier ?? 1),
    tutorialCompleted: Boolean(row.tutorial_completed),
    astronautStyle: row.astronaut_style ?? null,
    activePowerup: isPowerupActive
      ? {
          id: row.active_powerup,
          multiplier: getPowerup(row.active_powerup)?.multiplier ?? 1,
          expiresAt: row.active_powerup_expires_at,
        }
      : null,
    activeLuckPowerup: isLuckPowerupActive
      ? {
          id: row.active_luck_powerup,
          chance: getTimedLuckPowerup(row.active_luck_powerup)?.chance ?? 0,
          multiplier: getTimedLuckPowerup(row.active_luck_powerup)?.multiplier ?? 1,
          expiresAt: row.active_luck_powerup_expires_at,
        }
      : null,
    powerupCooldownUntil: isPowerupOnCooldown ? row.powerup_cooldown_until : null,
    luckPowerupCooldownUntil: isLuckPowerupOnCooldown ? row.luck_powerup_cooldown_until : null,
    activeMagnet: isMagnetActive
      ? {
          id: row.active_magnet,
          currency: getMagnet(row.active_magnet)?.currency ?? 'keys',
          expiresAt: row.active_magnet_expires_at,
        }
      : null,
    magnetCooldownUntil: isMagnetOnCooldown ? row.magnet_cooldown_until : null,
  }
}

// Called once from the frontend right after a successful Clerk sign-in.
// Mirrors the Clerk user into our own `users` table, keyed by the Clerk id,
// and bumps the daily streak (see usersRepository.upsertFromClerk).
usersRouter.post('/sync', async (req, res) => {
  const { userId } = getClerkAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId)
    const user = await usersRepository.upsertFromClerk({
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      username: clerkUser.username ?? clerkUser.firstName ?? null,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    res.json(toPublicUser(user))
  } catch (err) {
    console.error('Error syncing user', err)
    res.status(500).json({ error: 'Error syncing user' })
  }
})

// Changes the player's own username. Deliberately NOT done client-side via
// `user.update({ username })` (@clerk/clerk-react) — Clerk treats a
// username change as security-sensitive and gates it behind
// "reverification" (a fresh proof of identity, separate from just holding
// a session), which for a Google-only account with no password means an
// emailed verification code every single time. That's real, unwanted
// friction for something as routine as picking a display name.
// Reverification exists to stop a *hijacked browser session* from quietly
// changing account-recovery info — it's a client-SDK protection, not a
// rule on the field itself. Doing the write here instead sidesteps it
// entirely and safely: this route already requires the same signed
// session token every other authenticated route does, so nothing weaker is
// being trusted — we're just making the change through Clerk's admin
// (Secret Key) API, which was never subject to reverification in the first
// place, rather than through the browser's own Clerk session.
usersRouter.patch('/me/username', async (req, res) => {
  const { userId } = getClerkAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const trimmed = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  // Mirrors Clerk's own instance rules (length, no extended/accented
  // characters, no purely-numeric names) so a bad value fails fast with a
  // plain 400 instead of round-tripping to Clerk first to find out.
  const isValidFormat = /^[a-zA-Z0-9_]+$/.test(trimmed) && !/^\d+$/.test(trimmed)
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX || !isValidFormat) {
    return res.status(400).json({ error: 'invalid' })
  }

  try {
    const clerkUser = await clerkClient.users.updateUser(userId, { username: trimmed })
    const user = await usersRepository.upsertFromClerk({
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      username: clerkUser.username,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    res.json(toPublicUser(user))
  } catch (err) {
    const clerkError = err?.errors?.[0]
    const code = clerkError?.code ?? ''
    const message = clerkError?.message ?? ''
    if (code === 'form_identifier_exists' || /taken|already/i.test(message)) {
      return res.status(409).json({ error: 'taken' })
    }
    // Clerk's own form-validation error codes are all prefixed "form_" —
    // anything else caught here already passed our own format check above,
    // so a "form_" code at this point means Clerk enforces a rule we don't
    // mirror locally. Surfaced as a 400 either way rather than a 500, since
    // it's the request that's malformed, not the server.
    if (code.startsWith('form_')) {
      return res.status(400).json({ error: 'invalid' })
    }
    console.error('Error updating username', err)
    res.status(500).json({ error: 'Error updating username' })
  }
})

// Called once per guest session, mirroring what /sync does for a real
// Clerk sign-in — creates the row a `anon_<uuid>` id needs before any other
// route can write child data against it (every child table's `user_id` is
// a real foreign key to `users(id)`). No Clerk profile to look up here, so
// unlike /sync this is a bare insert: every other column just takes its
// own schema DEFAULT, identical to what a brand-new real account starts
// with too.
usersRouter.post('/anon-init', async (req, res) => {
  const { userId } = getAuth(req)
  if (!isAnonId(userId)) {
    return res.status(400).json({ error: 'invalid' })
  }

  try {
    await usersRepository.ensureAnonUser(userId)
    res.json({ ok: true })
  } catch (err) {
    console.error('Error creating anonymous user', err)
    res.status(500).json({ error: 'Error creating anonymous user' })
  }
})

// Called right after a guest signs in for real — folds whatever they did
// as `anon_<uuid>` into the account they just signed into. Requires a real
// Clerk session (rejects an anon bearer token outright: claiming who a
// *guest* progress belongs to obviously needs to itself be someone real),
// and the id being claimed is read from the body rather than from auth,
// since it's the *old* identity being described, not the one authorizing
// this request. See usersRepository.claimAnonymousProgress for the actual
// policy: a genuinely fresh account adopts the guest progress wholesale,
// an account that already has any progress of its own keeps it untouched
// and the guest row is left exactly as it was — never a destructive merge.
// Responds `{ claimed }` so the client knows which happened: on false the
// guest save is still intact and still that browser's, and the caller is
// expected to keep its guest id so signing out can resume it.
usersRouter.post('/claim-anonymous', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId || isAnonId(userId)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const anonId = req.body?.anonId
  if (!isAnonId(anonId) || anonId === userId) {
    return res.status(400).json({ error: 'invalid' })
  }

  try {
    const claimed = await usersRepository.claimAnonymousProgress(anonId, userId)
    res.json({ claimed })
  } catch (err) {
    console.error('Error claiming anonymous progress', err)
    res.status(500).json({ error: 'Error claiming anonymous progress' })
  }
})

// Saves what the astronaut is wearing. Guest-capable on purpose (the
// wrapped getAuth): playing without an account is a first-class mode here,
// and a guest's character should look like theirs too — theirs just lives
// on their guest row until they sign in, at which point claimAnonymousProgress
// carries the whole users row over with everything else.
usersRouter.put('/me/astronaut-style', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const style = parseAstronautStyle(req.body?.style)
  if (!style) return res.status(400).json({ error: 'invalid' })

  try {
    const saved = await usersRepository.updateAstronautStyle(userId, style)
    res.json({ astronautStyle: saved })
  } catch (err) {
    console.error('Error saving astronaut style', err)
    res.status(500).json({ error: 'Error saving astronaut style' })
  }
})

usersRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const user = await usersRepository.getById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(toPublicUser(user))
  } catch (err) {
    console.error('Error fetching current user', err)
    res.status(500).json({ error: 'Error fetching current user' })
  }
})

// Called once the onboarding tutorial finishes (or is skipped) — also
// re-fired every time it's manually replayed via the "?" button, which is
// harmless since it's just re-setting the same flag to true.
usersRouter.post('/tutorial-complete', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await usersRepository.markTutorialCompleted(userId)
    res.json({ ok: true })
  } catch (err) {
    console.error('Error marking tutorial complete', err)
    res.status(500).json({ error: 'Error marking tutorial complete' })
  }
})

// Powers the stats-page calendar strip — every day the user clicked at
// least once.
usersRouter.get('/me/click-days', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const clickDays = await usersRepository.getClickDays(userId)
    res.json({ clickDays })
  } catch (err) {
    console.error('Error fetching click days', err)
    res.status(500).json({ error: 'Error fetching click days' })
  }
})

// Public profile page — anyone can view anyone's (no auth), same as the
// leaderboard itself. See usersRepository.getPublicProfile for exactly what
// this exposes and why. Guest ids are rejected outright — nothing ever
// links to one (the leaderboard itself excludes them), so this only ever
// matters against someone deliberately guessing a `anon_...` URL.
usersRouter.get('/:id/public', async (req, res) => {
  if (isAnonId(req.params.id)) return res.status(404).json({ error: 'User not found' })
  try {
    const profile = await usersRepository.getPublicProfile(req.params.id)
    if (!profile) return res.status(404).json({ error: 'User not found' })
    res.json(profile)
  } catch (err) {
    console.error('Error fetching public profile', err)
    res.status(500).json({ error: 'Error fetching public profile' })
  }
})

// Powers the Inventory modal — owned-but-not-yet-activated powerups/luck/
// magnets, as {itemId: quantity}. Names/costs/durations come from each
// catalog (already fetched separately), this is just the counts.
usersRouter.get('/me/inventory', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const inventory = await usersRepository.getInventory(userId)
    res.json({ inventory })
  } catch (err) {
    console.error('Error fetching inventory', err)
    res.status(500).json({ error: 'Error fetching inventory' })
  }
})
