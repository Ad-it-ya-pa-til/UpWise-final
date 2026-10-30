import { Router, Request, Response } from 'express';
import {
  calculateBalance,
  getCoupons,
  findCouponById,
  decrementCouponInventory,
  generateCouponCode,
  saveCouponRedemption,
  getUserRedemptions,
  markCouponAsUsed,
  recordRewardTransaction,
} from '../services/learningStore.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import crypto from 'crypto';

const router = Router();

function getActor(req: Request) {
  const userId = req.user?.id || (req.headers['x-user-id'] as string) || null;
  const guestSessionId = (req.headers['x-guest-session'] as string) || null;
  return { userId, guestSessionId };
}

// GET /api/rewards/balance
router.get('/balance', optionalAuth, async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const balanceInfo = await calculateBalance(actor);
    res.json({
      success: true,
      data: balanceInfo,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/rewards/coupons
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await getCoupons();
    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/rewards/redeem
router.post('/redeem', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { couponId } = req.body;
    if (!couponId) {
      res.status(400).json({ success: false, error: 'couponId is required.' });
      return;
    }

    const actor = getActor(req);
    if (!actor.userId && !actor.guestSessionId) {
      res.status(400).json({ success: false, error: 'User session or guest session required.' });
      return;
    }

    const coupon = await findCouponById(couponId);
    if (!coupon || !coupon.isActive) {
      res.status(404).json({ success: false, error: 'Coupon not found or inactive.' });
      return;
    }

    if (coupon.inventory <= 0) {
      res.status(400).json({ success: false, error: 'Coupon is out of stock.' });
      return;
    }

    // Atomic balance verification: user balance >= coupon cost
    const { availableBalance } = await calculateBalance(actor);
    if (availableBalance < coupon.pointsCost) {
      res.status(400).json({
        success: false,
        error: `Insufficient UP Points balance. You have ${availableBalance} UP Points, but ${coupon.pointsCost} UP Points are required.`,
        requiredPoints: coupon.pointsCost,
        currentBalance: availableBalance,
      });
      return;
    }

    // 1. Deduct points via negative transaction record
    const txId = `tx_red_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await recordRewardTransaction({
      id: txId,
      userId: actor.userId,
      guestSessionId: actor.guestSessionId,
      quizAttemptId: null,
      points: -coupon.pointsCost, // Negative for debit
      type: 'COUPON_REDEMPTION',
      description: `Redeemed Coupon: ${coupon.title} (${coupon.brand})`,
      createdAt: new Date().toISOString(),
    });

    // 2. Decrement coupon inventory
    await decrementCouponInventory(coupon.id);

    // 3. Cryptographically generate unique coupon code: UPW-<PREFIX>-<HEX>-<NUM>
    const couponCode = generateCouponCode(coupon.codePrefix);

    // 4. Save to user's redeemed collection with expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + coupon.validityDays * 24 * 60 * 60 * 1000);

    const redemptionId = `red_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const redemption = await saveCouponRedemption({
      id: redemptionId,
      userId: actor.userId,
      guestSessionId: actor.guestSessionId,
      couponId: coupon.id,
      couponCode,
      pointsSpent: coupon.pointsCost,
      status: 'available',
      redeemedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      coupon,
    });

    // 5. Fetch updated balance
    const updatedBalance = await calculateBalance(actor);

    res.json({
      success: true,
      message: `Successfully redeemed ${coupon.title}!`,
      data: {
        redemption,
        newBalance: updatedBalance.availableBalance,
        totalEarned: updatedBalance.totalEarned,
        totalSpent: updatedBalance.totalSpent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/rewards/my-coupons
router.get('/my-coupons', optionalAuth, async (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const redemptions = await getUserRedemptions(actor);
    res.json({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/rewards/my-coupons/:id/use
router.post('/my-coupons/:id/use', optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await markCouponAsUsed(id);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Redeemed coupon not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Coupon marked as used.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
