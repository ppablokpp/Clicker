import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { LoadingScreen } from './LoadingScreen'

/**
 * One loading screen for the whole startup, mounted once and torn down once.
 *
 * There used to be two — AuthGate rendered its own while working out whose
 * save this is, then GameStateGate rendered another while that save arrived.
 * Being at different points in the tree, React unmounted the first and mounted
 * the second, and the spinner's DOM was rebuilt mid-load: new elements, new
 * compositor layer, fresh raster. Phase-locking the animation to wall clock
 * (see LoadingScreen) hid the visual jump in the animation itself, but not the
 * tug of the swap.
 *
 * So the screen stops belonging to either gate. It lives here, above both, and
 * the gates only report readiness. Nothing about it is re-created while the
 * startup runs, whatever changes underneath.
 *
 * It renders after `children` and covers the viewport, which flips the gating
 * around usefully: the app is free to mount and fetch *behind* it, so by the
 * time the cover lifts everything downstream has already done its first render
 * rather than starting one.
 */
type Report = (key: string, ready: boolean) => void

const ReportContext = createContext<Report>(() => {})

/**
 * Both keys start pending, which matters: readiness is reported from effects,
 * and those run after the first paint. Starting empty would show one frame of
 * bare page before the cover appeared.
 */
const INITIAL_READY: Record<string, boolean> = { identity: false, state: false }

export function LoadingGateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(INITIAL_READY)

  const report = useCallback<Report>((key, isReady) => {
    // Bail out when nothing changed. Readiness is reported from effects that
    // re-run whenever their inputs move, and a fresh object every time would
    // re-render everything under this provider on each report.
    setReady((prev) => (prev[key] === isReady ? prev : { ...prev, [key]: isReady }))
  }, [])

  const allReady = Object.values(ready).every(Boolean)

  return (
    <ReportContext.Provider value={report}>
      {children}
      {!allReady && (
        <div className="fixed inset-0 z-[100]">
          <LoadingScreen />
        </div>
      )}
    </ReportContext.Provider>
  )
}

/** Declares one named prerequisite of startup. Reports ready on unmount, so a
 *  branch that stops applying — the signed-out path when someone signs in —
 *  can't leave the cover up forever. */
export function useReportReady(key: string, isReady: boolean) {
  const report = useContext(ReportContext)
  useEffect(() => {
    report(key, isReady)
    return () => report(key, true)
  }, [key, isReady, report])
}
