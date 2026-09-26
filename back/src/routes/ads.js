import { Router } from 'express'
import { createPublicKey, createVerify } from 'node:crypto'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import { AD_KEYS_PER_AD, AD_KEYS_PER_DAY } from '../store/rewardedAds.js'

/**
 * Rewarded ads: a key for watching one, up to AD_KEYS_PER_DAY a day.
 *
 * The key is never granted on the phone's word. AdMob calls us itself when
 * an ad has actually been watched through ("server-side verification"),
 * signing the request with a key Google publishes, and only that callback
 * grants anything — otherwise anyone could hold the endpoint open and mint
 * keys without an ad in sight. The app only reads the count, and refreshes
 * it once the ad closes.
 *
 * Set up in AdMob: the rewarded ad unit's SSV callback URL points at
 * `/api/ads/ssv` on this host, and `custom_data` carries the player's id.
 */
export const adsRouter = Router()

const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json'
let verifierKeys = { at: 0, byId: new Map() }

/** Google's SSV signing keys, kept for a day — they rotate slowly. */
async function admobVerifierKey(keyId) {
  if (Date.now() - verifierKeys.at > 86_400_000 || !verifierKeys.byId.has(String(keyId))) {
    const res = await fetch(VERIFIER_KEYS_URL)
    if (!res.ok) throw new Error(`AdMob verifier keys ${res.status}`)
    const { keys } = await res.json()
    verifierKeys = { at: Date.now(), byId: new Map(keys.map((k) => [String(k.keyId), k.pem ?? k.base64])) }
  }
  return verifierKeys.byId.get(String(keyId)) ?? null
}

/**
 * Google signs everything in the query string up to (but not including)
 * `&signature=`, so the check is done on the raw query as it arrived —
 * re-encoding a parsed object would change bytes and break the signature.
 */
async function verifyAdmobCallback(rawQuery) {
  const refuse = (why) => {
    console.warn(`AdMob SSV refused: ${why}`)
    return null
  }
  const at = rawQuery.indexOf('signature=')
  if (at < 1) return refuse('no signature')
  const signed = rawQuery.slice(0, at - 1)
  const params = new URLSearchParams(rawQuery)
  const signature = params.get('signature')
  const keyId = params.get('key_id')
  if (!signature || !keyId) return refuse('missing signature or key_id')

  const pem = await admobVerifierKey(keyId)
  if (!pem) return refuse(`unknown key_id ${keyId}`)
  const key = pem.includes('BEGIN PUBLIC KEY')
    ? createPublicKey(pem)
    : createPublicKey({ key: Buffer.from(pem, 'base64'), format: 'der', type: 'spki' })

  const ok = createVerify('SHA256')
    .update(signed)
    .end()
    .verify({ key, dsaEncoding: 'der' }, Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))
  if (!ok) return refuse('bad signature')

  // Google replays nothing, but a callback kept and re-sent hours later
  // should not still be good for a key.
  const timestamp = Number(params.get('timestamp'))
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 3_600_000) return refuse('stale timestamp')

  const userId = params.get('user_id') || params.get('custom_data')
  if (!userId) return refuse('no user_id')
  return { userId }
}

// GET /api/ads/ssv?...  — AdMob's own callback.
//
// It answers 200 to everything, refusals included. Nothing is granted
// without a valid signature (see above) — the status code is not what
// protects the endpoint, and saying so out loud helps nobody: AdMob pings
// the URL when it is saved in the console and refuses one that answers
// anything else, and in normal operation a non-2xx just makes Google retry
// a callback that will be refused again for the same reason. Refusals are
// logged instead; `fly logs | grep SSV` is where they are read.
adsRouter.get('/ssv', async (req, res) => {
  // Answered first, so a slow database or an unreachable Google never turns
  // into a retry storm.
  res.status(200).send('ok')
  try {
    const rawQuery = req.originalUrl.split('?')[1] ?? ''
    const verified = await verifyAdmobCallback(rawQuery)
    if (!verified) return
    const result = await usersRepository.grantAdKey(verified.userId)
    console.log(
      result.ok
        ? `AdMob SSV: key granted to ${verified.userId}`
        : `AdMob SSV: no key for ${verified.userId} (${result.reason})`,
    )
  } catch (err) {
    console.error('AdMob SSV failed', err)
  }
})

// GET /api/ads/me — what the store needs to draw the button.
adsRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const used = await usersRepository.adKeysUsedToday(userId)
  res.json({ used, perDay: AD_KEYS_PER_DAY, keysPerAd: AD_KEYS_PER_AD })
})
