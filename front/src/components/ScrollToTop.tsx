import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Puts every route change back at the top of the page.
 *
 * React Router deliberately doesn't do this — it leaves whatever scroll
 * offset happened to be there — and the app had nothing doing it either, so
 * arriving anywhere from a scrolled screen landed you mid-page. Five routes
 * can be scrolled (Store, Stats, Leaderboard, PublicProfile,
 * CustomizeAstronaut), which is plenty of ways to build up an offset.
 *
 * Home is where it actually showed. It's `h-[100dvh] overflow-hidden`, so it
 * can never scroll itself and should be immune — but its cockpit header is
 * `absolute top-0`, pinned to the top of the *document*, while the bottom nav
 * is `fixed`. So a document still carrying an offset from the previous screen
 * puts the header above the fold and leaves the nav exactly where it belongs,
 * which reads as "the header is missing" rather than "the page is scrolled".
 * Shrinking the document to one viewport is supposed to clamp the offset back
 * to zero on its own, and usually does — hence "muy puntual" — but that clamp
 * isn't reliably immediate on mobile.
 *
 * `instant` on purpose: a smooth scroll here would animate the *incoming*
 * screen upward, which looks like the page moved rather than like it arrived.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
