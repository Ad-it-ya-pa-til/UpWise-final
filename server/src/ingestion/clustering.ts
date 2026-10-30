import prisma from '../db.js';

// Common English stopwords to ignore in title similarity
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'about', 'after', 'against', 'all', 'also', 'amid', 'before',
  'between', 'both', 'but', 'during', 'into', 'more', 'new', 'no', 'not', 'only',
  'or', 'other', 'over', 'says', 'than', 'their', 'then', 'there', 'these',
  'they', 'this', 'through', 'under', 'up', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'would'
]);

export function tokenizeTitle(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return intersectionCount / unionSize;
}

export async function clusterNewArticle(articleId: string): Promise<void> {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { clusters: true },
    });

    if (!article) return;
    if (article.clusters.length > 0) return; // already clustered

    const articleTokens = tokenizeTitle(article.title);
    if (articleTokens.size < 3) return;

    // Search for articles in the same category within +/- 48 hours
    const minDate = new Date(article.publishedAt.getTime() - 48 * 60 * 60 * 1000);
    const maxDate = new Date(article.publishedAt.getTime() + 48 * 60 * 60 * 1000);

    const candidates = await prisma.article.findMany({
      where: {
        id: { not: article.id },
        category: article.category,
        publisher: { not: article.publisher }, // from a different publisher!
        publishedAt: {
          gte: minDate,
          lte: maxDate,
        },
      },
      include: {
        clusters: {
          include: {
            cluster: true,
          },
        },
      },
    });

    let bestMatch: { candidateId: string; clusterId?: string; similarity: number } | null = null;
    const SIMILARITY_THRESHOLD = 0.35; // Good balance for headlines

    for (const candidate of candidates) {
      const candidateTokens = tokenizeTitle(candidate.title);
      const similarity = calculateJaccardSimilarity(articleTokens, candidateTokens);

      if (similarity >= SIMILARITY_THRESHOLD) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = {
            candidateId: candidate.id,
            clusterId: candidate.clusters[0]?.clusterId,
            similarity,
          };
        }
      }
    }

    if (bestMatch) {
      let targetClusterId = bestMatch.clusterId;

      if (!targetClusterId) {
        // Create a new cluster grouping both articles
        const newCluster = await prisma.storyCluster.create({
          data: {
            canonicalTitle: article.title,
            summary: article.summary,
            category: article.category,
            members: {
              create: [
                { articleId: bestMatch.candidateId },
                { articleId: article.id },
              ],
            },
          },
        });
        targetClusterId = newCluster.id;
      } else {
        // Add current article to existing cluster
        await prisma.articleClusterMember.upsert({
          where: {
            articleId_clusterId: {
              articleId: article.id,
              clusterId: targetClusterId,
            },
          },
          update: {},
          create: {
            articleId: article.id,
            clusterId: targetClusterId,
          },
        });
      }
    }
  } catch (error) {
    console.error(`[Clustering] Error clustering article ${articleId}:`, (error as Error).message);
  }
}

export async function runClusteringBatch(): Promise<void> {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 100,
    select: { id: true },
  });

  for (const a of articles) {
    await clusterNewArticle(a.id);
  }
}
