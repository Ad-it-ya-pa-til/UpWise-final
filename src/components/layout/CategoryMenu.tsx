import React, { useState, useRef, useEffect } from 'react'
import { Menu, X, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { CategoryGroup } from '../../types/navigation'
import { CATEGORY_GROUPS } from '../../mock/categories.mock'

export { CATEGORY_GROUPS }

interface CategoryMenuProps {
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  onSelectCategory: (groupId: string, subcategoryId?: string) => void
  className?: string
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'india-politics': true, // Keep first open by default
  })
  const menuRef = useRef<HTMLDivElement>(null)

  // Toggle group expansion inside the accordion
  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentActiveGroup = CATEGORY_GROUPS.find((g) => g.id === selectedCategoryId)

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Spotify-style Navigation Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="category-navigation-panel"
        className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border rounded-md transition-colors select-none ${
          isOpen
            ? 'bg-espresso text-surface border-espresso'
            : selectedCategoryId
            ? 'bg-newspaper-yellow-light text-espresso border-newspaper-yellow-border font-semibold'
            : 'bg-surface text-espresso hover:bg-border-light/60 border-border'
        }`}
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        <span>Categories</span>
        {currentActiveGroup && !isOpen && (
          <span className="hidden sm:inline-flex items-center gap-1 pl-1.5 border-l border-border text-xs text-muted-brown font-normal truncate max-w-[120px]">
            {currentActiveGroup.name}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable Category Popover Panel */}
      {isOpen && (
        <div
          id="category-navigation-panel"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-surface border border-border rounded-lg shadow-popover z-50 overflow-hidden text-left animate-in fade-in-50 duration-150"
        >
          {/* Header row inside popover */}
          <div className="px-4 py-2.5 border-b border-border-light bg-page/40 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-brown">
              Browse Sections
            </span>
            {selectedCategoryId && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('')
                  setIsOpen(false)
                }}
                className="text-[11px] text-muted-brown hover:text-espresso underline hover:no-underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Scrollable Accordion Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-light/60 py-1">
            {CATEGORY_GROUPS.map((group) => {
              const isGroupSelected = selectedCategoryId === group.id && !selectedSubcategoryId
              const hasSubselected =
                selectedCategoryId === group.id && Boolean(selectedSubcategoryId)
              const isExpanded = Boolean(expandedGroups[group.id])

              return (
                <div key={group.id} className="py-1">
                  {/* Category Header Row */}
                  <div
                    className={`flex items-center justify-between px-3 py-1.5 mx-1 rounded-md transition-colors ${
                      isGroupSelected
                        ? 'bg-newspaper-yellow-light/80 text-espresso font-semibold'
                        : hasSubselected
                        ? 'bg-page/70 text-espresso'
                        : 'hover:bg-page/50 text-espresso'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(group.id)
                        setIsOpen(false)
                      }}
                      className="flex-1 text-left text-sm flex items-center gap-2"
                    >
                      {isGroupSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-newspaper-yellow shrink-0" />
                      )}
                      <span>{group.name}</span>
                    </button>

                    {/* Expand/Collapse Chevron Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleGroup(group.id, e)}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.name} subcategories`}
                      className="p-1 text-muted-brown hover:text-espresso rounded hover:bg-border-light/60 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-brown" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-brown" />
                      )}
                    </button>
                  </div>

                  {/* Subcategories (Expanded) */}
                  {isExpanded && (
                    <div className="pl-6 pr-3 py-1 space-y-0.5">
                      {group.subcategories.map((sub) => {
                        const isSubSelected =
                          selectedCategoryId === group.id && selectedSubcategoryId === sub.id

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onSelectCategory(group.id, sub.id)
                              setIsOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors text-left ${
                              isSubSelected
                                ? 'bg-newspaper-yellow/20 text-espresso font-medium'
                                : 'text-muted-brown hover:text-espresso hover:bg-page/40'
                            }`}
                          >
                            <span>{sub.name}</span>
                            {isSubSelected && (
                              <Check className="w-3.5 h-3.5 text-espresso shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer inside popover */}
          <div className="px-3.5 py-2 border-t border-border-light bg-page/30 text-[11px] text-muted-brown flex items-center justify-between">
            <span>5 Primary Editorial Desks</span>
            <span className="font-mono text-[10px]">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  )
}
