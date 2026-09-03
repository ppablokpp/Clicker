import { DEFAULT_STYLE_IDS, loadStyleIds, saveStyleIds, type AstronautStyleIds } from './astronautStyles'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Normalises whatever the server hands back into a complete style. The
 * stored value is a partial bag of slot -> id (a row saved before a slot
 * existed simply won't have it), and `null` for anyone who never opened the
 * customization screen — both have to resolve to the default kit rather
 * than to an avatar with missing pieces.
 */
export function normalizeStyle(raw: unknown): AstronautStyleIds {
  if (!raw || typeof raw !== 'object') return DEFAULT_STYLE_IDS
  const partial = raw as Partial<Record<keyof AstronautStyleIds, unknown>>
  const pickId = (slot: keyof AstronautStyleIds) =>
    typeof partial[slot] === 'string' ? (partial[slot] as string) : DEFAULT_STYLE_IDS[slot]
  return {
    helmet: pickId('helmet'),
    suit: pickId('suit'),
    boots: pickId('boots'),
    belt: pickId('belt'),
    bracelet: pickId('bracelet'),
    accent: pickId('accent'),
  }
}

/**
 * The player's own equipped style, from the server. localStorage is still
 * written on every change and still read first (see loadStyleIds), but only
 * as a cache that makes the avatar paint correctly on the very first frame
 * — the server row is the source of truth, because it's what everyone else
 * sees on the public profile.
 *
 * Returns null on any failure so the caller can simply keep the cached
 * value: a network blip should never repaint someone's character as the
 * default kit.
 */
export async function fetchMyStyle(getToken: () => Promise<string | null>): Promise<AstronautStyleIds | null> {
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = await res.json()

    // Nothing stored on the account. That's true both for someone who has
    // never customized *and* for everyone who picked a look while this was
    // browser-only — and those two are indistinguishable from here. So the
    // local choice wins and gets pushed up, instead of the empty server row
    // resetting a character someone already built. Once it's up, the branch
    // below takes over on every later load.
    if (!data.astronautStyle) {
      const local = loadStyleIds()
      void saveMyStyle(getToken, local)
      return local
    }

    const style = normalizeStyle(data.astronautStyle)
    // Refresh the local cache so the next cold start paints this, not a
    // stale choice from another device.
    saveStyleIds(style)
    return style
  } catch {
    return null
  }
}

export async function saveMyStyle(
  getToken: () => Promise<string | null>,
  style: AstronautStyleIds,
): Promise<boolean> {
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/users/me/astronaut-style`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ style }),
    })
    return res.ok
  } catch (err) {
    console.error('No se pudo guardar la personalización', err)
    return false
  }
}
