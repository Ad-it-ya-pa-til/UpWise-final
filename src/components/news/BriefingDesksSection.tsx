import React, { useState, useEffect, useRef } from 'react'
import {
  Monitor,
  Landmark,
  BarChart3,
  Atom,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  Check,
} from 'lucide-react'
import { Article } from '../../types/news'

export interface BriefingDesk {
  id: string
  name: string
  subtitle: string
  groupId: string
  subcategoryId?: string
  icon: React.ComponentType<{ className?: string }>
}

const BRIEFING_DESKS: BriefingDesk[] = [
  {
    id: 'technology',
    name: 'Technology',
    subtitle: 'Innovation, AI, startups & more',
    groupId: 'tech-science',
    subcategoryId: 'tech-ai',
    icon: Monitor,
  },
  {
    id: 'politics',
    name: 'India & Politics',
    subtitle: 'Policy, governance, elections',
    groupId: 'india-politics',
    subcategoryId: undefined,
    icon: Landmark,
  },
  {
    id: 'business',
    name: 'Business',
    subtitle: 'Markets, economy, finance',
    groupId: 'business-economy',
    subcategoryId: 'biz-markets',
    icon: BarChart3,
  },
  {
    id: 'science',
    name: 'Science',
    subtitle: 'Research, space, health, climate',
    groupId: 'tech-science',
    subcategoryId: 'tech-space',
    icon: Atom,
  },
]

interface BriefingDesksSectionProps {
  selectedCategoryId: string | null
  selectedSubcategoryId: string | null
  onSelectCategory: (groupId: string, subcategoryId?: string) => void
  articles?: Article[]
  className?: string
}

export const BriefingDesksSection: React.FC<BriefingDesksSectionProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  articles = [],
  className = '',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Audio briefing player logic
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsPlayingAudio(false)
      setAudioProgress(0)
    } else {
      setIsPlayingAudio(true)
      
      // If Web Speech API is available, read today's briefing
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const briefingText = articles.slice(0, 3).map((a) => a.title).join('. Next story: ')
        const textToSpeak = `Here is your 60-second UPWISE briefing. ${briefingText || "India unveils high speed transit blueprint, silicon photonics milestone in Bengaluru, and Reserve Bank maintains growth outlook."}`
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.rate = 1.05
        utterance.pitch = 1.0
        utterance.onend = () => {
          setIsPlayingAudio(false)
          setAudioProgress(0)
        }
        utterance.onerror = () => {
          setIsPlayingAudio(false)
          setAudioProgress(0)
        }
        synthRef.current = utterance
        window.speechSynthesis.speak(utterance)
      } else {
        // Fallback simulation timer
        const timer = setTimeout(() => {
          setIsPlayingAudio(false)
          setAudioProgress(0)
        }, 12000)
        return () => clearTimeout(timer)
      }
    }
  }

  return (
    <section className={`mb-10 sm:mb-12 select-none font-sans ${className}`}>
      {/* Section Heading with Orange Dot */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#D95D39] shrink-0" />
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] tracking-tight">
          Choose your briefing
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Column (8 cols): 2x2 Clean Desk Cards */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {BRIEFING_DESKS.map((desk) => {
            const Icon = desk.icon
            const isSelected =
              desk.groupId === selectedCategoryId &&
              (!desk.subcategoryId || desk.subcategoryId === selectedSubcategoryId)

            return (
              <button
                key={desk.id}
                type="button"
                onClick={() => onSelectCategory(desk.groupId, desk.subcategoryId)}
                className={`group flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-white border-[#0F392B] ring-1 ring-[#0F392B]'
                    : 'bg-[#FDFBF7] hover:bg-white border-[#E8E2D8] hover:border-[#D4CBBF]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#0F392B] text-white'
                        : 'bg-white border border-[#E8E2D8] text-[#141412] group-hover:border-[#0F392B]/40 group-hover:text-[#0F392B]'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-[15px] text-[#141412] group-hover:text-[#0F392B] transition-colors truncate">
                      {desk.name}
                    </h3>
                    <p className="text-xs text-[#78716C] truncate mt-0.5 font-normal">
                      {desk.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pl-2 shrink-0">
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected
                        ? 'text-[#0F392B]'
                        : 'text-[#A8A29E] group-hover:text-[#0F392B] group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Column (4-5 cols): TODAY IN 60 SECONDS Audio Briefing Widget */}
        <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-[#0F392B] to-[#0A261D] rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle decorative radial waveform pattern background */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/[0.03] rounded-full pointer-events-none" />
          
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39] shrink-0" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#D2E4DC]">
                TODAY IN 60 SECONDS
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug mb-1.5">
              India's key headlines, in a minute
            </h3>

            {/* Subtitle */}
            <p className="text-xs text-[#B5D1C5] leading-relaxed mb-5 max-w-xs font-normal">
              The most important stories from India and around the world, curated for you.
            </p>
          </div>

          {/* Action Row: Listen Now Button + Audio Waveform */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleToggleAudio}
              className="bg-white hover:bg-[#FAF7F2] text-[#0F392B] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm shrink-0"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause • 1 min</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Listen now • 1 min</span>
                </>
              )}
            </button>

            {/* Audio Waveform Equalizer */}
            <div className="flex items-center gap-[3px] h-6 px-1 shrink-0" aria-hidden="true">
              {[35, 60, 45, 90, 75, 40, 80, 50, 95, 60, 30, 85, 70, 40].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: isPlayingAudio ? `${Math.max(20, (h + Math.sin(Date.now() / 200 + i) * 30))}%` : `${h * 0.4}%`,
                    animationDuration: `${0.6 + (i % 5) * 0.15}s`,
                  }}
                  className={`w-[2.5px] rounded-full transition-all duration-150 ${
                    isPlayingAudio ? 'bg-[#D95D39] animate-pulse' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
