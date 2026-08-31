import { createContext, useContext, type ReactNode } from 'react'
import { useClickCounter } from '../hooks/useClickCounter'

type ClickCounterValue = ReturnType<typeof useClickCounter>

const ClickCounterContext = createContext<ClickCounterValue | null>(null)

// Mounted once above the routes so the count survives switching tabs
// (Home unmounts when you navigate away, which would otherwise reset it).
export function ClickCounterProvider({ children }: { children: ReactNode }) {
  const value = useClickCounter()
  return <ClickCounterContext.Provider value={value}>{children}</ClickCounterContext.Provider>
}

export function useClickCounterContext() {
  const ctx = useContext(ClickCounterContext)
  if (!ctx) throw new Error('useClickCounterContext must be used within a ClickCounterProvider')
  return ctx
}
