import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';
import crypto from 'crypto';
import { FeedSourceConfig } from './feedConfig.js';

interface CustomItem extends Parser.Item {
  'content:encoded'?: string;
  'media:content'?: {
    $: {
      url: string;
      medium?: string;
    };
  } | {
    $: {
      url: string;
      medium?: string;
    };
  }[];
  'media:thumbnail'?: {
    $: {
      url: string;
    };
  };
  enclosure?: {
    url: string;
    type?: string;
  };
}

const parser: Parser<object, CustomItem> = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content:encoded'],
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
    ],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 UpWiseNewsBot/2.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  timeout: 10000,
});

export interface ParsedNewsItem {
  title: string;
  summary: string;
  content: string | null;
  url: string;
  publisher: string;
  category: string;
  subcategory: string;
  publishedAt: Date;
  imageUrl: string | null;
  contentHash: string;
  readingTime: number;
  language: 'en' | 'hi';
}

// Patterns that identify SEO spam, Pinterest aggregators, cartoon collections, or advertisements
const SPAM_PATTERNS = [
  /pinterest/i,
  /best ideas and inspiration for/i,
  /cartoons of politicians/i,
  /clipart/i,
  /stock illustrations/i,
  /free wallpaper/i,
  /sponsored content/i,
  /promoted post/i,
  /buy now/i,
  /affiliate disclosure/i,
  /click here to subscribe/i,
];

export function isLegitimateNewsArticle(title: string, summary: string, url: string): boolean {
  if (!title || title.trim().length < 12) return false;
  if (!url || !url.startsWith('http')) return false;

  // Block Pinterest or social bookmarking domains
  if (url.includes('pinterest.') || url.includes('instagram.com') || url.includes('tiktok.com')) {
    return false;
  }

  const combined = `${title} ${summary}`;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(combined)) {
      return false;
    }
  }

  return true;
}

export function detectLanguage(text: string, fallback: 'en' | 'hi' = 'en'): 'en' | 'hi' {
  if (!text) return fallback;
  // If text contains Devanagari Unicode characters (Hindi)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  return fallback;
}

export function extractImageUrl(item: CustomItem, rawHtml?: string): string | null {
  const isBadImage = (url: string) => {
    if (!url || !url.startsWith('http')) return true;
    const lower = url.toLowerCase();
    return (
      lower.includes('1x1') ||
      lower.includes('pixel') ||
      lower.includes('spacer') ||
      lower.includes('avatar') ||
      lower.includes('favicon') ||
      lower.includes('feedburner') ||
      lower.includes('pinterest') ||
      lower.includes('ad-banner') ||
      lower.includes('logo-small')
    );
  };

  // 1. Check enclosure
  if (item.enclosure?.url && (item.enclosure.type?.includes('image') || /\.(jpg|jpeg|png|webp|avif)/i.test(item.enclosure.url))) {
    if (!isBadImage(item.enclosure.url)) return item.enclosure.url;
  }

  // 2. Check media:content
  if (item['media:content']) {
    if (Array.isArray(item['media:content'])) {
      const img = item['media:content'].find(m => m.$?.url && (!m.$?.medium || m.$?.medium === 'image'));
      if (img?.$?.url && !isBadImage(img.$.url)) return img.$.url;
    } else if (item['media:content'].$?.url && !isBadImage(item['media:content'].$.url)) {
      return item['media:content'].$.url;
    }
  }

  // 3. Check media:thumbnail
  if (item['media:thumbnail']?.$?.url && !isBadImage(item['media:thumbnail'].$.url)) {
    return item['media:thumbnail'].$.url;
  }

  // 4. Look for img tag in rawHtml or content
  const htmlToSearch = rawHtml || item['content:encoded'] || item.content || item.summary || '';
  const imgMatch = htmlToSearch.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/i);
  if (imgMatch && imgMatch[1] && !isBadImage(imgMatch[1])) {
    return imgMatch[1];
  }

  return null;
}

export function cleanText(html: string): string {
  if (!html) return '';
  const clean = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return clean
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;/g, '...')
    .replace(/The post .* appeared first on .*/gi, '')
    .replace(/Read more on .*/gi, '')
    .replace(/Continue reading.*/gi, '')
    .replace(/\[&#8230;\]/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateSummary(text: string, maxSentences: number = 3): string {
  if (!text) return '';
  const sentences = text.match(/[^.!?।]+[.!?।]+(\s|$)/g);
  if (sentences && sentences.length > 0) {
    return sentences.slice(0, maxSentences).join(' ').trim();
  }
  return text.length > 250 ? text.slice(0, 247) + '...' : text;
}

export function calculateReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export async function fetchFeedItems(source: FeedSourceConfig): Promise<ParsedNewsItem[]> {
  try {
    const feed = await parser.parseURL(source.feedUrl);
    const results: ParsedNewsItem[] = [];

    for (const item of feed.items || []) {
      if (!item.title || !item.link) continue;

      const title = cleanText(item.title);
      const rawBody = item['content:encoded'] || item.content || item.summary || '';
      const cleanedBody = cleanText(rawBody);
      const summary = generateSummary(cleanedBody || title);

      // Verify that this is legitimate news, not Pinterest SEO or spam
      if (!isLegitimateNewsArticle(title, summary, item.link)) {
        continue;
      }

      const imageUrl = extractImageUrl(item, rawBody);
      
      let publishedAt = new Date();
      try {
        const rawDate = item.isoDate || item.pubDate;
        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            // Prevent future dates from skewing sort
            publishedAt = parsed.getTime() > Date.now() ? new Date() : parsed;
          }
        }
      } catch {
        publishedAt = new Date();
      }

      const readingTime = calculateReadingTime(cleanedBody || summary);
      const detectedLang = detectLanguage(title + ' ' + summary, source.language);

      // Create a deterministic hash to prevent duplicates
      const hashSource = `${title.toLowerCase().trim()}_${source.defaultPublisher}`;
      const contentHash = crypto.createHash('sha256').update(hashSource).digest('hex');

      results.push({
        title,
        summary: summary || title,
        content: cleanedBody.length > summary.length ? cleanedBody : null,
        url: item.link.trim(),
        publisher: source.defaultPublisher,
        category: source.category,
        subcategory: source.subcategory,
        publishedAt,
        imageUrl,
        contentHash,
        readingTime,
        language: detectedLang,
      });
    }

    return results;
  } catch (error) {
    console.error(`[RSS Ingestion] Error fetching from ${source.name} (${source.feedUrl}):`, (error as Error).message);
    return [];
  }
}
