export type CategoryKey = 
  | 'India & Politics'
  | 'Technology & Science'
  | 'Business & Economy'
  | 'Sports'
  | 'World & Lifestyle';

export interface CategoryInfo {
  id: string;
  name: CategoryKey;
  slug: string;
  description: string;
  subcategories: string[];
  color: string;
  accentBg: string;
  iconName: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  content?: string | null;
  url: string;
  publisher: string;
  category: string;
  subcategory?: string | null;
  publishedAt: string | Date;
  imageUrl?: string | null;
  readingTime: number;
  trending: boolean;
  viewCount: number;
  language?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  clusters?: {
    cluster: {
      id: string;
      canonicalTitle: string;
      members: {
        article: {
          id: string;
          title: string;
          publisher: string;
          url: string;
          publishedAt: string | Date;
          imageUrl?: string | null;
        };
      }[];
    };
  }[];
}

export interface FeedQueryParams {
  category?: string;
  subcategory?: string;
  q?: string;
  source?: string;
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | 'custom';
  startDate?: string;
  endDate?: string;
  language?: 'en' | 'hi' | 'all';
  sort?: 'latest' | 'oldest' | 'relevant';
  page?: number;
  limit?: number;
  trendingOnly?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filterMeta?: {
    category?: string;
    totalActiveFilters: number;
  };
}
