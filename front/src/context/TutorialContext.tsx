import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface TutorialStepDef {
  id: string
  // Matches a `data-tutorial="<target>"` attribute somewhere in the DOM —
  // undefined means a centered, full-dim narration step with no real
  // element to spotlight (e.g. the opening story beat).
  target?: string
  // true: TutorialOverlay itself detects a real click/pointerdown anywhere
  // inside the spotlighted hole (or, in open-field mode, anywhere outside
  // blockTargets) and advances automatically. Only used for steps that
  // don't cause anything else to happen ("just tap the asteroid") — a step
  // whose tap is *supposed* to cause something else (a navigation, a modal
  // opening) uses `advanceOnRoute`/`advanceOnTargetVisible` instead (see
  // below), never this, so advancing can never race the thing it's
  // supposed to follow.
  // false: whoever owns the target's onClick calls `advance()` manually
  // once its own async action actually finishes (the free-drone grant,
  // which needs to await a server round trip before it's safe to move on).
  autoAdvanceOnClick: boolean
  // Which route this step's target actually lives on — TutorialOverlay
  // navigates there automatically when a step needs it, so replaying the
  // whole thing from the Tree screen's "?" button still bounces back to
  // Home for the opening steps instead of getting stuck looking for a
  // target that isn't on the current page.
  route?: string
  // Open-field mode, mutually exclusive with `target` — instead of a
  // single spotlight hole, only these elements get covered (the top HUD,
  // the bottom nav) and the *rest of the whole screen* stays free to tap,
  // since Home's real click surface is the entire viewport, not one small
  // box. Used for "just shoot the asteroid" where boxing off a tiny hole
  // would fight the real click area instead of matching it.
  blockTargets?: string[]
  // How many real hits on the target (or, in open-field mode, anywhere
  // outside blockTargets) are needed before this step advances. Defaults
  // to 1.
  requiredClicks?: number
  // Advance the instant the URL matches this path — for a step whose
  // target is a plain navigation link. Watching the *result* (did the
  // route actually change) instead of guessing from a click means this can
  // never desync from whether the tap actually navigated: if it somehow
  // didn't, the tutorial correctly keeps waiting instead of plowing ahead
  // and getting stranded on the wrong screen.
  advanceOnRoute?: string
  // Advance the instant an element with this data-tutorial value appears
  // in the DOM — for a step whose target opens something (a modal) rather
  // than navigating. Tying advancement to the modal actually existing
  // (not to "a click landed on the button, which presumably opened it")
  // means it's immune to click-timing races with whatever else that same
  // tap's onClick handler does.
  advanceOnTargetVisible?: string
}

// Home's asteroid (x5) → Tree's nav tab → the drone node itself → its buy
// button (free, once) → a closing note about what the tree screen is for.
const ALL_STEPS: TutorialStepDef[] = [
  { id: 'intro', autoAdvanceOnClick: false, route: '/' },
  {
    id: 'pointAsteroid',
    blockTargets: ['home-hud', 'bottom-nav'],
    autoAdvanceOnClick: true,
    requiredClicks: 5,
    route: '/',
  },
  // nav-tree (the bottom pill) is rendered on every route, so no forced
  // navigation is needed just to reach this step itself.
  { id: 'pointTreeNav', target: 'nav-tree', autoAdvanceOnClick: false, advanceOnRoute: '/arbol' },
  {
    id: 'pointTreeRoot',
    target: 'tree-root-node',
    autoAdvanceOnClick: false,
    route: '/arbol',
    advanceOnTargetVisible: 'tree-buy-root',
  },
  { id: 'pointTreeBuy', target: 'tree-buy-root', autoAdvanceOnClick: false, route: '/arbol' },
  // Always pinned to the tree screen — reached either the normal way
  // (already there, buy-a-drone step just finished) or via the
  // already-own-a-drone replay skip below (landing here straight from
  // pointTreeNav), where forcing the route is what actually gets the
  // player off Home and onto the tree screen this text is about.
  { id: 'closing', autoAdvanceOnClick: false, route: '/arbol' },
]

// Replaying via the "?" button with the drone already owned skips the
// entire "tap the node, buy it free" demonstration — there's nothing left
// to show on a node you already own — by removing those two steps from the
// sequence outright instead of hopping over them at runtime once already
// on one. No skip-step bookkeeping in `advance()` at all this way: whatever
// step is next in the (possibly shorter) list just *is* the next step.
function buildSteps(skipDroneGrant: boolean): TutorialStepDef[] {
  if (!skipDroneGrant) return ALL_STEPS
  return ALL_STEPS.filter((s) => s.id !== 'pointTreeRoot' && s.id !== 'pointTreeBuy')
}

interface StartOptions {
  // Set when replaying via the "?" button and the drone node is already
  // past level 0 — skips the forced-buy step entirely instead of trying
  // (and failing) to grant an already-owned level for free.
  skipDroneGrant?: boolean
  // Replaying from the tree screen jumps straight past the Home-only
  // steps (intro story, tap-the-asteroid, go-to-tree-tab) instead of
  // bouncing the player back to Home just to replay the intro.
  startAt?: string
}

interface TutorialContextValue {
  isActive: boolean
  currentStep: TutorialStepDef | null
  skipDroneGrant: boolean
  start: (options?: StartOptions) => void
  advance: () => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  // null = not running. A real index (including 0) = currently on that step.
  const [stepIndex, setStepIndex] = useState<number | null>(null)
  const [skipDroneGrant, setSkipDroneGrant] = useState(false)
  const hasCheckedRef = useRef(false)

  // Recomputed only when skipDroneGrant actually changes (i.e. on `start`) —
  // this is the one array `stepIndex` indexes into for the whole run.
  const steps = useMemo(() => buildSteps(skipDroneGrant), [skipDroneGrant])

  // Auto-starts exactly once per real sign-in, the very first time this
  // account is seen with tutorial_completed still false — everything after
  // that (replays) goes through the explicit `start()` call from Tree's
  // "?" button instead.
  useEffect(() => {
    if (!userId || hasCheckedRef.current) return
    hasCheckedRef.current = true
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.tutorialCompleted === false) {
            setSkipDroneGrant(false)
            setStepIndex(0)
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar el estado del tutorial', err)
      }
    })()
  }, [userId, getToken])

  const finish = useCallback(async () => {
    setStepIndex(null)
    if (!userId) return
    try {
      const token = await getToken()
      await fetch(`${API_URL}/api/users/tutorial-complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('No se pudo guardar el progreso del tutorial', err)
    }
  }, [userId, getToken])

  const start = useCallback((options?: StartOptions) => {
    const skip = options?.skipDroneGrant ?? false
    setSkipDroneGrant(skip)
    const activeSteps = buildSteps(skip)
    const startAt = options?.startAt
    const idx = startAt ? activeSteps.findIndex((s) => s.id === startAt) : 0
    setStepIndex(idx >= 0 ? idx : 0)
  }, [])

  const advance = useCallback(() => {
    setStepIndex((prev) => {
      if (prev === null) return prev
      const next = prev + 1
      if (next >= steps.length) {
        void finish()
        return null
      }
      return next
    })
  }, [steps, finish])

  const currentStep = stepIndex !== null ? (steps[stepIndex] ?? null) : null

  const isActive = stepIndex !== null
  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ isActive, currentStep, skipDroneGrant, start, advance }),
    [isActive, currentStep, skipDroneGrant, start, advance],
  )

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
}

export function useTutorialContext() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorialContext must be used within a TutorialProvider')
  return ctx
}
