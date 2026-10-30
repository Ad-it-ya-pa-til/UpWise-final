import React, { useState, useRef, useEffect } from 'react'
import {
  Calendar,
  Building2,
  LayoutGrid,
  Layers,
  X,
  ChevronDown,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react'
import { LanguageMode, LayoutMode, DatePreset } from '../../types/news'
import { LanguageSelector } from '../layout/LanguageSelector'
import { useTranslation } from 'react-i18next'

interface AdvancedFilterBarProps {
  language: LanguageMode
  onLanguageChange: (lang: LanguageMode) => void
  datePreset: DatePreset
  onDatePresetChange: (preset: DatePreset) => void
  customStartDate: string
  customEndDate: string
  onCustomDateChange: (start: string, end: string) => void
  availablePublishers: string[]
  selectedPublishers: string[]
  onTogglePublisher: (pub: string) => void
  onSelectAllPublishers: () => void
  onClearPublishers: () => void
  layoutMode: LayoutMode
  onLayoutModeChange: (mode: LayoutMode) => void
  activeCategoryName?: string | null
  onClearCategory?: () => void
  searchQuery?: string
  onClearSearch?: () => void
  isSavedViewActive?: boolean
  onClearSavedView?: () => void
  totalResultsCount: number
  onResetAllFilters: () => void
}

export const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({

  language,
  onLanguageChange,
  datePreset,
  onDatePresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  availablePublishers,
  selectedPublishers,
  onTogglePublisher,
  onSelectAllPublishers,
  onClearPublishers,
  layoutMode,
  onLayoutModeChange,
  activeCategoryName,
  onClearCategory,
  searchQuery,
  onClearSearch,
  isSavedViewActive = false,
  onClearSavedView,
  totalResultsCount,
  onResetAllFilters,
}) => {
  const { t } = useTranslation()
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isPublisherOpen, setIsPublisherOpen] = useState(false)
  const [publisherSearch, setPublisherSearch] = useState('')
  const [tempStart, setTempStart] = useState(customStartDate)
  const [tempEnd, setTempEnd] = useState(customEndDate)
  const [dateError, setDateError] = useState<string | null>(null)

  const dateRef = useRef<HTMLDivElement>(null)
  const pubRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false)
      }
      if (pubRef.current && !pubRef.current.contains(event.target as Node)) {
        setIsPublisherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDateOpen(false)
        setIsPublisherOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleApplyCustomDate = () => {
    if (!tempStart || !tempEnd) {
      setDateError('Please enter both start and end dates.')
      return
    }
    if (new Date(tempStart) > new Date(tempEnd)) {
      setDateError('Start date cannot be after end date.')
      return
    }
    setDateError(null)
    onCustomDateChange(tempStart, tempEnd)
    onDatePresetChange('custom')
    setIsDateOpen(false)
  }

  const getDateLabel = () => {
    switch (datePreset) {
      case 'today':
        return 'Today'
      case 'yesterday':
        return 'Yesterday'
      case 'week':
        return 'Past 7 days'
      case 'month':
        return 'This Month'
      case 'custom':
        return customStartDate && customEndDate
          ? `${customStartDate.slice(5)} to ${customEndDate.slice(5)}`
          : 'Custom Range'
      default:
        return 'All Dates'
    }
  }

  const filteredPublishersList = availablePublishers.filter((p) =>
    p.toLowerCase().includes(publisherSearch.trim().toLowerCase())
  )

  const isAnyFilterActive = Boolean(
    searchQuery?.trim() ||
      datePreset !== 'all' ||
      selectedPublishers.length > 0 ||
      isSavedViewActive
  )

  return (
    <div className="w-full font-sans select-none text-xs flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Compact Filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Language Switcher */}
            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />

            {/* Date Filter */}
            <div ref={dateRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsDateOpen((prev) => !prev)
                  setIsPublisherOpen(false)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  datePreset !== 'all'
                    ? 'bg-[#FBF2EF] border-[#F3D5CC] text-[#D95D39] font-semibold'
                    : 'bg-white border-[#E8E2D8] text-[#55504A] hover:text-[#141412]'
                }`}
                aria-expanded={isDateOpen}
                aria-label="Filter by date"
              >
                <Calendar className="w-3 h-3 text-[#78716C]" />
                <span>{getDateLabel()}</span>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {isDateOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#E8E2D8] rounded-lg shadow-popover z-50 p-2 text-xs animate-in fade-in-50 duration-150">
                  <div className="space-y-0.5">
                    {[
                      { id: 'all', key: 'filters.allDates', label: 'All Dates' },
                      { id: 'today', key: 'filters.today', label: 'Today' },
                      { id: 'yesterday', key: 'filters.yesterday', label: 'Yesterday' },
                      { id: 'week', key: 'filters.past7Days', label: 'Past 7 Days' },
                      { id: 'month', key: 'filters.thisMonth', label: 'This Month' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onDatePresetChange(opt.id as DatePreset)
                          setIsDateOpen(false)
                        }}
                        className={`w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between text-xs transition-colors ${
                          datePreset === opt.id
                            ? 'bg-[#FBF2EF] text-[#D95D39] font-semibold'
                            : 'text-[#141412] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span>{t(opt.key, opt.label)}</span>
                        {datePreset === opt.id && <Check className="w-3 h-3 text-[#D95D39]" />}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E8E2D8]">
                    <div className="text-[11px] font-semibold text-[#141412] mb-1">
                      {t('filters.customRange', 'Custom Range')}
                    </div>
                    <div className="space-y-1">
                      <div>
                        <label className="text-[10px] text-[#78716C] block">{t('filters.fromDate', 'From')}</label>
                        <input
                          type="date"
                          value={tempStart}
                          onChange={(e) => setTempStart(e.target.value)}
                          className="w-full px-2 py-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-xs text-[#141412]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#78716C] block">{t('filters.toDate', 'To')}</label>
                        <input
                          type="date"
                          value={tempEnd}
                          onChange={(e) => setTempEnd(e.target.value)}
                          className="w-full px-2 py-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-xs text-[#141412]"
                        />
                      </div>
                      {dateError && (
                        <p className="text-[10px] text-[#D95D39] leading-tight">{dateError}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyCustomDate}
                        className="w-full mt-1 px-2.5 py-1 bg-[#0F392B] text-white font-medium text-xs rounded hover:bg-[#184837] transition-colors"
                      >
                        {t('filters.apply', 'Apply Range')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Publisher Wires Filter */}
            <div ref={pubRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPublisherOpen((prev) => !prev)
                  setIsDateOpen(false)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  selectedPublishers.length > 0
                    ? 'bg-[#FBF2EF] border-[#F3D5CC] text-[#D95D39] font-semibold'
                    : 'bg-white border-[#E8E2D8] text-[#55504A] hover:text-[#141412]'
                }`}
                aria-expanded={isPublisherOpen}
                aria-label="Filter by publisher"
              >
                <Building2 className="w-3 h-3 text-[#78716C]" />
                <span>
                  {selectedPublishers.length === 0
                    ? 'All Sources'
                    : selectedPublishers.length === 1
                    ? selectedPublishers[0]
                    : `Sources (${selectedPublishers.length})`}
                </span>
                <ChevronDown className="w-3 h-3 text-[#78716C]" />
              </button>

              {isPublisherOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-68 bg-white border border-[#E8E2D8] rounded-lg shadow-popover z-50 p-2 text-xs animate-in fade-in-50 duration-150">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded mb-1.5">
                    <Search className="w-3 h-3 text-[#78716C]" />
                    <input
                      type="text"
                      value={publisherSearch}
                      onChange={(e) => setPublisherSearch(e.target.value)}
                      placeholder={t('filters.filterPublishers', 'Filter publishers...')}
                      className="w-full bg-transparent text-xs text-[#141412] placeholder:text-[#78716C] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#E8E2D8] text-[10px] font-medium text-[#78716C]">
                    <button
                      type="button"
                      onClick={onSelectAllPublishers}
                      className="hover:text-[#141412] transition-colors"
                    >
                      {t('filters.selectAll', 'Select all')}
                    </button>
                    <button
                      type="button"
                      onClick={onClearPublishers}
                      className="hover:text-[#D95D39] transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-0.5 py-1">
                    {filteredPublishersList.length === 0 ? (
                      <p className="text-[11px] text-[#78716C] text-center py-2">{t('filters.noPublishersFound', 'No publishers found')}</p>
                    ) : (
                      filteredPublishersList.map((pub) => {
                        const isSelected = selectedPublishers.includes(pub)
                        return (
                          <label
                            key={pub}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#FAF7F2] cursor-pointer text-[#141412] text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onTogglePublisher(pub)}
                              className="w-3 h-3 rounded border-[#E8E2D8] text-[#0F392B] accent-[#0F392B]"
                            />
                            <span className="truncate">{pub}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Story Count & Layout Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-normal text-[#78716C] hidden sm:inline">
              {t('filters.storiesCount', '{{count}} stories', { count: totalResultsCount })}
            </span>

            <div className="inline-flex p-0.5 bg-white border border-[#E8E2D8] rounded text-[11px] font-medium">
              <button
                type="button"
                onClick={() => onLayoutModeChange('grid')}
                aria-label="Newspaper front page layout"
                title="Front Page Layout"
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-[#141412] text-[#FAF7F2] font-semibold'
                    : 'text-[#78716C] hover:text-[#141412]'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>{t('filters.frontPageLayout', 'Front Page')}</span>
              </button>

              <button
                type="button"
                onClick={() => onLayoutModeChange('stack')}
                aria-label="Digest stream layout"
                title="Digest Stream"
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                  layoutMode === 'stack'
                    ? 'bg-[#141412] text-[#FAF7F2] font-semibold'
                    : 'text-[#78716C] hover:text-[#141412]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{t('filters.digestLayout', 'Digest')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips (if any filter is on) */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px]">
            <span className="text-[#78716C] font-medium mr-1">{t('filters.filteredBy', 'Filtered:')}</span>

            {isSavedViewActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FBF2EF] text-[#C84B31] border border-[#F0C9BF]">
                {t('filters.savedStories', 'Saved Stories')}
                <button
                  type="button"
                  onClick={onClearSavedView}
                  aria-label="Exit saved stories"
                  className="hover:text-[#B83214]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery?.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#171715] border border-[#E5E0D5]">
                &quot;{searchQuery.trim()}&quot;
                <button
                  type="button"
                  onClick={onClearSearch}
                  aria-label="Clear search filter"
                  className="hover:text-[#C84B31]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {datePreset !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#171715] border border-[#E5E0D5]">
                {getDateLabel()}
                <button
                  type="button"
                  onClick={() => onDatePresetChange('all')}
                  aria-label="Clear date filter"
                  className="hover:text-[#C84B31]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPublishers.map((pub) => (
              <span
                key={pub}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#171715] border border-[#E5E0D5]"
              >
                {pub}
                <button
                  type="button"
                  onClick={() => onTogglePublisher(pub)}
                  aria-label={`Remove ${pub} filter`}
                  className="hover:text-[#C84B31]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={onResetAllFilters}
              className="inline-flex items-center gap-1 ml-auto text-[#78716C] hover:text-[#C84B31] transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    )
  }
