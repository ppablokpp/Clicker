const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * One opened chest. Currency chests report what was credited; style chests
 * report which piece was granted, as the slot/id pair that addresses it in
 * the cosmetics catalogue.
 */
export type ChestBatchResult =
  | { chest: string; kind: 'currency'; prizeId: string; prizeAmount: number; currency: 'clicks' | 'gems' }
  | { chest: string; kind: 'cosmetic'; slot: string; itemId: string }

/** How many chests the player is holding, keyed by chest id. */
export async function fetchOwnedChests(token: string | null): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/api/chests`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('owned-chests-failed')
  const data = await res.json()
  return data.owned ?? { material: 0, gems: 0, style: 0, styleRare: 0 }
}

export interface OpenChestsResponse {
  ok: boolean
  error?: string
  keys?: number
  totalClicks?: number
  gems?: number
  keyCost?: number
  /** Fresh counts after the pull, so the bench can stop showing a spent one. */
  ownedStyleChests?: number
  ownedStyleRareChests?: number
  ownedChests?: Record<string, number>
  results?: ChestBatchResult[]
}

/**
 * Opens a batch of chests in one request. Prizes are rolled server-side and
 * come back in the same order the chests were sent, so each reel can be
 * pointed at its own result. The whole batch is one transaction: it either
 * all lands or none of it does.
 */
export async function openChests(token: string, chests: string[]): Promise<OpenChestsResponse> {
  try {
    const res = await fetch(`${API_URL}/api/chests/open`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chests }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? 'open-failed' }
    return { ok: true, ...data }
  } catch (err) {
    console.error('No se pudieron abrir los cofres', err)
    return { ok: false, error: 'network' }
  }
}

/**
 * Every cosmetic this account has won, as "slot:itemId" keys. Used to grey
 * out a style chest whose pool the player has emptied, so they never press a
 * button that can only fail.
 */
export async function fetchOwnedCosmetics(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/chests/cosmetics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.owned) ? data.owned : []
  } catch (err) {
    console.error('No se pudieron cargar los cosméticos', err)
    return []
  }
}
