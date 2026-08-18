import { useLanguage } from '../context/LanguageContext'

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      title={language === 'es' ? 'Switch to English' : 'Cambiar a español'}
      aria-label="Toggle language"
      className="flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 px-2.5 text-[11px] font-bold tracking-wide text-neutral-300 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
    >
      {language.toUpperCase()}
    </button>
  )
}
