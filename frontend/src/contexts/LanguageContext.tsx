import { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type Language = 'en' | 'vi'

export const SUPPORTED_LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
]

interface LanguageContextValue {
  language: Language
  changeLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('job-tracker-lang')
    return stored === 'vi' ? 'vi' : 'en'
  })

  function changeLanguage(lang: Language) {
    i18n.changeLanguage(lang)
    localStorage.setItem('job-tracker-lang', lang)
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
