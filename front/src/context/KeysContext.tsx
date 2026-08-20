import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface KeysContextValue {
  keys: number
  /** Other places that award/spend keys server-side return the fresh authoritative total — this folds it in. */
  syncKeys: (newTotal: number) => void
}

const KeysContext = createContext<KeysContextValue | null>(null)

export function KeysProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { latestKeys } = useClickCounterContext()
  const [keys, setKeys] = useState(0)

  // A magnet powerup can grant keys mid-flush — every click flush reports
  // the fresh total, so fold it in as soon as it changes.
  useEffect(() => {
    if (typeof latestKeys === 'number') setKeys(latestKeys)
  }, [latestKeys])

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
          if (typeof data.keys === 'number') setKeys(data.keys)
        }
      } catch (err) {
        console.error('No se pudieron cargar las llaves', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const syncKeys = useCallback((newTotal: number) => {
    setKeys(newTotal)
  }, [])

  return <KeysContext.Provider value={{ keys, syncKeys }}>{children}</KeysContext.Provider>
}

export function useKeysContext() {
  const ctx = useContext(KeysContext)
  if (!ctx) throw new Error('useKeysContext must be used within a KeysProvider')
  return ctx
}
