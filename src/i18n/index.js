import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import uz from './uz'
import ru from './ru'

i18n
  .use(initReactI18next)
  .init({
    resources: { uz: { translation: uz }, ru: { translation: ru } },
    lng: localStorage.getItem('shina_lang') || 'uz',
    fallbackLng: 'uz',
    interpolation: { escapeValue: false },
  })

export default i18n
