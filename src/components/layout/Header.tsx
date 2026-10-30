import React, { useMemo } from 'react'
import { Bookmark, MessageSquare, Palette, Newspaper, Plus, Sparkles } from 'lucide-react'
import { UpwiseLogo } from './UpwiseLogo'
import { SearchWithCategoryBrowser } from './SearchWithCategoryBrowser'
import { NotificationsPopover } from './NotificationsPopover'
import { AccountMenu } from './AccountMenu'
import { UserProfile } from '../../types/navigation'
import { NavDestination } from './NavigationRail'

export interface HeaderProps {
  user: UserProfile | null
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  onSelectCategory: (groupId: string, subcategoryId?: string) => void
  onSearch?: (query: string) => void
  searchQuery?: string
  onClearSearch?: () => void
  onOpenDiscovery?: (focus: 'search' | 'categories') => void
  onCloseDiscovery?: () => void
  isDiscoveryOpen?: boolean
  onLoginClick?: () => void
  onSignOutClick?: () => void
  onNavigateHome?: () => void
  onNavigateSaved?: () => void
  isSavedViewActive?: boolean
  savedCount?: number
  onNavigatePersonalize?: () => void
  activeDestination?: NavDestination
  onSelectDestination?: (dest: NavDestination) => void
  onOpenNewPost?: () => void
  feedToolbar?: React.ReactNode
  upPoints?: number
  onOpenRewards?: () => void
  className?: string
}

export const NEWSPAPER_SECTIONS = [
  { id: 'all', label: 'Front Page', groupId: '', subcategoryId: undefined },
  { id: 'tech', label: 'Technology', groupId: 'tech-science', subcategoryId: 'tech-ai' },
  { id: 'politics', label: 'India & Politics', groupId: 'india-politics', subcategoryId: undefined },
  { id: 'business', label: 'Business', groupId: 'business-economy', subcategoryId: 'biz-markets' },
  { id: 'science', label: 'Science', groupId: 'tech-science', subcategoryId: 'tech-space' },
  { id: 'sports', label: 'Sports', groupId: 'sports', subcategoryId: undefined },
  { id: 'world', label: 'World', groupId: 'world-lifestyle', subcategoryId: 'wld-geopolitics' },
  { id: 'career', label: 'Careers', groupId: 'business-economy', subcategoryId: 'biz-startups' },
  { id: 'ai', label: 'AI & Startups', groupId: 'tech-science', subcategoryId: 'tech-ai' },
]

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSearch,
  searchQuery = '',
  onClearSearch,
  onOpenDiscovery,
  onCloseDiscovery,
  isDiscoveryOpen = false,
  onLoginClick,
  onSignOutClick,
  onNavigateHome,
  onNavigateSaved,
  isSavedViewActive = false,
  savedCount = 0,
  onNavigatePersonalize,
  activeDestination = 'feed',
  onSelectDestination,
  onOpenNewPost,
  feedToolbar,
  upPoints = 0,
  onOpenRewards,
  className = '',
}) => {
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const isSectionActive = (sec: typeof NEWSPAPER_SECTIONS[0]) => {
    if (activeDestination !== 'feed') return false
    if (sec.id === 'all') {
      return !selectedCategoryId && !isSavedViewActive
    }
    if (sec.groupId === selectedCategoryId) {
      if (!sec.subcategoryId) return true
      return sec.subcategoryId === selectedSubcategoryId
    }
    return false
  }

  const handleSectionClick = (sec: typeof NEWSPAPER_SECTIONS[0]) => {
    if (onSelectDestination) {
      onSelectDestination('feed')
    }
    if (sec.id === 'all') {
      onNavigateHome?.()
    } else {
      onSelectCategory(sec.groupId, sec.subcategoryId)
    }
  }

  return (
    <header className={`w-full bg-[#FAF7F2] text-[#141412] select-none font-sans ${className}`}>
      {/* Top Header Bar */}
      <div className="sticky top-0 z-50 border-b border-[#E8E2D8] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3 sm:gap-6">

            {/* Left: Brand Wordmark */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  onSelectDestination?.('feed')
                  onNavigateHome?.()
                }}
                className="group text-left focus:outline-none"
                aria-label="Upwise Hub Front Page"
              >
                <UpwiseLogo size="md" />
              </button>
            </div>

            {/* Right: Expandable Search, Destinations, Saved, Account */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              {/* Expandable Spotify-inspired Search Bar */}
              <SearchWithCategoryBrowser
                onSearch={onSearch}
                onCategorySelect={onSelectCategory}
                selectedCategoryId={selectedCategoryId}
                selectedSubcategoryId={selectedSubcategoryId}
                searchQuery={searchQuery}
                onClearSearch={onClearSearch}
                onOpenDiscovery={onOpenDiscovery}
                onCloseDiscovery={onCloseDiscovery}
                isDiscoveryOpen={isDiscoveryOpen}
              />

              {/* Publication destinations pill for News / Globe / Community / Cartoons */}
              {onSelectDestination && (
                <div className="hidden lg:flex items-center bg-white border border-[#E8E2D8] rounded-md p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => onSelectDestination('feed')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeDestination === 'feed'
                        ? 'bg-[#0F392B] text-white font-semibold'
                        : 'text-[#55504A] hover:text-[#141412]'
                      }`}
                  >
                    News
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('globe')}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${activeDestination === 'globe'
                        ? 'bg-[#0F392B] text-white font-semibold'
                        : 'text-[#55504A] hover:text-[#141412]'
                      }`}
                  >
                    <span>Globe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('community')}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${activeDestination === 'community'
                        ? 'bg-[#0F392B] text-white font-semibold'
                        : 'text-[#55504A] hover:text-[#141412]'
                      }`}
                  >
                    <span>Community</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('comics')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeDestination === 'comics'
                        ? 'bg-[#0F392B] text-white font-semibold'
                        : 'text-[#55504A] hover:text-[#141412]'
                      }`}
                  >
                    Cartoons
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDestination('quiz')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeDestination === 'quiz'
                        ? 'bg-[#0F392B] text-white font-semibold'
                        : 'text-[#55504A] hover:text-[#141412]'
                      }`}
                  >
                    Quiz & Cards
                  </button>
                </div>
              )}

              {/* Saved Button */}
              {onNavigateSaved && (
                <button
                  type="button"
                  onClick={onNavigateSaved}
                  aria-label={isSavedViewActive ? 'Exit saved stories' : 'View saved stories'}
                  title="Saved Stories"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${isSavedViewActive
                      ? 'bg-[#141412] text-white border-[#141412]'
                      : 'bg-white text-[#3A3732] hover:text-[#141412] hover:bg-[#FDFBF7] border-[#E8E2D8]'
                    }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 stroke-[1.75] ${isSavedViewActive ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">Saved</span>
                  {savedCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#D95D39] text-white font-sans text-[10px] font-bold rounded-full min-w-4 text-center leading-4">
                      {savedCount}
                    </span>
                  )}
                </button>
              )}

              {/* UP Points Rewards Pill Badge */}
              {onOpenRewards && (
                <button
                  type="button"
                  onClick={onOpenRewards}
                  title="UP Points Rewards & Coupons"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-[#0F392B] text-white hover:bg-[#184837] shadow-xs border border-[#0F392B]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D95D39] fill-[#D95D39]" />
                  <span>✦ {upPoints} UP</span>
                </button>
              )}

              <NotificationsPopover />

              <AccountMenu
                user={user}
                upPoints={upPoints}
                onOpenRewards={onOpenRewards}
                onLoginClick={onLoginClick}
                onSignOutClick={onSignOutClick}
                onNavigateSaved={onNavigateSaved}
                onNavigatePersonalize={onNavigatePersonalize}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layer 2 — Editorial Masthead (Centered Serif + Orange accent) */}
      <div className="pt-6 pb-4 sm:pt-7 sm:pb-5 text-center px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Subtle Orange/Terracotta pill dash */}
          <div className="w-8 h-[3px] bg-[#D95D39] rounded-full mx-auto mb-2.5" />

          <button
            type="button"
            onClick={() => {
              onSelectDestination?.('feed')
              onNavigateHome?.()
            }}
            className="group inline-flex flex-col items-center text-center focus:outline-none"
            aria-label="Upwise Hub Front Page"
          >
            <div className="flex items-baseline tracking-[-0.02em] leading-none">
              <span className="font-serif text-3xl sm:text-4xl md:text-[44px] font-bold text-[#141412] transition-colors group-hover:text-[#0D0D0B]">
                UPWISE
              </span>
              <span className="font-sans text-xs sm:text-sm font-semibold uppercase text-[#78716C] tracking-[0.25em] ml-2">
                HUB
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-[13px] text-[#6E6860] font-normal tracking-normal">
              <span>{currentDateFormatted}</span>
              <span className="text-[#D4CBBF]">•</span>
              <span>Independent student news & civic intelligence</span>
            </div>
          </button>
        </div>
      </div>

      {/* Layer 3 — Category Navigation Bar */}
      <div className="border-y border-[#E8E2D8] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Primary Category Navigation"
            className="flex items-center min-w-max justify-start md:justify-center gap-2 sm:gap-6 py-2 overflow-x-auto no-scrollbar"
          >
            {NEWSPAPER_SECTIONS.map((sec) => {
              const active = isSectionActive(sec)
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSectionClick(sec)}
                  className={`px-1 py-1 text-xs sm:text-[13px] transition-all shrink-0 relative ${active
                      ? 'text-[#141412] font-bold border-b-2 border-[#141412] pb-1.5 -mb-[9px]'
                      : 'text-[#55504A] hover:text-[#141412] font-medium'
                    }`}
                >
                  {sec.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Feed Toolbar (Filters when applicable) */}
      {feedToolbar && (
        <div className="border-b border-[#E8E2D8] bg-[#FDFBF7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            {feedToolbar}
          </div>
        </div>
      )}
    </header>
  )
}
