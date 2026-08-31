import { useAuth } from '@clerk/expo'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useClickCounterContext } from './ClickCounterContext'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

interface GemsContextValue {
  gems: number
  /** Other places that award gems server-side (case prizes) return the fresh authoritative total — this folds it in. */
  syncGems: (newTotal: number) => void
}

const GemsContext = createContext<GemsContextValue | null>(null)

// Ported from front/src/context/GemsContext.tsx exactly.
export function GemsProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { latestGems } = useClickCounterContext()
  const [gems, setGems] = useState(0)

  // A magnet powerup can grant gems mid-flush — every click flush reports
  // the fresh total, so fold it in as soon as it changes.
  useEffect(() => {
    if (typeof latestGems === 'number') setGems(latestGems)
  }, [latestGems])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (typeof data.gems === 'number') setGems(data.gems)
        }
      } catch (err) {
        console.error('No se pudieron cargar las gemas', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const syncGems = useCallback((newTotal: number) => {
    setGems(newTotal)
  }, [])

  // Memoized — this consumes ClickCounterContext (`latestGems`), so it
  // re-renders on every tap regardless of whether gems actually changed. An
  // unmemoized value here handed every GemsContext consumer (Tree's c1
  // node, GemUpgradesContext) a fresh reference on every shot, cascading
  // the same way ClickCounterContext's own unmemoized value did — see
  // useClickCounter.ts's comment for the full story.
  const value = useMemo(() => ({ gems, syncGems }), [gems, syncGems])

  return <GemsContext.Provider value={value}>{children}</GemsContext.Provider>
}

export function useGemsContext() {
  const ctx = useContext(GemsContext)
  if (!ctx) throw new Error('useGemsContext must be used within a GemsProvider')
  return ctx
}
