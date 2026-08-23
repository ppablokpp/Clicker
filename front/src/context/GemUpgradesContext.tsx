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
import { useGemsContext } from './GemsContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playTreeUpgrade } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface GemUpgradeDef {
  id: string
  cost: number
  multiplier: number
}

interface GemUpgradesContextValue {
  catalog: GemUpgradeDef[]
  owned: Set<string>
  /** Not cumulative — only your single highest-tier owned upgrade applies, as a flat multiplier on every click. */
  bestOwned: GemUpgradeDef | null
  buyingId: string | null
  buy: (upgrade: GemUpgradeDef) => Promise<{ ok: boolean; error?: string }>
}

const GemUpgradesContext = createContext<GemUpgradesContextValue | null>(null)

// Same sequential-tier ladder as UpgradesContext (clicks) — just spends
// gems instead. No RevenueCat involved.
export function GemUpgradesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncGems } = useGemsContext()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<GemUpgradeDef[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/gem-upgrades`)
      .then((r) => r.json())
      .then(setCatalog)
      .catch((err) => console.error('No se pudo cargar el catálogo de mejoras premium', err))
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/gem-upgrades/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setOwned(new Set(data.owned))
        }
      } catch (err) {
        console.error('No se pudieron cargar tus mejoras premium', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const buy = useCallback(
    async (upgrade: GemUpgradeDef) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setBuyingId(upgrade.id)
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/gem-upgrades/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ upgradeId: upgrade.id }),
        })
        const data = await res.json()
        if (res.ok) {
          setOwned((prev) => new Set(prev).add(upgrade.id))
          if (typeof data.gems === 'number') syncGems(data.gems)
          playTreeUpgrade()
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
    [userId, getToken, syncGems, promptSignIn],
  )

  const bestOwned = useMemo(() => {
    let best: GemUpgradeDef | null = null
    for (const upgrade of catalog) {
      if (owned.has(upgrade.id) && (!best || upgrade.multiplier > best.multiplier)) {
        best = upgrade
      }
    }
    return best
  }, [catalog, owned])

  return (
    <GemUpgradesContext.Provider value={{ catalog, owned, bestOwned, buyingId, buy }}>
      {children}
    </GemUpgradesContext.Provider>
  )
}

export function useGemUpgradesContext() {
  const ctx = useContext(GemUpgradesContext)
  if (!ctx) throw new Error('useGemUpgradesContext must be used within a GemUpgradesProvider')
  return ctx
}
