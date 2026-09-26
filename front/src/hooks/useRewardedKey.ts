import { useCallback, useEffect, useState } from 'react'
import { useKeysContext } from '../context/KeysContext'
import { useAuth } from '@clerk/clerk-react'
import { RewardSkipped, adsAvailable, showRewardedAd } from '../lib/ads'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * The "watch an ad, get a key" button's whole state.
 *
 * The key is granted by AdMob calling the back, not by us (see lib/ads and
 * back/src/routes/ads.js), so once the ad closes there is nothing to do but
 * ask the server what the total is now. That callback usually lands within
 * a second, occasionally a little later, so the total is re-read a few
 * times before giving up rather than once and hoping.
 */
export function useRewardedKey() {
  // Clerk's own, not useAppAuth: this hands out a key, and a guest id was
  // never issued by Clerk and must never be what a reward is attached to.
  const { userId, getToken } = useAuth()
  const { keys, syncKeys } = useKeysContext()
  const [used, setUsed] = useState(0)
  const [perDay, setPerDay] = useState(0)
  const [resetsAt, setResetsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [watching, setWatching] = useState(false)
  const [error, setError] = useState(false)

  const readAllowance = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/ads/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setUsed(Number(data.used ?? 0))
      setPerDay(Number(data.perDay ?? 0))
      const at = data.resetsAt ? Date.parse(data.resetsAt) : NaN
      setResetsAt(Number.isFinite(at) ? at : null)
    } catch (err) {
      console.error('No se pudo leer el cupo de anuncios', err)
    }
  }, [userId, getToken])

  useEffect(() => {
    void readAllowance()
  }, [readAllowance])

  // The countdown only ticks once the day's ads are spent — that is the only
  // state that shows it, and a timer running behind a button nobody is
  // looking at is a wake-up a minute for nothing.
  const spent = perDay > 0 && used >= perDay
  useEffect(() => {
    if (!spent) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [spent])

  const watch = useCallback(async () => {
    if (!userId || watching) return
    setError(false)
    setWatching(true)
    try {
      await showRewardedAd(userId)
      // Google's callback is on its way; wait for the key to appear rather
      // than claiming one ourselves.
      const before = keys
      for (let tries = 0; tries < 6; tries++) {
        await new Promise((r) => setTimeout(r, 700))
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) continue
        const data = await res.json()
        if (typeof data.keys === 'number' && data.keys > before) {
          syncKeys(data.keys)
          break
        }
      }
      await readAllowance()
    } catch (err) {
      // Closing the ad early is a choice, not a failure.
      if (!(err instanceof RewardSkipped)) {
        console.error('No se pudo mostrar el anuncio', err)
        setError(true)
      }
    } finally {
      setWatching(false)
    }
  }, [userId, watching, keys, getToken, syncKeys, readAllowance])

  return {
    /** Whether to show the button at all: inside the app, with an account. */
    available: adsAvailable() && Boolean(userId),
    used,
    perDay,
    left: Math.max(0, perDay - used),
    /** Seconds until the allowance comes back; 0 until there is one to wait for. */
    resetsIn: spent && resetsAt ? Math.max(0, Math.ceil((resetsAt - now) / 1000)) : 0,
    watching,
    error,
    watch,
  }
}
