import { useTranslation } from 'react-i18next'

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

