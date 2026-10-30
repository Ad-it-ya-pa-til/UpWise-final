export interface ArticleLocation {
  city?: string
  state?: string
  country?: string
  countryCode?: string
  coordinates?: [number, number] // [lat, lng]
  locationId?: string
}

export interface ArticleSource {
  id: string
  name: string
  category: string
  url?: string
}

export interface ArticleCluster {
  id: string
  title: string
  category: string
  primaryLocation?: string
  articleCount: number
  primaryArticleId?: string
  timeline?: Array<{
    date: string
    title: string
    source: string
  }>
  coverageTimeline?: Array<{
    date: string
    title: string
    source: string
    url?: string
  }>
  perspectives?: Array<{
    source: string
    stance: string
    summary: string
  }>
}

export interface Article {
  id: string
  title: string
  summary: string
  fullContent?: string
  publishedAt: string
  publishedDate?: string
  source: ArticleSource
  categoryName: string
  categoryId?: string
  subcategoryId?: string
  url?: string
  originalUrl?: string
  imageUrl?: string
  readTimeMinutes?: number
  isSaved?: boolean
  evidenceStatus?: 'verified' | 'unverified' | 'disputed'
  isFactCheck?: boolean
  keyTakeaways?: string[]
  language?: string
  location?: ArticleLocation
  cluster?: ArticleCluster
}

export type LayoutMode = 'stack' | 'grid'
export type LanguageMode =
  | 'en'
  | 'hi'
  | 'pa'
  | 'bn'
  | 'mr'
  | 'ta'
  | 'te'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'as'
  | 'ur'
export type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export interface NewsFilters {
  categoryId: string | null
  subcategoryId: string | null
  searchQuery: string
  language: LanguageMode
  datePreset: DatePreset
  customStartDate: string
  customEndDate: string
  selectedPublishers: string[]
  layoutMode: LayoutMode
  onlySaved: boolean
}
