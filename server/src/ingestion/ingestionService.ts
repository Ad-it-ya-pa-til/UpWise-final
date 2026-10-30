import prisma from '../db.js';
import { FEED_SOURCES } from './feedConfig.js';
import { fetchFeedItems } from './rssParser.js';
import { clusterNewArticle, runClusteringBatch } from './clustering.js';
import { SEED_ARTICLES } from './seedData.js';
import { extractArticleLocation } from '../services/geoService.js';
import crypto from 'crypto';

let schedulerTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;

export function sanitizeTextForDb(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');
}

export async function seedInitialArticles(): Promise<number> {
  const count = await prisma.article.count();
  if (count > 0) {
    console.log(`[Seed] Database already has ${count} articles. Skipping seed.`);
    return count;
  }

  console.log(`[Seed] Seeding initial curated articles...`);
  let inserted = 0;

  for (const item of SEED_ARTICLES) {
    const hashSource = `${item.title.toLowerCase().trim()}_${item.publisher}`;
    const contentHash = crypto.createHash('sha256').update(hashSource).digest('hex');

    const geo = (item.latitude && item.longitude)
      ? {
          latitude: item.latitude,
          longitude: item.longitude,
          location: item.location || item.city || item.state || item.country || 'Verified Location',
          city: item.city,
          state: item.state,
          country: item.country || 'India',
        }
      : extractArticleLocation(item.title, item.summary, item.content);

    try {
      await prisma.article.create({
        data: {
          title: item.title,
          summary: item.summary,
          content: item.content,
          url: item.url,
          publisher: item.publisher,
          category: item.category,
          subcategory: item.subcategory,
          publishedAt: item.publishedAt,
          imageUrl: item.imageUrl,
          contentHash,
          readingTime: item.readingTime,
          trending: item.trending,
          language: item.language || 'en',
          latitude: geo?.latitude || null,
          longitude: geo?.longitude || null,
          location: geo?.location || null,
          city: geo?.city || null,
          state: geo?.state || null,
          country: geo?.country || null,
        },
      });
      inserted++;
    } catch (e) {
      console.warn(`[Seed] Failed inserting article: ${item.title}`, (e as Error).message);
    }
  }

  // Also seed Sources
  for (const src of FEED_SOURCES) {
    try {
      await prisma.source.upsert({
        where: { feedUrl: src.feedUrl },
        update: { name: src.name, category: src.category, subcategory: src.subcategory },
        create: {
          name: src.name,
          feedUrl: src.feedUrl,
          category: src.category,
          subcategory: src.subcategory,
          sourceType: 'RSS',
          enabled: true,
        },
      });
    } catch (e) {
      console.warn(`[Seed] Source upsert skipped for ${src.name}:`, (e as Error).message);
    }
  }

  // Run clustering across seeded items
  await runClusteringBatch();

  console.log(`[Seed] Successfully seeded ${inserted} initial articles and clustered related stories.`);
  return inserted;
}

export async function refreshAllFeeds(): Promise<{ fetched: number; inserted: number; errors: number }> {
  if (isRefreshing) {
    console.log('[Ingestion] Ingestion cycle already active. Skipping overlapping run.');
    return { fetched: 0, inserted: 0, errors: 0 };
  }

  isRefreshing = true;
  console.log(`[Ingestion] Starting live multi-source RSS refresh across ${FEED_SOURCES.length} sources...`);
  let totalFetched = 0;
  let totalInserted = 0;
  let errorCount = 0;

  try {
    for (const source of FEED_SOURCES) {
      try {
        const items = await fetchFeedItems(source);
        totalFetched += items.length;

        for (const item of items) {
          try {
            if (!item.title || item.title.trim().length < 8 || !item.url) {
              continue;
            }

            // Deduplication Check 1: Unique URL
            const existingByUrl = await prisma.article.findUnique({
              where: { url: item.url },
            });
            if (existingByUrl) {
              continue;
            }

            // Deduplication Check 2: Canonical content hash (title + publisher)
            if (item.contentHash) {
              const existingByHash = await prisma.article.findFirst({
                where: { contentHash: item.contentHash },
              });
              if (existingByHash) {
                continue;
              }
            }

            // Timestamp validation: prevent future timestamp skew
            const validPublishedAt =
              item.publishedAt && !isNaN(item.publishedAt.getTime()) && item.publishedAt.getTime() <= Date.now()
                ? item.publishedAt
                : new Date();

            // Extract real-world geographic coordinates
            const geo = extractArticleLocation(item.title, item.summary, item.content || undefined);

            const sanitizedTitle = sanitizeTextForDb(item.title);
            const sanitizedSummary = sanitizeTextForDb(item.summary);
            const sanitizedContent = sanitizeTextForDb(item.content);

            const created = await prisma.article.create({
              data: {
                title: sanitizedTitle,
                summary: sanitizedSummary,
                content: sanitizedContent || null,
                url: item.url,
                publisher: item.publisher,
                category: item.category,
                subcategory: item.subcategory,
                publishedAt: validPublishedAt,
                imageUrl: item.imageUrl,
                contentHash: item.contentHash,
                readingTime: item.readingTime,
                trending: Math.random() > 0.8,
                language: item.language || 'en',
                latitude: geo?.latitude || null,
                longitude: geo?.longitude || null,
                location: geo?.location || null,
                city: geo?.city || null,
                state: geo?.state || null,
                country: geo?.country || null,
              },
            });
            totalInserted++;

            // Cluster new article asynchronously
            clusterNewArticle(created.id).catch((clusterErr) => {
              console.warn(`[Clustering] Non-blocking cluster error for ${created.id}:`, clusterErr.message);
            });
          } catch (itemErr) {
            console.warn(`[Ingestion] Skipping item "${item.title}":`, (itemErr as Error).message);
          }
        }

        // Update Source tracking record
        try {
          await prisma.source.upsert({
            where: { feedUrl: source.feedUrl },
            update: { lastFetchedAt: new Date(), enabled: true },
            create: {
              name: source.name,
              feedUrl: source.feedUrl,
              category: source.category,
              subcategory: source.subcategory,
              sourceType: 'RSS',
              enabled: true,
              lastFetchedAt: new Date(),
            },
          });
        } catch (srcErr) {
          console.warn(`[Ingestion] Source tracking update skipped for ${source.name}:`, (srcErr as Error).message);
        }
      } catch (err) {
        errorCount++;
        console.error(`[Ingestion] Source error for ${source.name} (${source.feedUrl}):`, (err as Error).message);
      }
    }
  } finally {
    isRefreshing = false;
  }

  console.log(`[Ingestion] Multi-source refresh complete: ${totalFetched} fetched, ${totalInserted} new inserted, ${errorCount} errors.`);
  return { fetched: totalFetched, inserted: totalInserted, errors: errorCount };
}

/**
 * Safe background scheduler for recurring news aggregation
 */
export function startIngestionScheduler(intervalMs = 30 * 60 * 1000): void {
  if (schedulerTimer) return;
  console.log(`[Scheduler] Live news aggregation scheduled to run every ${Math.round(intervalMs / 60000)} minutes.`);
  schedulerTimer = setInterval(() => {
    refreshAllFeeds().catch((err) => {
      console.warn('[Scheduler Background Error]', err.message);
    });
  }, intervalMs);
}

export function stopIngestionScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
