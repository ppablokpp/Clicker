import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { useClickCounterContext } from './ClickCounterContext'
import { useGemsContext } from './GemsContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/** The current tier's core, as the server reports it. */
export interface CoreState {
  tier: number
  /** Capsules loaded on every tier's core, in tier order. */
  cores: number[]
  repaired: number
  total: number
  /** ISO time the core under repair was started, or null when idle. */
  startedAt: string | null
  nextCost: number | null
  nextSeconds: number | null
  /** The next capsule costs nothing (the tutorial's first one). */
  nextFree: boolean
  /** The server's clock at the time of the read, ISO. */
  now: string
}

interface RefineryContextValue {
  core: CoreState | null
  /** How far the server's clock is ahead of ours, ms — so a countdown drawn
   *  from `startedAt` lands when the server's does, not a few seconds off. */
  clockOffset: number
  starting: boolean
  finishing: boolean
  refresh: () => Promise<void>
  start: () => Promise<{ ok: boolean; error?: string }>
  /** Pay gems to finish the smelt under way. */
  finish: () => Promise<{ ok: boolean; error?: string }>
}

const RefineryContext = createContext<RefineryContextValue | null>(null)

export function RefineryProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAppAuth()
  const { flushNow, syncTotalClicks, prestigeTier } = useClickCounterContext()
  const { syncGems } = useGemsContext()
  const [core, setCore] = useState<CoreState | null>(null)
  const [clockOffset, setClockOffset] = useState(0)
  const [starting, setStarting] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const take = useCallback((data: CoreState) => {
    setCore(data)
    setClockOffset(new Date(data.now).getTime() - Date.now())
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/refinery/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) take(await res.json())
    } catch (err) {
      console.error('No se pudo leer la refinería', err)
    }
  }, [userId, getToken, take])

  // Read on sign-in, and again whenever the tier changes: a prestige moves
  // the player onto another material, with another core.
  useEffect(() => {
    void refresh()
  }, [refresh, prestigeTier])

  const start = useCallback(async () => {
    if (!userId) return { ok: false, error: 'not-signed-in' }
    setStarting(true)
    try {
      // Cost is checked server-side against a total that only advances on
      // flush — same as a tree buy, force one so this isn't wrongly refused.
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/refinery/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      take(data)
      if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo fundir', err)
      return { ok: false, error: 'error' }
    } finally {
      setStarting(false)
    }
  }, [userId, getToken, flushNow, syncTotalClicks, take])

  const finish = useCallback(async () => {
    if (!userId) return { ok: false, error: 'not-signed-in' }
    setFinishing(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/refinery/finish`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      take(data)
      if (typeof data.gems === 'number') syncGems(data.gems)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo terminar la fundición', err)
      return { ok: false, error: 'error' }
    } finally {
      setFinishing(false)
    }
  }, [userId, getToken, take, syncGems])

  const value = useMemo(
    () => ({ core, clockOffset, starting, finishing, refresh, start, finish }),
    [core, clockOffset, starting, finishing, refresh, start, finish],
  )
  return <RefineryContext.Provider value={value}>{children}</RefineryContext.Provider>
}

export function useRefineryContext() {
  const ctx = useContext(RefineryContext)
  if (!ctx) throw new Error('useRefineryContext must be used within a RefineryProvider')
  return ctx
}

/**
 * The repair as it stands right now, from the server's state and the clock:
 * whether one is running, how far along, how long is left. Ticks while a
 * repair runs, and asks the server to finish it when the time is up.
 */
export function useCoreRepair() {
  const { core, clockOffset, refresh } = useRefineryContext()
  const [now, setNow] = useState(() => Date.now())

  const active = Boolean(core?.startedAt) && (core?.repaired ?? 0) < (core?.total ?? 0)
  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(t)
  }, [active])

  const duration = (core?.nextSeconds ?? 0) * 1000
  const startedAt = core?.startedAt ? new Date(core.startedAt).getTime() : 0
  const elapsed = active ? now + clockOffset - startedAt : 0
  const progress = active && duration > 0 ? Math.min(1, elapsed / duration) : 0
  const secondsLeft = active ? Math.max(0, Math.ceil((duration - elapsed) / 1000)) : 0

  // Time's up: the server settles it on the next read. Re-read until it has
  // (its clock may run a hair behind the estimate).
  const due = active && elapsed >= duration
  useEffect(() => {
    if (!due) return
    void refresh()
    const t = window.setInterval(() => void refresh(), 700)
    return () => window.clearInterval(t)
  }, [due, refresh])

  return { active, progress, secondsLeft }
}
