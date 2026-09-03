import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppAuth } from '../hooks/useAppAuth'
import { useClickCounterContext } from './ClickCounterContext'
import { usePowerupContext } from './PowerupContext'
import { useSignInPrompt } from './SignInPromptContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface MilestonesContextValue {
  claimed: Set<string>
  bonusMultiplier: number
  claimingKey: string | null
  claim: (categoryKey: string, milestone: number) => Promise<{ ok: boolean; error?: string }>
}

const MilestonesContext = createContext<MilestonesContextValue | null>(null)

function milestoneKey(categoryKey: string, milestone: number) {
  return `${categoryKey}:${milestone}`
}

export function MilestonesProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAppAuth()
  const { syncTotalClicks, flushNow } = useClickCounterContext()
  const { applyActivePowerup } = usePowerupContext()
  const { promptSignIn } = useSignInPrompt()
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [bonusMultiplier, setBonusMultiplier] = useState(1)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const [claimedRes, meRes] = await Promise.all([
          fetch(`${API_URL}/api/milestones/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!cancelled && claimedRes.ok) {
          const data = await claimedRes.json()
          setClaimed(new Set(data.claimed))
        }
        if (!cancelled && meRes.ok) {
          const data = await meRes.json()
          if (typeof data.milestoneBonusMultiplier === 'number') {
            setBonusMultiplier(data.milestoneBonusMultiplier)
          }
        }
      } catch (err) {
        console.error('No se pudieron cargar tus hitos', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])

  const claim = useCallback(
    async (categoryKey: string, milestone: number) => {
      if (!userId) {
        promptSignIn()
        return { ok: false, error: 'not-signed-in' }
      }
      const key = milestoneKey(categoryKey, milestone)
      setClaimingKey(key)
      try {
        // Milestone thresholds are checked against click-derived totals
        // that only advance on flush — force one first so a milestone just
        // reached via unflushed taps isn't wrongly rejected.
        await flushNow()
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/milestones/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ categoryKey, milestone }),
        })
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error }

        setClaimed((prev) => new Set(prev).add(key))
        if (typeof data.totalClicks === 'number') syncTotalClicks(data.totalClicks)
        if (typeof data.milestoneBonusMultiplier === 'number') setBonusMultiplier(data.milestoneBonusMultiplier)
        if (data.activePowerup) applyActivePowerup(data.activePowerup)
        return { ok: true }
      } catch (err) {
        console.error('No se pudo reclamar el hito', err)
        return { ok: false, error: 'network' }
      } finally {
        setClaimingKey(null)
      }
    },
    [userId, getToken, syncTotalClicks, applyActivePowerup, promptSignIn, flushNow],
  )

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ claimed, bonusMultiplier, claimingKey, claim }),
    [claimed, bonusMultiplier, claimingKey, claim],
  )

  return <MilestonesContext.Provider value={value}>{children}</MilestonesContext.Provider>
}

export function useMilestonesContext() {
  const ctx = useContext(MilestonesContext)
  if (!ctx) throw new Error('useMilestonesContext must be used within a MilestonesProvider')
  return ctx
}
