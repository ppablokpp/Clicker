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
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface MagnetDef {
  id: string
  currency: 'keys' | 'gems'
  cost: number
  durationSeconds: number
  procChance: number
}

interface ActiveMagnet {
  id: string
  currency: 'keys' | 'gems'
  expiresAt: number
}

interface MagnetContextValue {
  catalog: MagnetDef[]
  active: ActiveMagnet | null
  secondsLeft: number
  /** Buying either magnet locks both for an hour. */
  cooldownSecondsLeft: number
  buyingId: string | null
  activatingId: string | null
  /** Just adds one to the owned count — doesn't start it running. */
  buy: (magnet: MagnetDef) => Promise<{ ok: boolean; error?: string }>
  /** Consumes one owned unit and starts it running — fails if the other magnet is already active. */
  activate: (magnet: MagnetDef) => Promise<{ ok: boolean; error?: string }>
  // Re-pulls the catalog — cost scales with prestige tier server-side (see
  // the route), so a tier change needs this re-fetched or the Store keeps
  // showing the pre-prestige cost for the rest of the session (see
  // Home.tsx's handleConfirmPrestige).
  refetchCatalog: () => void
}

const MagnetContext = createContext<MagnetContextValue | null>(null)

// Passive currency-gamble powerup: while active, every click has a small
// server-rolled chance to also grant a key or a gem (see clicks.js's
// /increment — the actual proc happens there, this context just tracks
// whether one is currently running and lets you buy/activate one.
export function MagnetProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const { adjust: adjustInventory } = useInventoryContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<MagnetDef[]>([])
  const [active, setActive] = useState<ActiveMagnet | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  // Authenticated (not a plain anonymous fetch) so the backend can scale
  // cost to the caller's own prestige tier — signed-out visitors just get
  // the flat, tier-0 catalog back.
  const fetchCatalog = useCallback(() => {
    ;(async () => {
      try {
        const headers: Record<string, string> = {}
        if (userId) {
          const token = await getToken()
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(`${API_URL}/api/magnets`, { headers })
        setCatalog(await res.json())
      } catch (err) {
        console.error('No se pudo cargar el catálogo de imanes', err)
      }
    })()
  }, [userId, getToken])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Hydrate any magnet still running from a previous session.
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
          if (data.activeMagnet) {
            setActive({
              id: data.activeMagnet.id,
              currency: data.activeMagnet.currency,
              expiresAt: new Date(data.activeMagnet.expiresAt).getTime(),
            })
          }
          if (data.magnetCooldownUntil) {
            setCooldownUntil(new Date(data.magnetCooldownUntil).getTime())
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar el imán activo', err)
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
    async (magnet: MagnetDef) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setBuyingId(magnet.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/magnets/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ magnetId: magnet.id }),
        })
        const data = await res.json()
        if (res.ok) {
          adjustInventory(magnet.id, 1)
          if (data.cooldownUntil) setCooldownUntil(new Date(data.cooldownUntil).getTime())
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
          playChestPurchase()
          return { ok: true }
        }
        if (data.error === 'cooldown' && data.cooldownUntil) {
          setCooldownUntil(new Date(data.cooldownUntil).getTime())
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo comprar el imán', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncTotalClicks, adjustInventory, promptSignIn],
  )

  const activate = useCallback(
    async (magnet: MagnetDef) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setActivatingId(magnet.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/magnets/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ magnetId: magnet.id }),
        })
        const data = await res.json()
        if (res.ok && data.activeMagnet) {
          setActive({
            id: data.activeMagnet.id,
            currency: magnet.currency,
            expiresAt: new Date(data.activeMagnet.expiresAt).getTime(),
          })
          adjustInventory(magnet.id, -1)
          return { ok: true }
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo activar el imán', err)
        return { ok: false, error: 'network' }
      } finally {
        setActivatingId(null)
      }
    },
    [userId, getToken, adjustInventory, promptSignIn],
  )

  return (
    <MagnetContext.Provider
      value={{
        catalog,
        active,
        secondsLeft,
        cooldownSecondsLeft,
        buyingId,
        activatingId,
        buy,
        activate,
        refetchCatalog: fetchCatalog,
      }}
    >
      {children}
    </MagnetContext.Provider>
  )
}

export function useMagnetContext() {
  const ctx = useContext(MagnetContext)
  if (!ctx) throw new Error('useMagnetContext must be used within a MagnetProvider')
  return ctx
}
