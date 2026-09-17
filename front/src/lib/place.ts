import { useSyncExternalStore } from 'react'

/**
 * Where the player is: at the rock, or at the station.
 *
 * The centre tab goes back to whichever of the two you were last at, so
 * flicking through the store and the ranking from the station lands you
 * back at the station, not at the rock. Held in a module variable on
 * purpose, not in storage: a fresh load of the app always opens on the
 * asteroid, and that reset is exactly what reloading should do.
 */
export type Place = 'asteroid' | 'station'

let place: Place = 'asteroid'
const listeners = new Set<() => void>()

export function setPlace(next: Place) {
  if (place === next) return
  place = next
  for (const l of listeners) l()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const get = () => place

/** Read outside React — for a mount-time check. */
export const getPlace = get

export function usePlace(): Place {
  return useSyncExternalStore(subscribe, get, get)
}

/** The route the centre tab leads to from wherever you are. */
export const PLACE_ROUTES: Record<Place, string> = { asteroid: '/', station: '/estacion' }
