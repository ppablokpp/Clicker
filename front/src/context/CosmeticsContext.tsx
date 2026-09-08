import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { useGemsContext } from './GemsContext'
import { playChestPurchase } from '../lib/caseSound'
import { isDefaultCosmetic, type AstronautStyleIds } from '../lib/astronautStyles'
import type { AstronautSlot } from '../components/AstronautPiecePreview'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface BuyCosmeticsResult {
  ok: boolean
  /** Only set on failure — 'not-enough-gems', 'already-owned', … */
  reason?: string
}

interface CosmeticsContextValue {
  /** "slot:itemId" for everything won or bought. Never contains the stock kit. */
  owned: Set<string>
  /** False until the first fetch lands, so the grid can avoid flashing every item as locked. */
  loaded: boolean
  isUnlocked: (slot: AstronautSlot, id: string) => boolean
  /** Folds a chest win straight in, so a piece is wearable the moment the reel stops. */
  grantCosmetics: (items: { slot: string; itemId: string }[]) => void
  buyCosmetics: (
    items: { slot: AstronautSlot; id: string }[],
    style: AstronautStyleIds,
  ) => Promise<BuyCosmeticsResult>
}

const CosmeticsContext = createContext<CosmeticsContextValue | null>(null)

/**
 * What the player owns of the astronaut catalogue.
 *
 * The stock kit is deliberately not in here and never will be: it's free and
 * permanent, so `isUnlocked` answers for it from the catalogue rather than
 * from a set the server has to remember. That keeps user_cosmetics a record
 * of things actually earned — one row per real unlock — instead of every
 * account carrying twelve rows saying "yes, you may wear the default suit".
 */
export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAppAuth()
  const { syncGems } = useGemsContext()
  const [owned, setOwned] = useState<Set<string>>(() => new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setOwned(new Set())
      setLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/cosmetics/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (Array.isArray(data.owned)) setOwned(new Set(data.owned as string[]))
      } catch (err) {
        console.error('No se pudieron cargar los cosméticos', err)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const isUnlocked = useCallback(
    (slot: AstronautSlot, id: string) =>
      isDefaultCosmetic(slot, id) || owned.has(`${slot}:${id}`),
    [owned],
  )

  const grantCosmetics = useCallback((items: { slot: string; itemId: string }[]) => {
    if (items.length === 0) return
    setOwned((prev) => {
      const next = new Set(prev)
      for (const item of items) next.add(`${item.slot}:${item.itemId}`)
      return next
    })
  }, [])

  /**
   * Buys a basket and equips it in one request. The style goes up with it
   * because the purchase is what turns the fitting room's preview into the
   * saved outfit — a second PUT afterwards could fail on its own and leave
   * the player owning a piece their astronaut isn't wearing.
   */
  const buyCosmetics = useCallback(
    async (items: { slot: AstronautSlot; id: string }[], style: AstronautStyleIds) => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/cosmetics/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            items: items.map((i) => ({ slot: i.slot, itemId: i.id })),
            style,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return { ok: false, reason: data.error ?? 'buy-failed' }
        if (Array.isArray(data.owned)) setOwned(new Set(data.owned as string[]))
        // The same cue every other gem/key spend in the store plays, so
        // buying a piece here lands like buying anything else. Deliberately
        // not on grantCosmetics: a chest opening has its own reveal sound.
        playChestPurchase()
        if (typeof data.gems === 'number') syncGems(data.gems)
        return { ok: true }
      } catch (err) {
        console.error('No se pudo comprar el cosmético', err)
        return { ok: false, reason: 'network' }
      }
    },
    [getToken, syncGems],
  )

  const value = useMemo(
    () => ({ owned, loaded, isUnlocked, grantCosmetics, buyCosmetics }),
    [owned, loaded, isUnlocked, grantCosmetics, buyCosmetics],
  )
  return <CosmeticsContext.Provider value={value}>{children}</CosmeticsContext.Provider>
}

export function useCosmetics() {
  const ctx = useContext(CosmeticsContext)
  if (!ctx) throw new Error('useCosmetics debe usarse dentro de CosmeticsProvider')
  return ctx
}
