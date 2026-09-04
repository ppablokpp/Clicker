import { useReportReady } from './LoadingGate'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'

/**
 * Keeps the loading screen up until the player's actual save has arrived —
 * not just until we know whose save it is.
 *
 * AuthGate covers the second part, and its own comment is precise about the
 * limit: it waits for an identity, then mounts the children so that "every
 * context fetches on mount keyed by whatever identity it sees then". Which
 * means the moment it lets go, the game renders with every provider still at
 * its initial values.
 *
 * The trouble is that those initial values are not blank, they're *valid*.
 * Zero clicks with prestige tier 0 is a real, complete game state: it draws
 * the lilac tier-0 asteroid, an empty fleet, every counter at 0. So for one
 * round trip the app doesn't look unloaded, it looks like a brand new save —
 * and then everything jumps at once.
 *
 * Unlike AuthGate this withholds nothing. The cover is an overlay, so the app
 * mounting underneath is not a problem but the point: those first renders and
 * the work they kick off happen while nobody can see them, and the screen is
 * already settled when the cover lifts. It also has to sit INSIDE the
 * providers, whose fetches start on mount — gating above them would delay the
 * very requests it waits for.
 *
 * Both flags are set in a `finally` at their source, so a failed or offline
 * fetch reports ready anyway. Waiting on requests that can fail would
 * otherwise turn a dropped connection into a loading screen with no way out.
 */
export function GameStateGate() {
  // The counter carries the prestige tier and the totals — the asteroid's
  // material and every number in the console. The tree carries the owned
  // levels, which is the fleet: without it the drone swarms pop into
  // existence a beat later.
  const { hasLoadedState: countersReady } = useClickCounterContext()
  const { hasLoadedState: treeReady } = useTreeContext()

  useReportReady('state', countersReady && treeReady)
  return null
}
