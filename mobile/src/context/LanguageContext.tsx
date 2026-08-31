import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next: Language = prev === 'es' ? 'en' : 'es'
      AsyncStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, strings: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
