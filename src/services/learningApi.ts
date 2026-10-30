import { getAuthToken, getGuestSessionId } from './api'
import { NEWS_ARTICLES } from '../data/newsData'
import { matchDatePreset } from '../utils/dateUtils'

export interface ClientQuizQuestion {
  id: string
  questionText: string
  options: string[]
  sourceArticleId?: string
  sourceArticleTitle?: string
  sourceUrl?: string
  sourcePublisher?: string
}

export interface ClientQuiz {
  id: string
  title: string
  quizType: 'date_range' | 'daily'
  startDate?: string | null
  endDate?: string | null
  learningSummary?: string | null
  questions: ClientQuizQuestion[]
}

export interface ClientQuizReviewItem {
  questionId: string
  questionText: string
  options: string[]
  userChoice: number
  correctAnswer: number
  isCorrect: boolean
  explanation: string
  sourceArticleTitle?: string | null
  sourceUrl?: string | null
  sourcePublisher?: string | null
}

export interface ClientQuizSubmissionResult {
  success: boolean
  quizAttemptId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  pointsAwarded: number
  isPerfectScore: boolean
  availableBalance: number
  totalEarned: number
  isDuplicateSubmission: boolean
  learningSummary: string
  review: ClientQuizReviewItem[]
}

export interface ClientFlashcard {
  id: string
  front: string
  back: string
  category: string
  sourceArticleId?: string
  sourceArticleTitle: string
  sourcePublisher: string
  sourceUrl: string
  publishedAt: string
}

export interface ClientCoupon {
  id: string
  codePrefix: string
  title: string
  brand: string
  description: string
  discountText: string
  pointsCost: number
  terms: string
  validityDays: number
  isActive: boolean
  inventory: number
}

export interface ClientCouponRedemption {
  id: string
  userId?: string | null
  guestSessionId?: string | null
  couponId: string
  couponCode: string
  pointsSpent: number
  status: 'available' | 'used' | 'expired'
  redeemedAt: string
  expiresAt: string
  usedAt?: string | null
  coupon?: ClientCoupon
}

export interface ClientBalanceInfo {
  availableBalance: number
  totalEarned: number
  totalSpent: number
  transactions: Array<{
    id: string
    points: number
    type: 'QUIZ_COMPLETION' | 'COUPON_REDEMPTION'
    description: string
    createdAt: string
  }>
}

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-session': getGuestSessionId(),
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// Fallback seed coupons catalog
const FALLBACK_COUPONS: ClientCoupon[] = [
  {
    id: 'coupon-notebook-free',
    codePrefix: 'NOTEBOOK',
    title: 'Free Digital Revision Notebook',
    brand: 'UpWise Editorial Press',
    description: 'Unlock an interactive digital current affairs revision notebook with curated highlights, timelines, and analytical notes.',
    discountText: 'FREE ACCESS',
    pointsCost: 50,
    terms: 'Instant digital access. Valid across web and mobile viewports for 60 days.',
    validityDays: 60,
    isActive: true,
    inventory: 9999,
  },
  {
    id: 'coupon-books-50',
    codePrefix: 'BOOKS50',
    title: '₹50 Off Student Books',
    brand: 'KitabKhana & Academic Books',
    description: 'Flat ₹50 discount on any academic textbook, current affairs compendium, or UPSC/civil services prep material.',
    discountText: '₹50 OFF',
    pointsCost: 100,
    terms: 'Valid on purchases above ₹299. Single-use per student order. Valid for 60 days from redemption.',
    validityDays: 60,
    isActive: true,
    inventory: 500,
  },
  {
    id: 'coupon-journal-15',
    codePrefix: 'JOURNAL15',
    title: '15% Off Academic Journal Archive',
    brand: 'National Editorial Review',
    description: '15% off subscription to quarterly peer-reviewed policy journals, legal digests, and historical archives.',
    discountText: '15% OFF',
    pointsCost: 150,
    terms: 'Applicable on monthly, quarterly, and annual academic research tiers.',
    validityDays: 60,
    isActive: true,
    inventory: 300,
  },
  {
    id: 'coupon-campus-100',
    codePrefix: 'CAMPUS100',
    title: '₹100 Off Campus Bookstore',
    brand: 'Campus Book Haven',
    description: 'Flat ₹100 instant deduction on university textbooks, stationery sets, and research monographs.',
    discountText: '₹100 OFF',
    pointsCost: 200,
    terms: 'Minimum cart value ₹500 at participating college bookstores and partner university outlets.',
    validityDays: 60,
    isActive: true,
    inventory: 250,
  },
  {
    id: 'coupon-mock-20',
    codePrefix: 'MOCK20',
    title: '20% Off Mock Test Series',
    brand: 'Socrates Editorial Learning',
    description: '20% waiver on comprehensive current affairs analytical test series and weekly question simulations.',
    discountText: '20% OFF',
    pointsCost: 250,
    terms: 'Valid for all 2026 examination batches and analytical revision packs.',
    validityDays: 60,
    isActive: true,
    inventory: 150,
  },
]

// -------------------------------------------------------------
// API Calls with Graceful Client-Side Offline Resilience
// -------------------------------------------------------------

export async function fetchBalanceApi(): Promise<ClientBalanceInfo> {
  try {
    const res = await fetch('/api/rewards/balance', {
      headers: getRequestHeaders(),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        return json.data
      }
    }
  } catch {
    // Offline fallback
  }

  // Local storage fallback for points ledger
  try {
    const key = `upwise_learning_ledger_${getGuestSessionId()}`
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch { }

  return {
    availableBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
  }
}

export async function generateQuizByDateApi(params: {
  preset?: string
  startDate?: string
  endDate?: string
  topic?: string
  count?: number
}): Promise<{ success: boolean; quiz?: ClientQuiz; error?: string }> {
  try {
    const res = await fetch('/api/quizzes/generate-by-date', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    })

    const json = await res.json()
    if (res.ok && json.success) {
      return { success: true, quiz: json.data }
    } else {
      return { success: false, error: json.error || 'No articles found for selected date range.' }
    }
  } catch {
    // Client-side fallback using NEWS_ARTICLES
  }

  let filtered = NEWS_ARTICLES.filter((a) => {
    return matchDatePreset(a.publishedDate || a.publishedAt, (params.preset as any) || 'all', params.startDate, params.endDate)
  })

  if (params.topic && params.topic !== 'all' && params.topic.trim().length > 0) {
    const rawTopic = params.topic.trim().toLowerCase()
    const topicMatches = filtered.filter((a) => {
      const cat = (a.categoryName || a.categoryId || '').toLowerCase()
      const title = (a.title || '').toLowerCase()
      const summary = (a.summary || '').toLowerCase()
      return cat.includes(rawTopic) || rawTopic.includes(cat) || title.includes(rawTopic) || summary.includes(rawTopic)
    })
    if (topicMatches.length > 0) {
      const remaining = filtered.filter((a) => !topicMatches.includes(a))
      filtered = [...topicMatches, ...remaining]
    }
  }

  if (filtered.length === 0) {
    return {
      success: false,
      error: 'No news articles found in the selected date range. Please select a broader range like Last 7 Days.',
    }
  }

  const targetCount = params.count && [5, 10, 15, 20].includes(params.count) ? params.count : 5
  let selected = filtered.slice(0, targetCount)
  if (selected.length < targetCount && filtered.length > 0) {
    let idx = 0
    while (selected.length < targetCount) {
      selected.push(filtered[idx % filtered.length])
      idx++
    }
  }

  const topicLabel = params.topic && params.topic !== 'all' ? ` · ${params.topic}` : ''
  const quiz: ClientQuiz = {
    id: `quiz_fallback_${Date.now()}`,
    title: `Editorial Current Affairs Briefing (${params.preset || 'Selected Dates'}${topicLabel})`,
    quizType: params.preset === 'today' || params.preset === 'yesterday' ? 'daily' : 'date_range',
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    learningSummary: `Review of major events across ${selected.length} reports covering policy, economy, and national affairs.`,
    questions: selected.map((art, idx) => ({
      id: `q_${art.id}_${idx}`,
      questionText: `According to ${art.source.name} regarding "${art.title.slice(0, 60)}...", which statement accurately represents the primary factual development?`,
      options: [
        art.summary,
        'Officials announced the immediate repeal of the proposed initiative following cross-party talks.',
        'The regulatory board deferred all implementation milestones until the upcoming fiscal cycle.',
        'Industry representatives filed a petition seeking total exemption from the updated directives.',
      ],
      sourceArticleId: art.id,
      sourceArticleTitle: art.title,
      sourceUrl: art.originalUrl || '#',
      sourcePublisher: art.source.name,
    })),
  }

  return { success: true, quiz }
}

export async function generateFlashcardsByDateApi(params: {
  preset?: string
  startDate?: string
  endDate?: string
  topic?: string
  count?: number
}): Promise<{ success: boolean; flashcards?: ClientFlashcard[]; dateLabel?: string; error?: string }> {
  try {
    const res = await fetch('/api/quizzes/flashcards/generate-by-date', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    })

    const json = await res.json()
    if (res.ok && json.success) {
      return {
        success: true,
        flashcards: json.data.flashcards,
        dateLabel: json.data.dateLabel,
      }
    } else {
      return { success: false, error: json.error || 'No articles found for selected date range.' }
    }
  } catch {
    // Client-side fallback
  }

  let filtered = NEWS_ARTICLES.filter((a) => {
    return matchDatePreset(a.publishedDate || a.publishedAt, (params.preset as any) || 'all', params.startDate, params.endDate)
  })

  if (params.topic && params.topic !== 'all' && params.topic.trim().length > 0) {
    const rawTopic = params.topic.trim().toLowerCase()
    const topicMatches = filtered.filter((a) => {
      const cat = (a.categoryName || a.categoryId || '').toLowerCase()
      const title = (a.title || '').toLowerCase()
      const summary = (a.summary || '').toLowerCase()
      return cat.includes(rawTopic) || rawTopic.includes(cat) || title.includes(rawTopic) || summary.includes(rawTopic)
    })
    if (topicMatches.length > 0) {
      const remaining = filtered.filter((a) => !topicMatches.includes(a))
      filtered = [...topicMatches, ...remaining]
    }
  }

  if (filtered.length === 0) {
    return {
      success: false,
      error: 'No news articles found in the selected date range. Please select a broader range like Last 7 Days.',
    }
  }

  const targetCount = params.count && [5, 10, 15, 20].includes(params.count) ? params.count : 8
  let selected = filtered.slice(0, targetCount)
  if (selected.length < targetCount && filtered.length > 0) {
    let idx = 0
    while (selected.length < targetCount) {
      selected.push(filtered[idx % filtered.length])
      idx++
    }
  }

  const cards: ClientFlashcard[] = selected.map((art, idx) => ({
    id: `fc_${art.id}_${idx}`,
    front: art.title,
    back: `${art.summary}\n\n• Key Takeaway: ${Array.isArray(art.keyTakeaways) ? art.keyTakeaways[0] : 'Reported with verified facts.'}`,
    category: art.categoryName,
    sourceArticleId: art.id,
    sourceArticleTitle: art.title,
    sourcePublisher: art.source.name,
    sourceUrl: art.originalUrl || '#',
    publishedAt: art.publishedDate || 'Recent',
  }))

  return {
    success: true,
    flashcards: cards,
    dateLabel: params.preset || 'Selected Dates',
  }
}

export async function submitQuizApi(
  quizId: string,
  payload: {
    quizAttemptId?: string
    answers: Record<string, number>
    timeTaken?: number
  },
  fallbackQuestions?: ClientQuizQuestion[]
): Promise<ClientQuizSubmissionResult> {
  try {
    const res = await fetch(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (res.ok && json.success) {
      return json.data
    }
  } catch {
    // Fallback calculation
  }

  // Graceful client fallback scoring
  const questions = fallbackQuestions || []
  const total = questions.length || Object.keys(payload.answers).length || 5
  let correct = 0

  const review: ClientQuizReviewItem[] = questions.map((q) => {
    const userChoice = payload.answers[q.id] ?? -1
    // In fallback mode, index 0 is the correct answer
    const isCorrect = userChoice === 0
    if (isCorrect) correct++

    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      userChoice,
      correctAnswer: 0,
      isCorrect,
      explanation: `Verified by ${q.sourcePublisher || 'journalistic reporting'} in "${q.sourceArticleTitle || 'Source Article'}": ${q.options[0]}`,
      sourceArticleTitle: q.sourceArticleTitle,
      sourceUrl: q.sourceUrl,
      sourcePublisher: q.sourcePublisher,
    }
  })

  const isPerfect = total > 0 && correct === total
  const pointsAwarded = 5 + correct * 2 + (isPerfect ? 5 : 0)

  // Update local balance
  const current = await fetchBalanceApi()
  const newBalance = current.availableBalance + pointsAwarded
  const newEarned = current.totalEarned + pointsAwarded
  const newTx = [
    {
      id: `tx_${Date.now()}`,
      points: pointsAwarded,
      type: 'QUIZ_COMPLETION' as const,
      description: `Completed Quiz: Current Affairs Briefing (${correct}/${total} correct)`,
      createdAt: new Date().toISOString(),
    },
    ...current.transactions,
  ]

  const updatedLedger: ClientBalanceInfo = {
    availableBalance: newBalance,
    totalEarned: newEarned,
    totalSpent: current.totalSpent,
    transactions: newTx,
  }

  try {
    localStorage.setItem(`upwise_learning_ledger_${getGuestSessionId()}`, JSON.stringify(updatedLedger))
  } catch { }

  return {
    success: true,
    quizAttemptId: payload.quizAttemptId || `att_${Date.now()}`,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    totalQuestions: total,
    correctAnswers: correct,
    pointsAwarded,
    isPerfectScore: isPerfect,
    availableBalance: newBalance,
    totalEarned: newEarned,
    isDuplicateSubmission: false,
    learningSummary: 'Detailed synthesis of factual current affairs developments from the verified news stories.',
    review,
  }
}

export async function fetchCouponsApi(): Promise<ClientCoupon[]> {
  try {
    const res = await fetch('/api/rewards/coupons', {
      headers: getRequestHeaders(),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
    }
  } catch { }

  return FALLBACK_COUPONS
}

export async function redeemCouponApi(couponId: string): Promise<{
  success: boolean
  redemption?: ClientCouponRedemption
  newBalance?: number
  error?: string
}> {
  try {
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({ couponId }),
    })

    const json = await res.json()
    if (res.ok && json.success) {
      return {
        success: true,
        redemption: json.data.redemption,
        newBalance: json.data.newBalance,
      }
    } else {
      return {
        success: false,
        error: json.error || 'Failed to redeem coupon.',
      }
    }
  } catch { }

  // Fallback redemption
  const coupons = await fetchCouponsApi()
  const coupon = coupons.find((c) => c.id === couponId)
  if (!coupon) return { success: false, error: 'Coupon not found.' }

  const balance = await fetchBalanceApi()
  if (balance.availableBalance < coupon.pointsCost) {
    return {
      success: false,
      error: `Insufficient UP Points. You have ${balance.availableBalance} UP Points, but ${coupon.pointsCost} UP Points are required.`,
    }
  }

  const hex = Math.random().toString(16).substring(2, 6).toUpperCase()
  const num = Math.floor(1000 + Math.random() * 9000)
  const code = `UPW-${coupon.codePrefix}-${hex}-${num}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + coupon.validityDays * 24 * 60 * 60 * 1000)

  const redemption: ClientCouponRedemption = {
    id: `red_${Date.now()}`,
    couponId: coupon.id,
    couponCode: code,
    pointsSpent: coupon.pointsCost,
    status: 'available',
    redeemedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
    coupon,
  }

  const newBal = balance.availableBalance - coupon.pointsCost
  const newSpent = balance.totalSpent + coupon.pointsCost
  const updatedLedger: ClientBalanceInfo = {
    availableBalance: newBal,
    totalEarned: balance.totalEarned,
    totalSpent: newSpent,
    transactions: [
      {
        id: `tx_${Date.now()}`,
        points: -coupon.pointsCost,
        type: 'COUPON_REDEMPTION',
        description: `Redeemed Coupon: ${coupon.title}`,
        createdAt: now.toISOString(),
      },
      ...balance.transactions,
    ],
  }

  try {
    const key = `upwise_learning_ledger_${getGuestSessionId()}`
    localStorage.setItem(key, JSON.stringify(updatedLedger))

    const myCouponsKey = `upwise_my_coupons_${getGuestSessionId()}`
    const existing = JSON.parse(localStorage.getItem(myCouponsKey) || '[]')
    localStorage.setItem(myCouponsKey, JSON.stringify([redemption, ...existing]))
  } catch { }

  return {
    success: true,
    redemption,
    newBalance: newBal,
  }
}

export async function fetchMyCouponsApi(): Promise<ClientCouponRedemption[]> {
  try {
    const res = await fetch('/api/rewards/my-coupons', {
      headers: getRequestHeaders(),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        return json.data
      }
    }
  } catch { }

  try {
    const myCouponsKey = `upwise_my_coupons_${getGuestSessionId()}`
    const stored = localStorage.getItem(myCouponsKey)
    if (stored) return JSON.parse(stored)
  } catch { }

  return []
}

export async function markCouponUsedApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/rewards/my-coupons/${id}/use`, {
      method: 'POST',
      headers: getRequestHeaders(),
    })
    if (res.ok) return true
  } catch { }

  try {
    const myCouponsKey = `upwise_my_coupons_${getGuestSessionId()}`
    const stored = JSON.parse(localStorage.getItem(myCouponsKey) || '[]')
    const updated = stored.map((c: any) =>
      c.id === id ? { ...c, status: 'used', usedAt: new Date().toISOString() } : c
    )
    localStorage.setItem(myCouponsKey, JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

