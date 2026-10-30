import { useTranslation } from 'react-i18next'
import React, { useState, useEffect } from 'react'
import {
  Filter,
  SlidersHorizontal,
  ArrowUp,
  RefreshCw,
  Bookmark,
  Newspaper,
  ArrowRight,
  X,
} from 'lucide-react'
import { Article, LanguageMode, LayoutMode, DatePreset } from '../../types/news'
import { LeadStory } from './LeadStory'
import { ArticleCard } from './ArticleCard'
import { InShortsCard } from './InShortsCard'
import { BriefingDesksSection } from './BriefingDesksSection'
import { ONBOARDING_TOPICS } from '../auth/PersonalizeFeedOnboarding'
import { matchDatePreset } from '../../utils/dateUtils'

interface NewsFeedProps {
  articles: Article[]
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  onSelectCategory?: (groupId: string, subcategoryId?: string) => void
  searchQuery: string
  language?: LanguageMode
  datePreset?: DatePreset
  customStartDate?: string
  customEndDate?: string
  selectedPublishers?: string[]
  layoutMode?: LayoutMode
  isSavedViewActive?: boolean
  userPreferredTopics?: string[]
  onArticleClick: (article: Article) => void
  savedArticleIds?: string[]
  onToggleSave?: (articleId: string, e: React.MouseEvent) => void
  onClearFilters: () => void
  onEditPreferences?: () => void
  onShareStory?: (article: Article, e: React.MouseEvent) => void
}

const TOPIC_MATCH_RULES: Record<string, { categoryId?: string; subcategoryId?: string; keywords?: string[] }> = {
  'tech-computing': { categoryId: 'tech-science', keywords: ['silicon', 'photonics', 'computing', 'chip', 'semiconductor'] },
  'india-national': { categoryId: 'india-politics', subcategoryId: 'pol-national', keywords: ['transit', 'highway', 'freight', 'national'] },
  'business-markets': { categoryId: 'business-economy', subcategoryId: 'biz-banking', keywords: ['rbi', 'repo', 'markets', 'gdp', 'inflation'] },
  'science-innovation': { categoryId: 'tech-science', keywords: ['r&d', 'science', 'consortium', 'research', 'optical'] },
  'sports': { categoryId: 'sports', keywords: ['cricket', 'test', 'bowling', 'championship'] },
  'world-news': { categoryId: 'world-lifestyle', keywords: ['global', 'dispatch', 'world'] },
  'politics-gov': { categoryId: 'india-politics', subcategoryId: 'pol-governance', keywords: ['court', 'guidelines', 'waste', 'governance'] },
  'entertainment-culture': { categoryId: 'world-lifestyle', keywords: ['stepwells', 'architecture', 'heritage', 'culture'] },
  'career-education': { categoryId: 'business-economy', keywords: ['workforce', 'education'] },
  'startups-ai': { categoryId: 'tech-science', keywords: ['ai', 'server', 'foundry', 'models'] },
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  articles,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  searchQuery,
  language = 'en',
  datePreset = 'all',
  customStartDate = '',
  customEndDate = '',
  selectedPublishers = [],
  layoutMode = 'grid',
  isSavedViewActive = false,
  userPreferredTopics = [],
  onArticleClick,
  savedArticleIds = [],
  onToggleSave,
  onClearFilters,
  onEditPreferences,
  onShareStory,
}) => {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(8)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    setVisibleCount(8)
  }, [
    selectedCategoryId,
    selectedSubcategoryId,
    searchQuery,
    datePreset,
    customStartDate,
    customEndDate,
    selectedPublishers,
    isSavedViewActive,
  ])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredArticles = articles.filter((article) => {
    if (isSavedViewActive && !savedArticleIds.includes(article.id)) {
      return false
    }

    if (selectedCategoryId && article.categoryId !== selectedCategoryId) {
      return false
    }
    if (selectedSubcategoryId && article.subcategoryId !== selectedSubcategoryId) {
      return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = article.title.toLowerCase().includes(q)
      const titleHiMatch = article.titleHi?.toLowerCase().includes(q)
      const deckMatch = article.deck?.toLowerCase().includes(q)
      const summaryMatch = article.summary.toLowerCase().includes(q)
      const summaryHiMatch = article.summaryHi?.toLowerCase().includes(q)
      if (!titleMatch && !titleHiMatch && !deckMatch && !summaryMatch && !summaryHiMatch) {
        return false
      }
    }

    if (selectedPublishers.length > 0 && !selectedPublishers.includes(article.source.name)) {
      return false
    }

    if (!matchDatePreset(article.publishedDate || article.publishedAt, datePreset, customStartDate, customEndDate)) {
      return false
    }

    return true
  })

  const deduplicatedArticles = Array.from(
    new Map(filteredArticles.map((item) => [item.id, item])).values()
  )

  const rankedArticles = [...deduplicatedArticles].sort((a, b) => {
    if (userPreferredTopics.length === 0) return 0

    let scoreA = 0
    let scoreB = 0

    userPreferredTopics.forEach((topicId) => {
      const rule = TOPIC_MATCH_RULES[topicId]
      if (!rule) return

      if (rule.categoryId && a.categoryId === rule.categoryId) scoreA += 2
      if (rule.subcategoryId && a.subcategoryId === rule.subcategoryId) scoreA += 3
      if (rule.keywords) {
        const textA = (a.title + ' ' + (a.deck || '') + ' ' + a.summary).toLowerCase()
        if (rule.keywords.some((kw) => textA.includes(kw))) scoreA += 1
      }

      if (rule.categoryId && b.categoryId === rule.categoryId) scoreB += 2
      if (rule.subcategoryId && b.subcategoryId === rule.subcategoryId) scoreB += 3
      if (rule.keywords) {
        const textB = (b.title + ' ' + (b.deck || '') + ' ' + b.summary).toLowerCase()
        if (rule.keywords.some((kw) => textB.includes(kw))) scoreB += 1
      }
    })

    return scoreB - scoreA
  })

  const isFiltered = Boolean(
    selectedCategoryId ||
      searchQuery.trim() ||
      datePreset !== 'all' ||
      selectedPublishers.length > 0 ||
      isSavedViewActive
  )

  const visibleArticles = rankedArticles.slice(0, visibleCount)
  const hasMore = visibleCount < rankedArticles.length

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6)
      setIsLoadingMore(false)
    }, 250)
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Lead Story
  const leadArticle = visibleArticles.find((a) => a.isLead) || visibleArticles[0]
  const otherArticles = visibleArticles.filter((a) => a.id !== leadArticle?.id)
  
  // Secondary stories for 3-column "The stories shaping today" grid
  const secondaryArticles = otherArticles.slice(0, 3)
  // Remaining stories
  const compactArticles = otherArticles.slice(3)

  const preferredLabels = ONBOARDING_TOPICS.filter((t) =>
    userPreferredTopics.includes(t.id)
  ).map((t) => t.name)

  return (
    <div className="w-full max-w-7xl mx-auto font-sans select-none pt-4 sm:pt-6">
      {/* Saved View Active Header */}
      {isSavedViewActive && (
        <div className="mb-8 p-4 bg-white border border-[#E8E2D8] rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#0F392B] text-white">
              <Bookmark className="w-4 h-4 fill-current stroke-[1.5]" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#141412]">Saved Stories</h3>
              <p className="text-xs text-[#78716C]">
                {rankedArticles.length} {rankedArticles.length === 1 ? 'story' : 'stories'} bookmarked in your personal library
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold text-[#141412] hover:text-[#0F392B] bg-[#FAF7F2] border border-[#E8E2D8] px-3.5 py-1.5 rounded-md transition-colors"
          >
            Return to Front Page
          </button>
        </div>
      )}

      {/* Filter/Search Active Badge Bar */}
      {isFiltered && !isSavedViewActive && (
        <div className="mb-6 py-2 px-3.5 bg-white border border-[#E8E2D8] rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#141412] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39]" />
            <span className="font-semibold">Filtered results:</span>
            <span className="text-[#55504A] truncate">
              {searchQuery && `"${searchQuery}"`}
              {selectedCategoryId && `Desk: ${selectedCategoryId}`}
              {datePreset !== 'all' && `Date: ${datePreset}`}
              {` (${rankedArticles.length} stories)`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold text-[#D95D39] hover:text-[#B83214] flex items-center gap-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* User Personalized Topics Banner */}
      {userPreferredTopics.length > 0 && !isFiltered && (
        <div className="mb-6 p-3 sm:px-4 bg-white border border-[#E8E2D8] rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-[#141412] min-w-0">
            <span className="p-1.5 rounded bg-[#FAF7F2] text-[#0F392B] border border-[#E8E2D8] shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
            </span>
            <div className="truncate">
              <span className="font-semibold text-[#141412]">Prioritizing desks: </span>
              <span className="text-[#55504A] truncate">
                {preferredLabels.slice(0, 3).join(', ')}
                {preferredLabels.length > 3 ? ` +${preferredLabels.length - 3} more` : ''}
              </span>
            </div>
          </div>

          {onEditPreferences && (
            <button
              type="button"
              onClick={onEditPreferences}
              className="inline-flex items-center gap-1.5 text-xs text-[#141412] hover:text-[#0F392B] font-semibold self-start sm:self-auto shrink-0 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#78716C]" />
              <span>Update Preferences</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {rankedArticles.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#E8E2D8] rounded-xl p-8 shadow-xs max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center mx-auto mb-3.5 text-[#78716C]">
            <Filter className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-[#141412] mb-2">No matching dispatches found</h3>
          <p className="text-xs sm:text-sm text-[#55504A] max-w-sm mx-auto mb-6 leading-relaxed">
            We couldn't find any articles matching your active search, desk, or publisher filters.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="px-5 py-2.5 bg-[#0F392B] hover:bg-[#184837] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Stack / InShorts Digest Mode */}
          {layoutMode === 'stack' ? (
            <div className="w-full flex flex-col space-y-4">
              {visibleArticles.map((article) => (
                <InShortsCard
                  key={article.id}
                  article={article}
                  language={language}
                  onArticleClick={onArticleClick}
                  isSaved={savedArticleIds.includes(article.id)}
                  onToggleSave={onToggleSave}
                  onShare={onShareStory}
                  className="w-full"
                />
              ))}
            </div>
          ) : (
            /* Structured Editorial Front Page */
            <div className="w-full">
              {/* 1. Hero Section (Lead Story) */}
              {leadArticle && (
                <LeadStory
                  article={leadArticle}
                  language={language}
                  onArticleClick={onArticleClick}
                  isSaved={savedArticleIds.includes(leadArticle.id)}
                  onToggleSave={onToggleSave}
                />
              )}

              {/* 2. "The stories shaping today" (3-Column Editorial Grid) */}
              {secondaryArticles.length > 0 && (
                <section className="mb-10 sm:mb-12">
                  {/* Section Header with orange dot & hairline rule */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D95D39] shrink-0" />
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] tracking-tight">
                        The stories shaping today
                      </h2>
                    </div>

                    <div className="flex-1 h-[1px] bg-[#E8E2D8] mx-5 hidden sm:block" />

                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 1100, behavior: 'smooth' })
                      }}
                      className="text-xs font-semibold text-[#55504A] hover:text-[#0F392B] flex items-center gap-1 transition-colors"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>

                  {/* 3-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {secondaryArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        language={language}
                        onArticleClick={onArticleClick}
                        isSaved={savedArticleIds.includes(article.id)}
                        onToggleSave={onToggleSave}
                        variant="standard"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. "Choose your briefing" / Desks & 60-Second Audio Section */}
              <BriefingDesksSection
                selectedCategoryId={selectedCategoryId}
                selectedSubcategoryId={selectedSubcategoryId}
                onSelectCategory={onSelectCategory || (() => {})}
                articles={articles}
              />

              {/* 4. More Across Desks / Latest Stories */}
              {compactArticles.length > 0 && (
                <section className="pt-6 border-t border-[#E8E2D8]">
                  <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E8E2D8]">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#0F392B]" />
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#141412] tracking-tight">
                        More Across Desks
                      </h3>
                    </div>
                    <span className="text-xs text-[#78716C] font-normal">
                      Latest verified reporting
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 divide-y md:divide-y-0 divide-[#E8E2D8]">
                    {compactArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        language={language}
                        onArticleClick={onArticleClick}
                        isSaved={savedArticleIds.includes(article.id)}
                        onToggleSave={onToggleSave}
                        variant="compact"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="mt-12 flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-white border border-[#E8E2D8] hover:bg-[#FDFBF7] hover:border-[#D4CBBF] text-[#141412] text-xs font-semibold rounded-md shadow-xs transition-all flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D95D39]" />
                    <span>Retrieving stories...</span>
                  </>
                ) : (
                  <span>Load More Stories ({rankedArticles.length - visibleCount} remaining)</span>
                )}
              </button>
              <span className="text-[11px] text-[#78716C]">
                Displaying {visibleCount} of {rankedArticles.length} published stories
              </span>
            </div>
          )}
        </>
      )}

      {/* Back to top floating button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label="Back to top"
          title="Back to top of newspaper"
          className="fixed bottom-6 left-6 z-40 p-3 bg-white text-[#141412] border border-[#E8E2D8] hover:bg-[#FAF7F2] rounded-full shadow-lg transition-all animate-in fade-in"
        >
          <ArrowUp className="w-4 h-4 stroke-[2]" />
        </button>
      )}
    </div>
  )
}
