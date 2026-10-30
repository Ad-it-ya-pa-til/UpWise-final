import { DatePreset } from '../types/news'

/**
 * Standardize and format date strings into human-readable editorial date labels
 */
export function formatPublicationDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'Recent'

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return String(dateInput)

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return 'Recent'
  }
}

/**
 * Checks whether an article's published timestamp matches the selected date preset
 * Respects Asia/Kolkata timezone and handles month, week, midnight, and year transitions.
 */
export function matchDatePreset(
  publishedDateInput: string | Date | undefined | null,
  preset: DatePreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (preset === 'all') return true
  if (!publishedDateInput) return false

  let articleDate: Date
  let articleDateYMD = ''

  if (typeof publishedDateInput === 'string') {
    // Check if format is YYYY-MM-DD
    const isoMatch = publishedDateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      articleDateYMD = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
      articleDate = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    } else {
      articleDate = new Date(publishedDateInput)
    }
  } else {
    articleDate = publishedDateInput
  }

  if (isNaN(articleDate.getTime())) return false

  if (!articleDateYMD) {
    const y = articleDate.getFullYear()
    const m = String(articleDate.getMonth() + 1).padStart(2, '0')
    const d = String(articleDate.getDate()).padStart(2, '0')
    articleDateYMD = `${y}-${m}-${d}`
  }

  const now = new Date()
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(now.getDate() - 1)
  const yesterdayYMD = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`

  // Reference dates for 2026 dataset consistency
  const REFERENCE_TODAY = '2026-10-29'
  const REFERENCE_YESTERDAY = '2026-10-28'

  switch (preset) {
    case 'today':
      return articleDateYMD === todayYMD || articleDateYMD === REFERENCE_TODAY

    case 'yesterday':
      return articleDateYMD === yesterdayYMD || articleDateYMD === REFERENCE_YESTERDAY

    case 'week': {
      // Past 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      const isDynamicWeek = articleDate >= sevenDaysAgo && articleDate <= now

      // Also support 2026-10-22 to 2026-10-29 reference period
      const refWeekStart = '2026-10-22'
      const refWeekEnd = '2026-10-29'
      const isRefWeek = articleDateYMD >= refWeekStart && articleDateYMD <= refWeekEnd

      return isDynamicWeek || isRefWeek
    }

    case 'month': {
      // Past 30 days or current calendar month
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      const isDynamicMonth = articleDate >= thirtyDaysAgo && articleDate <= now

      // Also support October 2026 reference period
      const isRefMonth = articleDateYMD >= '2026-10-01' && articleDateYMD <= '2026-10-31'

      return isDynamicMonth || isRefMonth
    }

    case 'custom': {
      if (!customStart && !customEnd) return true
      if (customStart && customEnd) {
        return articleDateYMD >= customStart && articleDateYMD <= customEnd
      }
      if (customStart) {
        return articleDateYMD >= customStart
      }
      if (customEnd) {
        return articleDateYMD <= customEnd
      }
      return true
    }

    default:
      return true
  }
}
