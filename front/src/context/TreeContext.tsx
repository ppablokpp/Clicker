import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playTreeUpgrade } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
// Auto-click production only actually gets credited (persisted) when this
// state is (re)fetched (see back/src/db/treeRepository.js's accrueAndGetState)
// — kept infrequent since the fast local tick below is what makes the
// display feel smooth; this is purely how often the real total gets
// reconciled. Was 8000; matches the click-flush's own FLUSH_INTERVAL_MS now
// (see useClickCounter.ts) for the same reason — the server computes
// accrual from elapsed wall-clock time since last credited, so stretching
// this loses nothing (a poll after 30s of silence credits exactly the same
// total as two 15s polls would have, just in one write instead of two) and
// a buy action re-runs this same accrual pass itself before checking
// affordability, so purchases never see a stale production total either.
const POLL_INTERVAL_MS = 30_000
// Purely local, purely visual — predicts the display forward between real
// polls using the known rate, never touches the network.
const TICK_INTERVAL_MS = 100

interface TreeState {
  autoClickLevel: number
  autoClickCps: number
  autoClickNextCost: number | null
  autoClickNextCps: number
  luckLevel: number
  luckChance: number
  luckMultiplier: number
  luckNextCost: number | null
  luckChanceLevel: number
  luckChanceNextCost: number | null
  scoutDroneLevel: number
  scoutDroneNextCost: number | null
  scoutDroneRate: number
  scoutDroneCps: number
  scoutFrequencyLevel: number
  scoutFrequencyNextCost: number | null
  multiplierLevel: number
  multiplierValue: number
  multiplierNextValue: number
  multiplierNextCost: number | null
  legendaryUnlockLevel: number
  legendaryUnlockNextCost: number | null
  legendaryEaseLevel: number
  legendaryStreakBase: number
  legendaryEaseNextCost: number | null
  legendaryGrowthLevel: number
  legendaryBonusStep: number
  legendaryGrowthNextCost: number | null
  legendaryThresholdLevel: number
  legendaryThresholdTps: number
  legendaryThresholdNextCost: number | null
  autoMultiplierLevel: number
  autoMultiplierValue: number
  autoMultiplierNextValue: number
  autoMultiplierNextCost: number | null
  tapMultiplierLevel: number
  tapMultiplierValue: number
  tapMultiplierNextCost: number | null
  multiShotLevel: number
  multiShotValue: number
  multiShotNextCost: number | null
  anomalyUnlockLevel: number
  anomalyUnlockNextCost: number | null
  anomalyRewardLevel: number
  anomalyRewardValue: number
  anomalyRewardNextCost: number | null
  anomalyFrequencyLevel: number
  anomalyFrequencySeconds: number
  anomalyFrequencyNextCost: number | null
  offlineProductionLevel: number
  offlineProductionValue: number
  offlineProductionNextCost: number | null
}

interface TreeContextValue extends TreeState {
  // Pulls fresh tree levels immediately — used after a prestige confirm
  // (Home.tsx) instead of waiting for the next background poll.
  refetch: () => Promise<void>
  // What the fleet produced while the app was closed — set once, from the
  // very first /api/tree/me response after mount (see fetchState's
  // isFirstFetchRef), never from the routine 8s polls that follow. null
  // means either nothing to report yet, or the player already dismissed it
  // this session (see FleetAwayModal).
  awayCredit: number | null
  clearAwayCredit: () => void
  // Lights the Home header's "Centro de mando" button — true the instant
  // any tree upgrade is bought, cleared once the player actually opens that
  // panel (see Home.tsx's onClick), same on/off-on-seen pattern as
  // InventoryContext's own hasNewItem.
  hasNewUpgrade: boolean
  markUpgradesSeen: () => void
  isBuying: boolean
  buyAutoClick: () => Promise<{ ok: boolean; error?: string }>
  grantAutoClickFree: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLuck: boolean
  buyLuck: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLuckChance: boolean
  buyLuckChance: () => Promise<{ ok: boolean; error?: string }>
  isBuyingMultiplier: boolean
  buyMultiplier: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryUnlock: boolean
  buyLegendaryUnlock: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryEase: boolean
  buyLegendaryEase: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryGrowth: boolean
  buyLegendaryGrowth: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryThreshold: boolean
  buyLegendaryThreshold: () => Promise<{ ok: boolean; error?: string }>
  isBuyingScoutDrone: boolean
  buyScoutDrone: () => Promise<{ ok: boolean; error?: string }>
  isBuyingScoutFrequency: boolean
  buyScoutFrequency: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAutoMultiplier: boolean
  buyAutoMultiplier: () => Promise<{ ok: boolean; error?: string }>
  isBuyingTapMultiplier: boolean
  buyTapMultiplier: () => Promise<{ ok: boolean; error?: string }>
  isBuyingMultiShot: boolean
  buyMultiShot: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAnomalyUnlock: boolean
  buyAnomalyUnlock: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAnomalyReward: boolean
  buyAnomalyReward: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAnomalyFrequency: boolean
  buyAnomalyFrequency: () => Promise<{ ok: boolean; error?: string }>
  isBuyingOfflineProduction: boolean
  buyOfflineProduction: () => Promise<{ ok: boolean; error?: string }>
}

const TreeContext = createContext<TreeContextValue | null>(null)

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

export function TreeProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks, syncTotalClicksIfNewer, tickAutoClicks, syncObjectState, flushNow } =
    useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [state, setState] = useState<TreeState>(EMPTY_STATE)
  const [hasNewUpgrade, setHasNewUpgrade] = useState(false)
  const markUpgradesSeen = useCallback(() => setHasNewUpgrade(false), [])
  const [isBuying, setIsBuying] = useState(false)
  const [isBuyingLuck, setIsBuyingLuck] = useState(false)
  const [isBuyingLuckChance, setIsBuyingLuckChance] = useState(false)
  const [isBuyingMultiplier, setIsBuyingMultiplier] = useState(false)
  const [isBuyingLegendaryUnlock, setIsBuyingLegendaryUnlock] = useState(false)
  const [isBuyingLegendaryEase, setIsBuyingLegendaryEase] = useState(false)
  const [isBuyingLegendaryGrowth, setIsBuyingLegendaryGrowth] = useState(false)
  const [isBuyingLegendaryThreshold, setIsBuyingLegendaryThreshold] = useState(false)
  const [isBuyingScoutDrone, setIsBuyingScoutDrone] = useState(false)
  const [isBuyingScoutFrequency, setIsBuyingScoutFrequency] = useState(false)
  const [isBuyingAutoMultiplier, setIsBuyingAutoMultiplier] = useState(false)
  const [isBuyingTapMultiplier, setIsBuyingTapMultiplier] = useState(false)
  const [isBuyingMultiShot, setIsBuyingMultiShot] = useState(false)
  const [isBuyingAnomalyUnlock, setIsBuyingAnomalyUnlock] = useState(false)
  const [isBuyingAnomalyReward, setIsBuyingAnomalyReward] = useState(false)
  const [isBuyingAnomalyFrequency, setIsBuyingAnomalyFrequency] = useState(false)
  const [isBuyingOfflineProduction, setIsBuyingOfflineProduction] = useState(false)
  // Read from inside the fast tick interval without needing to restart it
  // every time the rate changes (e.g. right after a purchase).
  const cpsRef = useRef(0)
  const [awayCredit, setAwayCredit] = useState<number | null>(null)
  // Flips to false after the very first fetchState() call completes (mount
  // or sign-in), whether or not it actually credited anything — every
  // fetchState call after that is a routine background poll and must never
  // set awayCredit, or the modal would pop up again every 8 seconds.
  const isFirstFetchRef = useRef(true)
  const clearAwayCredit = useCallback(() => setAwayCredit(null), [])

  useEffect(() => {
    cpsRef.current = state.autoClickCps + state.scoutDroneCps
  }, [state.autoClickCps, state.scoutDroneCps])

  const fetchState = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
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
        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false
          if (typeof data.creditedThisCall === 'number' && data.creditedThisCall > 0) {
            setAwayCredit(data.creditedThisCall)
          }
        }
        // A read-only poll, not a spend/earn action — never allowed to move
        // the total backwards (see syncTotalClicksIfNewer's own comment for
        // why a plain syncTotalClicks here could randomly yank the counter
        // down mid-session).
        if (typeof data.totalClicks === 'number') syncTotalClicksIfNewer(data.totalClicks)
        if (typeof data.objectsBroken === 'number' && typeof data.objectProgress === 'number') {
          syncObjectState(data.objectsBroken, data.objectProgress)
        }
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
  // display, reconciled every time a real poll or purchase lands (whichever
  // calls syncTotalClicks, which zeroes this prediction back out so it's
  // never double-counted once the server value catches up).
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

  const buyAutoClick = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuying(true)
    try {
      // Cost is clicks-denominated and checked server-side against a total
      // that only advances on flush — force one first so this never gets
      // wrongly rejected against a total that's up to 30s stale.
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-click/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      // Only autoClick/totalClicks fields come back from this endpoint —
      // merge onto the existing state instead of replacing it wholesale,
      // so the luck fields fetched separately aren't clobbered back to 0.
      setState((prev) => ({
        ...prev,
        autoClickLevel: data.autoClickLevel,
        autoClickCps: data.autoClickCps,
        autoClickNextCost: data.autoClickNextCost,
        autoClickNextCps: data.autoClickNextCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      if (typeof data.objectsBroken === 'number' && typeof data.objectProgress === 'number') {
        syncObjectState(data.objectsBroken, data.objectProgress)
      }
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la mejora', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, getToken, syncTotalClicks, syncObjectState, promptSignIn, flushNow])

  // Tutorial-only: same response shape and state-merge as buyAutoClick, but
  // hits the free-grant endpoint instead — no cost, no isBuying flag (the
  // tutorial overlay drives its own "please wait" state), only ever
  // expected to succeed once (the backend itself refuses a second grant).
  const grantAutoClickFree = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-click/tutorial-grant`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        autoClickLevel: data.autoClickLevel,
        autoClickCps: data.autoClickCps,
        autoClickNextCost: data.autoClickNextCost,
        autoClickNextCps: data.autoClickNextCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      if (typeof data.objectsBroken === 'number' && typeof data.objectProgress === 'number') {
        syncObjectState(data.objectsBroken, data.objectProgress)
      }
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo conceder el dron del tutorial', err)
      return { ok: false, error: 'error' }
    }
  }, [userId, getToken, syncTotalClicks, syncObjectState, promptSignIn])

  const buyLuck = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLuck(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/luck/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        luckLevel: data.luckLevel,
        luckChance: data.luckChance,
        luckMultiplier: data.luckMultiplier,
        luckNextCost: data.luckNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la mejora de suerte', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLuck(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyLuckChance = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLuckChance(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/luck-chance/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        luckChanceLevel: data.luckChanceLevel,
        luckChance: data.luckChance,
        luckChanceNextCost: data.luckChanceNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la probabilidad de suerte', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLuckChance(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyMultiplier = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingMultiplier(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/multiplier/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        multiplierLevel: data.multiplierLevel,
        multiplierValue: data.multiplierValue,
        multiplierNextValue: data.multiplierNextValue,
        multiplierNextCost: data.multiplierNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar el multiplicador', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingMultiplier(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyLegendaryUnlock = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryUnlock(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/legendary-unlock/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        legendaryUnlockLevel: data.legendaryUnlockLevel,
        legendaryUnlockNextCost: data.legendaryUnlockNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Modo Legendario', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryUnlock(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyLegendaryEase = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryEase(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/legendary-ease/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        legendaryEaseLevel: data.legendaryEaseLevel,
        legendaryStreakBase: data.legendaryStreakBase,
        legendaryEaseNextCost: data.legendaryEaseNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Reflejos', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryEase(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyLegendaryGrowth = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryGrowth(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/legendary-growth/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        legendaryGrowthLevel: data.legendaryGrowthLevel,
        legendaryBonusStep: data.legendaryBonusStep,
        legendaryGrowthNextCost: data.legendaryGrowthNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Impulso', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryGrowth(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyLegendaryThreshold = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryThreshold(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/legendary-threshold/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        legendaryThresholdLevel: data.legendaryThresholdLevel,
        legendaryThresholdTps: data.legendaryThresholdTps,
        legendaryThresholdNextCost: data.legendaryThresholdNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Umbral', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryThreshold(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyScoutDrone = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingScoutDrone(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/scout-drone/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        scoutDroneLevel: data.scoutDroneLevel,
        scoutDroneNextCost: data.scoutDroneNextCost,
        scoutDroneRate: data.scoutDroneRate,
        scoutDroneCps: data.scoutDroneCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar el dron buscador', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingScoutDrone(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyScoutFrequency = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingScoutFrequency(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/scout-frequency/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        scoutFrequencyLevel: data.scoutFrequencyLevel,
        scoutFrequencyNextCost: data.scoutFrequencyNextCost,
        scoutDroneRate: data.scoutDroneRate,
        scoutDroneCps: data.scoutDroneCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Frecuencia', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingScoutFrequency(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyAutoMultiplier = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAutoMultiplier(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-multiplier/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      // Sobrecarga is a guaranteed multiplier baked into the displayed cps
      // directly, so this endpoint also reports the refreshed
      // autoClickCps/NextCps — unlike Fortuna/Azar's buy responses.
      setState((prev) => ({
        ...prev,
        autoMultiplierLevel: data.autoMultiplierLevel,
        autoMultiplierValue: data.autoMultiplierValue,
        autoMultiplierNextValue: data.autoMultiplierNextValue,
        autoMultiplierNextCost: data.autoMultiplierNextCost,
        autoClickCps: data.autoClickCps,
        autoClickNextCps: data.autoClickNextCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Sobrecarga', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAutoMultiplier(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyTapMultiplier = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingTapMultiplier(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/tap-multiplier/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        tapMultiplierLevel: data.tapMultiplierLevel,
        tapMultiplierValue: data.tapMultiplierValue,
        tapMultiplierNextCost: data.tapMultiplierNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar el multiplicador', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingTapMultiplier(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyMultiShot = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingMultiShot(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/multi-shot/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        multiShotLevel: data.multiShotLevel,
        multiShotValue: data.multiShotValue,
        multiShotNextCost: data.multiShotNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Multidisparo', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingMultiShot(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyAnomalyUnlock = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAnomalyUnlock(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/anomaly-unlock/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        anomalyUnlockLevel: data.anomalyUnlockLevel,
        anomalyUnlockNextCost: data.anomalyUnlockNextCost,
        anomalyRewardValue: data.anomalyRewardValue,
        anomalyFrequencySeconds: data.anomalyFrequencySeconds,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Anomalías', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAnomalyUnlock(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyAnomalyReward = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAnomalyReward(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/anomaly-reward/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        anomalyRewardLevel: data.anomalyRewardLevel,
        anomalyRewardValue: data.anomalyRewardValue,
        anomalyRewardNextCost: data.anomalyRewardNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Extracción', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAnomalyReward(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyAnomalyFrequency = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAnomalyFrequency(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/anomaly-frequency/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        anomalyFrequencyLevel: data.anomalyFrequencyLevel,
        anomalyFrequencySeconds: data.anomalyFrequencySeconds,
        anomalyFrequencyNextCost: data.anomalyFrequencyNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Frecuencia', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAnomalyFrequency(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  const buyOfflineProduction = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingOfflineProduction(true)
    try {
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/offline-production/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        offlineProductionLevel: data.offlineProductionLevel,
        offlineProductionValue: data.offlineProductionValue,
        offlineProductionNextCost: data.offlineProductionNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      playTreeUpgrade()
      setHasNewUpgrade(true)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Autonomía', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingOfflineProduction(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn, flushNow])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap. This is
  // the biggest offender of the 23: TreeContext sits directly behind
  // ClickCounterContext (tickAutoClicks/syncTotalClicks come from it), so an
  // unmemoized value here re-rendered every single tree-node display, the
  // Home HUD's drone counts, and everything else reading from it on every
  // click, for the entire session.
  const value = useMemo(
    () => ({
      ...state,
      // Exposed so a prestige confirm (Home.tsx) can pull the
      // just-reset tree levels immediately instead of waiting up to
      // POLL_INTERVAL_MS for the next background poll to catch up.
      refetch: fetchState,
      awayCredit,
      clearAwayCredit,
      hasNewUpgrade,
      markUpgradesSeen,
      isBuying,
      buyAutoClick,
      grantAutoClickFree,
      isBuyingLuck,
      buyLuck,
      isBuyingLuckChance,
      buyLuckChance,
      isBuyingMultiplier,
      buyMultiplier,
      isBuyingLegendaryUnlock,
      buyLegendaryUnlock,
      isBuyingLegendaryEase,
      buyLegendaryEase,
      isBuyingLegendaryGrowth,
      buyLegendaryGrowth,
      isBuyingLegendaryThreshold,
      buyLegendaryThreshold,
      isBuyingScoutDrone,
      buyScoutDrone,
      isBuyingScoutFrequency,
      buyScoutFrequency,
      isBuyingAutoMultiplier,
      buyAutoMultiplier,
      isBuyingTapMultiplier,
      buyTapMultiplier,
      isBuyingMultiShot,
      buyMultiShot,
      isBuyingAnomalyUnlock,
      buyAnomalyUnlock,
      isBuyingAnomalyReward,
      buyAnomalyReward,
      isBuyingAnomalyFrequency,
      buyAnomalyFrequency,
      isBuyingOfflineProduction,
      buyOfflineProduction,
    }),
    [
      state,
      fetchState,
      awayCredit,
      clearAwayCredit,
      hasNewUpgrade,
      markUpgradesSeen,
      isBuying,
      buyAutoClick,
      grantAutoClickFree,
      isBuyingLuck,
      buyLuck,
      isBuyingLuckChance,
      buyLuckChance,
      isBuyingMultiplier,
      buyMultiplier,
      isBuyingLegendaryUnlock,
      buyLegendaryUnlock,
      isBuyingLegendaryEase,
      buyLegendaryEase,
      isBuyingLegendaryGrowth,
      buyLegendaryGrowth,
      isBuyingLegendaryThreshold,
      buyLegendaryThreshold,
      isBuyingScoutDrone,
      buyScoutDrone,
      isBuyingScoutFrequency,
      buyScoutFrequency,
      isBuyingAutoMultiplier,
      buyAutoMultiplier,
      isBuyingTapMultiplier,
      buyTapMultiplier,
      isBuyingMultiShot,
      buyMultiShot,
      isBuyingAnomalyUnlock,
      buyAnomalyUnlock,
      isBuyingAnomalyReward,
      buyAnomalyReward,
      isBuyingAnomalyFrequency,
      buyAnomalyFrequency,
      isBuyingOfflineProduction,
      buyOfflineProduction,
    ],
  )

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>
}

export function useTreeContext() {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTreeContext must be used within a TreeProvider')
  return ctx
}
