import { useTranslation } from 'react-i18next'
import React, { useState, useEffect, useMemo, Suspense } from 'react'
import {
  Globe,
  Search,
  MapPin,
  Compass,
  ArrowRight,
  Clock,
  ExternalLink,
  Bookmark,
  Layers,
  ChevronRight,
  Filter,
  Calendar,
  X,
  Sparkles,
  SlidersHorizontal,
  Flame,
} from 'lucide-react'
import { Article, LanguageMode } from '../../types/news'
import {
  LocationDefinition,
  SUPPORTED_LOCATIONS,
  searchLocations,
  getLocationById,
} from '../../data/newsLocations'
import { fetchArticlesByLocation, fetchMapArticles } from '../../services/api'
import { formatPublicationDate } from '../../utils/dateUtils'

// Lazy load real interactive satellite map for performance & zero startup delay
const SatelliteMap = React.lazy(() =>
  import('./SatelliteMap').then((m) => ({ default: m.SatelliteMap }))
)

export interface NewsGlobeHubProps {
  articles: Article[]
  onArticleClick: (article: Article) => void
  onToggleSave?: (articleId: string, e: React.MouseEvent) => void
  savedArticleIds?: string[]
}

// Relative time formatter helper for breaking rail
function getRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'Just now'
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(d.getTime())) return 'Recently'
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return formatPublicationDate(dateStr)
  } catch {
    return 'Recently'
  }
}

// Map Loading Skeleton
function SatelliteMapSkeleton() {
  return (
    <div className="w-full h-full min-h-[420px] sm:min-h-[490px] rounded-xl border border-[#E8E2D8] bg-[#0A1A12] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-9 h-9 rounded-full border-2 border-[#E8E2D8] border-t-[#0F392B] animate-spin mb-3" />
      <span className="font-serif font-bold text-xs text-[#FAF7F2]">
        Loading Satellite Map Telemetry...
      </span>
      <span className="text-[10px] text-[#A8A29E] mt-0.5">
        Connecting to high-resolution earth imagery tiles
      </span>
    </div>
  )
}

// Preset News Topics for Combined Search
const TOPIC_SUGGESTIONS = [
  'Elections',
  'Artificial Intelligence',
  'Climate Change',
  'Cricket',
  'Agriculture',
  'Technology',
  'Semiconductors',
  'Clean Energy',
]

// Preset Combined Queries
const COMBINED_QUERY_PRESETS = [
  { label: 'AI news in Bengaluru', topic: 'AI', locationId: 'karnataka' },
  { label: 'Elections in Punjab', topic: 'Elections', locationId: 'punjab' },
  { label: 'Cricket news in Mumbai', topic: 'Cricket', locationId: 'maharashtra' },
  { label: 'Climate change in India', topic: 'Climate change', locationId: 'punjab' },
]

export const NewsGlobeHub: React.FC<NewsGlobeHubProps> = ({
  articles: _allArticles,
  onArticleClick,
  onToggleSave,
  savedArticleIds = [],
}) => {
  const { t } = useTranslation()
  const [selectedLocationId, setSelectedLocationId] = useState<string>('india')
  const [mapMode, setMapMode] = useState<'india' | 'global'>('india')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<'relevant' | 'latest'>('latest')

  // Satellite Map Specific State
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [targetCoordinates, setTargetCoordinates] = useState<[number, number] | null>(null)
  const [mapArticles, setMapArticles] = useState<Article[]>([])

  const [locationNews, setLocationNews] = useState<Article[]>([])
  const [leadStory, setLeadStory] = useState<Article | undefined>(undefined)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const selectedLocation = useMemo(() => {
    return getLocationById(selectedLocationId)
  }, [selectedLocationId])

  // Autocomplete search suggestions (Locations + Topics + Combined)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return []

    const q = searchQuery.toLowerCase().trim()
    const results: Array<{
      type: 'location' | 'topic' | 'combined'
      title: string
      subtitle?: string
      locationId?: string
      query: string
    }> = []

    // 1. Matched Locations
    const locMatches = searchLocations(q).slice(0, 4)
    for (const loc of locMatches) {
      results.push({
        type: 'location',
        title: loc.displayName,
        subtitle: `${loc.country} • ${loc.type.toUpperCase()}`,
        locationId: loc.id,
        query: loc.name,
      })
    }

    // 2. Matched Topics
    const topicMatches = TOPIC_SUGGESTIONS.filter((t) => t.toLowerCase().includes(q))
    for (const top of topicMatches) {
      results.push({
        type: 'topic',
        title: top,
        subtitle: 'News Topic',
        query: top,
      })
    }

    // 3. Combined query suggestions
    for (const preset of COMBINED_QUERY_PRESETS) {
      if (preset.label.toLowerCase().includes(q)) {
        results.push({
          type: 'combined',
          title: preset.label,
          subtitle: 'Combined Location + Topic',
          locationId: preset.locationId,
          query: preset.label,
        })
      }
    }

    return results.slice(0, 6)
  }, [searchQuery])

  // Fetch geographic news for the satellite map and dispatches
  useEffect(() => {
    let isCurrent = true
    setLoading(true)

    // Parallel fetch: Map articles with coordinates + Location dispatches
    Promise.all([
      fetchMapArticles({
        locationId: selectedLocationId !== 'all-desks' ? selectedLocationId : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        dateRange: selectedDatePreset !== 'all' ? selectedDatePreset : undefined,
        sort: selectedSort,
        q: searchQuery.trim() || undefined,
        limit: 100,
      }),
      fetchArticlesByLocation({
        locationId: selectedLocationId,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        dateRange: selectedDatePreset !== 'all' ? selectedDatePreset : undefined,
      }),
    ])
      .then(([mapRes, locRes]) => {
        if (!isCurrent) return

        setMapArticles(mapRes.articles)
        setLocationNews(locRes.articles)
        setLeadStory(locRes.leadArticle)
        setTotalCount(locRes.total)
        setLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [
    selectedLocationId,
    selectedCategory,
    selectedDatePreset,
    selectedLanguage,
    selectedSort,
    searchQuery,
  ])

  // Select location and fly map
  const handleSelectLocation = (locId: string) => {
    setSelectedLocationId(locId)
    setSearchQuery('')
    setIsSearchFocused(false)

    const target = getLocationById(locId)
    if (target.mapView !== mapMode) {
      setMapMode(target.mapView)
    }

    if (locId === 'india') {
      setSelectedArticleId(null)
      setTargetCoordinates([22.5937, 78.9629])
    } else if (locId === 'global') {
      setSelectedArticleId(null)
      setTargetCoordinates([20.0, 25.0])
    } else {
      const locArticle = mapArticles.find(
        (a) =>
          a.location?.city?.toLowerCase() === locId.toLowerCase() ||
          a.location?.state?.toLowerCase() === locId.toLowerCase() ||
          a.location?.city?.toLowerCase().includes(locId.toLowerCase())
      )
      if (locArticle) {
        setSelectedArticleId(locArticle.id)
      }
      if (target.coordinates) {
        setTargetCoordinates(target.coordinates)
      }
    }
  }

  // Handle autocomplete suggestion select
  const handleSelectSuggestion = (suggestion: {
    type: 'location' | 'topic' | 'combined'
    query: string
    locationId?: string
  }) => {
    setSearchQuery(suggestion.query)
    setIsSearchFocused(false)

    if (suggestion.locationId) {
      handleSelectLocation(suggestion.locationId)
    }
  }

  // Select article from marker or breaking rail
  const handleSelectArticle = (article: Article) => {
    setSelectedArticleId(article.id)
    if (article.location?.coordinates) {
      setTargetCoordinates(article.location.coordinates)
    }
  }

  // Regional Desk Filter Chips
  const REGIONAL_DESKS = [
    { id: 'all-desks', locationId: 'india', label: 'All Desks' },
    { id: 'punjab', locationId: 'punjab', label: 'Punjab' },
    { id: 'delhi', locationId: 'delhi', label: 'Delhi NCR' },
    { id: 'haryana', locationId: 'haryana', label: 'Haryana' },
    { id: 'chandigarh', locationId: 'chandigarh', label: 'Chandigarh' },
    { id: 'karnataka', locationId: 'karnataka', label: 'Bengaluru' },
    { id: 'maharashtra', locationId: 'maharashtra', label: 'Maharashtra' },
  ]

  // Filter categories matching Requirement 5
  const CATEGORY_TABS = [
    { id: 'all', label: 'All' },
    { id: 'politics', label: 'Politics' },
    { id: 'business', label: 'Business' },
    { id: 'technology', label: 'Technology' },
    { id: 'science', label: 'Science' },
    { id: 'sports', label: 'Sports' },
    { id: 'world', label: 'World' },
    { id: 'careers', label: 'Careers' },
    { id: 'environment', label: 'Environment' },
  ]

  // Date filters matching Requirement 5
  const DATE_TABS = [
    { id: 'all', label: 'All Dates' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'Last 30 Days' },
  ]

  // Language filters matching Requirement 5
  const LANGUAGE_TABS = [
    { id: 'all', label: 'All Languages' },
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिंदी (Hindi)' },
  ]

  // Sort filters matching Requirement 5
  const SORT_TABS = [
    { id: 'latest', label: 'Latest' },
    { id: 'relevant', label: 'Relevant' },
  ]

  // Breaking Local News Rail Stories (Dynamic per context)
  const breakingRailStories = useMemo(() => {
    // If user has searched or selected a location with active results
    if (locationNews.length > 0) {
      return locationNews.slice(0, 5)
    }
    if (mapArticles.length > 0) {
      return mapArticles.slice(0, 5)
    }
    return _allArticles.slice(0, 5)
  }, [locationNews, mapArticles, _allArticles])

  return (
    <div className="w-full font-sans select-none pb-12 animate-in fade-in duration-200">
      {/* =========================================================================
          1. ELEGANT LOCATION DASHBOARD HERO (Off-White & Subtle Beige)
          Features prominent unified search, rounded regional filter chips,
          interactive satellite map, and Breaking Local News stream
         ========================================================================= */}
      <section className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-5 sm:p-7 mb-8 shadow-xs">
        {/* Top Header & Map Mode Switcher (India Desks <-> World Bureaus) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F392B] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E]">
                  Regional Desks & Satellite Discovery
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39]" />
                <span className="text-[11px] font-semibold text-[#0F392B]">Live Satellite Map</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] tracking-tight">
                Location-Based News Dashboard
              </h1>
            </div>
          </div>

          {/* Mode Switcher: India Desks <-> World Bureaus */}
          <div className="flex items-center bg-white border border-[#E8E2D8] rounded-full p-1 text-xs font-semibold self-start sm:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setMapMode('india')
                setTargetCoordinates(null)
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                mapMode === 'india'
                  ? 'bg-[#0F392B] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#141412]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>India Desks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMapMode('global')
                setTargetCoordinates(null)
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                mapMode === 'global'
                  ? 'bg-[#0F392B] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#141412]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>World Bureaus</span>
            </button>
          </div>
        </div>

        {/* Unified Search Bar: Location + News Topic (Requirement 4) */}
        <div className="mt-5 max-w-2xl mx-auto relative">
          <div className="relative group">
            <Search className="w-4 h-4 text-[#78716C] group-focus-within:text-[#0F392B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search by location, topic, or combined query (e.g. 'AI in Bengaluru', 'Elections in Punjab', 'Cricket in Mumbai')..."
              className="w-full bg-white border border-[#E8E2D8] focus:border-[#0F392B] rounded-full pl-11 pr-10 py-3 text-xs sm:text-sm text-[#141412] placeholder-[#78716C] focus:outline-none transition-all shadow-xs focus:shadow-md"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#141412] p-1 rounded-full hover:bg-[#FAF7F2] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown with Locations & Topics */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-[#E8E2D8] rounded-xl shadow-lg overflow-hidden py-1.5">
              {searchSuggestions.map((item, idx) => (
                <button
                  key={`${item.type}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF7F2] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'location' ? (
                      <MapPin className="w-3.5 h-3.5 text-[#D95D39] shrink-0" />
                    ) : item.type === 'combined' ? (
                      <Sparkles className="w-3.5 h-3.5 text-[#0F392B] shrink-0" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-[#0369A1] shrink-0" />
                    )}
                    <span className="font-semibold text-[#141412] truncate">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-[11px] text-[#78716C] truncate">
                        ({item.subtitle})
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8E2D8] shrink-0 ml-2">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Regional Desk Chips (Below the Search Bar) */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap pb-1">
          {REGIONAL_DESKS.map((chip) => {
            const isSelected =
              chip.id === 'all-desks'
                ? selectedLocationId === 'punjab' && selectedCategory === 'all' && !searchQuery
                : selectedLocationId === chip.locationId && !searchQuery
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSelectLocation(chip.locationId)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all duration-150 flex items-center gap-1.5 font-medium shadow-2xs ${
                  isSelected
                    ? 'bg-[#0F392B] text-white border-[#0F392B] shadow-xs font-semibold'
                    : 'bg-white text-[#44403C] hover:text-[#141412] hover:bg-[#F5EFEB] border-[#E8E2D8]'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>

        {/* Dashboard Center Grid: Centered Real Satellite Map (8 Cols) + Breaking Local News Rail (4 Cols) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Centered Real Interactive Satellite Map (Requirement 2 & 3) */}
          <div className="lg:col-span-8 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl overflow-hidden relative shadow-2xs flex flex-col justify-between min-h-[420px] sm:min-h-[490px]">
            <Suspense fallback={<SatelliteMapSkeleton />}>
              <SatelliteMap
                articles={mapArticles}
                selectedArticleId={selectedArticleId}
                onArticleClick={onArticleClick}
                onArticleSelect={handleSelectArticle}
                onToggleSave={onToggleSave}
                savedArticleIds={savedArticleIds}
                mapMode={mapMode}
                targetCoordinates={targetCoordinates}
                locationName={selectedLocation.displayName}
                className="w-full h-full"
              />
            </Suspense>
          </div>

          {/* Breaking Local News Rail (Requirement 6: Dynamically responds to map context) */}
          <div className="lg:col-span-4 bg-white border border-[#E8E2D8] rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D95D39] animate-pulse" />
                  <h3 className="font-serif font-bold text-base text-[#141412]">
                    Breaking Local News
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8E2D8]">
                  {mapMode === 'india' ? 'India Live' : 'Global Live'}
                </span>
              </div>

              {/* Feed Items with Marker Highlight Sync */}
              <div className="space-y-2.5">
                {breakingRailStories.map((article, idx) => {
                  const relativeTimes = ['12m ago', '35m ago', '1h ago', '2h ago', '3h ago']
                  const timeLabel =
                    relativeTimes[idx] || getRelativeTime(article.publishedDate)
                  const isHighlighted = selectedArticleId === article.id

                  return (
                    <div
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className={`group cursor-pointer p-2.5 rounded-lg border transition-all flex gap-3 items-start ${
                        isHighlighted
                          ? 'bg-[#EBF3EF] border-[#0F392B] ring-1 ring-[#0F392B]/30 shadow-xs'
                          : 'hover:bg-[#FAF7F2] border-transparent hover:border-[#E8E2D8]'
                      }`}
                    >
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-16 h-16 rounded-md object-cover shrink-0 border border-[#E8E2D8] group-hover:scale-102 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-[#FAF7F2] border border-[#E8E2D8] shrink-0 flex items-center justify-center text-[#78716C]">
                          <MapPin className="w-5 h-5 text-[#D95D39]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#78716C] mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeLabel}</span>
                          <span>•</span>
                          <span className="text-[#0F392B] font-semibold truncate">
                            {article.source.name}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xs sm:text-[13px] text-[#141412] leading-snug group-hover:text-[#D95D39] transition-colors line-clamp-2">
                          {article.title}
                        </h4>

                        <div className="flex items-center justify-between mt-1 pt-1">
                          {article.location?.city && (
                            <span className="text-[9.5px] text-[#55504A] font-medium flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#0F392B]" />
                              {article.location.city}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onArticleClick(article)
                            }}
                            className="text-[10px] text-[#0F392B] hover:text-[#141412] font-semibold flex items-center gap-0.5 ml-auto"
                          >
                            <span>Read</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rail Footer */}
            <div className="pt-3 mt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#78716C]">
              <span className="text-[11px] font-medium truncate">
                Bureau: {selectedLocation.displayName}
              </span>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('location-dispatches-grid')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-[#0F392B] hover:text-[#141412] font-semibold flex items-center gap-1 text-[11px] shrink-0"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SELECTED LOCATION MASTHEAD & COHESIVE FILTER STRIP (Requirement 5)
         ========================================================================= */}
      <section
        id="location-dispatches-grid"
        className="bg-white border border-[#E8E2D8] rounded-xl p-4 sm:p-6 mb-8 shadow-2xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#D95D39]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D95D39]">
                {selectedLocation.country} • {selectedLocation.type.toUpperCase()}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141412] tracking-tight">
              {selectedLocation.heading}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
              {selectedLocation.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <span className="px-3 py-1 bg-[#FAF7F2] text-[#141412] border border-[#E8E2D8] rounded-md text-xs font-semibold">
              {totalCount} Verified Dispatches
            </span>
          </div>
        </div>

        {/* Compact Rounded Category & Cohesive Filters Strip (Requirement 5) */}
        <div className="pt-4 space-y-3">
          {/* Row 1: Category Filter Pills */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] mr-1 hidden sm:inline">
                Categories:
              </span>
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-[#0F392B] text-white border-[#0F392B] shadow-2xs font-semibold'
                      : 'bg-[#FAF7F2] text-[#55504A] hover:text-[#141412] hover:bg-[#F2ECE1] border-[#E8E2D8]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Secondary Filters (Language, Date, Sort) */}
          <div className="pt-2 border-t border-[#E8E2D8]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#78716C]">
            {/* Language Selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] text-[#78716C] font-semibold mr-1">
                Language:
              </span>
              {LANGUAGE_TABS.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                    selectedLanguage === lang.id
                      ? 'bg-[#141412] text-white font-semibold'
                      : 'bg-[#FAF7F2] text-[#55504A] hover:text-[#141412] border border-[#E8E2D8]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Date Range Selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#78716C] mr-0.5 shrink-0" />
              {DATE_TABS.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setSelectedDatePreset(dt.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                    selectedDatePreset === dt.id
                      ? 'bg-[#141412] text-white font-semibold'
                      : 'text-[#78716C] hover:text-[#141412]'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-[#78716C] font-semibold mr-1">
                Sort:
              </span>
              {SORT_TABS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedSort(st.id as 'relevant' | 'latest')}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors shrink-0 ${
                    selectedSort === st.id
                      ? 'bg-[#0F392B] text-white font-semibold'
                      : 'text-[#78716C] hover:text-[#141412]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. LOCATION DISPATCHES & LEAD STORY SPOTLIGHT
         ========================================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#E8E2D8] rounded-xl p-4 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="w-full h-32 bg-[#FAF7F2] rounded-md mb-3" />
              <div className="w-3/4 h-4 bg-[#FAF7F2] rounded mb-2" />
              <div className="w-1/2 h-3 bg-[#FAF7F2] rounded" />
            </div>
          ))}
        </div>
      ) : locationNews.length === 0 ? (
        /* Empty Results State */
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[#78716C] flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#141412] mb-1">
            No active dispatches for {selectedLocation.displayName} matching current filters
          </h3>
          <p className="text-xs sm:text-sm text-[#57534E] mb-5 max-w-md mx-auto leading-relaxed">
            Try adjusting your category or date filters, or switch to nearby regional desks like
            Delhi NCR, Haryana, or Chandigarh.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSelectedDatePreset('all')
                setSelectedLanguage('all')
                setSearchQuery('')
              }}
              className="px-3.5 py-1.5 bg-[#0F392B] text-white rounded-md text-xs font-semibold hover:bg-[#184837] transition-colors"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => handleSelectLocation('punjab')}
              className="px-3.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] text-[#141412] rounded-md text-xs font-semibold hover:bg-white transition-colors"
            >
              Explore Punjab
            </button>
            <button
              type="button"
              onClick={() => handleSelectLocation('delhi')}
              className="px-3.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] text-[#141412] rounded-md text-xs font-semibold hover:bg-white transition-colors"
            >
              Explore Delhi NCR
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Lead Story Spotlight for Selected Location */}
          {leadStory && (
            <article
              onClick={() => onArticleClick(leadStory)}
              className="group cursor-pointer bg-white border border-[#E8E2D8] rounded-xl p-6 sm:p-8 hover:border-[#141412]/30 transition-all shadow-2xs"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#141412]">
                        {leadStory.categoryName} •{' '}
                        {leadStory.location?.city || selectedLocation.name}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#141412] leading-[1.2] group-hover:text-[#D95D39] transition-colors mb-3">
                      {leadStory.title}
                    </h3>

                    {leadStory.deck && (
                      <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-4">
                        {leadStory.deck}
                      </p>
                    )}

                    {leadStory.keyTakeaways && leadStory.keyTakeaways.length > 0 && (
                      <div className="space-y-1.5 mb-5 border-l-2 border-[#0F392B] pl-3 py-1 bg-[#FAF8F5] rounded-r">
                        {leadStory.keyTakeaways.slice(0, 2).map((takeaway, i) => (
                          <p key={i} className="text-xs text-[#292524] leading-snug">
                            • {takeaway}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8] text-xs text-[#78716C]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#141412]">
                        {leadStory.source.name}
                      </span>
                      <span>•</span>
                      <span>{formatPublicationDate(leadStory.publishedDate)}</span>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-[#0F392B] group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {leadStory.imageUrl && (
                  <div className="lg:col-span-5 aspect-[16/10] rounded-lg overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2]">
                    <img
                      src={leadStory.imageUrl}
                      alt={leadStory.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
            </article>
          )}

          {/* Secondary Stories Grid for Selected Location */}
          {locationNews.length > 1 && (
            <div>
              <h3 className="font-serif font-bold text-lg text-[#141412] mb-4 flex items-center gap-2">
                <span>Latest Dispatches Filed Under {selectedLocation.displayName}</span>
                <span className="text-xs font-sans font-normal text-[#78716C]">
                  ({locationNews.length - 1} more)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationNews.slice(1).map((article) => {
                  const isSaved = savedArticleIds.includes(article.id)
                  return (
                    <article
                      key={article.id}
                      onClick={() => onArticleClick(article)}
                      className="group cursor-pointer bg-white border border-[#E8E2D8] rounded-xl overflow-hidden hover:border-[#141412]/30 transition-all flex flex-col justify-between shadow-2xs p-4 sm:p-5"
                    >
                      <div>
                        {article.imageUrl && (
                          <div className="aspect-[16/9] rounded-lg overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] mb-3">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                          <span className="text-[#D95D39] font-bold">
                            {article.categoryName}
                          </span>
                          {article.location?.city && (
                            <span className="text-[#141412] bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E8E2D8]">
                              {article.location.city}
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif font-bold text-base text-[#141412] leading-snug group-hover:text-[#D95D39] transition-colors mb-2 line-clamp-2">
                          {article.title}
                        </h4>

                        <p className="text-xs text-[#57534E] leading-relaxed line-clamp-2 mb-4">
                          {article.summary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#78716C]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#141412]">
                            {article.source.name}
                          </span>
                          <span>•</span>
                          <span>{formatPublicationDate(article.publishedDate)}</span>
                        </div>

                        {onToggleSave && (
                          <button
                            type="button"
                            onClick={(e) => onToggleSave(article.id, e)}
                            className="p-1 text-[#78716C] hover:text-[#141412]"
                            title={isSaved ? 'Remove bookmark' : 'Bookmark story'}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isSaved ? 'fill-[#D95D39] text-[#D95D39]' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
