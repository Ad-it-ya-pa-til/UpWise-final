import React, { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'
import { Article } from '../../types/news'
import {
  LocationDefinition,
  SUPPORTED_LOCATIONS,
  searchLocations,
  getLocationById,
} from '../../data/newsLocations'
import { fetchArticlesByLocation } from '../../services/api'
import { formatPublicationDate } from '../../utils/dateUtils'

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

export const NewsGlobeHub: React.FC<NewsGlobeHubProps> = ({
  articles: _allArticles,
  onArticleClick,
  onToggleSave,
  savedArticleIds = [],
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('punjab')
  const [mapMode, setMapMode] = useState<'india' | 'global'>('india')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('all')

  const [locationNews, setLocationNews] = useState<Article[]>([])
  const [leadStory, setLeadStory] = useState<Article | undefined>(undefined)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)

  const selectedLocation = useMemo(() => {
    return getLocationById(selectedLocationId)
  }, [selectedLocationId])

  // Autocomplete search suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchLocations(searchQuery).slice(0, 6)
  }, [searchQuery])

  // Fetch geographic news when location or filters change
  useEffect(() => {
    let isCurrent = true
    setLoading(true)

    fetchArticlesByLocation({
      locationId: selectedLocationId,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      dateRange: selectedDatePreset !== 'all' ? selectedDatePreset : undefined,
    })
      .then((res) => {
        if (!isCurrent) return
        setLocationNews(res.articles)
        setLeadStory(res.leadArticle)
        setTotalCount(res.total)
        setLoading(false)
      })
      .catch(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [selectedLocationId, selectedCategory, selectedDatePreset])

  // Sync map mode if user selects a location from the other view
  const handleSelectLocation = (locId: string) => {
    setSelectedLocationId(locId)
    setSearchQuery('')
    setIsSearchFocused(false)

    const target = getLocationById(locId)
    if (target.mapView !== mapMode) {
      setMapMode(target.mapView)
    }
  }

  // Regional Desk Filter Chips (Punjab, Delhi NCR, Haryana, Chandigarh, Bengaluru, Maharashtra)
  const REGIONAL_DESKS = [
    { id: 'all-desks', locationId: 'punjab', label: 'All Desks' },
    { id: 'punjab', locationId: 'punjab', label: 'Punjab' },
    { id: 'delhi', locationId: 'delhi', label: 'Delhi NCR' },
    { id: 'haryana', locationId: 'haryana', label: 'Haryana' },
    { id: 'chandigarh', locationId: 'chandigarh', label: 'Chandigarh' },
    { id: 'karnataka', locationId: 'karnataka', label: 'Bengaluru' },
    { id: 'maharashtra', locationId: 'maharashtra', label: 'Maharashtra' },
  ]

  // Filter categories available
  const CATEGORY_TABS = [
    { id: 'all', label: 'All Dispatches' },
    { id: 'tech-science', label: 'Tech & Science' },
    { id: 'india-politics', label: 'India & Politics' },
    { id: 'business-economy', label: 'Business & Economy' },
    { id: 'world-lifestyle', label: 'World & Climate' },
    { id: 'sports', label: 'Sports' },
  ]

  // Filter dates available
  const DATE_TABS = [
    { id: 'all', label: 'All Dates' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Past 7 Days' },
    { id: 'month', label: 'This Month' },
  ]

  // Locations relevant to the active map mode
  const mapLocations = useMemo(() => {
    return SUPPORTED_LOCATIONS.filter((l) => l.mapView === mapMode)
  }, [mapMode])

  // Breaking Local News Rail Stories
  const breakingRailStories = useMemo(() => {
    if (locationNews.length > 0) {
      return locationNews.slice(0, 4)
    }
    return _allArticles.slice(0, 4)
  }, [locationNews, _allArticles])

  // Callout preview headlines for key state desks on the map
  const DESK_PREVIEWS: Record<string, { label: string; preview: string }> = {
    punjab: {
      label: 'Punjab (Ludhiana)',
      preview: 'Punjab: Farmers protest continues at borders...',
    },
    chandigarh: {
      label: 'Chandigarh (HQ)',
      preview: 'Farmers protest continues at borders...',
    },
    delhi: {
      label: 'Delhi NCR (New Delhi)',
      preview: 'Haryana farmers community in telendana...',
    },
    haryana: {
      label: 'Haryana (Gurugram)',
      preview: 'Tech corridor innovation & EV manufacturing...',
    },
    maharashtra: {
      label: 'Maharashtra (Mumbai)',
      preview: 'Mumbai: Heavy rains cause waterlogging in key areas...',
    },
    karnataka: {
      label: 'Karnataka (Bengaluru)',
      preview: 'Bengaluru summary has dynamic state reporting...',
    },
  }

  return (
    <div className="w-full font-sans select-none pb-12 animate-in fade-in duration-200">
      {/* =========================================================================
          1. ELEGANT LOCATION DASHBOARD HERO (Off-White & Subtle Beige)
          Features prominent search, rounded regional filter chips, centered map,
          and Breaking Local News stream
         ========================================================================= */}
      <section className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-5 sm:p-7 mb-8 shadow-xs">
        {/* Top Header & Map Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#141412] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E]">
                  Regional Desks & Dispatches
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39]" />
                <span className="text-[11px] font-semibold text-[#0F392B]">Live Map</span>
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
              onClick={() => setMapMode('india')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                mapMode === 'india'
                  ? 'bg-[#141412] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#141412]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>India Desks</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('global')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                mapMode === 'global'
                  ? 'bg-[#141412] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#141412]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>World Bureaus</span>
            </button>
          </div>
        </div>

        {/* Search Bar (Above the Map) */}
        <div className="mt-5 max-w-2xl mx-auto relative">
          <div className="relative group">
            <Search className="w-4 h-4 text-[#78716C] group-focus-within:text-[#141412] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search news by region or state (e.g. Punjab, Delhi NCR, Haryana, Chandigarh, Bengaluru, Maharashtra)..."
              className="w-full bg-white border border-[#E8E2D8] focus:border-[#141412] rounded-full pl-11 pr-10 py-3 text-xs sm:text-sm text-[#141412] placeholder-[#78716C] focus:outline-none transition-all shadow-xs focus:shadow-md"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#141412] p-1 rounded-full hover:bg-[#F5EFEB] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-[#E8E2D8] rounded-xl shadow-lg overflow-hidden py-1.5">
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF7F2] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#141412] shrink-0" />
                    <span className="font-semibold text-[#141412]">{loc.displayName}</span>
                    <span className="text-[11px] text-[#78716C]">({loc.country})</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#E8E2D8]">
                    {loc.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Smooth Rounded Filter Chip Buttons for Regional Desks (Below the Search Bar) */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap pb-1">
          {REGIONAL_DESKS.map((chip) => {
            const isSelected =
              chip.id === 'all-desks'
                ? selectedLocationId === 'punjab' && selectedCategory === 'all'
                : selectedLocationId === chip.locationId
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSelectLocation(chip.locationId)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all duration-150 flex items-center gap-1.5 font-medium shadow-2xs ${
                  isSelected
                    ? 'bg-[#141412] text-white border-[#141412] shadow-xs font-semibold'
                    : 'bg-white text-[#44403C] hover:text-[#141412] hover:bg-[#F5EFEB] border-[#E8E2D8]'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>

        {/* Dashboard Center Grid: Centered Map (8 Cols) + Breaking Local News Rail (4 Cols) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Centered Interactive Vector Map */}
          <div className="lg:col-span-8 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl overflow-hidden relative shadow-2xs flex flex-col justify-between min-h-[380px] sm:min-h-[460px]">
            {/* Subtle Cartographic Grid Pattern */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #D4CBBF 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Map Top Status Pill */}
            <div className="relative z-10 px-4 pt-3 flex items-center justify-between text-xs text-[#78716C]">
              <span className="flex items-center gap-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-[#0F392B]" />
                {mapMode === 'india'
                  ? 'Interactive India State Desks'
                  : 'Interactive Global Bureaus'}
              </span>
              <span className="text-[11px] text-[#78716C] hidden sm:inline">
                Click any regional pin or callout card
              </span>
            </div>

            {/* Interactive SVG Projection */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4">
              {mapMode === 'india' ? (
                /* Centered Interactive Vector Map of India */
                <div className="relative w-full max-w-[500px] aspect-[1/1] mx-auto flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full transition-all select-none"
                  >
                    <defs>
                      <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow
                          dx="0"
                          dy="1.2"
                          stdDeviation="1"
                          floodColor="#141412"
                          floodOpacity="0.25"
                        />
                      </filter>
                      <filter id="land-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow
                          dx="0"
                          dy="1"
                          stdDeviation="1.5"
                          floodColor="#141412"
                          floodOpacity="0.05"
                        />
                      </filter>
                    </defs>

                    {/* Lat / Long Cartographic Guidelines */}
                    <line
                      x1="10"
                      y1="30"
                      x2="90"
                      y2="30"
                      stroke="#E5DEC9"
                      strokeWidth="0.3"
                      strokeDasharray="1.5,1.5"
                    />
                    <line
                      x1="10"
                      y1="55"
                      x2="90"
                      y2="55"
                      stroke="#E5DEC9"
                      strokeWidth="0.3"
                      strokeDasharray="1.5,1.5"
                    />
                    <line
                      x1="10"
                      y1="75"
                      x2="90"
                      y2="75"
                      stroke="#E5DEC9"
                      strokeWidth="0.3"
                      strokeDasharray="1.5,1.5"
                    />

                    {/* Accurate Crisp Cartographic Silhouette of India */}
                    <path
                      d="
                        M 38 7 
                        C 42 6, 45 7, 47 11 
                        C 48 14, 46 17, 44 20 
                        L 49 23 
                        L 53 27 
                        L 61 27 
                        L 68 28 
                        L 76 26 
                        L 84 28 
                        L 86 34 
                        L 81 38 
                        L 76 43 
                        L 70 38 
                        L 65 39 
                        L 63 45 
                        L 65 50 
                        L 60 56 
                        L 56 63 
                        L 50 70 
                        L 46 78 
                        L 43 85 
                        L 40 92 
                        L 37 91 
                        L 35 83 
                        L 34 76 
                        L 31 68 
                        L 29 60 
                        L 27 52 
                        L 23 52 
                        L 17 53 
                        L 14 49 
                        L 16 44 
                        L 22 43 
                        L 25 38 
                        L 26 31 
                        L 29 24 
                        L 33 16 
                        Z
                      "
                      fill="#F2ECE1"
                      stroke="#D8CFBE"
                      strokeWidth="0.8"
                      filter="url(#land-shadow)"
                      className="transition-colors hover:fill-[#EFE6D7]"
                    />

                    {/* Gujarat Kathiawar Peninsula Accent */}
                    <path
                      d="M 16 47 L 22 47 L 23 53 L 16 52 Z"
                      fill="#EFE6D7"
                      stroke="#D8CFBE"
                      strokeWidth="0.5"
                    />

                    {/* Subtle Internal Regional Desks Accent Guidelines */}
                    <path
                      d="M 29 24 L 40 28 M 26 31 L 37 32 M 27 52 L 40 50 M 31 68 L 46 66"
                      fill="none"
                      stroke="#E2D9C8"
                      strokeWidth="0.4"
                      strokeDasharray="1,1"
                    />

                    {/* Sleek Dark Location Pin Markers */}
                    {mapLocations.map((loc) => {
                      const isSelected = selectedLocationId === loc.id
                      const isHovered = hoveredLocationId === loc.id

                      return (
                        <g
                          key={loc.id}
                          onClick={() => handleSelectLocation(loc.id)}
                          onMouseEnter={() => setHoveredLocationId(loc.id)}
                          onMouseLeave={() => setHoveredLocationId(null)}
                          className="cursor-pointer transition-transform"
                          style={{
                            transformOrigin: `${loc.svgCoords.x}% ${loc.svgCoords.y}%`,
                          }}
                        >
                          {/* Pulsing Beacon Ring for Selected State */}
                          {isSelected && (
                            <circle
                              cx={loc.svgCoords.x}
                              cy={loc.svgCoords.y}
                              r="5.5"
                              fill="none"
                              stroke="#141412"
                              strokeWidth="0.8"
                              className="animate-ping opacity-50"
                            />
                          )}

                          {/* Outer Sleek Dark Marker Pin */}
                          <circle
                            cx={loc.svgCoords.x}
                            cy={loc.svgCoords.y}
                            r={isSelected ? '3.5' : isHovered ? '3.0' : '2.2'}
                            fill="#141412"
                            stroke="#FFFFFF"
                            strokeWidth="0.7"
                            filter="url(#pin-shadow)"
                            className="transition-all duration-150"
                          />

                          {/* Pin Center Dot Pip */}
                          <circle
                            cx={loc.svgCoords.x}
                            cy={loc.svgCoords.y}
                            r={isSelected ? '1.2' : '0.8'}
                            fill="#FFFFFF"
                          />
                        </g>
                      )
                    })}
                  </svg>

                  {/* Floating Interactive Callout Cards for Major State Desks (Punjab, Delhi, Chandigarh, Bengaluru, Maharashtra) */}
                  {mapLocations.map((loc) => {
                    const previewData = DESK_PREVIEWS[loc.id]
                    if (!previewData) return null

                    const isSelected = selectedLocationId === loc.id
                    const isHovered = hoveredLocationId === loc.id

                    // Show callout cards prominently
                    return (
                      <div
                        key={`callout-${loc.id}`}
                        onClick={() => handleSelectLocation(loc.id)}
                        onMouseEnter={() => setHoveredLocationId(loc.id)}
                        onMouseLeave={() => setHoveredLocationId(null)}
                        className={`absolute z-20 cursor-pointer transition-all duration-200 pointer-events-auto ${
                          isSelected
                            ? 'scale-105 opacity-100 z-30'
                            : isHovered
                            ? 'scale-102 opacity-100 z-25'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{
                          left: `${loc.svgCoords.x}%`,
                          top: `${loc.svgCoords.y}%`,
                          transform:
                            loc.id === 'karnataka'
                              ? 'translate(8px, -10px)'
                              : loc.id === 'maharashtra'
                              ? 'translate(-110%, -50%)'
                              : loc.id === 'chandigarh'
                              ? 'translate(8px, -80%)'
                              : loc.id === 'delhi'
                              ? 'translate(8px, 2px)'
                              : 'translate(-105%, -80%)',
                        }}
                      >
                        <div
                          className={`bg-white/95 backdrop-blur-xs border rounded-lg px-2.5 py-1.5 shadow-sm hover:shadow-md transition-all min-w-[120px] max-w-[160px] ${
                            isSelected
                              ? 'border-[#141412] ring-1 ring-[#141412]/20'
                              : 'border-[#E8E2D8] hover:border-[#141412]/40'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isSelected ? 'bg-[#D95D39]' : 'bg-[#141412]'
                              }`}
                            />
                            <span className="font-semibold text-[11px] text-[#141412] truncate">
                              {previewData.label}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-[#78716C] truncate mt-0.5 leading-tight">
                            {previewData.preview}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* World Bureaus Interactive Map Projection SVG */
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full max-h-[340px] transition-all select-none"
                >
                  <defs>
                    <filter id="world-pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow
                        dx="0"
                        dy="1.2"
                        stdDeviation="1"
                        floodColor="#141412"
                        floodOpacity="0.25"
                      />
                    </filter>
                  </defs>

                  {/* Stylized Continents Outline */}
                  <path
                    d="M 12 26 L 32 24 L 30 46 L 20 48 L 12 34 Z"
                    fill="#F2ECE1"
                    stroke="#D8CFBE"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 44 24 L 56 22 L 56 36 L 46 36 Z"
                    fill="#F2ECE1"
                    stroke="#D8CFBE"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 58 20 L 86 20 L 82 50 L 60 52 L 58 36 Z"
                    fill="#F2ECE1"
                    stroke="#D8CFBE"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 64 44 L 72 44 L 68 58 L 62 52 Z"
                    fill="#EAE2D2"
                    stroke="#0F392B"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 76 68 L 88 66 L 86 82 L 74 80 Z"
                    fill="#F2ECE1"
                    stroke="#D8CFBE"
                    strokeWidth="0.8"
                  />

                  {/* World Markers */}
                  {mapLocations.map((loc) => {
                    const isSelected = selectedLocationId === loc.id
                    const isHovered = hoveredLocationId === loc.id
                    return (
                      <g
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc.id)}
                        onMouseEnter={() => setHoveredLocationId(loc.id)}
                        onMouseLeave={() => setHoveredLocationId(null)}
                        className="cursor-pointer transition-transform"
                      >
                        {isSelected && (
                          <circle
                            cx={loc.svgCoords.x}
                            cy={loc.svgCoords.y}
                            r="5.5"
                            fill="none"
                            stroke="#141412"
                            strokeWidth="0.8"
                            className="animate-ping opacity-50"
                          />
                        )}
                        <circle
                          cx={loc.svgCoords.x}
                          cy={loc.svgCoords.y}
                          r={isSelected ? '3.5' : isHovered ? '3' : '2.2'}
                          fill="#141412"
                          stroke="#FFFFFF"
                          strokeWidth="0.6"
                          filter="url(#world-pin-shadow)"
                          className="transition-all duration-150"
                        />
                        <circle
                          cx={loc.svgCoords.x}
                          cy={loc.svgCoords.y}
                          r={isSelected ? '1.2' : '0.8'}
                          fill="#FFFFFF"
                        />
                        <text
                          x={loc.svgCoords.x + 3.5}
                          y={loc.svgCoords.y + 1}
                          fontSize="2.8"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                          fontWeight={isSelected ? '700' : '500'}
                          fill={isSelected ? '#141412' : '#57534E'}
                          className="select-none pointer-events-none"
                        >
                          {loc.name}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>

            {/* Bottom Location Indicator Bar */}
            <div className="relative z-10 px-4 py-2.5 bg-white/80 backdrop-blur-xs border-t border-[#E8E2D8] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#141412]" />
                <span className="font-semibold text-[#141412]">
                  {selectedLocation.displayName}
                </span>
                <span className="text-[11px] text-[#78716C]">
                  • {selectedLocation.type.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#0F392B]">
                {totalCount} Verified Dispatches
              </span>
            </div>
          </div>

          {/* Breaking Local News Rail (Right-Hand Rail matching Mockup) */}
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
                  Live Feed
                </span>
              </div>

              {/* Feed Items */}
              <div className="space-y-3">
                {breakingRailStories.map((article, idx) => {
                  const relativeTimes = ['12m ago', '35m ago', '1h ago', '2h ago']
                  const timeLabel =
                    relativeTimes[idx] || getRelativeTime(article.publishedDate)

                  return (
                    <div
                      key={article.id}
                      onClick={() => onArticleClick(article)}
                      className="group cursor-pointer p-2.5 rounded-lg hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D8] transition-all flex gap-3 items-start"
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
          2. SELECTED LOCATION MASTHEAD & FILTER STRIP
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

        {/* Category & Date Filters within Location */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#0F392B] text-white border-[#0F392B] font-semibold'
                    : 'bg-[#FAF7F2] text-[#55504A] hover:text-[#141412] border-[#E8E2D8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Date Range Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#78716C] mr-1 shrink-0" />
            {DATE_TABS.map((dt) => (
              <button
                key={dt.id}
                type="button"
                onClick={() => setSelectedDatePreset(dt.id)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors shrink-0 ${
                  selectedDatePreset === dt.id
                    ? 'bg-[#141412] text-white font-semibold'
                    : 'text-[#78716C] hover:text-[#141412]'
                }`}
              >
                {dt.label}
              </button>
            ))}
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
              }}
              className="px-3.5 py-1.5 bg-[#141412] text-white rounded-md text-xs font-semibold hover:bg-[#2C2B27] transition-colors"
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
