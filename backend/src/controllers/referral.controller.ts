import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * GET /api/referrals/creator/me (or /api/referrals/creator/:creatorId?)
 * Returns creator's referral code, link, summary metrics, and list of referred signups
 */
export const getCreatorReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { creatorId } = req.params;

    let targetCreator: any = null;

    if (authReq.user?.userId) {
      targetCreator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [
            { userId: authReq.user.userId },
            { id: authReq.user.userId },
          ],
        },
        include: { user: true },
      });
    }

    if (!targetCreator && creatorId) {
      targetCreator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [
            { id: creatorId },
            { userId: creatorId },
            { handle: creatorId },
          ],
        },
        include: { user: true },
      });
    }

    // Default fallback to first active verified creator if not found
    if (!targetCreator) {
      targetCreator = await prisma.creatorProfile.findFirst({
        where: { verificationStatus: 'VERIFIED' },
        include: { user: true },
      });
    }

    if (!targetCreator) {
      res.status(404).json({ success: false, error: 'Creator profile not found.' });
      return;
    }

    // Ensure referralCode is initialized
    let referralCode = targetCreator.referralCode;
    if (!referralCode) {
      const baseName = (targetCreator.user?.fullName || targetCreator.handle || 'COACH')
        .split(' ')[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      referralCode = `${baseName}-ASCEND`;
      
      await prisma.creatorProfile.update({
        where: { id: targetCreator.id },
        data: { referralCode },
      });
    }

    const bonusPerReferral = targetCreator.referralBonus ? Number(targetCreator.referralBonus) : 25.0;

    // Fetch all referrals for this creator
    const rawReferrals = await prisma.referral.findMany({
      where: { creatorId: targetCreator.id },
      include: { referredUser: true },
    });

    const referrals = rawReferrals.map((ref: any) => ({
      id: ref.id,
      referredUserId: ref.referredUserId,
      referredUserName: ref.referredUser?.fullName || 'Ascend Athlete',
      referredUserEmail: ref.referredUser?.email || 'confidential@ascend.io',
      referredUserAvatar: ref.referredUser?.avatarUrl || null,
      referralCode: ref.referralCode,
      status: ref.status as 'PENDING' | 'VERIFIED' | 'REWARDED',
      bonusAmount: Number(ref.bonusAmount || bonusPerReferral),
      rewardPaidAt: ref.rewardPaidAt || null,
      createdAt: ref.createdAt,
    }));

    const totalReferred = referrals.length;
    const verifiedCount = referrals.filter((r: any) => r.status === 'VERIFIED' || r.status === 'REWARDED').length;
    const pendingCount = referrals.filter((r: any) => r.status === 'PENDING').length;
    const totalEarnedBonus = referrals
      .filter((r: any) => r.status === 'VERIFIED' || r.status === 'REWARDED')
      .reduce((sum: number, r: any) => sum + r.bonusAmount, 0);
    const pendingBonus = referrals
      .filter((r: any) => r.status === 'PENDING')
      .reduce((sum: number, r: any) => sum + r.bonusAmount, 0);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const referralLink = `${frontendUrl}/join?ref=${referralCode}`;

    res.json({
      success: true,
      data: {
        creatorId: targetCreator.id,
        creatorName: targetCreator.user?.fullName || targetCreator.handle,
        referralCode,
        referralLink,
        bonusPerReferral,
        totalReferred,
        verifiedCount,
        pendingCount,
        totalEarnedBonus,
        pendingBonus,
        referrals,
      },
    });
  } catch (error) {
    console.error('[Get Creator Referrals Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch creator referral metrics.' });
  }
};

/**
 * PATCH /api/referrals/code
 * Customizes the creator's referral code
 */
export const updateReferralCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Please provide a valid referral code.' });
      return;
    }

    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (sanitizedCode.length < 3 || sanitizedCode.length > 20) {
      res.status(400).json({
        success: false,
        error: 'Referral code must be between 3 and 20 alphanumeric characters.',
      });
      return;
    }

    let targetCreator: any = null;
    if (authReq.user?.userId) {
      targetCreator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [
            { userId: authReq.user.userId },
            { id: authReq.user.userId },
          ],
        },
      });
    }

    if (!targetCreator) {
      targetCreator = await prisma.creatorProfile.findFirst({
        where: { verificationStatus: 'VERIFIED' },
      });
    }

    if (!targetCreator) {
      res.status(404).json({ success: false, error: 'Creator profile not found.' });
      return;
    }

    // Check if code is taken by another creator
    const existing = await prisma.creatorProfile.findFirst({
      where: {
        referralCode: sanitizedCode,
        id: { not: targetCreator.id },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: `The referral code "${sanitizedCode}" is already in use by another creator.`,
      });
      return;
    }

    await prisma.creatorProfile.update({
      where: { id: targetCreator.id },
      data: { referralCode: sanitizedCode },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const referralLink = `${frontendUrl}/join?ref=${sanitizedCode}`;

    res.json({
      success: true,
      message: 'Referral code updated successfully.',
      data: {
        referralCode: sanitizedCode,
        referralLink,
      },
    });
  } catch (error) {
    console.error('[Update Referral Code Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to update referral code.' });
  }
};

/**
 * GET /api/referrals/validate/:code
 * Public endpoint to validate a referral code and get referrer context
 */
export const validateReferralCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ success: false, error: 'Referral code is required.' });
      return;
    }

    const sanitizedCode = String(code).trim().toUpperCase();
    const creator = await prisma.creatorProfile.findFirst({
      where: { referralCode: sanitizedCode },
      include: { user: true },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Referral code "${sanitizedCode}" not found or inactive.`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        referralCode: sanitizedCode,
        creatorId: creator.id,
        creatorName: creator.user?.fullName || creator.handle,
        creatorAvatar: creator.user?.avatarUrl || null,
        headline: creator.headline,
        bonusPerReferral: Number(creator.referralBonus || 25.0),
      },
    });
  } catch (error) {
    console.error('[Validate Referral Code Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to validate referral code.' });
  }
};

/**
 * POST /api/referrals/claim
 * Allows an authenticated user to claim a referral code if they haven't been referred yet
 */
export const claimReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { code } = req.body;

    if (!authReq.user?.userId) {
      res.status(401).json({ success: false, error: 'Authentication required to claim referral.' });
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Valid referral code is required.' });
      return;
    }

    const sanitizedCode = code.trim().toUpperCase();

    // Check if user already has a referral record
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: authReq.user.userId },
    });

    if (existingReferral) {
      res.status(400).json({
        success: false,
        error: 'You have already redeemed a referral code for this account.',
      });
      return;
    }

    // Look up creator
    const creator = await prisma.creatorProfile.findFirst({
      where: { referralCode: sanitizedCode },
      include: { user: true },
    });

    if (!creator) {
      res.status(404).json({ success: false, error: 'Referral code not found.' });
      return;
    }

    if (creator.userId === authReq.user.userId) {
      res.status(400).json({ success: false, error: 'You cannot use your own referral code.' });
      return;
    }

    const bonusAmount = Number(creator.referralBonus || 25.0);

    const referral = await prisma.referral.create({
      data: {
        creatorId: creator.id,
        referredUserId: authReq.user.userId,
        referralCode: sanitizedCode,
        status: 'VERIFIED',
        bonusAmount,
        rewardPaidAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Referral code ${sanitizedCode} claimed successfully!`,
      data: referral,
    });
  } catch (error) {
    console.error('[Claim Referral Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to claim referral code.' });
  }
};
