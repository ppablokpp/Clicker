import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SignInPromptContextValue {
  isOpen: boolean
  promptSignIn: () => void
  closePrompt: () => void
}

const SignInPromptContext = createContext<SignInPromptContextValue | null>(null)

// The app is browsable signed out — this is what any click/buy/claim action
// calls instead of silently failing when there's no user yet, so a single
// shared modal opens no matter where the action came from.
export function SignInPromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const promptSignIn = useCallback(() => setIsOpen(true), [])
  const closePrompt = useCallback(() => setIsOpen(false), [])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(() => ({ isOpen, promptSignIn, closePrompt }), [isOpen, promptSignIn, closePrompt])

  return <SignInPromptContext.Provider value={value}>{children}</SignInPromptContext.Provider>
}

export function useSignInPrompt() {
  const ctx = useContext(SignInPromptContext)
  if (!ctx) throw new Error('useSignInPrompt must be used within a SignInPromptProvider')
  return ctx
}
