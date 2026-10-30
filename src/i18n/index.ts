import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import { LanguageMode } from '../types/news'
import { DEFAULT_LANGUAGE, isRTL } from './languages'

// Initial synchronous resources for fast startup
const resources = {
  en: { translation: en },
  hi: { translation: hi },
}

// Lazy loader registry for other 11 regional languages
const lazyLoaders: Record<string, () => Promise<{ default: any }>> = {
  pa: () => import('./locales/pa.json'),
  bn: () => import('./locales/bn.json'),
  mr: () => import('./locales/mr.json'),
  ta: () => import('./locales/ta.json'),
  te: () => import('./locales/te.json'),
  gu: () => import('./locales/gu.json'),
  kn: () => import('./locales/kn.json'),
  ml: () => import('./locales/ml.json'),
  or: () => import('./locales/or.json'),
  as: () => import('./locales/as.json'),
  ur: () => import('./locales/ur.json'),
}

// Determine initial language from storage
function getInitialLanguage(): LanguageMode {
  try {
    const session = localStorage.getItem('upwise_user_session')
    if (session) {
      const parsed = JSON.parse(session)
      const userLang = localStorage.getItem(`upwise_user_language_${parsed.id}`)
      if (userLang) return userLang as LanguageMode
    }
    const globalLang = localStorage.getItem('upwise_user_language')
    if (globalLang) return globalLang as LanguageMode
  } catch {
    // Storage fallback
  }
  return DEFAULT_LANGUAGE
}

const initialLang = getInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Seamless rendering without suspense fallbacks
    },
  })

// Dynamically load additional language bundles on demand
export async function loadLanguageBundle(lang: LanguageMode): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) {
    await i18n.changeLanguage(lang)
    updateDocumentDirection(lang)
    return
  }

  if (lazyLoaders[lang]) {
    try {
      const module = await lazyLoaders[lang]()
      i18n.addResourceBundle(lang, 'translation', module.default || module, true, true)
    } catch (err) {
      console.warn(`[i18n] Failed to lazy load bundle for ${lang}, falling back to English`, err)
    }
  }

  await i18n.changeLanguage(lang)
  updateDocumentDirection(lang)
}

// Update DOM direction and lang attributes
export function updateDocumentDirection(lang: LanguageMode): void {
  if (typeof document !== 'undefined') {
    const rtl = isRTL(lang)
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    if (rtl) {
      document.documentElement.classList.add('rtl-mode')
    } else {
      document.documentElement.classList.remove('rtl-mode')
    }
  }
}

// Initialize on page load if initial language is a lazy-loaded one
if (initialLang !== 'en' && initialLang !== 'hi') {
  loadLanguageBundle(initialLang).catch(() => {})
} else {
  updateDocumentDirection(initialLang)
}

export default i18n

