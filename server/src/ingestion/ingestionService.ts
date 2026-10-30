import prisma from '../db.js';
import { FEED_SOURCES } from './feedConfig.js';
import { fetchFeedItems } from './rssParser.js';
import { clusterNewArticle, runClusteringBatch } from './clustering.js';
import { SEED_ARTICLES } from './seedData.js';
import crypto from 'crypto';

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
        },
      });
      inserted++;
    } catch (e) {
      console.warn(`[Seed] Failed inserting article: ${item.title}`, (e as Error).message);
    }
  }

  // Also seed Sources
  for (const src of FEED_SOURCES) {
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
  }

  // Run clustering across seeded items
  await runClusteringBatch();

  console.log(`[Seed] Successfully seeded ${inserted} initial articles and clustered related stories.`);
  return inserted;
}

export async function refreshAllFeeds(): Promise<{ fetched: number; inserted: number; errors: number }> {
  console.log(`[Ingestion] Starting RSS refresh across ${FEED_SOURCES.length} sources...`);
  let totalFetched = 0;
  let totalInserted = 0;
  let errorCount = 0;

  for (const source of FEED_SOURCES) {
    try {
      const items = await fetchFeedItems(source);
      totalFetched += items.length;

      for (const item of items) {
        try {
          // Upsert article based on unique URL
          const existing = await prisma.article.findUnique({
            where: { url: item.url },
          });

          if (!existing) {
            const validPublishedAt =
              item.publishedAt && !isNaN(item.publishedAt.getTime())
                ? item.publishedAt
                : new Date();

            const created = await prisma.article.create({
              data: {
                title: item.title,
                summary: item.summary,
                content: item.content,
                url: item.url,
                publisher: item.publisher,
                category: item.category,
                subcategory: item.subcategory,
                publishedAt: validPublishedAt,
                imageUrl: item.imageUrl,
                contentHash: item.contentHash,
                readingTime: item.readingTime,
                trending: Math.random() > 0.75, // mark some live stories as trending
                language: item.language || 'en',
              },
            });
            totalInserted++;
            // Cluster new article
            await clusterNewArticle(created.id);
          }
        } catch (itemErr) {
          console.warn(`[Ingestion] Skipping invalid item "${item.title}":`, (itemErr as Error).message);
        }
      }

      await prisma.source.upsert({
        where: { feedUrl: source.feedUrl },
        update: { lastFetchedAt: new Date() },
        create: {
          name: source.name,
          feedUrl: source.feedUrl,
          category: source.category,
          subcategory: source.subcategory,
          sourceType: 'RSS',
          lastFetchedAt: new Date(),
        },
      });
    } catch (err) {
      errorCount++;
      console.error(`[Ingestion] Source error for ${source.name}:`, (err as Error).message);
    }
  }

  console.log(`[Ingestion] Refresh complete: ${totalFetched} fetched, ${totalInserted} new inserted, ${errorCount} errors.`);
  return { fetched: totalFetched, inserted: totalInserted, errors: errorCount };
}
