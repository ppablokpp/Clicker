import { useAuth } from '@clerk/expo'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buyTreeNode, fetchTreeState, type TreeBuyKey, type TreeStateResponse } from '../services/treeApi'
import { useClickCounterContext } from './ClickCounterContext'

// Auto-click production only actually gets credited (persisted) when this
// state is (re)fetched (see back/src/db/treeRepository.js's accrueAndGetState)
// — kept infrequent since the fast local tick below is what makes the
// display feel smooth; this is purely how often the real total gets
// reconciled. Matches front/src/context/TreeContext.tsx's own
// POLL_INTERVAL_MS exactly — was 8000, now matches the click-flush's own
// FLUSH_INTERVAL_MS (see useClickCounter.ts): the server computes accrual
// from elapsed wall-clock time since last credited, so stretching this
// loses nothing, and a buy action re-runs this same accrual pass itself
// before checking affordability anyway.
const POLL_INTERVAL_MS = 30_000
// Purely local, purely visual — predicts the display forward between real
// polls using the known rate, never touches the network.
const TICK_INTERVAL_MS = 100

type TreeState = Omit<TreeStateResponse, 'totalClicks' | 'objectsBroken' | 'objectProgress' | 'creditedThisCall'>

const EMPTY_STATE: TreeState = {
  autoClickLevel: 0,
  autoClickCps: 0,
  autoClickNextCost: 0,
  autoClickNextCps: 0,
  luckLevel: 0,
  luckChance: 0,
  luckMultiplier: 1,
  luckNextCost: 0,
  luckChanceLevel: 0,
  luckChanceNextCost: 0,
  scoutDroneLevel: 0,
  scoutDroneNextCost: 0,
  scoutDroneRate: 2,
  scoutDroneCps: 0,
  scoutFrequencyLevel: 0,
  scoutFrequencyNextCost: 0,
  multiplierLevel: 0,
  multiplierValue: 1,
  multiplierNextValue: 2,
  multiplierNextCost: 0,
  legendaryUnlockLevel: 0,
  legendaryUnlockNextCost: 100_000,
  legendaryEaseLevel: 0,
  legendaryStreakBase: 200,
  legendaryEaseNextCost: 0,
  legendaryGrowthLevel: 0,
  legendaryBonusStep: 0.1,
  legendaryGrowthNextCost: 0,
  legendaryThresholdLevel: 0,
  legendaryThresholdTps: 30,
  legendaryThresholdNextCost: 0,
  autoMultiplierLevel: 0,
  autoMultiplierValue: 0.5,
  autoMultiplierNextValue: 1,
  autoMultiplierNextCost: 0,
  tapMultiplierLevel: 0,
  tapMultiplierValue: 1,
  tapMultiplierNextCost: 0,
  multiShotLevel: 0,
  multiShotValue: 1,
  multiShotNextCost: 0,
  anomalyUnlockLevel: 0,
  anomalyUnlockNextCost: 5_000,
  anomalyRewardLevel: 0,
  anomalyRewardValue: 0,
  anomalyRewardNextCost: 0,
  anomalyFrequencyLevel: 0,
  anomalyFrequencySeconds: 300,
  anomalyFrequencyNextCost: 0,
  offlineProductionLevel: 0,
  offlineProductionValue: 0.01,
  offlineProductionNextCost: 5_000,
}

interface TreeContextValue extends TreeState {
  refetch: () => Promise<void>
  // Which node's buy button is currently in flight — a single tracker
  // instead of 19 individual booleans (one per node, matching the web),
  // since only one purchase can realistically be in progress at a time and
  // this is far more maintainable across 19 near-identical actions.
  buyingKey: TreeBuyKey | null
  buy: (key: TreeBuyKey) => Promise<{ ok: boolean; error?: string }>
}

const TreeContext = createContext<TreeContextValue | null>(null)

// front/src/context/TreeContext.tsx, ported in full: the fetch/poll/
// local-tick machinery, all 19 buy endpoints, and the fields those need. A
// single generic `buy(key)` (see services/treeApi.ts's buyTreeNode) drives
// every node instead of 19 near-identical callbacks.
export function TreeProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks, syncTotalClicksIfNewer, tickAutoClicks, syncObjectState, flushNow } =
    useClickCounterContext()
  const [state, setState] = useState<TreeState>(EMPTY_STATE)
  const [buyingKey, setBuyingKey] = useState<TreeBuyKey | null>(null)
  // Read from inside the fast tick interval without needing to restart it
  // every time the rate changes (e.g. right after a purchase).
  const cpsRef = useRef(0)

  useEffect(() => {
    cpsRef.current = state.autoClickCps + state.scoutDroneCps
  }, [state.autoClickCps, state.scoutDroneCps])

  const applyState = useCallback((data: TreeStateResponse) => {
    setState({
      autoClickLevel: data.autoClickLevel,
      autoClickCps: data.autoClickCps,
      autoClickNextCost: data.autoClickNextCost,
      autoClickNextCps: data.autoClickNextCps,
      luckLevel: data.luckLevel,
      luckChance: data.luckChance,
      luckMultiplier: data.luckMultiplier,
      luckNextCost: data.luckNextCost,
      luckChanceLevel: data.luckChanceLevel,
      luckChanceNextCost: data.luckChanceNextCost,
      scoutDroneLevel: data.scoutDroneLevel,
      scoutDroneNextCost: data.scoutDroneNextCost,
      scoutDroneRate: data.scoutDroneRate,
      scoutDroneCps: data.scoutDroneCps,
      scoutFrequencyLevel: data.scoutFrequencyLevel,
      scoutFrequencyNextCost: data.scoutFrequencyNextCost,
      multiplierLevel: data.multiplierLevel,
      multiplierValue: data.multiplierValue,
      multiplierNextValue: data.multiplierNextValue,
      multiplierNextCost: data.multiplierNextCost,
      legendaryUnlockLevel: data.legendaryUnlockLevel,
      legendaryUnlockNextCost: data.legendaryUnlockNextCost,
      legendaryEaseLevel: data.legendaryEaseLevel,
      legendaryStreakBase: data.legendaryStreakBase,
      legendaryEaseNextCost: data.legendaryEaseNextCost,
      legendaryGrowthLevel: data.legendaryGrowthLevel,
      legendaryBonusStep: data.legendaryBonusStep,
      legendaryGrowthNextCost: data.legendaryGrowthNextCost,
      legendaryThresholdLevel: data.legendaryThresholdLevel,
      legendaryThresholdTps: data.legendaryThresholdTps,
      legendaryThresholdNextCost: data.legendaryThresholdNextCost,
      autoMultiplierLevel: data.autoMultiplierLevel,
      autoMultiplierValue: data.autoMultiplierValue,
      autoMultiplierNextValue: data.autoMultiplierNextValue,
      autoMultiplierNextCost: data.autoMultiplierNextCost,
      tapMultiplierLevel: data.tapMultiplierLevel,
      tapMultiplierValue: data.tapMultiplierValue,
      tapMultiplierNextCost: data.tapMultiplierNextCost,
      multiShotLevel: data.multiShotLevel,
      multiShotValue: data.multiShotValue,
      multiShotNextCost: data.multiShotNextCost,
      anomalyUnlockLevel: data.anomalyUnlockLevel,
      anomalyUnlockNextCost: data.anomalyUnlockNextCost,
      anomalyRewardLevel: data.anomalyRewardLevel,
      anomalyRewardValue: data.anomalyRewardValue,
      anomalyRewardNextCost: data.anomalyRewardNextCost,
      anomalyFrequencyLevel: data.anomalyFrequencyLevel,
      anomalyFrequencySeconds: data.anomalyFrequencySeconds,
      anomalyFrequencyNextCost: data.anomalyFrequencyNextCost,
      offlineProductionLevel: data.offlineProductionLevel,
      offlineProductionValue: data.offlineProductionValue,
      offlineProductionNextCost: data.offlineProductionNextCost,
    })
  }, [])

  // Guards against overlapping calls the same way useClickCounter's own
  // flush() does — needed here specifically because the effect below that
  // schedules this on a timer can't be trusted to only ever have one
  // in-flight at a time (see that effect's own comment for why), and unlike
  // flush()'s /increment, this hits accrueAndGetState's SELECT ... FOR
  // UPDATE — several overlapping calls for the same user queue up on that
  // row lock instead of just wasting a request, and none of them ever
  // resolves in reasonable time.
  const fetchInFlightRef = useRef(false)

  const fetchState = useCallback(async () => {
    if (!userId || fetchInFlightRef.current) return
    fetchInFlightRef.current = true
    try {
      const token = await getToken()
      const data = await fetchTreeState(token)
      if (!data) return
      applyState(data)
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
    } finally {
      fetchInFlightRef.current = false
    }
  }, [userId, getToken, applyState, syncTotalClicksIfNewer, syncObjectState])

  // `fetchState` itself is *not* a stable reference — it (like almost every
  // callback here) depends on `getToken`, which Clerk hands back as a fresh
  // function on every render, and this provider re-renders constantly while
  // any auto-click production is active (tickAutoClicks below updates
  // totalClicks every TICK_INTERVAL_MS, and that flows through
  // ClickCounterContext's own memoized value, whose reference then changes
  // on the same cadence, re-rendering every consumer — including this
  // provider). Putting `fetchState` in this effect's own deps would tear
  // down and restart the interval on every one of those re-renders — i.e.
  // every ~100ms, forever — so the 30s poll would never survive long enough
  // to actually fire. Routing through a ref sidesteps that entirely: the
  // interval itself is set up exactly once (empty deps) and always calls
  // whatever the *latest* fetchState closure is via the ref, regardless of
  // how often that closure's identity changes.
  const fetchStateRef = useRef(fetchState)
  useEffect(() => {
    fetchStateRef.current = fetchState
  }, [fetchState])

  useEffect(() => {
    if (!userId) return
    fetchStateRef.current()
    const interval = setInterval(() => fetchStateRef.current(), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [userId])

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

  // One generic buy action for all 19 nodes — each POST returns the same
  // shape of fresh TreeState fields (whichever ones that node touches) plus
  // an updated totalClicks (the spend), same as the web's own 19 individual
  // buy* callbacks all did.
  const buy = useCallback(
    async (key: TreeBuyKey) => {
      if (!userId) return { ok: false, error: 'not-signed-in' }
      setBuyingKey(key)
      try {
        // Every node's cost is clicks-denominated and checked server-side
        // against a total that only advances on flush — force one first so
        // this never gets wrongly rejected against a total that's up to
        // FLUSH_INTERVAL_MS stale.
        await flushNow()
        const token = await getToken()
        const { ok, error, data } = await buyTreeNode(token, key)
        if (!ok) return { ok: false, error }
        applyState({ ...state, ...data } as TreeStateResponse)
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        return { ok: true }
      } catch (err) {
        console.error('No se pudo comprar la mejora', err)
        return { ok: false, error: 'network' }
      } finally {
        setBuyingKey(null)
      }
    },
    [userId, getToken, state, applyState, syncTotalClicks, flushNow],
  )

  // Memoized — this component consumes ClickCounterContext (for
  // syncTotalClicks etc.), so it re-renders on *every tap* regardless of
  // whether anything tree-related changed. An unmemoized value here used to
  // hand every one of TreeContext's own consumers (ShipModal, the Tree
  // screen, every TreeNodeModal) a brand-new object reference on every
  // single shot, forcing them all to re-render too — the same
  // context-cascade bug as ClickCounterContext's own value (see
  // useClickCounter.ts's comment), just one layer further down the
  // provider tree.
  const value = useMemo(
    () => ({ ...state, buyingKey, buy, refetch: fetchState }),
    [state, buyingKey, buy, fetchState],
  )

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>
}

export function useTreeContext() {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTreeContext must be used within a TreeProvider')
  return ctx
}
