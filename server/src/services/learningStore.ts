import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../db.js';

export interface StoredQuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceArticleId?: string | null;
  sourceArticleTitle?: string | null;
  sourceUrl?: string | null;
  sourcePublisher?: string | null;
}

export interface StoredQuiz {
  id: string;
  title: string;
  quizType: 'date_range' | 'daily';
  startDate?: string | null;
  endDate?: string | null;
  learningSummary?: string | null;
  questions: StoredQuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredQuizAttempt {
  id: string;
  userId?: string | null;
  guestSessionId?: string | null;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: Record<string, number>;
  completedAt: string;
}

export interface StoredRewardTransaction {
  id: string;
  userId?: string | null;
  guestSessionId?: string | null;
  quizAttemptId?: string | null;
  points: number; // positive for credit, negative for debit
  type: 'QUIZ_COMPLETION' | 'COUPON_REDEMPTION';
  description: string;
  createdAt: string;
}

export interface StoredCoupon {
  id: string;
  codePrefix: string;
  title: string;
  brand: string;
  description: string;
  discountText: string;
  pointsCost: number;
  terms: string;
  validityDays: number;
  isActive: boolean;
  inventory: number;
}

export interface StoredCouponRedemption {
  id: string;
  userId?: string | null;
  guestSessionId?: string | null;
  couponId: string;
  couponCode: string;
  pointsSpent: number;
  status: 'available' | 'used' | 'expired';
  redeemedAt: string;
  expiresAt: string;
  usedAt?: string | null;
  coupon?: StoredCoupon;
}

export interface StoredFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  sourceArticleId?: string;
  sourceArticleTitle: string;
  sourcePublisher: string;
  sourceUrl: string;
  publishedAt: string;
}

function resolveDataDir(): string {
  const cwd = process.cwd();
  if (path.basename(cwd) === 'server') {
    return path.resolve(cwd, 'data');
  }
  return path.resolve(cwd, 'server', 'data');
}

const DATA_DIR = resolveDataDir();
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'quiz_attempts.json');
const REWARDS_FILE = path.join(DATA_DIR, 'rewards.json');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const REDEMPTIONS_FILE = path.join(DATA_DIR, 'coupon_redemptions.json');

let writeQueue = Promise.resolve();
function queueWrite<T>(op: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(op);
  writeQueue = result.then(() => { }, () => { });
  return result;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' && process.env.NODE_ENV !== 'test');
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    await writeJsonFile(filePath, fallback);
    return fallback;
  }
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[LearningStore] Failed reading ${path.basename(filePath)}, resetting:`, (err as Error).message);
    await writeJsonFile(filePath, fallback);
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  ensureDataDir();
  return queueWrite(async () => {
    const tmp = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
    await fs.promises.rename(tmp, filePath);
  });
}

// -------------------------------------------------------------
// Seed Coupons Catalog
// -------------------------------------------------------------
export function getDefaultCoupons(): StoredCoupon[] {
  return [
    {
      id: 'coupon-notebook-free',
      codePrefix: 'NOTEBOOK',
      title: 'Free Digital Revision Notebook',
      brand: 'UpWise Editorial Press',
      description: 'Unlock an interactive digital current affairs revision notebook with curated highlights, timelines, and analytical notes.',
      discountText: 'FREE ACCESS',
      pointsCost: 50,
      terms: 'Instant digital access. Valid across web and mobile viewports for 60 days.',
      validityDays: 60,
      isActive: true,
      inventory: 9999,
    },
    {
      id: 'coupon-books-50',
      codePrefix: 'BOOKS50',
      title: '₹50 Off Student Books',
      brand: 'KitabKhana & Academic Books',
      description: 'Flat ₹50 discount on any academic textbook, current affairs compendium, or UPSC/civil services prep material.',
      discountText: '₹50 OFF',
      pointsCost: 100,
      terms: 'Valid on purchases above ₹299. Single-use per student order. Valid for 60 days from redemption.',
      validityDays: 60,
      isActive: true,
      inventory: 500,
    },
    {
      id: 'coupon-journal-15',
      codePrefix: 'JOURNAL15',
      title: '15% Off Academic Journal Archive',
      brand: 'National Editorial Review',
      description: '15% off subscription to quarterly peer-reviewed policy journals, legal digests, and historical archives.',
      discountText: '15% OFF',
      pointsCost: 150,
      terms: 'Applicable on monthly, quarterly, and annual academic research tiers.',
      validityDays: 60,
      isActive: true,
      inventory: 300,
    },
    {
      id: 'coupon-campus-100',
      codePrefix: 'CAMPUS100',
      title: '₹100 Off Campus Bookstore',
      brand: 'Campus Book Haven',
      description: 'Flat ₹100 instant deduction on university textbooks, stationery sets, and research monographs.',
      discountText: '₹100 OFF',
      pointsCost: 200,
      terms: 'Minimum cart value ₹500 at participating college bookstores and partner university outlets.',
      validityDays: 60,
      isActive: true,
      inventory: 250,
    },
    {
      id: 'coupon-mock-20',
      codePrefix: 'MOCK20',
      title: '20% Off Mock Test Series',
      brand: 'Socrates Editorial Learning',
      description: '20% waiver on comprehensive current affairs analytical test series and weekly question simulations.',
      discountText: '20% OFF',
      pointsCost: 250,
      terms: 'Valid for all 2026 examination batches and analytical revision packs.',
      validityDays: 60,
      isActive: true,
      inventory: 150,
    },
  ];
}

// -------------------------------------------------------------
// Coupon Store Operations
// -------------------------------------------------------------
export async function getCoupons(): Promise<StoredCoupon[]> {
  if (hasDatabase()) {
    try {
      const dbCoupons = await prisma.coupon.findMany({
        where: { isActive: true },
        orderBy: { pointsCost: 'asc' },
      });
      if (dbCoupons.length > 0) {
        return dbCoupons as StoredCoupon[];
      }
    } catch {
      // Database offline or uninitialized
    }
  }

  const coupons = await readJsonFile<StoredCoupon[]>(COUPONS_FILE, getDefaultCoupons());
  if (coupons.length === 0) {
    const defaults = getDefaultCoupons();
    await writeJsonFile(COUPONS_FILE, defaults);
    return defaults;
  }
  return coupons.filter((c) => c.isActive);
}

export async function findCouponById(id: string): Promise<StoredCoupon | null> {
  if (hasDatabase()) {
    try {
      const dbCoupon = await prisma.coupon.findUnique({ where: { id } });
      if (dbCoupon) return dbCoupon as StoredCoupon;
    } catch {
      // Fallback
    }
  }

  const coupons = await getCoupons();
  return coupons.find((c) => c.id === id) || null;
}

export async function decrementCouponInventory(couponId: string): Promise<void> {
  if (hasDatabase()) {
    try {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { inventory: { decrement: 1 } },
      });
    } catch {
      // Fallback
    }
  }

  const coupons = await readJsonFile<StoredCoupon[]>(COUPONS_FILE, getDefaultCoupons());
  const updated = coupons.map((c) => (c.id === couponId ? { ...c, inventory: Math.max(0, c.inventory - 1) } : c));
  await writeJsonFile(COUPONS_FILE, updated);
}

// -------------------------------------------------------------
// Quiz Storage Operations
// -------------------------------------------------------------
export async function saveQuiz(quiz: StoredQuiz): Promise<StoredQuiz> {
  if (hasDatabase()) {
    try {
      const created = await prisma.quiz.create({
        data: {
          id: quiz.id,
          title: quiz.title,
          quizType: quiz.quizType,
          startDate: quiz.startDate || null,
          endDate: quiz.endDate || null,
          learningSummary: quiz.learningSummary || null,
          questions: {
            create: quiz.questions.map((q) => ({
              id: q.id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              sourceArticleId: q.sourceArticleId || null,
              sourceArticleTitle: q.sourceArticleTitle || null,
              sourceUrl: q.sourceUrl || null,
            })),
          },
        },
        include: { questions: true },
      });
      return {
        ...quiz,
        id: created.id,
      };
    } catch {
      // Fallback to JSON store
    }
  }

  const quizzes = await readJsonFile<StoredQuiz[]>(QUIZZES_FILE, []);
  quizzes.push(quiz);
  await writeJsonFile(QUIZZES_FILE, quizzes);
  return quiz;
}

export async function findQuizById(id: string): Promise<StoredQuiz | null> {
  if (hasDatabase()) {
    try {
      const dbQuiz = await prisma.quiz.findUnique({
        where: { id },
        include: { questions: true },
      });
      if (dbQuiz) {
        return {
          id: dbQuiz.id,
          title: dbQuiz.title,
          quizType: dbQuiz.quizType as 'date_range' | 'daily',
          startDate: dbQuiz.startDate,
          endDate: dbQuiz.endDate,
          learningSummary: dbQuiz.learningSummary,
          createdAt: dbQuiz.createdAt.toISOString(),
          updatedAt: dbQuiz.updatedAt.toISOString(),
          questions: dbQuiz.questions.map((q) => ({
            id: q.id,
            quizId: q.quizId,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sourceArticleId: q.sourceArticleId,
            sourceArticleTitle: q.sourceArticleTitle,
            sourceUrl: q.sourceUrl,
          })),
        };
      }
    } catch {
      // Fallback
    }
  }

  const quizzes = await readJsonFile<StoredQuiz[]>(QUIZZES_FILE, []);
  return quizzes.find((q) => q.id === id) || null;
}

export async function saveQuizAttempt(attempt: StoredQuizAttempt): Promise<StoredQuizAttempt> {
  if (hasDatabase()) {
    try {
      await prisma.quizAttempt.create({
        data: {
          id: attempt.id,
          userId: attempt.userId || null,
          guestSessionId: attempt.guestSessionId || null,
          quizId: attempt.quizId,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          correctAnswers: attempt.correctAnswers,
          timeTaken: attempt.timeTaken,
          answers: attempt.answers as any,
          completedAt: new Date(attempt.completedAt),
        },
      });
    } catch {
      // Fallback
    }
  }

  const attempts = await readJsonFile<StoredQuizAttempt[]>(ATTEMPTS_FILE, []);
  attempts.push(attempt);
  await writeJsonFile(ATTEMPTS_FILE, attempts);
  return attempt;
}

// -------------------------------------------------------------
// Reward Ledger & Balance (Auditable Balance Engine)
// -------------------------------------------------------------
export async function getLedgerTransactions(actor: {
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<StoredRewardTransaction[]> {
  const { userId, guestSessionId } = actor;

  if (hasDatabase()) {
    try {
      const where: any = {};
      if (userId) {
        where.userId = userId;
      } else if (guestSessionId) {
        where.guestSessionId = guestSessionId;
      } else {
        return [];
      }

      const dbTx = await prisma.rewardTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      if (dbTx.length > 0) {
        return dbTx.map((t) => ({
          id: t.id,
          userId: t.userId,
          guestSessionId: t.guestSessionId,
          quizAttemptId: t.quizAttemptId,
          points: t.points,
          type: t.type as 'QUIZ_COMPLETION' | 'COUPON_REDEMPTION',
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        }));
      }
    } catch {
      // Fallback to JSON store
    }
  }

  const allTx = await readJsonFile<StoredRewardTransaction[]>(REWARDS_FILE, []);
  return allTx
    .filter((tx) => {
      if (userId && tx.userId === userId) return true;
      if (!userId && guestSessionId && tx.guestSessionId === guestSessionId) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function calculateBalance(actor: {
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<{
  availableBalance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: StoredRewardTransaction[];
}> {
  const transactions = await getLedgerTransactions(actor);

  let totalEarned = 0;
  let totalSpent = 0;

  for (const tx of transactions) {
    if (tx.points > 0) {
      totalEarned += tx.points;
    } else if (tx.points < 0) {
      totalSpent += Math.abs(tx.points);
    }
  }

  const availableBalance = Math.max(0, totalEarned - totalSpent);

  return {
    availableBalance,
    totalEarned,
    totalSpent,
    transactions,
  };
}

export async function isAttemptAlreadyRewarded(quizAttemptId: string): Promise<boolean> {
  if (hasDatabase()) {
    try {
      const existing = await prisma.rewardTransaction.findFirst({
        where: { quizAttemptId },
      });
      if (existing) return true;
    } catch {
      // Fallback
    }
  }

  const allTx = await readJsonFile<StoredRewardTransaction[]>(REWARDS_FILE, []);
  return allTx.some((t) => t.quizAttemptId === quizAttemptId);
}

export async function recordRewardTransaction(tx: StoredRewardTransaction): Promise<StoredRewardTransaction> {
  if (hasDatabase()) {
    try {
      await prisma.rewardTransaction.create({
        data: {
          id: tx.id,
          userId: tx.userId || null,
          guestSessionId: tx.guestSessionId || null,
          quizAttemptId: tx.quizAttemptId || null,
          points: tx.points,
          type: tx.type,
          description: tx.description,
          createdAt: new Date(tx.createdAt),
        },
      });

      if (tx.userId) {
        await prisma.user.update({
          where: { id: tx.userId },
          data: { pointsBalance: { increment: tx.points } },
        }).catch(() => { });
      }
    } catch {
      // Fallback
    }
  }

  const allTx = await readJsonFile<StoredRewardTransaction[]>(REWARDS_FILE, []);
  allTx.push(tx);
  await writeJsonFile(REWARDS_FILE, allTx);
  return tx;
}

// -------------------------------------------------------------
// Coupon Redemptions
// -------------------------------------------------------------
export function generateCouponCode(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'UPW';
  const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `UPW-${cleanPrefix}-${hex}-${num}`;
}

export async function saveCouponRedemption(redemption: StoredCouponRedemption): Promise<StoredCouponRedemption> {
  if (hasDatabase()) {
    try {
      await prisma.couponRedemption.create({
        data: {
          id: redemption.id,
          userId: redemption.userId || null,
          guestSessionId: redemption.guestSessionId || null,
          couponId: redemption.couponId,
          couponCode: redemption.couponCode,
          pointsSpent: redemption.pointsSpent,
          status: redemption.status,
          redeemedAt: new Date(redemption.redeemedAt),
          expiresAt: new Date(redemption.expiresAt),
          usedAt: redemption.usedAt ? new Date(redemption.usedAt) : null,
        },
      });
    } catch {
      // Fallback
    }
  }

  const redemptions = await readJsonFile<StoredCouponRedemption[]>(REDEMPTIONS_FILE, []);
  redemptions.push(redemption);
  await writeJsonFile(REDEMPTIONS_FILE, redemptions);
  return redemption;
}

export async function getUserRedemptions(actor: {
  userId?: string | null;
  guestSessionId?: string | null;
}): Promise<StoredCouponRedemption[]> {
  const coupons = await getCoupons();
  const couponMap = new Map<string, StoredCoupon>(coupons.map((c) => [c.id, c]));

  if (hasDatabase()) {
    try {
      const where: any = {};
      if (actor.userId) {
        where.userId = actor.userId;
      } else if (actor.guestSessionId) {
        where.guestSessionId = actor.guestSessionId;
      } else {
        return [];
      }

      const dbRedemptions = await prisma.couponRedemption.findMany({
        where,
        include: { coupon: true },
        orderBy: { redeemedAt: 'desc' },
      });

      if (dbRedemptions.length > 0) {
        const now = new Date();
        return dbRedemptions.map((r) => {
          const expiresAtDate = new Date(r.expiresAt);
          let status = r.status as 'available' | 'used' | 'expired';
          if (status === 'available' && expiresAtDate < now) {
            status = 'expired';
          }
          return {
            id: r.id,
            userId: r.userId,
            guestSessionId: r.guestSessionId,
            couponId: r.couponId,
            couponCode: r.couponCode,
            pointsSpent: r.pointsSpent,
            status,
            redeemedAt: r.redeemedAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
            usedAt: r.usedAt ? r.usedAt.toISOString() : null,
            coupon: (r.coupon as unknown as StoredCoupon) || couponMap.get(r.couponId),
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  const redemptions = await readJsonFile<StoredCouponRedemption[]>(REDEMPTIONS_FILE, []);
  const now = new Date();

  return redemptions
    .filter((r) => {
      if (actor.userId && r.userId === actor.userId) return true;
      if (!actor.userId && actor.guestSessionId && r.guestSessionId === actor.guestSessionId) return true;
      return false;
    })
    .map((r) => {
      const expiresAtDate = new Date(r.expiresAt);
      let status = r.status;
      if (status === 'available' && expiresAtDate < now) {
        status = 'expired';
      }
      return {
        ...r,
        status,
        coupon: r.coupon || couponMap.get(r.couponId),
      };
    })
    .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
}

export async function markCouponAsUsed(id: string): Promise<StoredCouponRedemption | null> {
  const nowStr = new Date().toISOString();

  try {
    const updated = await prisma.couponRedemption.update({
      where: { id },
      data: {
        status: 'used',
        usedAt: new Date(nowStr),
      },
      include: { coupon: true },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      guestSessionId: updated.guestSessionId,
      couponId: updated.couponId,
      couponCode: updated.couponCode,
      pointsSpent: updated.pointsSpent,
      status: 'used',
      redeemedAt: updated.redeemedAt.toISOString(),
      expiresAt: updated.expiresAt.toISOString(),
      usedAt: nowStr,
      coupon: updated.coupon as unknown as StoredCoupon,
    };
  } catch {
    // Fallback
  }

  const redemptions = await readJsonFile<StoredCouponRedemption[]>(REDEMPTIONS_FILE, []);
  let found: StoredCouponRedemption | null = null;
  const updatedList = redemptions.map((r) => {
    if (r.id === id) {
      found = { ...r, status: 'used', usedAt: nowStr };
      return found;
    }
    return r;
  });

  if (found) {
    await writeJsonFile(REDEMPTIONS_FILE, updatedList);
  }
  return found;
}

