import { CategoryGroup } from '../types/navigation'

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'india-politics',
    name: 'India & Politics',
    slug: 'india-politics',
    subcategories: [
      { id: 'pol-national', name: 'National Affairs', slug: 'national' },
      { id: 'pol-governance', name: 'Policy & Governance', slug: 'governance' },
      { id: 'pol-elections', name: 'Elections & Parliament', slug: 'elections' },
      { id: 'pol-foreign', name: 'Foreign Relations', slug: 'foreign-relations' },
      { id: 'pol-states', name: 'States Round-up', slug: 'states' },
    ],
  },
  {
    id: 'tech-science',
    name: 'Technology & Science',
    slug: 'tech-science',
    subcategories: [
      { id: 'tech-ai', name: 'Artificial Intelligence', slug: 'ai' },
      { id: 'tech-space', name: 'Space & Exploration', slug: 'space' },
      { id: 'tech-climate', name: 'Climate & Energy Tech', slug: 'climate-tech' },
      { id: 'tech-biotech', name: 'Bio & Health Sciences', slug: 'biotech' },
      { id: 'tech-gadgets', name: 'Consumer Hardware', slug: 'hardware' },
    ],
  },
  {
    id: 'business-economy',
    name: 'Business & Economy',
    slug: 'business-economy',
    subcategories: [
      { id: 'biz-markets', name: 'Markets & Indices', slug: 'markets' },
      { id: 'biz-startups', name: 'Startups & Venture', slug: 'startups' },
      { id: 'biz-banking', name: 'Banking & Fiscal Policy', slug: 'banking' },
      { id: 'biz-realestate', name: 'Real Estate & Infra', slug: 'infra' },
      { id: 'biz-global', name: 'Global Economy & Trade', slug: 'global-trade' },
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    subcategories: [
      { id: 'spt-cricket', name: 'Cricket', slug: 'cricket' },
      { id: 'spt-football', name: 'Football / Soccer', slug: 'football' },
      { id: 'spt-olympic', name: 'Olympic Disciplines', slug: 'olympics' },
      { id: 'spt-racquet', name: 'Tennis & Badminton', slug: 'racquet' },
      { id: 'spt-motorsport', name: 'Motorsport & F1', slug: 'motorsport' },
    ],
  },
  {
    id: 'world-lifestyle',
    name: 'World & Lifestyle',
    slug: 'world-lifestyle',
    subcategories: [
      { id: 'wld-geopolitics', name: 'Global Dispatch', slug: 'global-dispatch' },
      { id: 'wld-culture', name: 'Culture & The Arts', slug: 'culture' },
      { id: 'wld-wellness', name: 'Health & Wellness', slug: 'wellness' },
      { id: 'wld-books', name: 'Literature & Ideas', slug: 'books' },
      { id: 'wld-travel', name: 'Travel & Architecture', slug: 'travel' },
    ],
  },
]
