import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Decides where every route change lands.
 *
 * React Router deliberately does nothing here — it leaves whatever scroll
 * offset happened to be there — and the app had nothing doing it either, so
 * arriving anywhere from a scrolled screen landed you mid-page. (Router 7
 * ships its own `ScrollRestoration`, but only for data routers; this app uses
 * `BrowserRouter` + `Routes`, so it isn't available here.)
 *
 * Two different behaviours, split on how you got there:
 *
 *  - **Going somewhere new** (PUSH) → the top. Home is where the old
 *    behaviour actually showed: it's `h-[100dvh] overflow-hidden` so it can
 *    never scroll itself, but its cockpit header is `absolute top-0`, pinned
 *    to the top of the *document*, while the bottom nav is `fixed`. A
 *    document still carrying an offset from the previous screen put the
 *    header above the fold and left the nav exactly where it belonged, which
 *    reads as "the header is missing" rather than "the page is scrolled".
 *
 *  - **Coming back** (POP — the back arrow on a public profile or the
 *    customization screen, both `navigate(-1)`) → wherever you were. Landing
 *    at the top of a hundred-row ranking after peeking at one player's
 *    profile means finding your place again every time.
 */

/** Last known offset per path. Session-lived; a few numbers, never cleaned. */
const offsets = new Map<string, number>()

/**
 * How long to keep re-applying a restored offset, in frames (~0.7s at 60fps).
 * The screen being returned to usually mounts empty and fetches its own
 * content — the ranking does — so for the first few frames the document is
 * too short to hold the offset and the browser clamps it straight back to
 * zero. Bounded because a restore that never gives up would fight the player
 * if they start scrolling themselves.
 */
const RESTORE_FRAMES = 40

export function ScrollManager() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  // Which path the scroll listener below is recording for. A ref, and updated
  // synchronously in the layout effect *before* scrolling: `scrollTo` queues
  // its scroll event asynchronously, so without this the event fired by our
  // own restore could land on the outgoing path and overwrite the offset we
  // just came back to.
  const recordingFor = useRef(pathname)

  // Recorded continuously rather than read on the way out. By the time an
  // effect cleanup runs the new route is already in the DOM and the browser
  // may have clamped the offset to zero, so the value worth saving is gone.
  useEffect(() => {
    const onScroll = () => offsets.set(recordingFor.current, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    recordingFor.current = pathname
    const target = navigationType === 'POP' ? (offsets.get(pathname) ?? 0) : 0

    // `instant` on purpose: a smooth scroll would animate the *incoming*
    // screen, which looks like the page moved rather than like it arrived.
    if (target === 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }

    let framesLeft = RESTORE_FRAMES
    let raf = 0
    const attempt = () => {
      window.scrollTo({ top: target, left: 0, behavior: 'instant' })
      // Landed, or the document is never going to be tall enough. Either way
      // stop — retrying forever would fight a player who scrolls meanwhile.
      if (Math.abs(window.scrollY - target) < 2 || framesLeft-- <= 0) return
      raf = requestAnimationFrame(attempt)
    }
    attempt()
    return () => cancelAnimationFrame(raf)
  }, [pathname, navigationType])

  return null
}
