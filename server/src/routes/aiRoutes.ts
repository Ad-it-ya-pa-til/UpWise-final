import { Router, Request, Response } from 'express';
import { generateAiReply, verifyClaimEvidence } from '../services/aiService.js';
import { rateLimit } from '../middlewares/rateLimiter.js';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI Assistant query limit reached for this minute. Please pause for a moment.',
});

router.post('/chat', aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { message, articleContext, language, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    const result = await generateAiReply({
      message: message.trim(),
      articleContext,
      language,
      history,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
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

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
