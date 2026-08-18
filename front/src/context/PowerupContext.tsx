import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface PowerupDef {
  id: string
  cost: number
  durationSeconds: number
  multiplier: number
}

interface ActivePowerup {
  id: string
  multiplier: number
  expiresAt: number
}

interface PowerupContextValue {
  catalog: PowerupDef[]
  active: ActivePowerup | null
  secondsLeft: number
  buyingId: string | null
  buy: (powerup: PowerupDef) => Promise<{ ok: boolean; error?: string }>
}

const PowerupContext = createContext<PowerupContextValue | null>(null)

export function PowerupProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const [catalog, setCatalog] = useState<PowerupDef[]>([])
  const [active, setActive] = useState<ActivePowerup | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/powerups`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de potenciadores', err))
  }, [])

  // Hydrate any powerup still running from a previous session.
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
          if (data.activePowerup) {
            setActive({
              id: data.activePowerup.id,
              multiplier: data.activePowerup.multiplier,
              expiresAt: new Date(data.activePowerup.expiresAt).getTime(),
            })
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar el potenciador activo', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  // Ticks the countdown and clears the powerup the moment it expires.
  useEffect(() => {
    if (!active) {
      setSecondsLeft(0)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((active.expiresAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) setActive(null)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [active])

  const buy = useCallback(
    async (powerup: PowerupDef) => {
      if (!userId) return { ok: false, error: 'not-signed-in' }
      setBuyingId(powerup.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/powerups/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ powerupId: powerup.id }),
        })
        const data = await res.json()
        if (res.ok && data.activePowerup) {
          setActive({
            id: data.activePowerup.id,
            multiplier: data.activePowerup.multiplier,
            expiresAt: new Date(data.activePowerup.expiresAt).getTime(),
          })
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
          return { ok: true }
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo comprar el potenciador', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncTotalClicks],
  )

  return (
    <PowerupContext.Provider value={{ catalog, active, secondsLeft, buyingId, buy }}>
      {children}
    </PowerupContext.Provider>
  )
}

export function usePowerupContext() {
  const ctx = useContext(PowerupContext)
  if (!ctx) throw new Error('usePowerupContext must be used within a PowerupProvider')
  return ctx
}
