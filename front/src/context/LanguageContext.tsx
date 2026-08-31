import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { translations, type Language, type TranslationStrings } from '../i18n/translations'

const STORAGE_KEY = 'clicker:language'

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

interface LanguageContextValue {
  language: Language
  toggleLanguage: () => void
  strings: TranslationStrings
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectInitialLanguage)

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'es' ? 'en' : 'es'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  // Memoized — see GemsContext's comment for why an inline object literal
  // here would cascade re-renders to every consumer on every tap.
  const value = useMemo(
    () => ({ language, toggleLanguage, strings: translations[language] }),
    [language, toggleLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
