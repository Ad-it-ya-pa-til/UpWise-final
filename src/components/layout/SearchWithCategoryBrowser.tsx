import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { CategoryGroup } from '../../types/navigation'

export interface SearchWithCategoryBrowserProps {
  onSearch?: (query: string) => void
  onCategorySelect?: (categoryId: string, subcategoryId?: string) => void
  categories?: CategoryGroup[]
  selectedCategoryId?: string | null
  selectedSubcategoryId?: string | null
  placeholder?: string
  className?: string
  onOpenDiscovery?: (focus: 'search' | 'categories') => void
  onCloseDiscovery?: () => void
  isDiscoveryOpen?: boolean
  searchQuery?: string
  onClearSearch?: () => void
}

// Spotify-inspired "Browse all / library drawer" icon
const BrowseAllDrawerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    {/* Top shelf/lid */}
    <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h11A1.5 1.5 0 0 1 19 3.5V5H5V3.5z" />
    {/* Main drawer body with circular cutout handle */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7zm9 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
    />
  </svg>
)

export const SearchWithCategoryBrowser: React.FC<SearchWithCategoryBrowserProps> = ({
  placeholder = 'Search news, topics, people, or places...',
  className = '',
  onOpenDiscovery,
  onCloseDiscovery,
  isDiscoveryOpen = false,
  searchQuery = '',
  onClearSearch,
  onSearch,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => Boolean(searchQuery.trim()) || isDiscoveryOpen)
  const [inputValue, setInputValue] = useState(searchQuery)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep internal input value synchronized with prop
  useEffect(() => {
    setInputValue(searchQuery)
    if (searchQuery.trim()) {
      setIsExpanded(true)
    }
  }, [searchQuery])

  // Synchronize expansion with discovery overlay state
  useEffect(() => {
    if (isDiscoveryOpen) {
      setIsExpanded(true)
    } else if (!searchQuery.trim() && !inputValue.trim()) {
      setIsExpanded(false)
    }
  }, [isDiscoveryOpen, searchQuery, inputValue])

  // Automatically focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  // Handle clicks outside container to close search bar & discovery
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const overlay = document.getElementById('discovery-overlay-container')
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        (!overlay || !overlay.contains(event.target as Node))
      ) {
        if (!searchQuery.trim() && !inputValue.trim()) {
          setIsExpanded(false)
          onCloseDiscovery?.()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchQuery, inputValue, onCloseDiscovery])

  // Keyboard shortcut (⌘K / Ctrl+K) and Escape key handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsExpanded(true)
        onOpenDiscovery?.('search')
      } else if (event.key === 'Escape' && (isExpanded || isDiscoveryOpen)) {
        event.preventDefault()
        setIsExpanded(false)
        onCloseDiscovery?.()
        if (!searchQuery.trim()) {
          onClearSearch?.()
        }
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, isDiscoveryOpen, searchQuery, onOpenDiscovery, onCloseDiscovery, onClearSearch])

  const handleToggle = () => {
    if (isExpanded || isDiscoveryOpen) {
      // Collapse search bar and close discovery panel
      setIsExpanded(false)
      onCloseDiscovery?.()
      if (!inputValue.trim()) {
        onClearSearch?.()
        onSearch?.('')
      }
    } else {
      // Expand search bar and open discovery panel
      setIsExpanded(true)
      onOpenDiscovery?.('search')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    onSearch?.(val)
    if (!isDiscoveryOpen) {
      onOpenDiscovery?.('search')
    }
  }

  const handleInputFocus = () => {
    if (!isDiscoveryOpen) {
      onOpenDiscovery?.('search')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue('')
    onClearSearch?.()
    onSearch?.('')
    inputRef.current?.focus()
  }

  const handleBrowseAllClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(true)
    onOpenDiscovery?.('categories')
  }

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(inputValue.trim())
    }
  }

  return (
    <div ref={containerRef} className={`relative flex items-center ${className}`}>
      {/* Collapsed State: Sleek search icon button */}
      {!isExpanded && !isDiscoveryOpen ? (
        <button
          type="button"
          onClick={handleToggle}
          title="Search UPWISE HUB (⌘K)"
          aria-label="Open search and editorial desks"
          aria-expanded={false}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-white hover:bg-[#FAF7F2] text-[#141412] hover:text-[#0F392B] border border-[#E8E2D8] hover:border-[#D4CBBF] shadow-[0_1px_2px_rgba(20,20,18,0.03)] transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F392B]"
        >
          <Search className="w-4 h-4 stroke-[2] transition-transform duration-200 group-hover:scale-110" />
        </button>
      ) : (
        /* Expanded State: Spotify-inspired rounded pill dark charcoal search bar */
        <div
          className="relative flex items-center h-9 sm:h-10 bg-[#181816] text-white border border-[#2A2A26] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.18)] px-1 transition-all duration-300 ease-out w-64 sm:w-80 md:w-96 lg:w-[420px] max-w-[calc(100vw-5rem)] focus-within:ring-1 focus-within:ring-[#0F392B] focus-within:border-[#0F392B]"
        >
          {/* Left: Search Icon (toggles expanded/discovery state) */}
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Toggle search panel"
            className="p-1.5 ml-1 text-[#A8A29E] hover:text-white rounded-full transition-colors shrink-0 focus:outline-none"
          >
            <Search className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Center: Search input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDownInput}
            placeholder={placeholder}
            aria-label="Search input"
            className="flex-1 bg-transparent text-xs sm:text-[13px] text-white placeholder-[#8A847C] focus:outline-none px-2 py-1 min-w-0 font-sans tracking-normal"
          />

          {/* Clear button (visible when there is text) */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              title="Clear search"
              className="p-1 text-[#8A847C] hover:text-white rounded-full transition-colors shrink-0 mr-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          )}

          {/* Keyboard shortcut hint (visible when empty on desktop) */}
          {!inputValue && (
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-[#8A847C] bg-white/5 border border-white/10 rounded mr-1.5 shrink-0 select-none">
              ESC
            </kbd>
          )}

          {/* Subtle vertical divider */}
          <span className="h-4 w-px bg-white/20 mx-1 shrink-0" aria-hidden="true" />

          {/* Right: Browse All / Editorial Desks Icon */}
          <button
            type="button"
            onClick={handleBrowseAllClick}
            aria-label="Browse all editorial desks"
            title="Browse all editorial desks"
            className="p-1.5 mr-1 text-[#A8A29E] hover:text-white hover:bg-white/10 rounded-full transition-all duration-150 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <BrowseAllDrawerIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
