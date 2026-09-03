import { useEffect, useRef, useState } from 'react'
import { getOrCreateAnonId } from '../lib/anonId'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Creates (idempotently) the `users` row a guest id needs before anything
 * else can write against it — every game-progress table's `user_id` is a
 * real foreign key, so nothing a guest does can be stored until this lands.
 *
 * Returns whether it has finished, and AuthGate blocks rendering on it.
 * That blocking is required, not cautious: the contexts fetch on mount, so
 * without it a brand-new guest's very first page load fires ~20 requests
 * against a row that doesn't exist yet, gets 404s back, and — since those
 * effects only re-run when `userId` changes, which it won't — never
 * retries. The result would be a permanently empty-looking app until a
 * manual reload. One idempotent `INSERT ... ON CONFLICT DO NOTHING` up
 * front is the cheap, correct fix.
 *
 * The in-flight request is cached in a ref and *every* run of the effect
 * subscribes to it, rather than later runs bailing out early. That shape
 * is what makes this correct under StrictMode, which deliberately runs
 * mount → cleanup → mount: a "have I started already?" ref guard that
 * returns early on the second run leaves nobody left listening (the first
 * run's listener was just cancelled by its own cleanup), so the promise
 * resolves into the void and `ready` never flips — an app stuck on the
 * loading screen forever. Sharing the promise instead means the second run
 * re-subscribes without re-firing the request.
 *
 * Fails open: a network error still resolves to `true`, so a backend
 * hiccup degrades this to "some fetches 404 until reload" rather than
 * stranding the player on a loading screen.
 */
export function useAnonInit(): boolean {
  const [ready, setReady] = useState(false)
  const requestRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const anonId = getOrCreateAnonId()
    requestRef.current ??= fetch(`${API_URL}/api/users/anon-init`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${anonId}` },
    })
      .then(() => undefined)
      .catch((err) => {
        console.error('No se pudo iniciar el progreso de invitado', err)
      })

    let cancelled = false
    void requestRef.current.then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
