import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const FLUSH_INTERVAL_MS = 1000
const CPS_WINDOW_MS = 2000

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
  const recentClicksRef = useRef<number[]>([])
  const confirmedRef = useRef(0)
  const pendingRef = useRef(0)
  const isFlushingRef = useRef(false)
  const peakCpsRef = useRef(0)

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
          setTotalClicks(confirmedRef.current + pendingRef.current)
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
    const amountSent = pendingRef.current
    if (amountSent === 0 || !userId || isFlushingRef.current) return
    isFlushingRef.current = true

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/clicks/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amountSent, peakCps: peakCpsRef.current }),
        keepalive: true,
      })
      if (res.ok) {
        const data = await res.json()
        confirmedRef.current = data.totalClicks
        pendingRef.current -= amountSent
        setTotalClicks(confirmedRef.current + pendingRef.current)
      }
      // On failure the clicks stay in pendingRef and go out on the next tick.
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

  const registerClick = useCallback((amount = 1) => {
    recentClicksRef.current.push(Date.now())
    pendingRef.current += amount
    setTotalClicks(confirmedRef.current + pendingRef.current)
  }, [])

  return { totalClicks, clicksPerSecond, registerClick }
}
