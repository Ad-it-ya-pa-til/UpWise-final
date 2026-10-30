import prisma from '../db.js';
import { FeedQueryParams, PaginatedResponse, ArticleItem, CategoryInfo } from '../types/index.js';
import { Prisma } from '@prisma/client';

export const CATEGORIES_DATA: CategoryInfo[] = [
  {
    id: 'india-politics',
    name: 'India & Politics',
    slug: 'india-politics',
    description: 'National affairs, parliamentary legislation, elections, governance, and diplomacy.',
    subcategories: [
      'Indian politics',
      'Government and policy',
      'Elections',
      'Current affairs',
      'International relations',
    ],
    color: '#C2410C', // Amber / Rust
    accentBg: '#FFFBEB',
    iconName: 'Building2',
  },
  {
    id: 'tech-science',
    name: 'Technology & Science',
    slug: 'technology-science',
    description: 'Artificial intelligence, space exploration, discoveries, hardware, and emerging startups.',
    subcategories: [
      'AI and technology',
      'Startups',
      'Gadgets',
      'Space',
      'Scientific discoveries',
    ],
    color: '#0369A1', // Sky blue
    accentBg: '#F0F9FF',
    iconName: 'Cpu',
  },
  {
    id: 'business-economy',
    name: 'Business & Economy',
    slug: 'business-economy',
    description: 'Markets, monetary policy, corporate developments, venture capital, and economic trends.',
    subcategories: [
      'Business',
      'Finance and markets',
      'Economy',
      'Careers and industry',
    ],
    color: '#047857', // Emerald green
    accentBg: '#ECFDF5',
    iconName: 'TrendingUp',
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'sports',
    description: 'Live match analysis, cricket, football leagues, international tournaments, and athletics.',
    subcategories: [
      'Cricket',
      'Football',
      'Other sports',
      'Major tournaments',
    ],
    color: '#BE123C', // Rose / Ruby
    accentBg: '#FFF1F2',
    iconName: 'Trophy',
  },
  {
    id: 'world-lifestyle',
    name: 'World & Lifestyle',
    slug: 'world-lifestyle',
    description: 'Global affairs, climate & environmental treaties, healthcare innovations, and culture.',
    subcategories: [
      'World news',
      'Healthcare',
      'Education',
      'Environment',
      'Culture and entertainment',
    ],
    color: '#6D28D9', // Violet / Purple
    accentBg: '#F5F3FF',
    iconName: 'Globe',
  },
];

export async function getArticles(params: FeedQueryParams): Promise<PaginatedResponse<ArticleItem>> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {};

  // Category filter
  if (params.category && params.category !== 'All' && params.category !== 'all') {
    where.category = {
      equals: params.category,
      mode: 'insensitive',
    };
  }

  // Subcategory filter
  if (params.subcategory && params.subcategory !== 'All') {
    where.subcategory = {
      equals: params.subcategory,
      mode: 'insensitive',
    };
  }

  // Source / Publisher filter
  if (params.source && params.source !== 'All') {
    where.publisher = {
      equals: params.source,
      mode: 'insensitive',
    };
  }

  // Trending filter
  if (params.trendingOnly) {
    where.trending = true;
  }

  // Language filter
  if (params.language && params.language !== 'all') {
    where.language = params.language;
  }

  // Search query (in title, summary, or publisher)
  if (params.q && params.q.trim().length > 0) {
    const query = params.q.trim();
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } },
      { publisher: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Date filters based on original publishedAt timestamp
  const now = new Date();
  if (params.dateRange === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.publishedAt = { gte: startOfToday };
  } else if (params.dateRange === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);
    where.publishedAt = {
      gte: startOfYesterday,
      lte: endOfYesterday,
    };
  } else if (params.dateRange === '7d') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    where.publishedAt = { gte: sevenDaysAgo };
  } else if (params.dateRange === '30d') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    where.publishedAt = { gte: thirtyDaysAgo };
  } else if (params.dateRange === 'custom') {
    const dateCondition: { gte?: Date; lte?: Date } = {};
    if (params.startDate) {
      dateCondition.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      // Include up to end of the selected day
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.lte = end;
    }
    if (dateCondition.gte || dateCondition.lte) {
      where.publishedAt = dateCondition;
    }
  }

  // Sorting
  let orderBy: Prisma.ArticleOrderByWithRelationInput = { publishedAt: 'desc' };
  if (params.sort === 'oldest') {
    orderBy = { publishedAt: 'asc' };
  } else if (params.sort === 'relevant') {
    orderBy = { viewCount: 'desc' };
  }

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        clusters: {
          include: {
            cluster: {
              include: {
                members: {
                  where: {
                    article: {
                      id: { not: undefined }
                    }
                  },
                  include: {
                    article: {
                      select: {
                        id: true,
                        title: true,
                        publisher: true,
                        url: true,
                        publishedAt: true,
                        imageUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: articles as unknown as ArticleItem[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
    filterMeta: {
      category: params.category,
      totalActiveFilters: [
        params.category,
        params.subcategory,
        params.q,
        params.source,
        params.dateRange,
      ].filter(Boolean).length,
    },
  };
}

export async function getArticleById(id: string): Promise<ArticleItem | null> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      clusters: {
        include: {
          cluster: {
            include: {
              members: {
                include: {
                  article: {
                    select: {
                      id: true,
                      title: true,
                      publisher: true,
                      url: true,
                      publishedAt: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (article) {
    // Increment view count asynchronously
    prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
  }

  return article as unknown as ArticleItem | null;
}

export async function getTrendingArticles(limit: number = 6, language?: string): Promise<ArticleItem[]> {
  const where: Prisma.ArticleWhereInput = { trending: true };
  if (language && language !== 'all') {
    where.language = language;
  }
  const articles = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  if (articles.length < limit) {
    const additionalWhere: Prisma.ArticleWhereInput = {
      id: { notIn: articles.map(a => a.id) },
    };
    if (language && language !== 'all') {
      additionalWhere.language = language;
    }
    const additional = await prisma.article.findMany({
      where: additionalWhere,
      orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit - articles.length,
    });
    return [...articles, ...additional] as unknown as ArticleItem[];
  }

  return articles as unknown as ArticleItem[];
}

export async function getAvailablePublishers(): Promise<string[]> {
  const publishers = await prisma.article.findMany({
    select: { publisher: true },
    distinct: ['publisher'],
    orderBy: { publisher: 'asc' },
  });
  return publishers.map(p => p.publisher);
}
