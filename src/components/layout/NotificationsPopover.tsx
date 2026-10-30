import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle } from 'lucide-react'

interface NotificationsPopoverProps {
  className?: string
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Notifications"
        className={`p-2 rounded border transition-all ${
          isOpen
            ? 'bg-[#171715] text-white border-[#171715]'
            : 'bg-white text-[#5C5852] hover:text-[#171715] hover:bg-[#FAF8F3] border-[#E5E0D5]'
        }`}
      >
        <Bell className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#E5E0D5] rounded-lg shadow-popover z-50 overflow-hidden text-left animate-in fade-in-50 duration-150 font-sans">
          <div className="px-4 py-2.5 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#171715]">
              Dispatches & Alerts
            </span>
            <span className="text-[10px] text-[#78716C]">Today</span>
          </div>

          <div className="p-6 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#5C5852] mb-3">
              <CheckCircle className="w-5 h-5 text-[#C84B31]" />
            </div>
            <h4 className="text-sm font-semibold text-[#171715]">All Dispatches Caught Up</h4>
            <p className="text-xs text-[#78716C] mt-1 max-w-[220px] leading-relaxed">
              You are completely up to date with today’s verified reporting and category digests.
            </p>
          </div>

          <div className="px-4 py-2 border-t border-[#E5E0D5] bg-[#FAF8F3] text-[11px] text-[#78716C] flex items-center justify-between">
            <span>Upwise Hub</span>
            <span className="font-mono text-[10px]">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  )
}
