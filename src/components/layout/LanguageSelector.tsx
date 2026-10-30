import React, { useState, useRef, useEffect } from 'react'
import { Languages, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageMode } from '../../types/news'
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../../i18n/languages'
import { loadLanguageBundle } from '../../i18n'

export interface LanguageSelectorProps {
  currentLanguage: LanguageMode
  onLanguageChange: (lang: LanguageMode) => void
  variant?: 'compact' | 'footer' | 'pill'
  className?: string
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = 'compact',
  className = '',
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeConfig = getLanguageConfig(currentLanguage)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelect = async (code: LanguageMode) => {
    setIsOpen(false)
    await loadLanguageBundle(code)
    onLanguageChange(code)
  }

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('filters.selectLanguage', 'Select Language')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
          variant === 'footer'
            ? 'bg-white text-[#141412] border-[#E8E2D8] hover:border-[#0F392B]'
            : 'bg-white text-[#3A3732] border-[#E8E2D8] hover:border-[#0F392B] hover:text-[#141412] shadow-xs'
        }`}
      >
        <Languages className="w-3.5 h-3.5 text-[#0F392B] shrink-0" />
        <span className="truncate max-w-[90px]">{activeConfig.nativeName}</span>
        <ChevronDown
          className={`w-3 h-3 text-[#78716C] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('filters.selectLanguage', 'Select Language')}
          className="absolute z-50 mt-1 right-0 w-48 max-h-64 overflow-y-auto bg-white border border-[#E8E2D8] rounded-xl shadow-lg py-1.5 text-xs animate-in fade-in duration-100 divide-y divide-[#F2EDE4]"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
            {t('filters.languageEdition', 'Language Edition')}
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#E8F3EE] text-[#0F392B] font-bold'
                      : 'text-[#3A3732] hover:bg-[#FAF7F2]'
                  }`}
                  dir={lang.dir}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] text-[#78716C]">({lang.name})</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0F392B] shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

