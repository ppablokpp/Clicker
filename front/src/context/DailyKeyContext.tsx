import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useKeysContext } from './KeysContext'
import { useSignInPrompt } from './SignInPromptContext'
import { playChestPurchase } from '../lib/caseSound'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface ClaimResult {
  ok: boolean
  error?: string
}

interface DailyKeyContextValue {
  claimedToday: boolean
  /** Seconds until the daily key resets, only meaningful while claimedToday. */
  cooldownSecondsLeft: number
  isClaiming: boolean
  claim: () => Promise<ClaimResult>
}

const DailyKeyContext = createContext<DailyKeyContextValue | null>(null)

// The reset is a calendar-day boundary on the server (CURRENT_DATE, UTC on
// Neon by default) — next UTC midnight from "now" is a close enough estimate
// for a cosmetic countdown without needing the server to echo back a timestamp.
function msUntilNextUtcMidnight(): number {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return next - now.getTime()
}

// Once per calendar day, claim exactly one key — the same daily-cooldown
// idea the case itself used to have, just moved here.
export function DailyKeyProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth()
  const { syncKeys } = useKeysContext()
  const { promptSignIn } = useSignInPrompt()
  const [claimedToday, setClaimedToday] = useState(false)
  const [resetAt, setResetAt] = useState<number | null>(null)
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0)
  const [isClaiming, setIsClaiming] = useState(false)

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
          if (typeof data.keyClaimedToday === 'boolean') {
            setClaimedToday(data.keyClaimedToday)
            if (data.keyClaimedToday) setResetAt(Date.now() + msUntilNextUtcMidnight())
          }
        }
      } catch (err) {
        console.error('No se pudo comprobar la llave diaria', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  // Ticks the cooldown down and flips back to claimable once it hits zero.
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
        setClaimedToday(false)
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [resetAt])

  const claim = useCallback(async (): Promise<ClaimResult> => {
    if (!userId) {
      promptSignIn()
      return { ok: false, error: 'not-signed-in' }
    }
    setIsClaiming(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/daily-key/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setClaimedToday(true)
        setResetAt(Date.now() + msUntilNextUtcMidnight())
        if (typeof data.keys === 'number') syncKeys(data.keys)
        playChestPurchase()
        return { ok: true }
      }
      if (data.error === 'already-claimed') {
        setClaimedToday(true)
        setResetAt(Date.now() + msUntilNextUtcMidnight())
      }
      return { ok: false, error: data.error }
    } catch (err) {
      console.error('No se pudo reclamar la llave diaria', err)
      return { ok: false, error: 'network' }
    } finally {
      setIsClaiming(false)
    }
  }, [userId, getToken, syncKeys, promptSignIn])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ claimedToday, cooldownSecondsLeft, isClaiming, claim }),
    [claimedToday, cooldownSecondsLeft, isClaiming, claim],
  )

  return <DailyKeyContext.Provider value={value}>{children}</DailyKeyContext.Provider>
}

export function useDailyKeyContext() {
  const ctx = useContext(DailyKeyContext)
  if (!ctx) throw new Error('useDailyKeyContext must be used within a DailyKeyProvider')
  return ctx
}
