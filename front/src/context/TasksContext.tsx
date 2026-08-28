import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useClickCounterContext } from './ClickCounterContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface TasksContextValue {
  claimed: Set<string>
  claimingId: string | null
  claim: (taskId: string) => Promise<{ ok: boolean; error?: string }>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncTotalClicks } = useClickCounterContext()
  const { promptSignIn } = useSignInPrompt()
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [claimingId, setClaimingId] = useState<string | null>(null)

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
        return { ok: true }
      } catch (err) {
        console.error('No se pudo reclamar la tarea', err)
        return { ok: false, error: 'network' }
      } finally {
        setClaimingId(null)
      }
    },
    [userId, getToken, syncTotalClicks, promptSignIn],
  )

  return <TasksContext.Provider value={{ claimed, claimingId, claim }}>{children}</TasksContext.Provider>
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext must be used within a TasksProvider')
  return ctx
}
