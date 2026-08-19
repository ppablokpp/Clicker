import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface DailyCasePrize {
  id: string
  amount: number
  weight: number
}

interface SpinResult {
  ok: boolean
  error?: string
  prizeId?: string
  prizeAmount?: number
  /** Caller applies this to the visible counter once the reel animation reveals the prize — not before, or the total would spoil the result early. */
  totalClicks?: number
}

interface DailyCaseContextValue {
  catalog: DailyCasePrize[]
  cost: number
  /** Server-authoritative — whether today's spin has already been used. */
  isAvailable: boolean
  /** Seconds until the daily case resets, only meaningful while !isAvailable. */
  cooldownSecondsLeft: number
  isSpinning: boolean
  spin: () => Promise<SpinResult>
}

const DailyCaseContext = createContext<DailyCaseContextValue | null>(null)

// The reset is a calendar-day boundary on the server (CURRENT_DATE, UTC on
// Neon by default) — next UTC midnight from "now" is a close enough estimate
// for a cosmetic countdown without needing the server to echo back a timestamp.
function msUntilNextUtcMidnight(): number {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return next - now.getTime()
}

export function DailyCaseProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { promptSignIn } = useSignInPrompt()
  const [catalog, setCatalog] = useState<DailyCasePrize[]>([])
  const [cost, setCost] = useState(0)
  const [isAvailable, setIsAvailable] = useState(true)
  const [resetAt, setResetAt] = useState<number | null>(null)
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/daily-case`)
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data.prizes)
        setCost(data.cost)
      })
      .catch((err) => console.error('No se pudo cargar el cofre diario', err))
  }, [])

  // Hydrate whether today's spin is already used.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          if (typeof data.dailyCaseAvailable === 'boolean') {
            setIsAvailable(data.dailyCaseAvailable)
            if (!data.dailyCaseAvailable) setResetAt(Date.now() + msUntilNextUtcMidnight())
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar el cofre diario', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  // Ticks the cooldown down and flips back to available once it hits zero.
  useEffect(() => {
    if (!resetAt) {
      setCooldownSecondsLeft(0)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))
      setCooldownSecondsLeft(remaining)
      if (remaining === 0) {
        setResetAt(null)
        setIsAvailable(true)
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [resetAt])

  const spin = useCallback(async (): Promise<SpinResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsSpinning(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/daily-case/spin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setIsAvailable(false)
        setResetAt(Date.now() + msUntilNextUtcMidnight())
        return { ok: true, prizeId: data.prizeId, prizeAmount: data.prizeAmount, totalClicks: data.totalClicks }
      }
      if (data.error === 'cooldown') {
        setIsAvailable(false)
        setResetAt(Date.now() + msUntilNextUtcMidnight())
      }
      return { ok: false, error: data.error }
    } catch (err) {
      console.error('No se pudo abrir el cofre diario', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsSpinning(false)
    }
  }, [userId, getToken, promptSignIn])

  return (
    <DailyCaseContext.Provider
      value={{ catalog, cost, isAvailable, cooldownSecondsLeft, isSpinning, spin }}
    >
      {children}
    </DailyCaseContext.Provider>
  )
}

export function useDailyCaseContext() {
  const ctx = useContext(DailyCaseContext)
  if (!ctx) throw new Error('useDailyCaseContext must be used within a DailyCaseProvider')
  return ctx
}
