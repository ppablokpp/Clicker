import AsyncStorage from '@react-native-async-storage/async-storage'

// Durability layer for the click counter's local "pending" buffer (see
// useClickCounter.ts) — mirrors front/src/lib/pendingClicksStorage.ts, just
// on AsyncStorage instead of localStorage (async, so every call here is
// awaited rather than synchronous). Now that flushes only reach the server
// every FLUSH_INTERVAL_MS (30s, up from 1s), a hard crash/force-quit between
// flushes — the one case the existing AppState-background flush can't catch,
// since that needs the app to get a chance to run JS at all — would silently
// drop up to 30s of real progress. This persists the *unflushed* buffer only
// (never the confirmed total, which always comes fresh from the server on
// load) so it can be replayed into memory and re-sent next launch.
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

export async function loadPendingClicks(userId: string): Promise<PersistedPending | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Called on a 5s interval (and right before the app backgrounds) — never
// per-tap, that would just be an async storage write on every single click
// for no benefit over the interval.
export async function savePendingClicks(userId: string, data: PersistedPending): Promise<void> {
  try {
    if (data.pending <= 0) {
      await AsyncStorage.removeItem(STORAGE_KEY_PREFIX + userId)
      return
    }
    await AsyncStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(data))
  } catch {
    // Storage unavailable — losing this durability layer isn't fatal, the
    // normal 30s server flush still runs.
  }
}

export async function clearPendingClicks(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_PREFIX + userId)
  } catch {
    // Same as above — non-fatal.
  }
}
