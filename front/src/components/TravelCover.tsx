import { useEffect } from 'react'
import { LoadingScreen } from './LoadingScreen'

/** How long a flight takes. Long enough to read as a trip, short enough
 *  that nobody reaches for the back button. */
const FLIGHT_MS = 2000

// The flight itself: the startup cover with its own status lines, held for
// a couple of seconds, then `onDone` — which is where the caller navigates.
// Above the tab bar (z-40) and every modal (z-50), so the trip is the only
// thing on screen.
export function TravelCover({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, FLIGHT_MS)
    return () => window.clearTimeout(t)
    // `onDone` is an inline arrow at both call sites; re-arming the timer
    // on every render of the parent would push the landing out forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="fixed inset-0 z-[100]">
      <LoadingScreen steps={steps} />
    </div>
  )
}
