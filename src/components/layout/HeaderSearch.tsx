import React, { useState, useRef, useEffect } from 'react'
import { Search, X, TrendingUp, MapPin, Tag } from 'lucide-react'
import { HeaderSearchSuggestion } from '../../types/navigation'

interface HeaderSearchProps {
  onSearch?: (query: string) => void
  className?: string
}

// Tasteful, non-fabricated demo suggestions clearly labeled
const DEMO_SUGGESTIONS: HeaderSearchSuggestion[] = [
  { id: '1', label: 'Union Budget 2026 Highlights', type: 'topic' },
  { id: '2', label: 'ISRO Next-Gen Launch Vehicle', type: 'topic' },
  { id: '3', label: 'Bengaluru Tech & Infrastructure', type: 'city' },
  { id: '4', label: 'Semiconductor Manufacturing Policy', type: 'category' },
  { id: '5', label: 'Renewable Energy Grid Expansion', type: 'topic' },
]

export const HeaderSearch: React.FC<HeaderSearchProps> = ({ onSearch, className = '' }) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsMobileExpanded(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch?.(query.trim())
    setIsOpen(false)
    setIsMobileExpanded(false)
  }

  const handleSelectSuggestion = (label: string) => {
    setQuery(label)
    onSearch?.(label)
    setIsOpen(false)
    setIsMobileExpanded(false)
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
    onSearch?.('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Mobile Search Trigger Icon (visible only on very small screens) */}
      <div className="md:hidden flex items-center">
        {!isMobileExpanded ? (
          <button
            type="button"
            onClick={() => {
              setIsMobileExpanded(true)
              setTimeout(() => inputRef.current?.focus(), 100)
            }}
            className="p-2 text-espresso hover:text-espresso-rich hover:bg-border-light rounded-sm transition-colors"
            aria-label="Open search input"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Main Search Container */}
      <div
        className={`
          ${isMobileExpanded ? 'fixed inset-x-0 top-0 z-50 p-3 bg-surface border-b border-border shadow-popover flex items-center gap-2' : 'hidden md:block w-full max-w-md lg:max-w-lg'}
        `}
      >
        <form onSubmit={handleSubmit} className="relative w-full flex items-center">
          <label htmlFor="news-search-input" className="sr-only">
            Search news, topics, cities
          </label>

          {/* Embedded Search Icon */}
          <div className="absolute left-3.5 pointer-events-none text-muted-brown flex items-center">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>

          {/* Search Input */}
          <input
            id="news-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search news, topics, cities..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-surface text-espresso placeholder:text-muted-brown/70 border border-border rounded-full hover:border-border-dark focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso transition-all duration-150"
          />

          {/* Clear button when text present */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 text-muted-brown hover:text-espresso rounded-full hover:bg-border-light transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close mobile search overlay */}
          {isMobileExpanded && (
            <button
              type="button"
              onClick={() => {
                setIsMobileExpanded(false)
                setIsOpen(false)
              }}
              className="ml-2 px-3 py-1.5 text-xs font-medium text-muted-brown hover:text-espresso border border-border rounded-md hover:bg-page transition-colors md:hidden"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Suggestion Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-lg shadow-popover z-50 overflow-hidden text-left">
            <div className="px-3.5 py-2 border-b border-border-light flex items-center justify-between text-xs font-semibold text-muted-brown uppercase tracking-wider">
              <span>Suggested Topics</span>
              <span className="text-[10px] text-muted-brown/70 normal-case font-normal">(Demo Suggestions)</span>
            </div>

            <ul className="py-1 divide-y divide-border-light/50">
              {DEMO_SUGGESTIONS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item.label)}
                    className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm text-espresso hover:bg-newspaper-yellow-light/60 flex items-center justify-between group transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      {item.type === 'city' ? (
                        <MapPin className="w-3.5 h-3.5 text-muted-brown group-hover:text-espresso" />
                      ) : item.type === 'category' ? (
                        <Tag className="w-3.5 h-3.5 text-muted-brown group-hover:text-espresso" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-muted-brown group-hover:text-espresso" />
                      )}
                      <span className="group-hover:text-espresso-rich font-medium">{item.label}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-brown/70">
                      {item.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {query.trim() && (
              <div className="px-3.5 py-2.5 bg-page/40 border-t border-border-light text-xs text-muted-brown flex items-center justify-between">
                <span>
                  Press <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono text-[10px] text-espresso">Enter</kbd> to search for "{query}"
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
