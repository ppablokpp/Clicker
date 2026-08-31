import { useAuth } from '@clerk/expo'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchTreeState, type TreeStateResponse } from '../services/treeApi'
import { useClickCounterContext } from './ClickCounterContext'

// Auto-click production only actually gets credited (persisted) when this
// state is (re)fetched (see back/src/db/treeRepository.js) — kept
// infrequent since the fast local tick below is what makes the display
// feel smooth; this is purely how often the real total gets reconciled.
// Matches front/src/context/TreeContext.tsx's own POLL_INTERVAL_MS exactly.
const POLL_INTERVAL_MS = 8000
// Purely local, purely visual — predicts the display forward between real
// polls using the known rate, never touches the network.
const TICK_INTERVAL_MS = 100

type TreeState = Omit<TreeStateResponse, 'totalClicks' | 'objectsBroken' | 'objectProgress' | 'creditedThisCall'>

const EMPTY_STATE: TreeState = {
  autoClickLevel: 0,
  autoClickCps: 0,
  luckChance: 0,
  luckMultiplier: 1,
  scoutDroneLevel: 0,
  scoutDroneRate: 2,
  scoutDroneCps: 0,
  multiplierValue: 1,
  autoMultiplierValue: 0.5,
  tapMultiplierValue: 1,
  multiShotValue: 1,
  offlineProductionValue: 0.01,
}

interface TreeContextValue extends TreeState {
  refetch: () => Promise<void>
}

const TreeContext = createContext<TreeContextValue | null>(null)

// Read-only subset of front/src/context/TreeContext.tsx — the fetch/poll/
// local-tick machinery only, none of its 19 buy mutations (those back the
// full pan/zoom Tree canvas, which is its own much larger port, deliberately
// last per the plan). This alone is enough to show real fleet/production
// numbers on Home and in the Command Center: how many drones you own, how
// fast they're actually producing, the tap-power multipliers, etc.
export function TreeProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicksIfNewer, tickAutoClicks, syncObjectState } = useClickCounterContext()
  const [state, setState] = useState<TreeState>(EMPTY_STATE)
  // Read from inside the fast tick interval without needing to restart it
  // every time the rate changes (e.g. right after a purchase, once buying
  // exists on mobile too).
  const cpsRef = useRef(0)

  useEffect(() => {
    cpsRef.current = state.autoClickCps + state.scoutDroneCps
  }, [state.autoClickCps, state.scoutDroneCps])

  const fetchState = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getToken()
      const data = await fetchTreeState(token)
      if (!data) return
      setState({
        autoClickLevel: data.autoClickLevel,
        autoClickCps: data.autoClickCps,
        luckChance: data.luckChance,
        luckMultiplier: data.luckMultiplier,
        scoutDroneLevel: data.scoutDroneLevel,
        scoutDroneRate: data.scoutDroneRate,
        scoutDroneCps: data.scoutDroneCps,
        multiplierValue: data.multiplierValue,
        autoMultiplierValue: data.autoMultiplierValue,
        tapMultiplierValue: data.tapMultiplierValue,
        multiShotValue: data.multiShotValue,
        offlineProductionValue: data.offlineProductionValue,
      })
      // A read-only poll, not a spend/earn action — never allowed to move
      // the total backwards (see syncTotalClicksIfNewer's own comment for
      // why a plain syncTotalClicks here could randomly yank the counter
      // down mid-session).
      if (typeof data.totalClicks === 'number') syncTotalClicksIfNewer(data.totalClicks)
      if (typeof data.objectsBroken === 'number' && typeof data.objectProgress === 'number') {
        syncObjectState(data.objectsBroken, data.objectProgress)
      }
    } catch (err) {
      console.error('No se pudo cargar el estado del árbol', err)
    }
  }, [userId, getToken, syncTotalClicksIfNewer, syncObjectState])

  useEffect(() => {
    if (!userId) return
    fetchState()
    const interval = setInterval(fetchState, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [userId, fetchState])

  // Smooth local prediction between the infrequent real polls above — pure
  // display, reconciled every time a real poll lands (syncTotalClicksIfNewer
  // folds this prediction back out via ClickCounterContext so it's never
  // double-counted once the server value catches up).
  useEffect(() => {
    if (!userId) return
    let lastTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const deltaSeconds = (now - lastTime) / 1000
      lastTime = now
      if (cpsRef.current > 0) tickAutoClicks(cpsRef.current * deltaSeconds)
    }, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [userId, tickAutoClicks])

  return <TreeContext.Provider value={{ ...state, refetch: fetchState }}>{children}</TreeContext.Provider>
}

export function useTreeContext() {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTreeContext must be used within a TreeProvider')
  return ctx
}
