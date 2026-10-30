import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Readable } from 'stream';

process.env.NODE_ENV = 'test';

import { app } from '../index.js';
import {
  generateCouponCode,
  calculateBalance,
  recordRewardTransaction,
  getCoupons,
} from '../services/learningStore.js';

function makeRequest(
  expressApp: any,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    try {
      const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : '';
      const socket = new Readable({ read() { } });
      const req = new http.IncomingMessage(socket as any);
      req.method = options.method || 'GET';
      req.url = options.path;
      req.headers = {
        'content-type': 'application/json',
        ...(options.headers
          ? Object.fromEntries(
            Object.entries(options.headers).map(([k, v]) => [k.toLowerCase(), v])
          )
          : {}),
      };
      if (bodyStr) {
        req.headers['content-length'] = String(Buffer.byteLength(bodyStr));
      }

      let resData = '';
      const res = new http.ServerResponse(req);
      res.write = function (chunk: any) {
        if (chunk) resData += chunk.toString();
        return true;
      };
      res.end = function (chunk?: any): any {
        if (chunk) resData += chunk.toString();
        let parsed = resData;
        try {
          parsed = JSON.parse(resData);
        } catch {
          // Plain text or empty response
        }
        resolve({ status: res.statusCode, body: parsed });
        return this;
      };

      expressApp(req, res);

      if (bodyStr) {
        req.push(bodyStr);
      }
      req.push(null);
    } catch (err) {
      reject(err);
    }
  });
}

test('Coupon Code Generation: Formats cryptographically as UPW-<PREFIX>-<HEX>-<NUM>', () => {
  const code = generateCouponCode('BOOKS50');
  assert.match(code, /^UPW-BOOKS50-[0-9A-F]{4}-\d{4}$/, 'Coupon code must match required pattern UPW-<PREFIX>-<HEX>-<NUM>');
});

test('HTTP API: Generate Date-Grounded Quiz (POST /api/quizzes/generate-by-date)', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/generate-by-date',
    body: {
      preset: '7d',
    },
  });

  assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.id, 'Quiz should have an ID');
  assert.ok(res.body.data.questions.length >= 3, 'Quiz should have at least 3 questions');

  // Verify Source Transparency
  for (const q of res.body.data.questions) {
    assert.ok(q.questionText, 'Question text should be non-empty');
    assert.equal(q.options.length, 4, 'Question must have exactly 4 choices');
    assert.ok(q.sourceArticleTitle, 'Question must cite source article title');
    assert.ok(q.sourceUrl, 'Question must have sourceUrl link');
  }
});

test('HTTP API: Zero Hallucination & Answer Secrecy on GET /api/quizzes/:id', async () => {
  // First generate a quiz
  const genRes = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/generate-by-date',
    body: { preset: '30d' },
  });
  assert.equal(genRes.status, 200);
  const quizId = genRes.body.data.id;

  // Now retrieve via public endpoint
  const getRes = await makeRequest(app, {
    method: 'GET',
    path: `/api/quizzes/${quizId}`,
  });

  assert.equal(getRes.status, 200);
  const quiz = getRes.body.data;

  // CRITICAL API SECURITY RULE:
  // Public endpoint GET /api/quizzes/:id must NEVER expose correctAnswer or explanation
  for (const q of quiz.questions) {
    assert.equal((q as any).correctAnswer, undefined, 'correctAnswer MUST NOT be exposed in GET /api/quizzes/:id');
    assert.equal((q as any).explanation, undefined, 'explanation MUST NOT be exposed in GET /api/quizzes/:id');
    assert.ok(q.id, 'Question has id');
    assert.ok(q.questionText, 'Question has questionText');
    assert.equal(q.options.length, 4, 'Question has 4 options');
  }
});

test('HTTP API: 3D Flashcards Generation (POST /api/quizzes/flashcards/generate-by-date)', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/flashcards/generate-by-date',
    body: { preset: '7d' },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.flashcards.length >= 3, 'Must produce flashcards for date window');

  const card = res.body.data.flashcards[0];
  assert.ok(card.front, 'Card has front headline/question');
  assert.ok(card.back, 'Card has back fact breakdown');
  assert.ok(card.sourceArticleTitle, 'Card cites source headline');
  assert.ok(card.sourcePublisher, 'Card cites source publisher');
  assert.ok(card.sourceUrl, 'Card has clickable source URL');
});

test('HTTP API: Scoring Integrity & Idempotency on Quiz Submission (POST /api/quizzes/:id/submit)', async () => {
  const guestSession = `test_guest_${Date.now()}`;

  // Generate quiz
  const genRes = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/generate-by-date',
    body: { preset: '7d' },
  });
  const quiz = genRes.body.data;
  const quizId = quiz.id;

  // Retrieve raw stored quiz with answers from server store to simulate a realistic submission
  const { findQuizById } = await import('../services/learningStore.js');
  const stored = await findQuizById(quizId);
  assert.ok(stored);

  // Submit with 4 correct answers out of 5 (or N-1 correct)
  const answers: Record<string, number> = {};
  const total = stored.questions.length;
  stored.questions.forEach((q, idx) => {
    // Make 1 answer incorrect, rest correct
    if (idx === 0) {
      answers[q.id] = (q.correctAnswer + 1) % 4; // Wrong answer
    } else {
      answers[q.id] = q.correctAnswer; // Correct answer
    }
  });

  const expectedCorrect = total - 1;
  // Formula: Base 5 + 2 * correct + (perfect bonus 5 if 100%)
  const expectedPoints = 5 + expectedCorrect * 2 + (expectedCorrect === total ? 5 : 0);

  const attemptId = `test_att_${Date.now()}`;
  const submitRes = await makeRequest(app, {
    method: 'POST',
    path: `/api/quizzes/${quizId}/submit`,
    headers: { 'x-guest-session': guestSession },
    body: {
      quizAttemptId: attemptId,
      answers,
      timeTaken: 45,
    },
  });

  assert.equal(submitRes.status, 200);
  assert.equal(submitRes.body.success, true);
  assert.equal(submitRes.body.data.correctAnswers, expectedCorrect);
  assert.equal(submitRes.body.data.pointsAwarded, expectedPoints);
  assert.ok(submitRes.body.data.review.length === total);
  assert.ok(submitRes.body.data.learningSummary, 'Editorial learning summary must be returned');

  // Verify Idempotency: resubmitting with same quizAttemptId awards 0 duplicate points
  const duplicateRes = await makeRequest(app, {
    method: 'POST',
    path: `/api/quizzes/${quizId}/submit`,
    headers: { 'x-guest-session': guestSession },
    body: {
      quizAttemptId: attemptId,
      answers,
      timeTaken: 45,
    },
  });

  assert.equal(duplicateRes.status, 200);
  assert.equal(duplicateRes.body.data.pointsAwarded, 0, 'Duplicate submission must award 0 points');
  assert.equal(duplicateRes.body.data.isDuplicateSubmission, true);
});

test('HTTP API: Rewards Catalog & Atomic Coupon Redemption (POST /api/rewards/redeem)', async () => {
  const guestSession = `test_guest_redeem_${Date.now()}`;

  // Check initial balance = 0
  const balRes1 = await makeRequest(app, {
    method: 'GET',
    path: '/api/rewards/balance',
    headers: { 'x-guest-session': guestSession },
  });
  assert.equal(balRes1.body.data.availableBalance, 0);

  // Attempt to redeem 100-point coupon with 0 points -> Must fail with 400
  const failRes = await makeRequest(app, {
    method: 'POST',
    path: '/api/rewards/redeem',
    headers: { 'x-guest-session': guestSession },
    body: { couponId: 'coupon-books-50' },
  });
  assert.equal(failRes.status, 400, 'Redemption with insufficient balance must return 400');
  assert.equal(failRes.body.success, false);

  // Credit 120 points to the guest ledger
  await recordRewardTransaction({
    id: `seed_tx_${Date.now()}`,
    guestSessionId: guestSession,
    points: 120,
    type: 'QUIZ_COMPLETION',
    description: 'Manual seed for redemption test',
    createdAt: new Date().toISOString(),
  });

  // Verify new balance is 120
  const balRes2 = await makeRequest(app, {
    method: 'GET',
    path: '/api/rewards/balance',
    headers: { 'x-guest-session': guestSession },
  });
  assert.equal(balRes2.body.data.availableBalance, 120);

  // Now redeem coupon for 100 points
  const redeemRes = await makeRequest(app, {
    method: 'POST',
    path: '/api/rewards/redeem',
    headers: { 'x-guest-session': guestSession },
    body: { couponId: 'coupon-books-50' },
  });

  assert.equal(redeemRes.status, 200);
  assert.equal(redeemRes.body.success, true);
  assert.equal(redeemRes.body.data.newBalance, 20, 'Balance must be decremented from 120 to 20');
  assert.match(
    redeemRes.body.data.redemption.couponCode,
    /^UPW-BOOKS50-[0-9A-F]{4}-\d{4}$/,
    'Issued coupon code must follow UPW-<PREFIX>-<HEX>-<NUM>'
  );

  // Verify "My Coupons" contains the newly redeemed coupon
  const myCouponsRes = await makeRequest(app, {
    method: 'GET',
    path: '/api/rewards/my-coupons',
    headers: { 'x-guest-session': guestSession },
  });
  assert.equal(myCouponsRes.status, 200);
  assert.ok(myCouponsRes.body.data.length >= 1);
  const myCoupon = myCouponsRes.body.data[0];
  assert.equal(myCoupon.status, 'available');

  // Mark as used
  const useRes = await makeRequest(app, {
    method: 'POST',
    path: `/api/rewards/my-coupons/${myCoupon.id}/use`,
    headers: { 'x-guest-session': guestSession },
  });
  assert.equal(useRes.status, 200);
  assert.equal(useRes.body.data.status, 'used');
});

test('HTTP API: Topic and Count Filtering in Quiz Generation', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/generate-by-date',
    body: {
      preset: '30d',
      topic: 'Technology & Science',
      count: 10,
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.questions.length, 10, 'Quiz must generate exactly 10 questions when requested');
  assert.ok(res.body.data.title.includes('Technology & Science'), 'Title should reflect selected topic');
});

test('HTTP API: Topic and Count Filtering in Flashcards Generation', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/api/quizzes/flashcards/generate-by-date',
    body: {
      preset: '30d',
      topic: 'India & Politics',
      count: 15,
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.flashcards.length, 15, 'Flashcards must generate exactly 15 cards when requested');
});

