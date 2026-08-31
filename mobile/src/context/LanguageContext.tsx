import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translations, type Language, type TranslationStrings } from '../i18n/translations'

const STORAGE_KEY = 'clicker:language'

// Synchronous guess for the very first render — AsyncStorage itself is
// async, unlike the web version's localStorage, so the stored preference
// (if any) can only override this a tick later, in the effect below.
function detectInitialLanguage(): Language {
  const [first] = getLocales()
  return first?.languageCode === 'en' ? 'en' : 'es'
}

interface LanguageContextValue {
  language: Language
  toggleLanguage: () => void
  strings: TranslationStrings
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectInitialLanguage)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'es' || stored === 'en') setLanguage(stored)
    })
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'es' ? 'en' : 'es'
      AsyncStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  // Memoized for consistency with every other context in the app (see
  // useClickCounter.ts's comment for why this matters) — this one's own
  // re-renders are rare (only on an actual language change), but every
  // component in the app reads from it, so it's cheap insurance against the
  // same cascade bug even though it isn't the hot path.
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
