import prisma from '../db.js';
import type { ArticleContext } from './aiService.js';

export interface RetrievedArticle {
  id: string;
  title: string;
  summary: string;
  content?: string | null;
  url: string;
  publisher: string;
  category: string;
  publishedAt: string;
}

export type NewsRetrievalReason =
  | 'matched'
  | 'latest'
  | 'no_match'
  | 'database_unavailable'
  | 'not_news_query'
  | 'article_context_only';

export interface NewsRetrievalResult {
  articles: RetrievedArticle[];
  /** True when the PostgreSQL article store was reachable. */
  available: boolean;
  reason: NewsRetrievalReason;
}

/**
 * Clear signals that the user is asking about UPWISE reporting or current
 * affairs rather than a general-knowledge question.
 */
export const NEWS_SIGNAL =
  /\b(news|headlines?|articles?|reports?|reporting|coverage|dispatches?|current affairs|current events|upwise|breaking|editorial|bulletins?|stories|story|archive|latest updates?)\b/i;

const NEWS_SUMMARY_SIGNAL =
  /\b(summar(?:y|ize|ise)|compare|explain|what happened|updates?|developments?|details?)\b/i;

const RECENCY_SIGNAL = /\b(today|tonight|yesterday|this week|recent|latest|new)\b/i;

const COMPARISON_SIGNAL =
  /\b(compare|comparison|other (?:reports?|sources?|outlets?|coverage|articles?)|different reports?|cross[- ]check|multiple sources?)\b/i;

const CATEGORY_RULES: Array<{ category: string; pattern: RegExp }> = [
  {
    category: 'AI & Startups',
    pattern: /\b(artificial intelligence|ai|frontier models?|genai|llm|llms|startups?|venture capital|founder)\b/i,
  },
  {
    category: 'Science',
    pattern: /\b(science|scientific|space|nasa|isro|astronomy|quantum|biotech|biology|telescope|planetary)\b/i,
  },
  {
    category: 'Careers',
    pattern: /\b(careers?|jobs?|employment|hiring|workforce|recruitment|upskilling|education|university|examinations?)\b/i,
  },
  {
    category: 'Technology',
    pattern: /\b(tech|technology|technological|hardware|gadgets?|software|cyber|computing|semiconductor|server)\b/i,
  },
  {
    category: 'Business',
    pattern: /\b(business|economy|economic|markets?|finance|financial|stocks?|rbi|inflation|gdp|trade|banking)\b/i,
  },
  {
    category: 'Sports',
    pattern: /\b(sports?|cricket|football|olympics?|tournament|match|athletics?|badminton|champions league)\b/i,
  },
  {
    category: 'India & Politics',
    pattern: /\b(politics|political|parliament|elections?|government|policy|governance|ministry|diplomacy|congress|bjp|bill)\b/i,
  },
  {
    category: 'World',
    pattern: /\b(world|global|international|climate|environment|health|healthcare|lifestyle|treaty|ocean)\b/i,
  },
  {
    category: 'Technology & Science',
    pattern: /\b(tech|technology|science|scientific|space|nasa|isro|ai|quantum)\b/i,
  },
  {
    category: 'Business & Economy',
    pattern: /\b(business|economy|markets?|finance)\b/i,
  },
  {
    category: 'World & Lifestyle',
    pattern: /\b(world|global|international|culture|entertainment)\b/i,
  },
];

export function buildRetrievalCategoryWhere(category?: string) {
  if (!category) return {};
  const c = category.toLowerCase().trim();
  if (c === 'technology' || c === 'tech') {
    return { category: { in: ['Technology', 'Technology & Science'], mode: 'insensitive' as const } };
  }
  if (c === 'science') {
    return { category: { in: ['Science', 'Technology & Science'], mode: 'insensitive' as const } };
  }
  if (c === 'ai & startups' || c === 'ai' || c === 'startups') {
    return { category: { in: ['AI & Startups', 'Technology & Science'], mode: 'insensitive' as const } };
  }
  if (c === 'business') {
    return { category: { in: ['Business', 'Business & Economy'], mode: 'insensitive' as const } };
  }
  if (c === 'careers' || c === 'career') {
    return { category: { in: ['Careers', 'Business & Economy'], mode: 'insensitive' as const } };
  }
  if (c === 'world') {
    return { category: { in: ['World', 'World & Lifestyle'], mode: 'insensitive' as const } };
  }
  if (c === 'technology & science') {
    return { category: { in: ['Technology & Science', 'Technology', 'Science', 'AI & Startups'], mode: 'insensitive' as const } };
  }
  if (c === 'business & economy') {
    return { category: { in: ['Business & Economy', 'Business', 'Careers'], mode: 'insensitive' as const } };
  }
  if (c === 'world & lifestyle') {
    return { category: { in: ['World & Lifestyle', 'World'], mode: 'insensitive' as const } };
  }
  return { category: { equals: category, mode: 'insensitive' as const } };
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'about', 'from', 'this', 'that', 'these', 'those', 'what',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'does', 'did', 'are',
  'was', 'were', 'has', 'have', 'had', 'can', 'could', 'would', 'should', 'will', 'shall',
  'you', 'your', 'please', 'tell', 'give', 'let', 'know', 'into', 'over', 'under', 'between',
  'there', 'their', 'they', 'them', 'its', 'our', 'also', 'than', 'then', 'more', 'most',
  'some', 'any', 'all', 'not', 'but', 'out', 'get', 'got', 'make', 'made', 'use', 'using',
  'today', 'todays', "today's", 'today’s', 'tonight', 'yesterday', 'week', 'recent', 'latest', 'new',
  'news', 'headline', 'headlines', 'article', 'articles', 'report', 'reports', 'reporting',
  'coverage', 'story', 'stories', 'upwise', 'current', 'affairs', 'affair', 'events', 'event',
  'summarize', 'summarise', 'summary', 'explain', 'compare', 'comparison', 'available', 'details', 'detail',
  'update', 'updates', 'development', 'developments', 'happened', 'according', 'based',
  'technology', 'tech', 'science', 'scientific', 'business', 'economy', 'economic', 'sports',
  'politics', 'political', 'world', 'global', 'international', 'breaking', 'different', 'other',
  'sources', 'source', 'outlets', 'cross', 'check',
]);

export function detectNewsCategory(message: string): string | undefined {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(message)) return rule.category;
  }
  return undefined;
}

/**
 * Returns true only when the user is plausibly asking about UPWISE reporting or
 * current affairs. General knowledge/programming questions must not be forced
 * through article retrieval.
 */
export function isNewsIntent(message: string, _hasArticleContext = false): boolean {
  if (NEWS_SIGNAL.test(message) || COMPARISON_SIGNAL.test(message)) return true;
  if (NEWS_SUMMARY_SIGNAL.test(message) && RECENCY_SIGNAL.test(message)) return true;
  if (detectNewsCategory(message) && RECENCY_SIGNAL.test(message)) return true;
  return false;
}

export function wantComparison(message: string): boolean {
  return COMPARISON_SIGNAL.test(message);
}

export function extractSearchTerms(message: string): string[] {
  const words = message.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const word of words) {
    const isNonLatin = /[^\u0000-\u024f]/.test(word);
    if (word.length < (isNonLatin ? 2 : 3)) continue;
    if (STOPWORDS.has(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    terms.push(word);
    if (terms.length >= 8) break;
  }

  return terms;
}

function isSpecificQuery(terms: string[]): boolean {
  return terms.length > 1;
}

function toRetrievedArticle(article: {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  url: string;
  publisher: string;
  category: string;
  publishedAt: Date;
}): RetrievedArticle {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    url: article.url,
    publisher: article.publisher,
    category: article.category,
    publishedAt: article.publishedAt.toISOString(),
  };
}

const ARTICLE_SELECT = {
  id: true,
  title: true,
  summary: true,
  content: true,
  url: true,
  publisher: true,
  category: true,
  publishedAt: true,
} as const;

/**
 * Retrieves relevant UPWISE articles from PostgreSQL. Retrieval is intentionally
 * conservative: if a specific query has no matches we return no articles rather
 * than substituting unrelated headlines.
 */
export async function retrieveNewsArticles(options: {
  message: string;
  articleContext?: ArticleContext;
  hasNewsSignal?: boolean;
  category?: string;
}): Promise<NewsRetrievalResult> {
  const { message, articleContext } = options;
  const hasArticleContext = Boolean(articleContext?.title);
  const newsSignal = options.hasNewsSignal ?? NEWS_SIGNAL.test(message);
  const comparison = wantComparison(message);
  const category = options.category ?? detectNewsCategory(message) ?? articleContext?.category;

  const newsIntent =
    newsSignal ||
    comparison ||
    (NEWS_SUMMARY_SIGNAL.test(message) && RECENCY_SIGNAL.test(message)) ||
    (Boolean(category) && RECENCY_SIGNAL.test(message));

  if (!hasArticleContext && !newsIntent) {
    return { articles: [], available: true, reason: 'not_news_query' };
  }

  // An attached article is already supplied to the model. Only query the
  // archive when the user explicitly asks for other reporting/comparison.
  if (hasArticleContext && !newsSignal && !comparison) {
    return { articles: [], available: true, reason: 'article_context_only' };
  }

  let terms = extractSearchTerms(message);
  if (hasArticleContext && comparison && terms.length === 0 && articleContext?.title) {
    terms = extractSearchTerms(articleContext.title);
  }

  const query = async (): Promise<NewsRetrievalResult> => {
    // 1. Targeted search across verified UPWISE articles.
    if (terms.length > 0) {
      const or = terms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' as const } },
        { summary: { contains: term, mode: 'insensitive' as const } },
        { content: { contains: term, mode: 'insensitive' as const } },
        { publisher: { contains: term, mode: 'insensitive' as const } },
      ]);

      const matches = await prisma.article.findMany({
        where: {
          ...buildRetrievalCategoryWhere(category),
          OR: or,
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: ARTICLE_SELECT,
      });

      if (matches.length > 0) {
        return {
          articles: matches.map(toRetrievedArticle),
          available: true,
          reason: 'matched',
        };
      }

      // 2. For a specific query with no matches, stay honest instead of
      //    returning unrelated coverage.
      if (isSpecificQuery(terms)) {
        return { articles: [], available: true, reason: 'no_match' };
      }
    }

    // 3. Broad "latest news" / "today's current affairs" requests get the most
    //    recent reporting, optionally scoped to the detected desk.
    const latest = await prisma.article.findMany({
      where: buildRetrievalCategoryWhere(category),
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: ARTICLE_SELECT,
    });

    return {
      articles: latest.map(toRetrievedArticle),
      available: true,
      reason: latest.length > 0 ? 'latest' : 'no_match',
    };
  };

  try {
    return await Promise.race([
      query(),
      new Promise<NewsRetrievalResult>((resolve) =>
        setTimeout(
          () => resolve({ articles: [], available: false, reason: 'database_unavailable' }),
          6000
        )
      ),
    ]);
  } catch {
    // Do not log query text or database credentials. The model is told that the
    // archive is unavailable and must not invent articles.
    console.warn('[AI] UPWISE article retrieval is unavailable.');
    return { articles: [], available: false, reason: 'database_unavailable' };
  }
}
