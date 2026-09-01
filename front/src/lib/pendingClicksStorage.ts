// Durability layer for the click counter's local "pending" buffer (see
// useClickCounter.ts). Now that flushes only reach the server every
// FLUSH_INTERVAL_MS (30s, up from 1s), a hard crash/power-loss between
// flushes — the one case the existing visibilitychange/pagehide flush can't
// catch, since those need the page to get a chance to run JS at all — would
// silently drop up to 30s of real progress. This persists the *unflushed*
// buffer only (never the confirmed total, which always comes fresh from the
// server on load) so it can be replayed into memory and re-sent next launch.
const STORAGE_KEY_PREFIX = 'clicker:pendingClicks:'

export interface PersistedPending {
  pending: number
  pendingRealClicks: number
  pendingLuckyHits: number
  peakCps: number
}

function isValid(value: unknown): value is PersistedPending {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.pending === 'number' &&
    typeof v.pendingRealClicks === 'number' &&
    typeof v.pendingLuckyHits === 'number' &&
    typeof v.peakCps === 'number'
  )
}

export function loadPendingClicks(userId: string): PersistedPending | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Called on a 5s interval (and right before the page actually goes away) —
// never per-click, that would just be a synchronous localStorage write on
// every single tap for no benefit over the interval.
export function savePendingClicks(userId: string, data: PersistedPending): void {
  try {
    if (data.pending <= 0) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + userId)
      return
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(data))
  } catch {
    // Storage full/unavailable (private browsing, quota) — losing this
    // durability layer isn't fatal, the normal 30s server flush still runs.
  }
}

export function clearPendingClicks(userId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + userId)
  } catch {
    // Same as above — non-fatal.
  }
}
