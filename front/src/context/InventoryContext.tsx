import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface InventoryContextValue {
  inventory: Record<string, number>
  /** Optimistic local bump right after a successful buy/activate — avoids waiting on a refetch. */
  adjust: (itemId: string, delta: number) => void
  // Lights the Home header's "Inventario" button — true the instant any
  // item is gained (a positive adjust), cleared once the player actually
  // opens the inventory panel (see Home.tsx's onClick).
  hasNewItem: boolean
  markInventorySeen: () => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

// Owned-but-not-yet-activated powerups/luck-powerups/magnets — one shared
// store since all three categories' /buy routes write into the same
// user_inventory table on the backend. Powers the Home "Inventory" modal's
// owned counts; each category's own context (Powerup/TimedLuckPowerup/
// Magnet) reads and adjusts this instead of tracking its own copy.
export function InventoryProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [hasNewItem, setHasNewItem] = useState(false)
  const markInventorySeen = useCallback(() => setHasNewItem(false), [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (data.inventory) setInventory(data.inventory)
        }
      } catch (err) {
        console.error('No se pudo cargar el inventario', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const adjust = useCallback((itemId: string, delta: number) => {
    if (delta > 0) setHasNewItem(true)
    setInventory((prev) => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta)
      return { ...prev, [itemId]: next }
    })
  }, [])

  return (
    <InventoryContext.Provider value={{ inventory, adjust, hasNewItem, markInventorySeen }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventoryContext() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventoryContext must be used within an InventoryProvider')
  return ctx
}
