import prisma from '../db.js';
import { FeedQueryParams, PaginatedResponse, ArticleItem, CategoryInfo, MapQueryParams } from '../types/index.js';
import { Prisma } from '@prisma/client';
import { parseCombinedQuery, extractArticleLocation } from './geoService.js';
import { SEED_ARTICLES } from '../ingestion/seedData.js';

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
  // Official 8 Categories
  {
    id: 'technology',
    name: 'Technology',
    slug: 'technology',
    description: 'Hardware, silicon architecture, digital infrastructure, and consumer systems.',
    subcategories: ['Hardware & Systems', 'Consumer Tech', 'Digital Infrastructure', 'Computing'],
    color: '#0369A1',
    accentBg: '#F0F9FF',
    iconName: 'Cpu',
  },
  {
    id: 'science',
    name: 'Science',
    slug: 'science',
    description: 'Space exploration, astrophysics, climate science, and biological discoveries.',
    subcategories: ['Space Exploration', 'Physics & Astronomy', 'Bio & Health Sciences', 'Scientific discoveries'],
    color: '#7C3AED',
    accentBg: '#F5F3FF',
    iconName: 'FlaskConical',
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    description: 'Markets, monetary policy, corporate developments, venture capital, and trade.',
    subcategories: ['Business', 'Finance and markets', 'Economy', 'Corporate Strategy'],
    color: '#047857',
    accentBg: '#ECFDF5',
    iconName: 'TrendingUp',
  },
  {
    id: 'careers',
    name: 'Careers',
    slug: 'careers',
    description: 'Workforce shifts, professional development, technical education, and employment benchmarks.',
    subcategories: ['Workforce & Industry', 'Higher Education', 'Civil Services & Exams', 'Skill Development'],
    color: '#B45309',
    accentBg: '#FEF3C7',
    iconName: 'GraduationCap',
  },
  {
    id: 'ai-startups',
    name: 'AI & Startups',
    slug: 'ai-startups',
    description: 'Frontier AI models, venture investments, founder briefings, and emerging tech.',
    subcategories: ['Artificial Intelligence', 'Startups & Venture', 'Machine Learning', 'GenAI'],
    color: '#BE185D',
    accentBg: '#FDF2F8',
    iconName: 'Rocket',
  },
  {
    id: 'world',
    name: 'World',
    slug: 'world',
    description: 'Global affairs, international treaties, foreign policy, and cross-border developments.',
    subcategories: ['World news', 'Global Diplomacy', 'International Trade', 'Environment'],
    color: '#0D9488',
    accentBg: '#F0FDFA',
    iconName: 'Globe',
  },
];

export function buildCategoryCondition(categoryParam?: string): Prisma.ArticleWhereInput | null {
  if (!categoryParam || categoryParam === 'All' || categoryParam === 'all') {
    return null;
  }
  const cat = categoryParam.trim().toLowerCase();

  if (cat === 'technology & science' || cat === 'tech-science') {
    return {
      category: {
        in: ['Technology & Science', 'Technology', 'Science', 'AI & Startups'],
        mode: 'insensitive',
      },
    };
  }
  if (cat === 'business & economy' || cat === 'business-economy') {
    return {
      category: {
        in: ['Business & Economy', 'Business', 'Careers'],
        mode: 'insensitive',
      },
    };
  }
  if (cat === 'world & lifestyle' || cat === 'world-lifestyle') {
    return {
      category: {
        in: ['World & Lifestyle', 'World'],
        mode: 'insensitive',
      },
    };
  }
  if (cat === 'india & politics' || cat === 'india-politics' || cat === 'politics') {
    return {
      category: {
        in: ['India & Politics', 'India'],
        mode: 'insensitive',
      },
    };
  }
  if (cat === 'technology' || cat === 'tech') {
    return {
      OR: [
        { category: { equals: 'Technology', mode: 'insensitive' } },
        { category: { equals: 'Technology & Science', mode: 'insensitive' } },
      ],
    };
  }
  if (cat === 'science') {
    return {
      OR: [
        { category: { equals: 'Science', mode: 'insensitive' } },
        {
          AND: [
            { category: { equals: 'Technology & Science', mode: 'insensitive' } },
            { subcategory: { contains: 'space', mode: 'insensitive' } },
          ],
        },
      ],
    };
  }
  if (cat === 'ai & startups' || cat === 'ai-startups' || cat === 'ai') {
    return {
      OR: [
        { category: { equals: 'AI & Startups', mode: 'insensitive' } },
        { subcategory: { contains: 'ai', mode: 'insensitive' } },
        { subcategory: { contains: 'startup', mode: 'insensitive' } },
      ],
    };
  }
  if (cat === 'business') {
    return {
      OR: [
        { category: { equals: 'Business', mode: 'insensitive' } },
        { category: { equals: 'Business & Economy', mode: 'insensitive' } },
      ],
    };
  }
  if (cat === 'careers' || cat === 'career') {
    return {
      OR: [
        { category: { equals: 'Careers', mode: 'insensitive' } },
        { subcategory: { contains: 'career', mode: 'insensitive' } },
        { subcategory: { contains: 'workforce', mode: 'insensitive' } },
        { subcategory: { contains: 'education', mode: 'insensitive' } },
      ],
    };
  }
  if (cat === 'world') {
    return {
      OR: [
        { category: { equals: 'World', mode: 'insensitive' } },
        { category: { equals: 'World & Lifestyle', mode: 'insensitive' } },
      ],
    };
  }
  if (cat === 'sports') {
    return {
      category: { equals: 'Sports', mode: 'insensitive' },
    };
  }

  return {
    category: { equals: categoryParam, mode: 'insensitive' },
  };
}

export async function getArticles(params: FeedQueryParams): Promise<PaginatedResponse<ArticleItem>> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {};
  const andConditions: Prisma.ArticleWhereInput[] = [];

  // Category filter
  if (params.category && params.category !== 'All' && params.category !== 'all') {
    const catCond = buildCategoryCondition(params.category);
    if (catCond) {
      andConditions.push(catCond);
    }
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
    andConditions.push({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { publisher: { contains: query, mode: 'insensitive' } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
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

/**
 * Geographical news retrieval endpoint handler
 * Supports bounding box, location filter, combined topic+location queries, category, language, and date presets
 */
export async function getMapArticles(params: MapQueryParams): Promise<{
  data: ArticleItem[];
  total: number;
  centerLocation?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  queryMeta?: {
    topic?: string;
    location?: string;
  };
}> {
  const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
  const where: Prisma.ArticleWhereInput = {
    latitude: { not: null },
    longitude: { not: null },
  };

  let centerLocation: { name: string; latitude: number; longitude: number } | undefined;
  let queryTopic: string | undefined;
  let queryLocation: string | undefined;

  const andConditions: Prisma.ArticleWhereInput[] = [];

  // 1. Bounding box filter (minLng,minLat,maxLng,maxLat)
  if (params.bbox) {
    const parts = params.bbox.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      const [minLng, minLat, maxLng, maxLat] = parts;
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    }
  }

  // 2. Specific location filter
  if (params.location && params.location !== 'all' && params.location !== 'global') {
    const parsed = parseCombinedQuery(params.location);
    if (parsed.matchedLocation) {
      queryLocation = parsed.matchedLocation.city || parsed.matchedLocation.state || parsed.matchedLocation.country;
      centerLocation = {
        name: queryLocation,
        latitude: parsed.matchedLocation.latitude,
        longitude: parsed.matchedLocation.longitude,
      };
      const locOr: Prisma.ArticleWhereInput[] = [];
      if (parsed.matchedLocation.city) locOr.push({ city: { equals: parsed.matchedLocation.city, mode: 'insensitive' } });
      if (parsed.matchedLocation.state) locOr.push({ state: { equals: parsed.matchedLocation.state, mode: 'insensitive' } });
      if (parsed.matchedLocation.country) locOr.push({ country: { equals: parsed.matchedLocation.country, mode: 'insensitive' } });
      locOr.push({ location: { contains: params.location, mode: 'insensitive' } });
      locOr.push({ title: { contains: params.location, mode: 'insensitive' } });
      andConditions.push({ OR: locOr });
    }
  }

  // 3. Search query (supports unified topic + location queries e.g. "AI news in Bengaluru", "Elections in Punjab")
  if (params.q && params.q.trim().length > 0) {
    const parsed = parseCombinedQuery(params.q);
    queryTopic = parsed.topicQuery;
    if (parsed.matchedLocation) {
      queryLocation = parsed.matchedLocation.city || parsed.matchedLocation.state || parsed.matchedLocation.country;
      if (!centerLocation) {
        centerLocation = {
          name: queryLocation,
          latitude: parsed.matchedLocation.latitude,
          longitude: parsed.matchedLocation.longitude,
        };
      }
      const locOr: Prisma.ArticleWhereInput[] = [];
      if (parsed.matchedLocation.city) locOr.push({ city: { equals: parsed.matchedLocation.city, mode: 'insensitive' } });
      if (parsed.matchedLocation.state) locOr.push({ state: { equals: parsed.matchedLocation.state, mode: 'insensitive' } });
      if (parsed.matchedLocation.country) locOr.push({ country: { equals: parsed.matchedLocation.country, mode: 'insensitive' } });
      locOr.push({ location: { contains: queryLocation, mode: 'insensitive' } });
      andConditions.push({ OR: locOr });
    }

    if (queryTopic && queryTopic.length > 0) {
      const topicOr: Prisma.ArticleWhereInput[] = [
        { title: { contains: queryTopic, mode: 'insensitive' } },
        { summary: { contains: queryTopic, mode: 'insensitive' } },
        { publisher: { contains: queryTopic, mode: 'insensitive' } },
      ];
      andConditions.push({ OR: topicOr });
    } else if (!parsed.matchedLocation) {
      const textQuery = params.q.trim();
      const freeOr: Prisma.ArticleWhereInput[] = [
        { title: { contains: textQuery, mode: 'insensitive' } },
        { summary: { contains: textQuery, mode: 'insensitive' } },
        { publisher: { contains: textQuery, mode: 'insensitive' } },
        { city: { contains: textQuery, mode: 'insensitive' } },
        { state: { contains: textQuery, mode: 'insensitive' } },
        { country: { contains: textQuery, mode: 'insensitive' } },
      ];
      andConditions.push({ OR: freeOr });
    }
  }

  // 4. Category filter
  if (params.category && params.category !== 'All' && params.category !== 'all') {
    const catCond = buildCategoryCondition(params.category);
    if (catCond) {
      andConditions.push(catCond);
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // 5. Language filter
  if (params.language && params.language !== 'all') {
    where.language = params.language;
  }

  // 6. Date filters
  const now = new Date();
  if (params.dateRange === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.publishedAt = { gte: startOfToday };
  } else if (params.dateRange === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);
    where.publishedAt = { gte: startOfYesterday, lte: endOfYesterday };
  } else if (params.dateRange === '7d' || (params.dateRange as any) === 'week') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    where.publishedAt = { gte: sevenDaysAgo };
  } else if (params.dateRange === '30d' || (params.dateRange as any) === 'month') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    where.publishedAt = { gte: thirtyDaysAgo };
  } else if (params.dateRange === 'custom') {
    const dateCondition: { gte?: Date; lte?: Date } = {};
    if (params.startDate) dateCondition.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      dateCondition.lte = end;
    }
    if (dateCondition.gte || dateCondition.lte) where.publishedAt = dateCondition;
  }

  // 7. Sorting
  let orderBy: Prisma.ArticleOrderByWithRelationInput = { publishedAt: 'desc' };
  if (params.sort === 'oldest') {
    orderBy = { publishedAt: 'asc' };
  } else if (params.sort === 'relevant') {
    orderBy = { viewCount: 'desc' };
  }

  let total = 0;
  let articles: ArticleItem[] = [];

  try {
    const [dbTotal, dbArticles] = await Promise.race([
      Promise.all([
        prisma.article.count({ where }),
        prisma.article.findMany({
          where,
          orderBy,
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
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB Timeout')), 1200)
      ),
    ]);

    total = dbTotal;
    articles = dbArticles as unknown as ArticleItem[];

    // If database returned 0 articles (e.g. not seeded yet), fall back to seed articles
    if (total === 0) {
      articles = getFallbackMapArticles(params);
      total = articles.length;
    }
  } catch (_dbError) {
    // Database connection unavailable or in standalone/test mode; fall back gracefully
    articles = getFallbackMapArticles(params);
    total = articles.length;
  }

  return {
    data: articles,
    total,
    centerLocation,
    queryMeta: {
      topic: queryTopic,
      location: queryLocation,
    },
  };
}

export function getFallbackMapArticles(params: MapQueryParams): ArticleItem[] {
  let list = SEED_ARTICLES.map((item, idx) => {
    const geo = (item.latitude && item.longitude)
      ? {
          latitude: item.latitude,
          longitude: item.longitude,
          location: item.location || item.city || item.state || item.country || '',
          city: item.city,
          state: item.state,
          country: item.country || 'India',
        }
      : extractArticleLocation(item.title, item.summary, item.content);

    if (!geo) return null;

    const articleItem: ArticleItem = {
      id: `seed-map-${idx + 1}`,
      title: item.title,
      summary: item.summary,
      content: item.content,
      url: item.url,
      publisher: item.publisher,
      category: item.category,
      subcategory: item.subcategory,
      publishedAt: item.publishedAt,
      imageUrl: item.imageUrl,
      readingTime: item.readingTime,
      trending: item.trending,
      viewCount: item.trending ? 450 : 120,
      language: item.language || 'en',
      latitude: geo.latitude,
      longitude: geo.longitude,
      location: geo.location,
      city: geo.city,
      state: geo.state,
      country: geo.country,
      createdAt: item.publishedAt,
      updatedAt: item.publishedAt,
    };
    return articleItem;
  }).filter((a): a is ArticleItem => a !== null);

  // Apply filters
  if (params.bbox) {
    const parts = params.bbox.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      const [minLng, minLat, maxLng, maxLat] = parts;
      list = list.filter(
        (a) =>
          a.latitude! >= minLat &&
          a.latitude! <= maxLat &&
          a.longitude! >= minLng &&
          a.longitude! <= maxLng
      );
    }
  }

  if (params.location && params.location !== 'all' && params.location !== 'global') {
    const parsed = parseCombinedQuery(params.location);
    const locName = (parsed.locationQuery || params.location).toLowerCase();
    list = list.filter((a) => {
      const text = `${a.city || ''} ${a.state || ''} ${a.country || ''} ${a.location || ''} ${a.title}`.toLowerCase();
      return text.includes(locName);
    });
  }

  if (params.q && params.q.trim()) {
    const parsed = parseCombinedQuery(params.q);
    if (parsed.matchedLocation) {
      const locName = (parsed.locationQuery || '').toLowerCase();
      list = list.filter((a) => {
        const text = `${a.city || ''} ${a.state || ''} ${a.country || ''} ${a.location || ''}`.toLowerCase();
        return text.includes(locName);
      });
    }
    if (parsed.topicQuery) {
      const topic = parsed.topicQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(topic) ||
          a.summary.toLowerCase().includes(topic) ||
          a.publisher.toLowerCase().includes(topic)
      );
    } else if (!parsed.matchedLocation) {
      const q = params.q.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.publisher.toLowerCase().includes(q) ||
          (a.city && a.city.toLowerCase().includes(q)) ||
          (a.state && a.state.toLowerCase().includes(q)) ||
          (a.country && a.country.toLowerCase().includes(q))
      );
    }
  }

  if (params.category && params.category !== 'all' && params.category !== 'All') {
    const catLower = params.category.toLowerCase().trim();
    list = list.filter((a) => {
      const aCat = a.category.toLowerCase();
      if (catLower === 'technology & science' || catLower === 'tech-science') {
        return aCat.includes('technology') || aCat.includes('science') || aCat.includes('ai');
      }
      if (catLower === 'business & economy' || catLower === 'business-economy') {
        return aCat.includes('business') || aCat.includes('career') || aCat.includes('economy');
      }
      if (catLower === 'world & lifestyle' || catLower === 'world-lifestyle') {
        return aCat.includes('world') || aCat.includes('lifestyle');
      }
      if (catLower === 'technology' || catLower === 'tech') {
        return aCat === 'technology' || aCat === 'technology & science';
      }
      if (catLower === 'science') {
        return aCat === 'science' || (aCat === 'technology & science' && (a.subcategory || '').toLowerCase().includes('space'));
      }
      if (catLower === 'ai & startups' || catLower === 'ai-startups' || catLower === 'ai') {
        return aCat === 'ai & startups' || (a.subcategory || '').toLowerCase().includes('ai') || (a.subcategory || '').toLowerCase().includes('startup');
      }
      if (catLower === 'business') {
        return aCat === 'business' || aCat === 'business & economy';
      }
      if (catLower === 'careers' || catLower === 'career') {
        return aCat === 'careers' || (a.subcategory || '').toLowerCase().includes('career');
      }
      if (catLower === 'world') {
        return aCat === 'world' || aCat === 'world & lifestyle';
      }
      if (catLower === 'india & politics' || catLower === 'india-politics' || catLower === 'politics') {
        return aCat.includes('india') || aCat.includes('politics');
      }
      if (catLower === 'sports') {
        return aCat === 'sports';
      }
      return aCat === catLower;
    });
  }

  if (params.language && params.language !== 'all') {
    list = list.filter((a) => a.language === params.language);
  }

  // Sort
  if (params.sort === 'oldest') {
    list.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  } else if (params.sort === 'relevant') {
    list.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
  return list.slice(0, limit);
}
