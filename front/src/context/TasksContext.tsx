import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface TasksContextValue {
  claimed: Set<string>
  claimingId: string | null
  // Progress for 'counter'-type tasks (see back/src/tasks/config.js) —
  // 'node-level' tasks don't need this, their progress already comes from
  // the tree's own live state (TreeContext).
  anomaliesNeutralized: number
  // Lets EventChallenge fold a fresh count straight in the instant a win
  // lands, instead of waiting for the next full /api/tasks/me refetch.
  syncAnomaliesNeutralized: (count: number) => void
  claim: (taskId: string) => Promise<{ ok: boolean; error?: string }>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAppAuth()
  const { syncTotalClicks, flushNow } = useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [anomaliesNeutralized, setAnomaliesNeutralized] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/tasks/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setClaimed(new Set(data.claimed))
          if (typeof data.anomaliesNeutralized === 'number') setAnomaliesNeutralized(data.anomaliesNeutralized)
        }
      } catch (err) {
        console.error('No se pudieron cargar tus tareas', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const claim = useCallback(
    async (taskId: string) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      setClaimingId(taskId)
      try {
        // 'counter'-type tasks (e.g. lucky_clicks_found) check a field that
        // only advances on flush — force one first so a task just reached
        // via unflushed taps isn't wrongly rejected as not-yet-complete.
        await flushNow()
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/tasks/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskId }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        setClaimed((prev) => new Set(prev).add(taskId))
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        playChestPurchase()
        return { ok: true }
      } catch (err) {
        console.error('No se pudo reclamar la tarea', err)
        return { ok: false, error: 'network' }
      } finally {
        setClaimingId(null)
      }
    },
    [userId, getToken, syncTotalClicks, promptSignIn, flushNow],
  )

  const syncAnomaliesNeutralized = useCallback((count: number) => setAnomaliesNeutralized(count), [])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ claimed, claimingId, anomaliesNeutralized, syncAnomaliesNeutralized, claim }),
    [claimed, claimingId, anomaliesNeutralized, syncAnomaliesNeutralized, claim],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext must be used within a TasksProvider')
  return ctx
}
