import React from 'react'
import { useTranslation } from 'react-i18next'
import { Newspaper, Globe, MessageSquare, Palette, GraduationCap } from 'lucide-react'
import { NavDestination } from './NavigationRail'

export interface MobileBottomNavProps {
  activeDestination: NavDestination
  onSelectDestination: (destination: NavDestination) => void
  className?: string
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeDestination,
  onSelectDestination,
  className = '',
}) => {
  const { t } = useTranslation()
  const destinations = [
    {
      id: 'feed' as NavDestination,
      label: t('nav.news', 'News'),
      icon: Newspaper,
    },
    {
      id: 'globe' as NavDestination,
      label: t('nav.globe', 'Globe'),
      icon: Globe,
    },
    {
      id: 'community' as NavDestination,
      label: t('nav.community', 'Community'),
      icon: MessageSquare,
    },
    {
      id: 'comics' as NavDestination,
      label: t('nav.cartoons', 'Comics'),
      icon: Palette,
    },
    {
      id: 'quiz' as NavDestination,
      label: t('nav.quizAndCards', 'Quiz'),
      icon: GraduationCap,
    },
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`fixed bottom-0 inset-x-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-[#E5E0D5] py-2 px-4 flex items-center justify-around md:hidden pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] font-sans select-none ${className}`}
    >
      {destinations.map((dest) => {
        const Icon = dest.icon
        const isActive = activeDestination === dest.id

        return (
          <button
            key={dest.id}
            type="button"
            onClick={() => onSelectDestination(dest.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[11px] transition-colors relative ${isActive
                ? 'text-[#171715] font-semibold'
                : 'text-[#6B665E] hover:text-[#171715] font-medium'
              }`}
          >
            <Icon className={`w-5 h-5 stroke-[1.75] ${isActive ? 'text-[#C84B31]' : 'text-[#78716C]'}`} />
            <span>{dest.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[#C84B31] mt-0.5" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
