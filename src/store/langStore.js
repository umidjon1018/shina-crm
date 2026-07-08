import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '../i18n/index.js'

export const useLangStore = create(
  persist(
    (set) => ({
      lang: 'uz',

      setLang: (lang) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('shina_lang', lang)
        set({ lang })
      },

      initLang: () => {
        const saved = localStorage.getItem('shina_lang') || 'uz'
        i18n.changeLanguage(saved)
        set({ lang: saved })
      },
    }),
    {
      name: 'shina-lang-storage',
    }
  )
)
