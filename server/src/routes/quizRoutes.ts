import { Router, Request, Response } from 'express';
import {
  generateQuizForDateRange,
  generateFlashcardsForDateRange,
  evaluateQuizSubmission,
  DateFilterRange,
} from '../services/learningService.js';
import { findQuizById } from '../services/learningStore.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Helper to sanitize quiz questions for public viewing (CRITICAL API SECURITY RULE)
export function sanitizePublicQuiz(quiz: any) {
  return {
    id: quiz.id,
    title: quiz.title,
    quizType: quiz.quizType,
    startDate: quiz.startDate,
    endDate: quiz.endDate,
    learningSummary: quiz.learningSummary,
    questions: quiz.questions.map((q: any) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      sourceArticleId: q.sourceArticleId,
      sourceArticleTitle: q.sourceArticleTitle,
      sourceUrl: q.sourceUrl,
      sourcePublisher: q.sourcePublisher,
      // NOTE: correctAnswer and explanation are strictly stripped!
    })),
  };
}

// POST /api/quizzes/generate-by-date
router.post('/generate-by-date', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { preset, startDate, endDate, topic, count } = req.body as DateFilterRange;
    const result = await generateQuizForDateRange({ preset, startDate, endDate, topic, count });

    if (!result.success || !result.quiz) {
      res.status(result.code === 'NO_ARTICLES' ? 404 : 400).json({
        success: false,
        code: result.code || 'GENERATION_FAILED',
        error: result.message || 'Could not generate quiz for selected date range.',
      });
      return;
    }

    res.json({
      success: true,
      data: sanitizePublicQuiz(result.quiz),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/quizzes/flashcards/generate-by-date
router.post('/flashcards/generate-by-date', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { preset, startDate, endDate, topic, count } = req.body as DateFilterRange;
    const result = await generateFlashcardsForDateRange({ preset, startDate, endDate, topic, count });

    if (!result.success || !result.flashcards) {
      res.status(result.code === 'NO_ARTICLES' ? 404 : 400).json({
        success: false,
        code: result.code || 'GENERATION_FAILED',
        error: result.message || 'Could not generate flashcards for selected date range.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        flashcards: result.flashcards,
        dateLabel: result.dateLabel,
        totalArticles: result.totalArticles,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/quizzes/:id
// CRITICAL API SECURITY RULE: Public endpoint GET /api/quizzes/:id must NEVER expose correctAnswer or explanation
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const quiz = await findQuizById(id);

    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    res.json({
      success: true,
      data: sanitizePublicQuiz(quiz),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { quizAttemptId, answers, timeTaken } = req.body;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid submission payload. "answers" object is required.',
      });
      return;
    }

    const userId = req.user?.id || (req.headers['x-user-id'] as string) || null;
    const guestSessionId = (req.headers['x-guest-session'] as string) || null;

    const result = await evaluateQuizSubmission(
      id,
      {
        quizAttemptId,
        answers,
        timeTaken: Number(timeTaken) || 0,
      },
      { userId, guestSessionId }
    );

    if (!result) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
