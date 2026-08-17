import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'clicker:totalClicks'
const CPS_WINDOW_MS = 2000

function readStoredClicks(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Tracks the local player's click count in real time and persists it to
 * localStorage. Once the backend exists this is the natural seam to swap
 * the local increment for an optimistic update + API call.
 */
export function useClickCounter() {
  const [totalClicks, setTotalClicks] = useState(readStoredClicks)
  const [clicksPerSecond, setClicksPerSecond] = useState(0)
  const recentClicksRef = useRef<number[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(totalClicks))
  }, [totalClicks])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      recentClicksRef.current = recentClicksRef.current.filter(
        (t) => now - t < CPS_WINDOW_MS,
      )
      setClicksPerSecond(recentClicksRef.current.length / (CPS_WINDOW_MS / 1000))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const registerClick = useCallback(() => {
    recentClicksRef.current.push(Date.now())
    setTotalClicks((c) => c + 1)
  }, [])

  return { totalClicks, clicksPerSecond, registerClick }
}
