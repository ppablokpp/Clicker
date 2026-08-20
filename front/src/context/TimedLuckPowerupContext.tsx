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
import { useInventoryContext } from './InventoryContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface TimedLuckPowerupDef {
  id: string
  cost: number
  durationSeconds: number
  chance: number
  multiplier: number
}

interface ActiveLuckPowerup {
  id: string
  chance: number
  multiplier: number
  expiresAt: number
}

interface TimedLuckPowerupContextValue {
  catalog: TimedLuckPowerupDef[]
  active: ActiveLuckPowerup | null
  secondsLeft: number
  /** Buying any tier locks the whole category for an hour — shared across all 4. */
  cooldownSecondsLeft: number
  buyingId: string | null
  activatingId: string | null
  /** Just adds one to the owned count — doesn't start it running. */
  buy: (powerup: TimedLuckPowerupDef) => Promise<{ ok: boolean; error?: string }>
  /** Consumes one owned unit and starts it running — fails if another tier in this category is already active. */
  activate: (powerup: TimedLuckPowerupDef) => Promise<{ ok: boolean; error?: string }>
}

const TimedLuckPowerupContext = createContext<TimedLuckPowerupContextValue | null>(null)

// Same "confirmed + pending" independence as PowerupContext, but for a
// separate active slot — a click-multiplier powerup and a timed luck
// powerup can run at the same time, they're independent effects.
export function TimedLuckPowerupProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const { adjust: adjustInventory } = useInventoryContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<TimedLuckPowerupDef[]>([])
  const [active, setActive] = useState<ActiveLuckPowerup | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/timed-luck-powerups`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de suerte con temporizador', err))
  }, [])

  // Hydrate any timed luck powerup still running from a previous session.
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
          if (data.activeLuckPowerup) {
            setActive({
              id: data.activeLuckPowerup.id,
              chance: data.activeLuckPowerup.chance,
              multiplier: data.activeLuckPowerup.multiplier,
              expiresAt: new Date(data.activeLuckPowerup.expiresAt).getTime(),
            })
          }
          if (data.luckPowerupCooldownUntil) {
            setCooldownUntil(new Date(data.luckPowerupCooldownUntil).getTime())
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar la suerte con temporizador activa', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

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

  // Ticks the shared category cooldown down independently of whichever tier is active.
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSecondsLeft(0)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownSecondsLeft(remaining)
      if (remaining === 0) setCooldownUntil(null)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [cooldownUntil])

  const buy = useCallback(
    async (powerup: TimedLuckPowerupDef) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setBuyingId(powerup.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/timed-luck-powerups/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ powerupId: powerup.id }),
        })
        const data = await res.json()
        if (res.ok) {
          adjustInventory(powerup.id, 1)
          if (data.cooldownUntil) setCooldownUntil(new Date(data.cooldownUntil).getTime())
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
          return { ok: true }
        }
        if (data.error === 'cooldown' && data.cooldownUntil) {
          setCooldownUntil(new Date(data.cooldownUntil).getTime())
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo comprar la suerte con temporizador', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncTotalClicks, adjustInventory, promptSignIn],
  )

  const activate = useCallback(
    async (powerup: TimedLuckPowerupDef) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setActivatingId(powerup.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/timed-luck-powerups/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ powerupId: powerup.id }),
        })
        const data = await res.json()
        if (res.ok && data.activeLuckPowerup) {
          setActive({
            id: data.activeLuckPowerup.id,
            chance: data.activeLuckPowerup.chance,
            multiplier: data.activeLuckPowerup.multiplier,
            expiresAt: new Date(data.activeLuckPowerup.expiresAt).getTime(),
          })
          adjustInventory(powerup.id, -1)
          return { ok: true }
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo activar la suerte con temporizador', err)
        return { ok: false, error: 'network' }
      } finally {
        setActivatingId(null)
      }
    },
    [userId, getToken, adjustInventory, promptSignIn],
  )

  return (
    <TimedLuckPowerupContext.Provider
      value={{ catalog, active, secondsLeft, cooldownSecondsLeft, buyingId, activatingId, buy, activate }}
    >
      {children}
    </TimedLuckPowerupContext.Provider>
  )
}

export function useTimedLuckPowerupContext() {
  const ctx = useContext(TimedLuckPowerupContext)
  if (!ctx) throw new Error('useTimedLuckPowerupContext must be used within a TimedLuckPowerupProvider')
  return ctx
}
