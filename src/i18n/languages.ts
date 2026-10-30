import { LanguageMode } from '../types/news'

export type LanguageMetadata = LanguageConfig;
export interface LanguageConfig {
  code: LanguageMode
  name: string
  nativeName: string
  script: string
  dir: 'ltr' | 'rtl'
  fontFamily?: string
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', dir: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', dir: 'ltr' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Perso-Arabic', dir: 'rtl' },
]

export const DEFAULT_LANGUAGE: LanguageMode = 'en'

export function isRTL(lang: LanguageMode): boolean {
  return lang === 'ur'
}

export function getLanguageConfig(lang: string): LanguageConfig {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
  return found || SUPPORTED_LANGUAGES[0]
}

