import React, { useEffect } from 'react'
import {
  Cpu,
  Landmark,
  TrendingUp,
  FlaskConical,
  Trophy,
  Globe,
  Palette,
  GraduationCap,
  Rocket,
  ArrowRight,
  X,
  Search,
} from 'lucide-react'
import { Article } from '../../types/news'

export interface CommandDiscoveryOverlayProps {
  isOpen: boolean
  initialFocus?: 'search' | 'categories'
  onClose: () => void
  selectedCategoryId: string | null
  selectedSubcategoryId?: string | null
  onSelectCategory: (groupId: string, subcategoryId?: string) => void
  onClearCategory?: () => void
  searchQuery: string
  onSearch: (query: string) => void
  articles: Article[]
  onArticleClick: (article: Article) => void
}

interface EditorialDesk {
  id: string
  groupId: string
  subcategoryId?: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
  descColor: string
  iconBg: string
  dotColor: string
  imageUrl: string
  isDark: boolean
}

const EDITORIAL_DESKS: EditorialDesk[] = [
  {
    id: 'desk-tech',
    groupId: 'tech-science',
    subcategoryId: 'tech-ai',
    name: 'Technology',
    description: 'Hardware, silicon architecture, computing platforms, and digital infrastructure.',
    icon: Cpu,
    bgColor: '#103E35', // Deep Forest Teal
    textColor: 'text-white',
    descColor: 'text-white/80',
    iconBg: 'bg-white/15 text-white',
    dotColor: '#D95D39', // Coral Orange
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    isDark: true,
  },
  {
    id: 'desk-politics',
    groupId: 'india-politics',
    subcategoryId: 'pol-national',
    name: 'India & Politics',
    description: 'National governance, parliament, public policy, and interstate corridors.',
    icon: Landmark,
    bgColor: '#FDF2E9', // Warm Apricot / Peach Cream
    textColor: 'text-[#171715]',
    descColor: 'text-[#5C5852]',
    iconBg: 'bg-[#171715]/5 text-[#171715]',
    dotColor: '#E76F51', // Terracotta
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    isDark: false,
  },
  {
    id: 'desk-business',
    groupId: 'business-economy',
    subcategoryId: 'biz-markets',
    name: 'Business & Markets',
    description: 'Equities, central bank policy, macroeconomics, and fiscal strategies.',
    icon: TrendingUp,
    bgColor: '#1B365D', // Deep Midnight Navy
    textColor: 'text-white',
    descColor: 'text-white/80',
    iconBg: 'bg-white/15 text-white',
    dotColor: '#38BDF8', // Luminous Cyan
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    isDark: true,
  },
  {
    id: 'desk-science',
    groupId: 'tech-science',
    subcategoryId: 'tech-space',
    name: 'Science',
    description: 'Deep space exploration, quantum breakthroughs, and biotechnology.',
    icon: FlaskConical,
    bgColor: '#E9E4F8', // Soft Lavender Periwinkle
    textColor: 'text-[#2A1B4E]',
    descColor: 'text-[#4C1D95]/80',
    iconBg: 'bg-white/60 text-[#5B21B6]',
    dotColor: '#7C3AED', // Royal Violet
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    isDark: false,
  },
  {
    id: 'desk-sports',
    groupId: 'sports',
    subcategoryId: 'spt-cricket',
    name: 'Sports',
    description: 'Cricket, football, tennis, athletics, and motorsport.',
    icon: Trophy,
    bgColor: '#FCE7DC', // Warm Apricot Blush
    textColor: 'text-[#281A16]',
    descColor: 'text-[#6C4E44]',
    iconBg: 'bg-[#281A16]/5 text-[#281A16]',
    dotColor: '#EA580C', // Tangerine
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    isDark: false,
  },
  {
    id: 'desk-world',
    groupId: 'world-lifestyle',
    subcategoryId: 'wld-geopolitics',
    name: 'World News',
    description: 'Diplomatic summits, foreign affairs, and cross-border trade.',
    icon: Globe,
    bgColor: '#11463D', // Deep Pine Teal
    textColor: 'text-white',
    descColor: 'text-white/80',
    iconBg: 'bg-white/15 text-white',
    dotColor: '#14B8A6', // Emerald Teal
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    isDark: true,
  },
  {
    id: 'desk-entertainment',
    groupId: 'world-lifestyle',
    subcategoryId: 'wld-culture',
    name: 'Entertainment',
    description: 'Cinema, literature, architecture, and cultural heritage.',
    icon: Palette,
    bgColor: '#FDF0D0', // Warm Honey Amber
    textColor: 'text-[#302213]',
    descColor: 'text-[#644E33]',
    iconBg: 'bg-[#302213]/5 text-[#302213]',
    dotColor: '#F59E0B', // Golden Amber
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    isDark: false,
  },
  {
    id: 'desk-career',
    groupId: 'business-economy',
    subcategoryId: 'biz-startups',
    name: 'Career & Education',
    description: 'Workforce transformations, technical education, and engineering standards.',
    icon: GraduationCap,
    bgColor: '#CEE3DA', // Soft Dusty Sage Teal
    textColor: 'text-[#15312B]',
    descColor: 'text-[#3A5750]',
    iconBg: 'bg-[#15312B]/5 text-[#15312B]',
    dotColor: '#0D9488', // Forest Teal
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    isDark: false,
  },
  {
    id: 'desk-ai',
    groupId: 'tech-science',
    subcategoryId: 'tech-ai',
    name: 'AI & Startups',
    description: 'Frontier AI models, venture investments, and founder briefs.',
    icon: Rocket,
    bgColor: '#2A1B3E', // Deep Midnight Aubergine
    textColor: 'text-white',
    descColor: 'text-white/80',
    iconBg: 'bg-white/15 text-white',
    dotColor: '#EC4899', // Cyber Pink
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    isDark: true,
  },
]

export const CommandDiscoveryOverlay: React.FC<CommandDiscoveryOverlayProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  searchQuery,
  onSearch,
  articles,
  onArticleClick,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const trimmedQuery = searchQuery.trim().toLowerCase()

  // Filter actual news articles matching the user's query
  const matchingArticles = trimmedQuery
    ? articles.filter((a) => {
        return (
          a.title.toLowerCase().includes(trimmedQuery) ||
          a.summary.toLowerCase().includes(trimmedQuery) ||
          a.categoryName.toLowerCase().includes(trimmedQuery) ||
          a.source.name.toLowerCase().includes(trimmedQuery) ||
          (a.author?.name && a.author.name.toLowerCase().includes(trimmedQuery))
        )
      })
    : []

  const handleDeskClick = (desk: EditorialDesk) => {
    onSelectCategory(desk.groupId, desk.subcategoryId)
    onClose()
  }

  const handleArticleSelect = (article: Article) => {
    onArticleClick(article)
    onClose()
  }

  return (
    <div
      id="discovery-overlay-container"
      className="fixed inset-x-0 top-14 bottom-0 z-40 bg-[#FAF7F2] overflow-y-auto font-sans animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Editorial Desks and Discovery"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col min-h-full justify-between">
        
        {/* Top Header & Content Area */}
        <div>
          {/* Header Row when query is empty: Exact match to reference screenshot */}
          {!trimmedQuery ? (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E2D8]/70">
              <div>
                {/* Overline with Coral Dot */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#D95D39] shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D95D39]">
                    EDITORIAL DESKS &amp; SECTIONS
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#171715] tracking-tight leading-tight">
                  Explore by interest
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-[#5C5852] mt-1 font-normal">
                  Select a section to filter the broadsheet dispatches
                </p>
              </div>

              {/* Editorial cursive script: "Bigger stories. Deeper perspectives." */}
              <div className="hidden sm:block text-right pb-1 select-none pointer-events-none">
                <div className="font-serif italic text-stone-400 text-lg sm:text-xl leading-tight -rotate-2">
                  <div>Bigger stories.</div>
                  <div>Deeper perspectives.</div>
                </div>
              </div>
            </div>
          ) : (
            /* Header Row when user has typed a search query */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8E2D8]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0F392B] shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F392B]">
                    LIVE SEARCH DISPATCHES
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#171715] tracking-tight">
                  Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5852] mt-0.5">
                  Found {matchingArticles.length}{' '}
                  {matchingArticles.length === 1 ? 'dispatch' : 'dispatches'} across all desks
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSearch('')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0F392B] bg-[#EBF3EF] hover:bg-[#DCEAE3] border border-[#C5DDD2] rounded-full transition-colors self-start sm:self-center"
              >
                <span>Browse all desks</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MAIN BODY: 9 Colorful Category Cards (when search is empty) */}
          {!trimmedQuery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6 sm:mt-7">
              {EDITORIAL_DESKS.map((desk) => {
                const IconComp = desk.icon

                return (
                  <div
                    key={desk.id}
                    onClick={() => handleDeskClick(desk)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleDeskClick(desk)
                      }
                    }}
                    style={{ backgroundColor: desk.bgColor }}
                    className="group relative overflow-hidden rounded-2xl h-[175px] sm:h-[190px] border border-black/5 hover:border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer select-none text-left flex flex-col justify-between"
                  >
                    {/* Right side: Image Container with Organic Wavy Mask */}
                    <div className="absolute right-0 top-0 bottom-0 w-[48%] sm:w-[50%] overflow-hidden bg-black/10">
                      <img
                        src={desk.imageUrl}
                        alt={desk.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />

                      {/* Smooth Organic Wave Overlay Cutting into Image */}
                      <svg
                        className="absolute inset-y-0 left-0 h-full w-14 sm:w-20 -translate-x-px pointer-events-none z-10"
                        viewBox="0 0 60 160"
                        preserveAspectRatio="none"
                        fill="none"
                      >
                        <path
                          d="M0,0 L50,0 C32,40 16,65 24,95 C32,125 45,140 50,160 L0,160 Z"
                          fill={desk.bgColor}
                        />
                      </svg>
                    </div>

                    {/* Floating Decorative Accent Bead on Wave Curve */}
                    <div
                      className="absolute z-20 pointer-events-none flex items-center justify-center"
                      style={{
                        right: 'calc(48% - 10px)',
                        top: '52%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {/* Outer translucent halo */}
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-25"
                        style={{ backgroundColor: desk.dotColor }}
                      />
                      {/* Solid center dot */}
                      <div
                        className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-md"
                        style={{ backgroundColor: desk.dotColor }}
                      />
                    </div>

                    {/* Left side: Content Area */}
                    <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full max-w-[58%] sm:max-w-[55%]">
                      {/* Top: Circular Icon Badge */}
                      <div>
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-3 ${desk.iconBg} backdrop-blur-xs shadow-xs`}
                        >
                          <IconComp className="w-4 h-4 stroke-[2]" />
                        </div>

                        {/* Category Name in Bold Serif */}
                        <h3
                          className={`font-serif text-xl sm:text-[22px] lg:text-2xl font-bold tracking-tight leading-tight mb-1.5 ${desk.textColor}`}
                        >
                          {desk.name}
                        </h3>

                        {/* Description */}
                        <p
                          className={`text-xs sm:text-[13px] leading-relaxed line-clamp-2 ${desk.descColor}`}
                        >
                          {desk.description}
                        </p>
                      </div>

                      {/* Bottom Action: "Open Section →" */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                        <span className={`${desk.textColor} group-hover:underline`}>
                          Open Section
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 ${desk.textColor}`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* SEARCH RESULTS: Real Dispatches matching query */
            <div className="mt-6">
              {matchingArticles.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF0ED] text-[#D95D39] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#171715] mb-2 font-normal">
                    No dispatches found
                  </h3>
                  <p className="text-sm text-[#78716C] max-w-md mx-auto mb-6">
                    We couldn&apos;t find any stories matching &ldquo;{searchQuery}&rdquo;. Try another term, or explore our editorial desks.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearch('')}
                    className="px-5 py-2.5 bg-[#0F392B] hover:bg-[#184837] text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
                  >
                    View all 9 editorial desks
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {matchingArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleArticleSelect(article)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleArticleSelect(article)
                        }
                      }}
                      className="group p-5 rounded-2xl border border-[#E8E2D8] bg-white hover:bg-[#FDFBF7] hover:border-[#D4CBBF] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left"
                    >
                      <div>
                        {/* Metadata row */}
                        <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2.5 flex-wrap">
                          <span className="font-semibold px-2 py-0.5 rounded bg-[#0F392B]/10 text-[#0F392B]">
                            {article.categoryName}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-[#171715]">
                            {article.source.name}
                          </span>
                          <span>•</span>
                          <span>{article.readTime || '4 min read'}</span>
                        </div>

                        {/* Title */}
                        <h4 className="font-serif text-lg font-bold text-[#141412] group-hover:text-[#0F392B] transition-colors leading-snug line-clamp-2 mb-2">
                          {article.title}
                        </h4>

                        {/* Summary */}
                        <p className="text-xs sm:text-sm text-[#5C5852] line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-[#F0ECE3] flex items-center justify-between text-xs text-[#78716C]">
                        <span>By {article.author?.name || 'Upwise Editorial'}</span>
                        <span className="font-semibold text-[#0F392B] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Read dispatch <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Footer Info Bar: Matches Reference Screenshot */}
        <div className="mt-8 pt-5 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#78716C] flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[#D95D39] font-bold">⚡</span>
            <span>Press ESC to exit, or select a desk to filter</span>
          </div>

          <button
            type="button"
            onClick={() => onSearch('')}
            className="font-semibold text-[#171715] hover:text-[#0F392B] flex items-center gap-1 transition-colors"
          >
            <span>Upwise Hub Editorial Desks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
