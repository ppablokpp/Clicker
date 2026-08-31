import { useAuth } from '@clerk/expo'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { claimTask, fetchTasksMe } from '../services/tasksApi'
import { useClickCounterContext } from './ClickCounterContext'

// Ported from front/src/context/TasksContext.tsx — same GET /api/tasks/me +
// POST /api/tasks/claim endpoints. `anomaliesNeutralized` will just stay 0
// on mobile for now since the "Anomalía" shooting-star event (Meteor.tsx)
// isn't ported — that mission's progress is honestly 0 rather than faked.
interface TasksContextValue {
  claimed: Set<string>
  claimingId: string | null
  anomaliesNeutralized: number
  claim: (taskId: string) => Promise<{ ok: boolean; error?: string }>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [anomaliesNeutralized, setAnomaliesNeutralized] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const data = await fetchTasksMe(token)
        if (!cancelled && data) {
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
      if (!userId) return { ok: false, error: 'not-signed-in' }
      setClaimingId(taskId)
      try {
        const token = await getToken()
        const { ok, data } = await claimTask(token, taskId)
        if (!ok) return { ok: false, error: data.error }

        setClaimed((prev) => new Set(prev).add(taskId))
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        return { ok: true }
      } catch (err) {
        console.error('No se pudo reclamar la tarea', err)
        return { ok: false, error: 'network' }
      } finally {
        setClaimingId(null)
      }
    },
    [userId, getToken, syncTotalClicks],
  )

  // Memoized — this consumes ClickCounterContext (`syncTotalClicks`), so it
  // re-renders on every tap regardless of whether any task actually
  // changed; without this every TasksContext consumer (TasksModal, Home's
  // hasClaimableTask check) got a fresh reference on every single shot too.
  const value = useMemo(
    () => ({ claimed, claimingId, anomaliesNeutralized, claim }),
    [claimed, claimingId, anomaliesNeutralized, claim],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext must be used within a TasksProvider')
  return ctx
}
