import React, { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { UpwiseLogo } from '../layout/UpwiseLogo'

export interface AuthLayoutProps {
  onLogoClick?: () => void
  children: React.ReactNode
  heading?: string
  className?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  onLogoClick,
  children,
  className = '',
}) => {
  const formattedDate = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  return (
    <div
      className={`min-h-screen bg-[#FAF7F2] text-[#141412] flex flex-col justify-between items-center px-4 py-8 sm:py-12 font-sans selection:bg-[#EAE4D8] selection:text-[#141412] select-none ${className}`}
    >
      <div className="w-full max-w-[450px] flex flex-col items-center">
        {/* Header with Centered Wordmark and Access Bar */}
        <header className="w-full flex flex-col items-center mb-6 sm:mb-8 text-center">
          {/* Restrained Terracotta Pill Dash */}
          <div className="w-7 h-[3px] bg-[#D95D39] rounded-full mx-auto mb-2.5" />

          <UpwiseLogo onClick={onLogoClick} size="xl" />

          {/* Reader Access & Date Bar */}
          <div className="w-full mt-4 py-2 border-y border-[#E8E2D8] flex items-center justify-between text-xs text-[#6E6860]">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-[#55504A]">
              Reader Access
            </span>
            <span className="text-[#78716C] font-normal">
              {formattedDate}
            </span>
          </div>
        </header>

        {/* Main Auth Form Container */}
        <main className="w-full">
          {children}
        </main>
      </div>

      {/* Editorial Footer */}
      <footer className="mt-8 pt-4 text-center text-xs text-[#78716C] font-sans flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Upwise Hub • Independent student news & civic intelligence</span>
        {onLogoClick && (
          <>
            <span className="hidden sm:inline text-[#D4CBBF]">•</span>
            <button
              type="button"
              onClick={onLogoClick}
              className="text-[#141412] hover:text-[#0F392B] transition-colors inline-flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
              <span>Return to Front Page</span>
            </button>
          </>
        )}
      </footer>
    </div>
  )
}
