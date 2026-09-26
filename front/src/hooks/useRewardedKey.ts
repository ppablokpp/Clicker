import { useCallback, useEffect, useState } from 'react'
import { useKeysContext } from '../context/KeysContext'
import { useAppAuth } from './useAppAuth'
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
  const { userId, getToken } = useAppAuth()
  const { keys, syncKeys } = useKeysContext()
  const [used, setUsed] = useState(0)
  const [perDay, setPerDay] = useState(0)
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
    } catch (err) {
      console.error('No se pudo leer el cupo de anuncios', err)
    }
  }, [userId, getToken])

  useEffect(() => {
    void readAllowance()
  }, [readAllowance])

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
    watching,
    error,
    watch,
  }
}
