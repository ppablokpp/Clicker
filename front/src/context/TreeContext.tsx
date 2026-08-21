import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
// Auto-click production only actually gets credited (persisted) when this
// state is (re)fetched (see back/src/db/treeRepository.js) — kept
// infrequent since the fast local tick below is what makes the display
// feel smooth; this is purely how often the real total gets reconciled.
const POLL_INTERVAL_MS = 8000
// Purely local, purely visual — predicts the display forward between real
// polls using the known rate, never touches the network.
const TICK_INTERVAL_MS = 100

interface TreeState {
  autoClickLevel: number
  autoClickCps: number
  autoClickNextCost: number
  autoClickNextCps: number
  luckLevel: number
  luckChance: number
  luckMultiplier: number
  luckNextCost: number
  luckChanceLevel: number
  luckChanceNextCost: number
  autoLuckLevel: number
  autoLuckMultiplier: number
  autoLuckNextCost: number
  autoLuckChanceLevel: number
  autoLuckChance: number
  autoLuckChanceNextCost: number
  multiplierLevel: number
  multiplierValue: number
  multiplierNextCost: number
  legendaryEaseLevel: number
  legendaryStreakBase: number
  legendaryEaseNextCost: number | null
  legendaryGrowthLevel: number
  legendaryBonusStep: number
  legendaryGrowthNextCost: number | null
  autoMultiplierLevel: number
  autoMultiplierNextCost: number | null
}

interface TreeContextValue extends TreeState {
  isBuying: boolean
  buyAutoClick: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLuck: boolean
  buyLuck: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLuckChance: boolean
  buyLuckChance: () => Promise<{ ok: boolean; error?: string }>
  isBuyingMultiplier: boolean
  buyMultiplier: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryEase: boolean
  buyLegendaryEase: () => Promise<{ ok: boolean; error?: string }>
  isBuyingLegendaryGrowth: boolean
  buyLegendaryGrowth: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAutoLuck: boolean
  buyAutoLuck: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAutoLuckChance: boolean
  buyAutoLuckChance: () => Promise<{ ok: boolean; error?: string }>
  isBuyingAutoMultiplier: boolean
  buyAutoMultiplier: () => Promise<{ ok: boolean; error?: string }>
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
  autoLuckLevel: 0,
  autoLuckMultiplier: 1,
  autoLuckNextCost: 0,
  autoLuckChanceLevel: 0,
  autoLuckChance: 0,
  autoLuckChanceNextCost: 0,
  multiplierLevel: 0,
  multiplierValue: 1,
  multiplierNextCost: 0,
  legendaryEaseLevel: 0,
  legendaryStreakBase: 200,
  legendaryEaseNextCost: 0,
  legendaryGrowthLevel: 0,
  legendaryBonusStep: 0.5,
  legendaryGrowthNextCost: 0,
  autoMultiplierLevel: 0,
  autoMultiplierNextCost: 0,
}

export function TreeProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks, tickAutoClicks } = useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [state, setState] = useState<TreeState>(EMPTY_STATE)
  const [isBuying, setIsBuying] = useState(false)
  const [isBuyingLuck, setIsBuyingLuck] = useState(false)
  const [isBuyingLuckChance, setIsBuyingLuckChance] = useState(false)
  const [isBuyingMultiplier, setIsBuyingMultiplier] = useState(false)
  const [isBuyingLegendaryEase, setIsBuyingLegendaryEase] = useState(false)
  const [isBuyingLegendaryGrowth, setIsBuyingLegendaryGrowth] = useState(false)
  const [isBuyingAutoLuck, setIsBuyingAutoLuck] = useState(false)
  const [isBuyingAutoLuckChance, setIsBuyingAutoLuckChance] = useState(false)
  const [isBuyingAutoMultiplier, setIsBuyingAutoMultiplier] = useState(false)
  // Read from inside the fast tick interval without needing to restart it
  // every time the rate changes (e.g. right after a purchase).
  const cpsRef = useRef(0)

  useEffect(() => {
    cpsRef.current = state.autoClickCps
  }, [state.autoClickCps])

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
          autoLuckLevel: data.autoLuckLevel,
          autoLuckMultiplier: data.autoLuckMultiplier,
          autoLuckNextCost: data.autoLuckNextCost,
          autoLuckChanceLevel: data.autoLuckChanceLevel,
          autoLuckChance: data.autoLuckChance,
          autoLuckChanceNextCost: data.autoLuckChanceNextCost,
          multiplierLevel: data.multiplierLevel,
          multiplierValue: data.multiplierValue,
          multiplierNextCost: data.multiplierNextCost,
          legendaryEaseLevel: data.legendaryEaseLevel,
          legendaryStreakBase: data.legendaryStreakBase,
          legendaryEaseNextCost: data.legendaryEaseNextCost,
          legendaryGrowthLevel: data.legendaryGrowthLevel,
          legendaryBonusStep: data.legendaryBonusStep,
          legendaryGrowthNextCost: data.legendaryGrowthNextCost,
          autoMultiplierLevel: data.autoMultiplierLevel,
          autoMultiplierNextCost: data.autoMultiplierNextCost,
        })
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      }
    } catch (err) {
      console.error('No se pudo cargar el estado del árbol', err)
    }
  }, [userId, getToken, syncTotalClicks])

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
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la mejora', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuying(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyLuck = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLuck(true)
    try {
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
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la mejora de suerte', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLuck(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyLuckChance = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLuckChance(true)
    try {
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
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar la probabilidad de suerte', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLuckChance(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyMultiplier = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingMultiplier(true)
    try {
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
        multiplierNextCost: data.multiplierNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar el multiplicador', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingMultiplier(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyLegendaryEase = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryEase(true)
    try {
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
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Reflejos', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryEase(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyLegendaryGrowth = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingLegendaryGrowth(true)
    try {
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
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Impulso', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingLegendaryGrowth(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyAutoLuck = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAutoLuck(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-luck/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        autoLuckLevel: data.autoLuckLevel,
        autoLuckMultiplier: data.autoLuckMultiplier,
        autoLuckNextCost: data.autoLuckNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Fortuna', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAutoLuck(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyAutoLuckChance = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAutoLuckChance(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-luck-chance/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      setState((prev) => ({
        ...prev,
        autoLuckChanceLevel: data.autoLuckChanceLevel,
        autoLuckChance: data.autoLuckChance,
        autoLuckChanceNextCost: data.autoLuckChanceNextCost,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Azar', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAutoLuckChance(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  const buyAutoMultiplier = useCallback(async () => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsBuyingAutoMultiplier(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/tree/auto-multiplier/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      // Sobrecarga multiplies auto-click's production in place, so this
      // endpoint also reports the refreshed autoClickCps/NextCps — unlike
      // Fortuna/Azar's buy responses.
      setState((prev) => ({
        ...prev,
        autoMultiplierLevel: data.autoMultiplierLevel,
        autoMultiplierNextCost: data.autoMultiplierNextCost,
        autoClickCps: data.autoClickCps,
        autoClickNextCps: data.autoClickNextCps,
      }))
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo comprar Sobrecarga', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsBuyingAutoMultiplier(false)
    }
  }, [userId, getToken, syncTotalClicks, promptSignIn])

  return (
    <TreeContext.Provider
      value={{
        ...state,
        isBuying,
        buyAutoClick,
        isBuyingLuck,
        buyLuck,
        isBuyingLuckChance,
        buyLuckChance,
        isBuyingMultiplier,
        buyMultiplier,
        isBuyingLegendaryEase,
        buyLegendaryEase,
        isBuyingLegendaryGrowth,
        buyLegendaryGrowth,
        isBuyingAutoLuck,
        buyAutoLuck,
        isBuyingAutoLuckChance,
        buyAutoLuckChance,
        isBuyingAutoMultiplier,
        buyAutoMultiplier,
      }}
    >
      {children}
    </TreeContext.Provider>
  )
}

export function useTreeContext() {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTreeContext must be used within a TreeProvider')
  return ctx
}
