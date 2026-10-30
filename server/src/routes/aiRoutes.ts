import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateAiReply, verifyClaimEvidence } from '../services/aiService.js';
import { isAiServiceError } from '../services/aiErrors.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import { rateLimit } from '../middlewares/rateLimiter.js';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI Assistant query limit reached for this minute. Please pause for a moment.',
});

const MAX_MESSAGE_CHARS = 4000;

const articleContextSchema = z
  .object({
    id: z.string().max(100).optional(),
    title: z.string().max(300).optional(),
    publisher: z.string().max(200).optional(),
    url: z.string().max(1000).optional(),
    summary: z.string().max(4000).optional(),
    content: z.string().max(20000).optional(),
    category: z.string().max(120).optional(),
    publishedAt: z.string().max(60).optional(),
  })
  .optional();

const historySchema = z
  .array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(MAX_MESSAGE_CHARS),
    })
  )
  .max(12)
  .optional();

const chatRequestSchema = z.object({
  message: z
    .string({ required_error: 'Message cannot be empty' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(MAX_MESSAGE_CHARS, `Message must be ${MAX_MESSAGE_CHARS} characters or fewer`),
  articleContext: articleContextSchema,
  language: z.enum(['en', 'hi']).optional(),
  history: historySchema,
});

function sendAiError(res: Response, error: unknown): void {
  if (isAiServiceError(error)) {
    if (error.retryAfter) {
      res.setHeader('Retry-After', String(error.retryAfter));
    }
    res.status(error.status).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Log only a short server-side marker; never expose stack traces, upstream
  // response bodies or credentials to the client.
  console.error('[AI] Chat request failed unexpectedly.');
  res.status(500).json({
    success: false,
    error: 'The AI assistant is temporarily unavailable. Please try again shortly.',
    code: 'AI_ERROR',
  });
}

router.post('/chat', aiRateLimiter, optionalAuth, async (req: Request, res: Response) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const path = firstIssue?.path?.join('.');
      res.status(400).json({
        success: false,
        error: firstIssue?.message || 'Invalid chat request.',
        code: 'AI_INVALID_REQUEST',
        ...(path ? { field: path } : {}),
      });
      return;
    }

    const result = await generateAiReply({
      message: parsed.data.message,
      articleContext: parsed.data.articleContext,
      language: parsed.data.language,
      history: parsed.data.history,
    });

    res.json(result);
  } catch (error) {
    sendAiError(res, error);
  }
});

// Dedicated Evidence Lens: Real Search Evidence Retrieval & Claim Verification
router.post('/evidence-lens', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { claim, articleContext, language } = req.body;

    if (!claim || typeof claim !== 'string' || claim.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'A claim of at least 3 characters is required to evaluate evidence' });
    }

    const result = await verifyClaimEvidence({
      claim: claim.trim(),
      articleContext,
      language,
    });

    res.json(result);
  } catch (error) {
    console.error('[AI] Evidence Lens request failed.');
    res.status(500).json({ success: false, error: 'Evidence verification is temporarily unavailable. Please try again shortly.' });
  }
});

export default router;
