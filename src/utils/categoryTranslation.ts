import { useTranslation } from 'react-i18next'
import { Article } from '../types/news'

export const CATEGORY_TRANSLATION_MAP: Record<string, string> = {
  'india-politics': 'sections.indiaPolitics',
  'India & Politics': 'sections.indiaPolitics',
  'tech-science': 'sections.techScience',
  'Technology & Science': 'sections.techScience',
  'business-economy': 'sections.businessEconomy',
  'Business & Economy': 'sections.businessEconomy',
  'Business & Markets': 'sections.businessEconomy',
  'sports': 'sections.sports',
  'Sports': 'sections.sports',
  'Sports & Athletics': 'sections.sports',
  'world-lifestyle': 'sections.worldLifestyle',
  'World & Lifestyle': 'sections.worldLifestyle',
  'all': 'sections.all',
  'frontPage': 'sections.frontPage',
  'Front Page': 'sections.frontPage',
  'technology': 'sections.technology',
  'Technology': 'sections.technology',
  'business': 'sections.business',
  'Business': 'sections.business',
  'science': 'sections.science',
  'Science': 'sections.science',
  'world': 'sections.world',
  'World': 'sections.world',
  'careers': 'sections.careers',
  'Careers': 'sections.careers',
  'ai': 'sections.aiStartups',
  'ai-startups': 'sections.aiStartups',
  'AI & Startups': 'sections.aiStartups',
}

/**
 * Hook to translate any category or desk identifier/name into current active language
 */
export function useCategoryTranslation() {
  const { t } = useTranslation()

  return function translateCategory(cat: string | null | undefined): string {
    if (!cat) return ''
    const key = CATEGORY_TRANSLATION_MAP[cat] || CATEGORY_TRANSLATION_MAP[cat.trim()]
    if (key) {
      return t(key, cat)
    }
    return cat
  }
}

/**
 * Cohesive category matcher supporting the 8 official news categories
 * as well as legacy composite groups (e.g. Technology & Science, Business & Economy).
 */
export function matchesCategoryFilter(
  article: Article,
  selectedCategoryId: string | null,
  selectedSubcategoryId?: string | null
): boolean {
  if (!selectedCategoryId || selectedCategoryId === 'all') return true

  const selCat = selectedCategoryId.toLowerCase().trim()
  const artCatId = (article.categoryId || '').toLowerCase().trim()
  const artCatName = (article.categoryName || '').toLowerCase().trim()
  const artSubId = (article.subcategoryId || '').toLowerCase().trim()
  const artSubName = (article.subcategoryName || '').toLowerCase().trim()

  // If a subcategory is explicitly chosen, enforce it
  if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
    const selSub = selectedSubcategoryId.toLowerCase().trim()
    if (artSubId && artSubId !== selSub) {
      return false
    }
  }

  // Exact match
  if (artCatId === selCat || artCatName === selCat) return true

  // 1. Technology
  if (selCat === 'technology' || selCat === 'tech') {
    if (artCatId === 'technology' || artCatName === 'technology') return true
    if (artCatId === 'tech-science' || artCatName === 'technology & science') {
      return !artSubId.includes('space') && !artSubName.includes('space')
    }
    return false
  }

  // 2. India & Politics
  if (selCat === 'india-politics' || selCat === 'politics' || selCat === 'india & politics') {
    return artCatId.includes('politics') || artCatName.includes('politics') || artCatId.includes('india')
  }

  // 3. Business
  if (selCat === 'business') {
    if (artCatId === 'business' || artCatName === 'business') return true
    if (artCatId === 'business-economy' || artCatName === 'business & economy') {
      return !artSubId.includes('career') && !artSubName.includes('career')
    }
    return false
  }

  // 4. Science
  if (selCat === 'science') {
    if (artCatId === 'science' || artCatName === 'science') return true
    if (artCatId === 'tech-science' || artCatName === 'technology & science') {
      return (
        artSubId.includes('space') ||
        artSubName.includes('space') ||
        artSubName.includes('science') ||
        artSubName.includes('biotech')
      )
    }
    return false
  }

  // 5. Sports
  if (selCat === 'sports') {
    return artCatId === 'sports' || artCatName === 'sports'
  }

  // 6. World
  if (selCat === 'world') {
    return artCatId === 'world' || artCatName === 'world' || artCatId.includes('world')
  }

  // 7. Careers
  if (selCat === 'careers' || selCat === 'career') {
    if (artCatId === 'careers' || artCatName === 'careers') return true
    if (artCatId === 'business-economy' || artCatName === 'business & economy') {
      return (
        artSubId.includes('career') ||
        artSubName.includes('career') ||
        artSubName.includes('workforce') ||
        artSubName.includes('startup')
      )
    }
    return false
  }

  // 8. AI & Startups
  if (selCat === 'ai-startups' || selCat === 'ai' || selCat === 'ai & startups') {
    if (artCatId === 'ai-startups' || artCatName === 'ai & startups') return true
    if (artCatId === 'tech-science' || artCatName === 'technology & science') {
      return (
        artSubId.includes('ai') ||
        artSubName.includes('ai') ||
        artSubName.includes('startup') ||
        artSubId.includes('startup')
      )
    }
    if (artCatId === 'business-economy') {
      return artSubId.includes('startup') || artSubName.includes('startup')
    }
    return false
  }

  // Legacy Group: Technology & Science
  if (selCat === 'tech-science' || selCat === 'technology & science') {
    return (
      artCatId === 'tech-science' ||
      artCatName === 'technology & science' ||
      artCatId === 'technology' ||
      artCatId === 'science' ||
      artCatId === 'ai-startups' ||
      artCatName === 'technology' ||
      artCatName === 'science' ||
      artCatName === 'ai & startups'
    )
  }

  // Legacy Group: Business & Economy
  if (selCat === 'business-economy' || selCat === 'business & economy') {
    return (
      artCatId === 'business-economy' ||
      artCatName === 'business & economy' ||
      artCatId === 'business' ||
      artCatId === 'careers' ||
      artCatName === 'business' ||
      artCatName === 'careers'
    )
  }

  // Legacy Group: World & Lifestyle
  if (selCat === 'world-lifestyle' || selCat === 'world & lifestyle') {
    return (
      artCatId === 'world-lifestyle' ||
      artCatName === 'world & lifestyle' ||
      artCatId === 'world' ||
      artCatName === 'world'
    )
  }

  return false
}
