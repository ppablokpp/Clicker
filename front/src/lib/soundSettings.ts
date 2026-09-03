const STORAGE_KEY = 'clankup_sound_enabled'

/**
 * Cached in a module variable, not read from localStorage per call: this is
 * checked once per sound, and rapid tapping fires one per shot — a
 * synchronous storage read on that path is real work for a value that only
 * changes when someone opens settings.
 *
 * Defaults to on. Sound is part of how the game feels, so silence has to be
 * something a player chose, never the state they land in because nothing
 * was stored yet.
 */
let enabled = ((): boolean => {
  try {
    // Only an explicit 'false' turns it off — a missing key, a cleared
    // profile or a corrupted value all mean "never chose", which is on.
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
})()

export function isSoundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(next: boolean): void {
  enabled = next
  try {
    localStorage.setItem(STORAGE_KEY, String(next))
  } catch {
    // Storage unavailable — the choice still holds for this session.
  }
}
