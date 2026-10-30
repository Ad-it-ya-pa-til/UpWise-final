import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, LogOut, Bookmark, SlidersHorizontal, ChevronDown, Sparkles, Award } from 'lucide-react'
import { UserProfile } from '../../types/navigation'

interface AccountMenuProps {
  user: UserProfile | null
  upPoints?: number
  onOpenRewards?: () => void
  onLoginClick?: () => void
  onSignOutClick?: () => void
  onNavigateSaved?: () => void
  onNavigatePersonalize?: () => void
  className?: string
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  upPoints = 0,
  onOpenRewards,
  onLoginClick,
  onSignOutClick,
  onNavigateSaved,
  onNavigatePersonalize,
  className = '',
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!user) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => onLoginClick?.()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#0F392B] text-white hover:bg-[#184837] rounded-md transition-all shadow-sm border border-[#0F392B]"
          aria-label="Sign in"
        >
          <User className="w-3.5 h-3.5 stroke-[2]" />
          <span>Sign In</span>
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs font-medium bg-white hover:bg-[#FDFBF7] text-[#141412] rounded-md border border-[#E8E2D8] hover:border-[#D4CBBF] transition-all shadow-xs"
      >
        <span className="w-5 h-5 rounded-full bg-[#0F392B] text-white flex items-center justify-center font-bold text-[10px]">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#E8E2D8] rounded-lg shadow-popover z-50 py-1 text-xs animate-in fade-in duration-100 divide-y divide-[#E8E2D8]"
        >
          <div className="px-3 py-2 bg-[#FAF7F2] flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-[#141412] truncate">{user.name}</p>
              <p className="text-[11px] text-[#78716C] truncate mt-0.5">{user.email}</p>
            </div>
            {onOpenRewards && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onOpenRewards()
                }}
                className="ml-2 px-2 py-1 rounded bg-[#0F392B] text-white text-[10px] font-bold shrink-0 hover:bg-[#184837] flex items-center gap-1 shadow-xs"
                title="View UP Points Balance"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#D95D39] fill-[#D95D39]" />
                <span>{upPoints} UP</span>
              </button>
            )}
          </div>

          <div className="py-1">
            {onOpenRewards && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  onOpenRewards()
                }}
                className="w-full text-left px-3 py-2 text-[#0F392B] hover:bg-[#E8F3EE] flex items-center justify-between transition-colors font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-[#D95D39]" />
                  <span>Rewards & Coupons</span>
                </div>
                <span className="text-[10px] font-bold bg-[#0F392B] text-white px-1.5 py-0.5 rounded">
                  ✦ {upPoints} UP
                </span>
              </button>
            )}

            {onNavigateSaved && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  onNavigateSaved()
                }}
                className="w-full text-left px-3 py-2 text-[#3A3732] hover:text-[#141412] hover:bg-[#FAF7F2] flex items-center gap-2 transition-colors font-medium"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Saved Library</span>
              </button>
            )}

            {onNavigatePersonalize && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  onNavigatePersonalize()
                }}
                className="w-full text-left px-3 py-2 text-[#3A3732] hover:text-[#141412] hover:bg-[#FAF7F2] flex items-center gap-2 transition-colors font-medium"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#78716C]" />
                <span>Customize Desks</span>
              </button>
            )}
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onSignOutClick?.()
              }}
              className="w-full text-left px-3 py-2 text-[#C14B29] hover:bg-[#FBF2EF] flex items-center gap-2 transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('auth.signOut', 'Sign Out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
