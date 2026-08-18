import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface PermanentUpgradeDef {
  id: string
  cost: number
  chance: number
  multiplier: number
}

interface UpgradesContextValue {
  catalog: PermanentUpgradeDef[]
  owned: Set<string>
  /** Not cumulative — only your single highest-tier owned upgrade applies. */
  bestOwned: PermanentUpgradeDef | null
  buyingId: string | null
  buy: (upgrade: PermanentUpgradeDef) => Promise<{ ok: boolean; error?: string }>
  rollLuckMultiplier: () => number
}

const UpgradesContext = createContext<UpgradesContextValue | null>(null)

export function UpgradesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const [catalog, setCatalog] = useState<PermanentUpgradeDef[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/upgrades`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de mejoras', err))
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/upgrades/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setOwned(new Set(data.owned))
        }
      } catch (err) {
        console.error('No se pudieron cargar tus mejoras permanentes', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const buy = useCallback(
    async (upgrade: PermanentUpgradeDef) => {
      if (!userId) return { ok: false, error: 'not-signed-in' }
      setBuyingId(upgrade.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/upgrades/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ upgradeId: upgrade.id }),
        })
        const data = await res.json()
        if (res.ok) {
          setOwned((prev) => new Set(prev).add(upgrade.id))
          if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
          return { ok: true }
        }
        return { ok: false, error: data.error }
      } catch (err) {
        console.error('No se pudo comprar la mejora', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingId(null)
      }
    },
    [userId, getToken, syncTotalClicks],
  )

  const bestOwned = useMemo(() => {
    let best: PermanentUpgradeDef | null = null
    for (const upgrade of catalog) {
      if (owned.has(upgrade.id) && (!best || upgrade.multiplier > best.multiplier)) {
        best = upgrade
      }
    }
    return best
  }, [catalog, owned])

  const rollLuckMultiplier = useCallback(() => {
    if (!bestOwned) return 1
    return Math.random() < bestOwned.chance ? bestOwned.multiplier : 1
  }, [bestOwned])

  return (
    <UpgradesContext.Provider value={{ catalog, owned, bestOwned, buyingId, buy, rollLuckMultiplier }}>
      {children}
    </UpgradesContext.Provider>
  )
}

export function useUpgradesContext() {
  const ctx = useContext(UpgradesContext)
  if (!ctx) throw new Error('useUpgradesContext must be used within an UpgradesProvider')
  return ctx
}
