export interface Subcategory {
  id: string
  name: string
  slug: string
}

export interface CategoryGroup {
  id: string
  name: string
  slug: string
  subcategories: Subcategory[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  initials: string
  avatarUrl?: string
  role?: 'user' | 'reviewer' | 'admin'
}

export interface HeaderSearchSuggestion {
  id: string
  label: string
  type: 'topic' | 'city' | 'category'
}
