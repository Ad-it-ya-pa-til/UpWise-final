import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RotateCw,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  BookOpen,
  Gift,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Trophy,
  Filter,
  CheckCircle,
} from 'lucide-react'
import {
  ClientQuiz,
  ClientQuizQuestion,
  ClientQuizSubmissionResult,
  ClientFlashcard,
  generateQuizByDateApi,
  generateFlashcardsByDateApi,
  submitQuizApi,
} from '../../services/learningApi'
import { CATEGORY_GROUPS } from '../../mock/categories.mock'

export type StudioMode = 'quiz' | 'flashcards'
export type LearningDatePreset = 'today' | 'yesterday' | '7d' | '15d' | '30d' | 'custom'

export interface LearningStudioProps {
  onOpenRewards: () => void
  currentBalance?: number
  onBalanceUpdated?: (newBalance: number) => void
  initialCategoryId?: string | null
  className?: string
}

const DATE_PRESETS: Array<{ id: LearningDatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 Days' },
  { id: '15d', label: '15 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'custom', label: 'Custom' },
]

const COUNT_OPTIONS = [5, 10, 15, 20]

export const LearningStudio: React.FC<LearningStudioProps> = ({
  onOpenRewards,
  currentBalance = 0,
  onBalanceUpdated,
  initialCategoryId = null,
  className = '',
}) => {
  const { t } = useTranslation()
  // -------------------------------------------------------------
  // Mode Switcher State
  // -------------------------------------------------------------
  const [mode, setMode] = useState<StudioMode>('quiz')

  // -------------------------------------------------------------
  // Shared Configuration State (Preserved across mode switches)
  // -------------------------------------------------------------
  const [datePreset, setDatePreset] = useState<LearningDatePreset>('7d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Topic selection: detect category or default to 'all'
  const [selectedTopic, setSelectedTopic] = useState<string>(() => {
    if (initialCategoryId && CATEGORY_GROUPS.some((g) => g.id === initialCategoryId)) {
      return initialCategoryId
    }
    return 'all'
  })
  const [customTopicInput, setCustomTopicInput] = useState<string>('')
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState<boolean>(false)
  const topicDropdownRef = useRef<HTMLDivElement>(null)

  // Question/Card Count selection (5, 10, 15, 20)
  const [itemCount, setItemCount] = useState<number>(10)

  // UI state: whether config panel is collapsed during active quiz
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(true)

  // -------------------------------------------------------------
  // Generation & Status State
  // -------------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // -------------------------------------------------------------
  // Independent Mode State: Quiz
  // -------------------------------------------------------------
  const [quiz, setQuiz] = useState<ClientQuiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitConfirmationOpen, setSubmitConfirmationOpen] = useState<boolean>(false)
  const [quizResult, setQuizResult] = useState<ClientQuizSubmissionResult | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [showHintMap, setShowHintMap] = useState<Record<string, boolean>>({})
  const [quizzesCompletedCount, setQuizzesCompletedCount] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  // -------------------------------------------------------------
  // Independent Mode State: Flashcards
  // -------------------------------------------------------------
  const [flashcards, setFlashcards] = useState<ClientFlashcard[]>([])
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0)
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false)
  const [masteredCardIds, setMasteredCardIds] = useState<string[]>([])

  // Close topic dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(e.target as Node)) {
        setIsTopicDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => setToastMessage(null), 3000)
    return () => clearTimeout(t)
  }, [toastMessage])

  // Timer logic for active quiz
  useEffect(() => {
    if (quiz && !quizResult) {
      setElapsedSeconds(0)
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quiz, quizResult])

  // Format MM:SS timer
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Active topic display label
  const activeTopicDisplay = useMemo(() => {
    if (selectedTopic === 'custom') {
      return customTopicInput.trim() ? `Custom: "${customTopicInput.trim()}"` : 'Custom Topic'
    }
    if (selectedTopic === 'all') {
      return 'All Current Affairs'
    }
    const found = CATEGORY_GROUPS.find((g) => g.id === selectedTopic)
    return found ? found.name : selectedTopic
  }, [selectedTopic, customTopicInput])

  // -------------------------------------------------------------
  // Primary Generation Action (Explicit button click only)
  // -------------------------------------------------------------
  const handleGenerate = async (targetMode = mode) => {
    setIsGenerating(true)
    setGenerationError(null)
    setSubmitConfirmationOpen(false)

    const topicPayload =
      selectedTopic === 'custom'
        ? customTopicInput.trim() || undefined
        : selectedTopic === 'all'
          ? undefined
          : selectedTopic

    const params = {
      preset: datePreset,
      startDate: datePreset === 'custom' ? customStartDate : undefined,
      endDate: datePreset === 'custom' ? customEndDate : undefined,
      topic: topicPayload,
      count: itemCount,
    }

    if (targetMode === 'quiz') {
      setQuizResult(null)
      setSelectedAnswers({})
      setCurrentQuestionIndex(0)
      setShowHintMap({})
      const res = await generateQuizByDateApi(params)
      setIsGenerating(false)
      if (res.success && res.quiz) {
        setQuiz(res.quiz)
        setIsConfigExpanded(false)
      } else {
        setQuiz(null)
        setGenerationError(
          res.error || 'No news articles found for this date range. Try selecting "Last 7 Days" or "Last 30 Days".'
        )
      }
    } else {
      setIsCardFlipped(false)
      setActiveCardIndex(0)
      setMasteredCardIds([])
      const res = await generateFlashcardsByDateApi(params)
      setIsGenerating(false)
      if (res.success && res.flashcards) {
        setFlashcards(res.flashcards)
        setIsConfigExpanded(false)
      } else {
        setFlashcards([])
        setGenerationError(
          res.error || 'No news articles found for this date range. Try selecting "Last 7 Days" or "Last 30 Days".'
        )
      }
    }
  }

  // -------------------------------------------------------------
  // Mode Switcher (NEVER triggers generation, preserves shared config)
  // -------------------------------------------------------------
  const handleSwitchMode = (newMode: StudioMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setGenerationError(null)
    // Does NOT call handleGenerate! Shared configuration is preserved intact.
  }

  // -------------------------------------------------------------
  // Quiz Interaction Handlers
  // -------------------------------------------------------------
  const handleSelectOption = (optionIndex: number) => {
    if (!quiz) return
    const currentQ = quiz.questions[currentQuestionIndex]
    if (!currentQ) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }))
  }

  const toggleHint = (questionId: string) => {
    setShowHintMap((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  const handleConfirmSubmit = async () => {
    if (!quiz) return
    setSubmitConfirmationOpen(false)
    setIsSubmitting(true)

    const payload = {
      quizAttemptId: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      answers: selectedAnswers,
      timeTaken: elapsedSeconds,
    }

    const result = await submitQuizApi(quiz.id, payload, quiz.questions)
    setIsSubmitting(false)
    setQuizResult(result)
    setQuizzesCompletedCount((prev) => prev + 1)
    onBalanceUpdated?.(result.availableBalance)
  }

  // -------------------------------------------------------------
  // Flashcards Navigation & Mastery Handlers
  // -------------------------------------------------------------
  const handleNextCard = useCallback(() => {
    setIsCardFlipped(false)
    if (activeCardIndex < flashcards.length - 1) {
      setActiveCardIndex((prev) => prev + 1)
    }
  }, [activeCardIndex, flashcards.length])

  const handlePrevCard = useCallback(() => {
    setIsCardFlipped(false)
    if (activeCardIndex > 0) {
      setActiveCardIndex((prev) => prev - 1)
    }
  }, [activeCardIndex])

  const handleFlipCard = useCallback(() => {
    setIsCardFlipped((prev) => !prev)
  }, [])

  const handleMarkMastered = () => {
    const current = flashcards[activeCardIndex]
    if (current && !masteredCardIds.includes(current.id)) {
      setMasteredCardIds((prev) => [...prev, current.id])
      setToastMessage('✦ Card marked as mastered!')
    }
    if (activeCardIndex < flashcards.length - 1) {
      handleNextCard()
    }
  }

  const handleReviewAgain = () => {
    setIsCardFlipped(false)
    const current = flashcards[activeCardIndex]
    if (current) {
      // Move current card to end of review stack
      setFlashcards((prev) => [...prev.filter((_, idx) => idx !== activeCardIndex), current])
      setToastMessage('↺ Added to end of study deck')
    }
  }

  const handleResetFlashcardDeck = () => {
    setMasteredCardIds([])
    setActiveCardIndex(0)
    setIsCardFlipped(false)
    setToastMessage('↺ Flashcard deck reset')
  }

  // Keyboard navigation for Flashcards mode (space = flip, arrow left/right = nav)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (mode === 'flashcards' && flashcards.length > 0) {
        if (e.code === 'Space') {
          e.preventDefault()
          handleFlipCard()
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault()
          handlePrevCard()
        } else if (e.code === 'ArrowRight') {
          e.preventDefault()
          handleNextCard()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, flashcards.length, handleFlipCard, handlePrevCard, handleNextCard])

  const isAllFlashcardsMastered =
    flashcards.length > 0 && masteredCardIds.length === flashcards.length

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pb-12 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#0F392B] text-white text-xs font-bold shadow-xl border border-[#0F392B] flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-[#D95D39]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CENTRAL EDITORIAL STUDIO CARD (Header, Mode Switcher & Shared Config) */}
      {/* ========================================================================= */}
      <section
        aria-label="Learning Studio Configuration"
        className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-7 shadow-xs relative overflow-hidden"
      >
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-radial from-[#0F392B]/5 to-transparent pointer-events-none" />

        {/* Studio Masthead */}
        <div className="flex items-start justify-between gap-4 relative z-10 pb-5">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F392B] tracking-tight">
              News Quiz &amp; Flashcards
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#6E6860] mt-1 leading-relaxed">
              Turn the news you read into knowledge you remember.
            </p>

            {/* Compact session progress indicator */}
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#78716C]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#0F392B]">
                <BookOpen className="w-3.5 h-3.5 text-[#0F392B]" />
                Zero Hallucination
              </span>
              <span>•</span>
              <span>Grounded in verified news dispatches</span>
              {(quizzesCompletedCount > 0 || masteredCardIds.length > 0) && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-[#D95D39]">
                    {quizzesCompletedCount > 0 && `${quizzesCompletedCount} Quizzes Completed`}
                    {quizzesCompletedCount > 0 && masteredCardIds.length > 0 && ' · '}
                    {masteredCardIds.length > 0 && `${masteredCardIds.length} Cards Mastered`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Top-Right UP Points Balance Pill */}
          <button
            type="button"
            onClick={onOpenRewards}
            title="View UP Points Balance & Rewards Catalog"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F3EE] hover:bg-[#D5EADF] text-[#0F392B] border border-[#C5DDD2] text-xs font-bold transition-all shadow-xs group focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0F392B] fill-[#0F392B] group-hover:scale-110 transition-transform" />
            <span>✦ {currentBalance} UP</span>
          </button>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* 2. MODE SWITCHER SEGMENTED CONTROL (Always prominent & visible)       */}
        {/* --------------------------------------------------------------------- */}
        <div className="pt-2 pb-5">
          <div
            role="tablist"
            aria-label="Learning Mode Switcher"
            className="w-full bg-[#EDE8DF]/75 p-1 rounded-xl flex items-center border border-[#E0D8CB] shadow-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'quiz'}
              onClick={() => handleSwitchMode('quiz')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'quiz'
                  ? 'bg-[#0F392B] text-white shadow-xs'
                  : 'text-[#55504A] hover:text-[#141412]'
              } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t('learning.quizMode', 'Quiz Mode')}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'flashcards'}
              onClick={() => handleSwitchMode('flashcards')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'flashcards'
                  ? 'bg-[#0F392B] text-white shadow-xs'
                  : 'text-[#55504A] hover:text-[#141412]'
              } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('learning.flashcardsMode', 'Flashcards Mode')}</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* 3. SHARED CONFIGURATION PANEL (Unified for both Quiz & Flashcards)    */}
        {/* --------------------------------------------------------------------- */}
        <div className="border-t border-[#E8E2D8] pt-5 space-y-5">
          {/* Header row to allow collapsing config when quiz/cards are active */}
          {(quiz || flashcards.length > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#55504A] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#0F392B]" />
                Learning Configuration
              </span>
              <button
                type="button"
                onClick={() => setIsConfigExpanded((prev) => !prev)}
                className="text-xs font-semibold text-[#0F392B] hover:underline flex items-center gap-1"
              >
                <span>{isConfigExpanded ? 'Collapse Settings' : 'Adjust Settings'}</span>
                {isConfigExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {isConfigExpanded && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* DATE RANGE SELECTION: 2x3 Grid matching user mockup */}
              <div>
                <label className="block text-xs font-bold text-[#141412] mb-2">
                  {t('learning.selectDateRange', 'Select date range')}
                </label>
                <div
                  role="radiogroup"
                  aria-label="Date range selection"
                  className="grid grid-cols-3 gap-2.5"
                >
                  {DATE_PRESETS.map((preset) => {
                    const isSelected = datePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setDatePreset(preset.id)}
                        className={`py-2 px-3 rounded-lg text-xs sm:text-sm transition-all border text-center font-medium ${
                          isSelected
                            ? 'border-[#0F392B] text-[#0F392B] bg-[#E8F3EE]/60 font-bold ring-1 ring-[#0F392B]'
                            : 'border-[#E8E2D8] bg-white text-[#55504A] hover:border-[#D4CBBF] hover:bg-[#FAF7F2]'
                        } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Inline Custom Date Range Inputs */}
                {datePreset === 'custom' && (
                  <div className="mt-3 p-3.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <label htmlFor="custom-start-date" className="font-semibold text-[#55504A]">
                        From:
                      </label>
                      <input
                        id="custom-start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-white text-[#141412] focus:outline-none focus:border-[#0F392B] focus-visible:ring-1 focus-visible:ring-[#0F392B]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="custom-end-date" className="font-semibold text-[#55504A]">
                        To:
                      </label>
                      <input
                        id="custom-end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-white text-[#141412] focus:outline-none focus:border-[#0F392B] focus-visible:ring-1 focus-visible:ring-[#0F392B]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CURRENT TOPIC SELECTION */}
              <div ref={topicDropdownRef} className="relative">
                <label className="block text-xs font-bold text-[#141412] mb-2">
                  {t('learning.currentTopic', 'Current topic')}
                </label>

                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isTopicDropdownOpen}
                  onClick={() => setIsTopicDropdownOpen((prev) => !prev)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#E8E2D8] bg-white hover:border-[#D4CBBF] text-left text-xs sm:text-sm font-semibold text-[#0F392B] flex items-center justify-between transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                >
                  <span className="truncate">{activeTopicDisplay}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#78716C] transition-transform ${
                      isTopicDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isTopicDropdownOpen && (
                  <div
                    role="listbox"
                    className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#E8E2D8] rounded-xl shadow-lg py-1.5 text-xs animate-in fade-in duration-150 divide-y divide-[#F2EDE4]"
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedTopic === 'all'}
                        onClick={() => {
                          setSelectedTopic('all')
                          setIsTopicDropdownOpen(false)
                        }}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between ${
                          selectedTopic === 'all'
                            ? 'bg-[#E8F3EE] text-[#0F392B] font-bold'
                            : 'text-[#3A3732] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span>All Current Affairs (Cross-Disciplinary)</span>
                        {selectedTopic === 'all' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="py-1">
                      {CATEGORY_GROUPS.map((group) => {
                        const isSelected = selectedTopic === group.id
                        return (
                          <button
                            key={group.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedTopic(group.id)
                              setIsTopicDropdownOpen(false)
                            }}
                            className={`w-full px-3.5 py-2 text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#E8F3EE] text-[#0F392B] font-bold'
                                : 'text-[#3A3732] hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <span>{group.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        )
                      })}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedTopic === 'custom'}
                        onClick={() => {
                          setSelectedTopic('custom')
                          setIsTopicDropdownOpen(false)
                        }}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between ${
                          selectedTopic === 'custom'
                            ? 'bg-[#E8F3EE] text-[#0F392B] font-bold'
                            : 'text-[#3A3732] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span>Custom Topic...</span>
                        {selectedTopic === 'custom' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Topic Input if 'custom' is active */}
                {selectedTopic === 'custom' && (
                  <div className="mt-2.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="Enter custom topic (e.g. Artificial Intelligence, Climate Summit, Space Exploration)..."
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-[#141412] placeholder-[#A8A29E] focus:outline-none focus:border-[#0F392B] focus:bg-white focus-visible:ring-1 focus-visible:ring-[#0F392B]"
                    />
                  </div>
                )}
              </div>

              {/* NUMBER OF QUESTIONS / FLASHCARDS: 4-col row matching user mockup */}
              <div>
                <label className="block text-xs font-bold text-[#141412] mb-2">
                  {mode === 'quiz' ? t('learning.questionCount', 'Number of questions') : t('learning.flashcards', 'Number of flashcards')}
                </label>
                <div
                  role="radiogroup"
                  aria-label="Item count"
                  className="grid grid-cols-4 gap-2.5"
                >
                  {COUNT_OPTIONS.map((count) => {
                    const isSelected = itemCount === count
                    return (
                      <button
                        key={count}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setItemCount(count)}
                        className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all border text-center ${
                          isSelected
                            ? 'border-[#0F392B] text-[#0F392B] bg-[#E8F3EE]/60 font-bold ring-1 ring-[#0F392B]'
                            : 'border-[#E8E2D8] bg-white text-[#55504A] hover:border-[#D4CBBF] hover:bg-[#FAF7F2]'
                        } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PRIMARY GENERATE BUTTON (Explicit click required) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerate(mode)}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F392B] text-white hover:bg-[#184837] active:scale-[0.99] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D95D39]" />
                      <span>Synthesizing Verified News Articles...</span>
                    </>
                  ) : (
                    <span>
                      {mode === 'quiz' ? t('learning.generateQuiz', 'Generate Fresh Quiz') : t('learning.generateFlashcards', 'Generate Flashcards')}
                    </span>
                  )}
                </button>
                <p className="text-center text-[11px] text-[#8C827A] mt-2">
                  Strictly grounded in verified published news stories within selected range.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Generation Error Recovery Alert */}
      {generationError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FFF6EE] border border-[#F5D5C1] text-[#9A3412] text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200"
        >
          <AlertTriangle className="w-5 h-5 text-[#D95D39] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{generationError}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDatePreset('7d')
                  handleGenerate(mode)
                }}
                className="px-3 py-1 bg-[#D95D39] text-white rounded-md text-xs font-bold hover:bg-[#B84725] transition-colors"
              >
                Switch to Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic('all')
                  handleGenerate(mode)
                }}
                className="px-3 py-1 bg-white text-[#9A3412] border border-[#F5D5C1] rounded-md text-xs font-bold hover:bg-[#FAF7F2] transition-colors"
              >
                Search All Topics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE A: QUIZ MODE                                                         */}
      {/* ========================================================================= */}
      {mode === 'quiz' && (
        <>
          {/* 1. Empty / Welcome state when quiz is not yet generated */}
          {!quiz && !isGenerating && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#E8F3EE] text-[#0F392B] flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-serif text-xl font-bold text-[#141412]">
                  Ready to test your current affairs recall?
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6860] mt-1 leading-relaxed">
                  Select your desired date range and topic in the studio above, then click{' '}
                  <strong className="text-[#0F392B]">Generate Fresh Quiz</strong> to test your
                  knowledge and earn UP Points.
                </p>
              </div>
            </div>
          )}

          {/* 2. Distraction-Free Active Quiz Interface */}
          {quiz && !quizResult && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question Header & Timing */}
              <div>
                <div className="flex flex-wrap items-center justify-between text-xs text-[#78716C] mb-2 font-medium gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F392B] text-sm sm:text-base font-serif">
                      Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[11px] font-semibold text-[#55504A]">
                      {activeTopicDisplay}
                    </span>
                  </div>

                  <span className="flex items-center gap-1.5 font-mono text-xs bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#E8E2D8] text-[#141412]">
                    <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div
                  role="progressbar"
                  aria-valuenow={currentQuestionIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={quiz.questions.length}
                  className="w-full h-2 bg-[#F2EDE4] rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-[#0F392B] transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question jump indicators */}
                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined
                    const isCurrent = idx === currentQuestionIndex
                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        aria-label={`Jump to question ${idx + 1}`}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-[#0F392B] text-white ring-2 ring-[#0F392B]/30'
                            : isAnswered
                              ? 'bg-[#E8F3EE] text-[#0F392B] border border-[#C5DDD2]'
                              : 'bg-[#FAF7F2] text-[#A8A29E] border border-[#E8E2D8] hover:text-[#141412]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Current Question Body */}
              {quiz.questions[currentQuestionIndex] && (
                <div className="space-y-6 pt-2">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] leading-snug">
                      {quiz.questions[currentQuestionIndex].questionText}
                    </h3>

                    {/* Source Article Transparency Citation */}
                    {quiz.questions[currentQuestionIndex].sourceArticleTitle && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#6E6860] flex-wrap">
                        <span className="font-semibold text-[#0F392B]">
                          Reported by {quiz.questions[currentQuestionIndex].sourcePublisher || 'Verified News'}:
                        </span>
                        <a
                          href={quiz.questions[currentQuestionIndex].sourceUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-[#0F392B]/40 hover:text-[#0F392B] inline-flex items-center gap-1 font-medium truncate max-w-md"
                        >
                          <span>"{quiz.questions[currentQuestionIndex].sourceArticleTitle}"</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Expandable Hint */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => toggleHint(quiz.questions[currentQuestionIndex].id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D95D39] hover:underline"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>
                          {showHintMap[quiz.questions[currentQuestionIndex].id]
                            ? 'Hide Context Hint'
                            : 'Need a hint? View Context Clue'}
                        </span>
                      </button>

                      {showHintMap[quiz.questions[currentQuestionIndex].id] && (
                        <div className="mt-2 p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#55504A] leading-relaxed animate-in fade-in duration-150">
                          <span className="font-bold text-[#0F392B]">Editorial Context: </span>
                          Consider the core regulatory objectives and official public statements
                          published by{' '}
                          {quiz.questions[currentQuestionIndex].sourcePublisher || 'journalistic sources'}.
                          Focus on verified administrative provisions over speculative outcomes.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Multiple Choice Options (A, B, C, D) */}
                  <div
                    role="radiogroup"
                    aria-label="Answer options"
                    className="space-y-3"
                  >
                    {quiz.questions[currentQuestionIndex].options.map((optionText, optIdx) => {
                      const qId = quiz.questions[currentQuestionIndex].id
                      const isSelected = selectedAnswers[qId] === optIdx
                      const optionLetters = ['A', 'B', 'C', 'D']

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group min-h-[52px] ${
                            isSelected
                              ? 'border-[#0F392B] bg-[#E8F3EE]/60 shadow-xs ring-1 ring-[#0F392B]'
                              : 'border-[#E8E2D8] bg-white hover:border-[#0F392B]/40 hover:bg-[#FAF7F2]'
                          } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#0F392B] text-white'
                                : 'bg-[#FAF7F2] text-[#6E6860] border border-[#E8E2D8] group-hover:border-[#0F392B]'
                            }`}
                          >
                            {optionLetters[optIdx]}
                          </span>
                          <span
                            className={`text-xs sm:text-sm leading-relaxed mt-0.5 ${
                              isSelected ? 'font-semibold text-[#0F392B]' : 'text-[#3A3732]'
                            }`}
                          >
                            {optionText}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Navigation & Submit Bar */}
                  <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                        currentQuestionIndex === 0
                          ? 'border-[#E8E2D8] text-[#A8A29E] bg-[#FAF7F2] cursor-not-allowed'
                          : 'border-[#E8E2D8] text-[#141412] hover:bg-[#FAF7F2]'
                      } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                          className="px-5 py-2 rounded-lg bg-[#0F392B] text-white hover:bg-[#184837] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                        >
                          <span>Next</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSubmitConfirmationOpen(true)}
                          className="px-5 py-2 rounded-lg bg-[#D95D39] text-white hover:bg-[#B84725] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#D95D39] focus-visible:outline-none"
                        >
                          <span>Review &amp; Submit</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Quiz Review & Results Screen */}
          {quizResult && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-7 animate-in fade-in duration-300">
              {/* Header Score Presentation */}
              <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[#78716C]">
                    Editorial Current Affairs Evaluation
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-[#141412] mt-1">
                    Score: {quizResult.correctAnswers} of {quizResult.totalQuestions} correct ({quizResult.score}%)
                  </h2>
                  <p className="text-xs text-[#6E6860] mt-1">
                    Completed in {formatTimer(elapsedSeconds || 45)}. Grounded in verified dispatches.
                  </p>
                </div>

                {/* Celebratory Points Card */}
                <div className="p-4 rounded-xl bg-[#0F392B] text-white shadow-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#D95D39]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#FAF7F2]">
                      ✦ You earned +{quizResult.pointsAwarded} UP Points
                    </div>
                    <div className="text-[11px] text-[#A3C7B9] mt-0.5">
                      Available Balance: {quizResult.availableBalance} UP Points
                    </div>
                  </div>
                </div>
              </div>

              {/* Editorial Learning Summary */}
              {quizResult.learningSummary && (
                <div className="p-5 rounded-xl bg-[#F4F1EA] border border-[#E8E2D8] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F392B] uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Editorial Learning Synthesis</span>
                  </div>
                  <p className="font-serif text-sm text-[#141412] leading-relaxed">
                    {quizResult.learningSummary}
                  </p>
                </div>
              )}

              {/* Question-by-Question Detailed Review */}
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#141412] pb-2 border-b border-[#E8E2D8]">
                  Detailed Question Analysis &amp; Source Verification
                </h3>

                {quizResult.review.map((item, idx) => {
                  const optionLetters = ['A', 'B', 'C', 'D']

                  return (
                    <div
                      key={item.questionId || idx}
                      className={`p-5 rounded-xl border transition-all ${
                        item.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-xs text-[#78716C]">
                          Question {idx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Incorrect
                            </>
                          )}
                        </span>
                      </div>

                      <h4 className="font-serif text-base sm:text-lg font-bold text-[#141412] mt-2 leading-snug">
                        {item.questionText}
                      </h4>

                      {/* Options review */}
                      <div className="mt-3 space-y-1.5">
                        {item.options.map((opt, optIdx) => {
                          const isUserChoice = item.userChoice === optIdx
                          const isCorrectChoice = item.correctAnswer === optIdx

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg text-xs flex items-start gap-2.5 ${
                                isCorrectChoice
                                  ? 'bg-emerald-100 text-emerald-950 font-semibold'
                                  : isUserChoice && !item.isCorrect
                                    ? 'bg-rose-100 text-rose-950 line-through'
                                    : 'text-[#6E6860]'
                              }`}
                            >
                              <span className="font-bold shrink-0">{optionLetters[optIdx]}.</span>
                              <span>{opt}</span>
                              {isCorrectChoice && (
                                <span className="ml-auto text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5 rounded shrink-0">
                                  Correct Fact
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Editorial Explanation */}
                      <div className="mt-3 pt-3 border-t border-black/5 text-xs text-[#55504A] leading-relaxed">
                        <span className="font-semibold text-[#141412]">
                          Editorial Fact Breakdown:{' '}
                        </span>
                        {item.explanation}
                      </div>

                      {/* Source Citation Link */}
                      {item.sourceArticleTitle && (
                        <div className="mt-2 text-xs">
                          <a
                            href={item.sourceUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-[#0F392B]/40 hover:text-[#0F392B] inline-flex items-center gap-1 font-medium text-[#0F392B]"
                          >
                            <span>
                              Source: {item.sourceArticleTitle} ({item.sourcePublisher || 'Verified'})
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleGenerate('quiz')}
                  className="px-5 py-2.5 rounded-xl bg-[#0F392B] text-white hover:bg-[#184837] text-xs font-bold transition-all shadow-xs flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Generate Another Quiz</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('flashcards')
                      if (flashcards.length === 0) {
                        handleGenerate('flashcards')
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] hover:border-[#0F392B] text-xs font-bold text-[#141412] transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                  >
                    <Layers className="w-4 h-4 text-[#D95D39]" />
                    <span>Study Flashcards</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenRewards}
                    className="px-4 py-2.5 rounded-xl bg-[#D95D39] text-white hover:bg-[#B84725] text-xs font-bold transition-all shadow-xs flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#D95D39] focus-visible:outline-none"
                  >
                    <Gift className="w-4 h-4" />
                    <span>View Rewards &amp; Coupons</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE B: 3D INTERACTIVE FLASHCARDS MODE                                     */}
      {/* ========================================================================= */}
      {mode === 'flashcards' && (
        <>
          {/* 1. Empty / Welcome state when flashcards not yet generated */}
          {flashcards.length === 0 && !isGenerating && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#E8F3EE] text-[#0F392B] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-serif text-xl font-bold text-[#141412]">
                  Interactive 3D Study Flashcards
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6860] mt-1 leading-relaxed">
                  Select your date range and topic above, then click{' '}
                  <strong className="text-[#0F392B]">Generate Flashcards</strong> to create a
                  dedicated editorial study deck.
                </p>
              </div>
            </div>
          )}

          {/* 2. All Mastered Completion Screen */}
          {isAllFlashcardsMastered && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-xs animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#E8F3EE] text-[#0F392B] flex items-center justify-center mx-auto shadow-xs">
                <Trophy className="w-8 h-8 text-[#D95D39]" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#141412]">
                  🎉 All {flashcards.length} Cards Mastered!
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6860] leading-relaxed">
                  You have successfully reviewed and mastered every factual headline in this deck.
                  Ready to test your comprehension under quiz conditions?
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFlashcardDeck}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-bold text-[#141412] transition-colors"
                >
                  ↺ Review Deck Again
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate('flashcards')}
                  className="px-5 py-2.5 rounded-xl bg-[#0F392B] text-white hover:bg-[#184837] text-xs font-bold transition-all shadow-xs"
                >
                  ✨ Generate Fresh Cards
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('quiz')
                    if (!quiz) handleGenerate('quiz')
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#D95D39] text-white hover:bg-[#B84725] text-xs font-bold transition-all shadow-xs"
                >
                  📝 Test Knowledge in Quiz Mode
                </button>
              </div>
            </div>
          )}

          {/* 3. Active 3D Flashcards Interface */}
          {flashcards.length > 0 && !isAllFlashcardsMastered && (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Flashcard Header & Progress */}
              <div className="flex flex-wrap items-center justify-between text-xs text-[#78716C] gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F392B] text-sm sm:text-base font-serif">
                    Card {activeCardIndex + 1} of {flashcards.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[11px] font-semibold text-[#55504A]">
                    {activeTopicDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#78716C] hidden sm:inline">
                    Click card or press <kbd className="px-1.5 py-0.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded font-mono text-[10px]">Space</kbd> to flip
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#E8F3EE] text-[#0F392B] font-bold text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#0F392B]" />
                    <span>{masteredCardIds.length} Mastered</span>
                  </span>
                  <span className="text-xs text-[#78716C]">
                    {flashcards.length - masteredCardIds.length} Remaining
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#F2EDE4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F392B] transition-all duration-300 rounded-full"
                  style={{
                    width: `${((activeCardIndex + 1) / flashcards.length) * 100}%`,
                  }}
                />
              </div>

              {/* 3D Flip Card Container */}
              <div className="perspective-1000 w-full min-h-[350px]">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Flashcard: ${flashcards[activeCardIndex].front}. Press Enter or Space to flip`}
                  onClick={handleFlipCard}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleFlipCard()
                    }
                  }}
                  className={`relative w-full min-h-[350px] transition-transform duration-500 transform-style-preserve-3d cursor-pointer rounded-2xl border border-[#E8E2D8] shadow-sm select-none focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none ${
                    isCardFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* CARD FRONT: Core headline / question */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-[#FAF7F2] rounded-2xl p-7 sm:p-9 flex flex-col justify-between border border-[#E8E2D8]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D95D39] bg-[#FFF2ED] px-2.5 py-1 rounded">
                        {flashcards[activeCardIndex].category || 'Current Affairs'}
                      </span>
                      <span className="text-xs text-[#78716C] flex items-center gap-1 font-medium">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip to reveal facts</span>
                      </span>
                    </div>

                    <div className="my-auto text-center px-4 sm:px-8">
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#141412] leading-snug">
                        {flashcards[activeCardIndex].front}
                      </h3>
                      <p className="text-xs text-[#78716C] mt-3">
                        Reported by {flashcards[activeCardIndex].sourcePublisher}
                      </p>
                    </div>

                    <div className="text-center text-[11px] text-[#A8A29E]">
                      Click card or press Spacebar to flip
                    </div>
                  </div>

                  {/* CARD BACK: Editorial breakdown + source link */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white rounded-2xl p-7 sm:p-9 flex flex-col justify-between border border-[#0F392B]/20">
                    <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-3">
                      <span className="text-xs font-bold text-[#0F392B] uppercase tracking-wider">
                        Editorial Fact Breakdown
                      </span>
                      <span className="text-xs text-[#78716C]">
                        {flashcards[activeCardIndex].sourcePublisher}
                      </span>
                    </div>

                    <div className="my-auto space-y-3 px-2">
                      <div className="text-xs sm:text-sm text-[#141412] leading-relaxed whitespace-pre-line font-normal">
                        {flashcards[activeCardIndex].back}
                      </div>

                      <div className="pt-2">
                        <a
                          href={flashcards[activeCardIndex].sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F392B] hover:underline"
                        >
                          <span>Read original verified dispatch</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="text-center text-[11px] text-[#78716C] pt-2 border-t border-[#F2EDE4]">
                      Corroborated by primary publication sources
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation & Study Controls */}
              <div className="pt-4 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    disabled={activeCardIndex === 0}
                    className={`p-2.5 rounded-lg border text-xs font-semibold ${
                      activeCardIndex === 0
                        ? 'border-[#E8E2D8] text-[#A8A29E] cursor-not-allowed bg-[#FAF7F2]'
                        : 'border-[#E8E2D8] text-[#141412] hover:bg-[#FAF7F2]'
                    } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                    title="Previous card (Left Arrow)"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleFlipCard}
                    className="px-4 py-2 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#E8E2D8] text-xs font-bold text-[#141412] transition-colors focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                  >
                    Flip Card
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCard}
                    disabled={activeCardIndex === flashcards.length - 1}
                    className={`p-2.5 rounded-lg border text-xs font-semibold ${
                      activeCardIndex === flashcards.length - 1
                        ? 'border-[#E8E2D8] text-[#A8A29E] cursor-not-allowed bg-[#FAF7F2]'
                        : 'border-[#E8E2D8] text-[#141412] hover:bg-[#FAF7F2]'
                    } focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none`}
                    title="Next card (Right Arrow)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReviewAgain}
                    className="px-3.5 py-2 rounded-lg border border-[#E8E2D8] text-xs font-semibold text-[#6E6860] hover:text-[#141412] hover:bg-[#FAF7F2] transition-colors focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                  >
                    Review Again
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkMastered}
                    className="px-4 py-2 rounded-lg bg-[#0F392B] text-white hover:bg-[#184837] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                  >
                    <Check className="w-4 h-4" />
                    <span>Got It</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('quiz')
                      if (!quiz) handleGenerate('quiz')
                    }}
                    className="ml-2 px-3.5 py-2 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] hover:border-[#0F392B] text-xs font-bold text-[#0F392B] transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#0F392B] focus-visible:outline-none"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Take Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL BEFORE QUIZ SUBMISSION                                 */}
      {/* ========================================================================= */}
      {submitConfirmationOpen && quiz && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl border border-[#E8E2D8] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 id="submit-modal-title" className="font-serif text-xl font-bold text-[#141412]">
              Ready to Submit Your Quiz?
            </h3>
            <p className="text-xs sm:text-sm text-[#6E6860] leading-relaxed">
              You have answered {Object.keys(selectedAnswers).length} of {quiz.questions.length}{' '}
              questions in {formatTimer(elapsedSeconds)}. Your answers will be verified against
              verified news sources to award UP Points.
            </p>
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubmitConfirmationOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#55504A] hover:bg-[#FAF7F2] border border-[#E8E2D8]"
              >
                Go Back &amp; Review
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F392B] text-white hover:bg-[#184837] shadow-xs disabled:opacity-75"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
