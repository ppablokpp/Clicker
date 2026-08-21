import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { toLocalDateString } from '../lib/date'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const FLUSH_INTERVAL_MS = 1000
const CPS_WINDOW_MS = 2000
// Must match back/src/routes/clicks.js's MAX_CLICKS_PER_REQUEST — the
// backend rejects a single increment larger than this, so flush() has to
// split anything bigger into several requests instead of sending it all at
// once (high multipliers can pile up thousands of pending clicks between ticks).
const MAX_CLICKS_PER_REQUEST = 5000

/**
 * The database is the source of truth for where the count *starts*, but the
 * displayed number is always `confirmed + pending` computed locally — it
 * never gets overwritten by a server response, only added to. That keeps
 * clicks feeling instant even if a flush is slow: a flush only ever
 * subtracts the exact amount it sent from `pending`, so clicks that landed
 * mid-flight stay visible instead of being clobbered by a stale total.
 */
export function useClickCounter() {
  const { userId, getToken } = useAuth()
  const [totalClicks, setTotalClicks] = useState(0)
  const [clicksPerSecond, setClicksPerSecond] = useState(0)
  // Every /increment response includes the current keys/gems totals (a
  // magnet powerup can silently grant either mid-flush) — exposed here so
  // KeysContext/GemsContext (nested inside this provider) can sync off of
  // it without this hook needing to know they exist.
  const [latestKeys, setLatestKeys] = useState<number | null>(null)
  const [latestGems, setLatestGems] = useState<number | null>(null)
  const recentClicksRef = useRef<number[]>([])
  const confirmedRef = useRef(0)
  const pendingRef = useRef(0)
  // Genuine screen taps only — always +1 per registerClick call, regardless
  // of the (possibly multiplied) `amount` it's given. Drained in lockstep
  // with pendingRef, capped per-chunk at that chunk's amountSent so it can
  // never report more real taps than the multiplied total it rode along with.
  const pendingRealClicksRef = useRef(0)
  // Purely a display prediction for auto-click production (see TreeContext)
  // — ticks up locally between the infrequent real accrual polls so the
  // number feels alive, then gets zeroed out by syncTotalClicks every time
  // an authoritative total lands (that total already includes whatever was
  // predicted, so keeping the local guess around after that would double-count it).
  const autoPendingRef = useRef(0)
  const isFlushingRef = useRef(false)
  const peakCpsRef = useRef(0)
  // Lets a case-opening reel hide the real total behind its reveal
  // animation instead of letting an unrelated background sync (e.g.
  // auto-click's own poll landing mid-spin) jump the counter and spoil the
  // prize before the reel visually lands on it. Nestable — only actually
  // resumes once every caller has released it. Doesn't touch pendingRef or
  // taps in flight, only when a *synced* (server-authoritative) total is
  // allowed to become visible.
  const suspendSyncCountRef = useRef(0)
  const pendingSyncTotalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/clicks/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          confirmedRef.current = data.totalClicks
          setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
        }
      } catch (err) {
        console.error('No se pudo cargar el contador desde el servidor', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      recentClicksRef.current = recentClicksRef.current.filter(
        (t) => now - t < CPS_WINDOW_MS,
      )
      const cps = recentClicksRef.current.length / (CPS_WINDOW_MS / 1000)
      if (cps > peakCpsRef.current) peakCpsRef.current = cps
      setClicksPerSecond(cps)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const flush = useCallback(async () => {
    if (pendingRef.current === 0 || !userId || isFlushingRef.current) return
    isFlushingRef.current = true

    try {
      const token = await getToken()
      // Drains everything in <=MAX_CLICKS_PER_REQUEST chunks within this one
      // flush call — otherwise a single burst bigger than the cap would get
      // rejected every tick forever, since pendingRef only grows and never
      // shrinks on failure.
      while (pendingRef.current > 0) {
        const amountSent = Math.min(pendingRef.current, MAX_CLICKS_PER_REQUEST)
        const realClicksSent = Math.min(pendingRealClicksRef.current, amountSent)
        const res = await fetch(`${API_URL}/api/clicks/increment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            amount: amountSent,
            realClicks: realClicksSent,
            peakCps: peakCpsRef.current,
            localDate: toLocalDateString(new Date()),
          }),
          keepalive: true,
        })
        if (!res.ok) break // stays in pendingRef, retried next tick
        const data = await res.json()
        confirmedRef.current = data.totalClicks
        pendingRef.current -= amountSent
        pendingRealClicksRef.current -= realClicksSent
        setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
        if (typeof data.keys === 'number') setLatestKeys(data.keys)
        if (typeof data.gems === 'number') setLatestGems(data.gems)
      }
    } catch (err) {
      console.error('No se pudo guardar el progreso de clicks', err)
    } finally {
      isFlushingRef.current = false
    }
  }, [userId, getToken])

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [flush])

  useEffect(() => {
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const registerClick = useCallback(
    (amount = 1) => {
      if (!userId) return
      recentClicksRef.current.push(Date.now())
      pendingRef.current += amount
      pendingRealClicksRef.current += 1
      setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
    },
    [userId],
  )

  // Other places that spend clicks server-side (buying a powerup or a
  // permanent upgrade) return the fresh authoritative total — this folds it
  // in immediately instead of waiting for the next click-driven flush, which
  // might never come if nothing gets clicked again right away. Also drops
  // any predicted auto-click amount, since the new total already accounts
  // for everything up to now.
  const syncTotalClicks = useCallback((newTotal: number) => {
    if (suspendSyncCountRef.current > 0) {
      // Still the last-write-wins semantics a normal call would have — just
      // held back from the display until whatever's suspending it resumes.
      pendingSyncTotalRef.current = newTotal
      return
    }
    confirmedRef.current = newTotal
    autoPendingRef.current = 0
    setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current))
  }, [])

  const suspendSync = useCallback(() => {
    suspendSyncCountRef.current += 1
  }, [])

  const resumeSync = useCallback(() => {
    suspendSyncCountRef.current = Math.max(0, suspendSyncCountRef.current - 1)
    if (suspendSyncCountRef.current === 0 && pendingSyncTotalRef.current !== null) {
      const total = pendingSyncTotalRef.current
      pendingSyncTotalRef.current = null
      confirmedRef.current = total
      autoPendingRef.current = 0
      setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current))
    }
  }, [])

  // Purely visual — ticks the displayed total up between the infrequent
  // real auto-click accrual polls (see TreeContext) without touching
  // pendingRef, so it's never sent to /increment and never mistaken for a
  // real tap (real-clicks stat, streak, etc. stay untouched by this).
  // autoPendingRef itself stays fractional (0.5 cps needs sub-1 precision
  // between 100ms ticks to ever add up to anything) — only the exposed,
  // displayed totalClicks gets floored.
  const tickAutoClicks = useCallback((amount: number) => {
    autoPendingRef.current += amount
    setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
  }, [])

  return {
    totalClicks,
    clicksPerSecond,
    registerClick,
    syncTotalClicks,
    tickAutoClicks,
    suspendSync,
    resumeSync,
    latestKeys,
    latestGems,
  }
}
