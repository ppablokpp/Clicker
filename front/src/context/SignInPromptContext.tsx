import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

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

  return (
    <SignInPromptContext.Provider value={{ isOpen, promptSignIn, closePrompt }}>
      {children}
    </SignInPromptContext.Provider>
  )
}

export function useSignInPrompt() {
  const ctx = useContext(SignInPromptContext)
  if (!ctx) throw new Error('useSignInPrompt must be used within a SignInPromptProvider')
  return ctx
}
