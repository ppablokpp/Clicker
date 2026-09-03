import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { useClickCounterContext } from './ClickCounterContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface GemsContextValue {
  gems: number
  /** Other places that award gems server-side (case prizes) return the fresh authoritative total — this folds it in. */
  syncGems: (newTotal: number) => void
}

const GemsContext = createContext<GemsContextValue | null>(null)

export function GemsProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAppAuth()
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

  // Memoized — an inline object literal here would be a fresh reference on
  // every render, and React re-renders every context consumer whenever the
  // `value` reference changes, regardless of which field it actually reads.
  // Since this context sits behind ClickCounterContext (which changes on
  // every tap), an unmemoized value meant every consumer of *this* context
  // re-rendered on every single click too, app-wide, for the whole session.
  const value = useMemo(() => ({ gems, syncGems }), [gems, syncGems])
  return <GemsContext.Provider value={value}>{children}</GemsContext.Provider>
}

export function useGemsContext() {
  const ctx = useContext(GemsContext)
  if (!ctx) throw new Error('useGemsContext must be used within a GemsProvider')
  return ctx
}
