import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { MembershipService } from '../services/membership.service.js';
import { prisma } from '../config/db.js';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// Helper: resolve creator ID from param (id | handle | userId)
async function resolveCreatorId(identifier: string): Promise<string | null> {
  const creator = await prisma.creatorProfile.findFirst({
    where: {
      OR: [{ id: identifier }, { userId: identifier }, { handle: identifier }],
    },
    select: { id: true },
  });
  return creator?.id ?? null;
}

/**
 * GET /creators/:id/tiers
 * Returns all active membership tiers for a creator
 */
export const getTiersForCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${identifier}" not found.`,
      });
      return;
    }

    const tiers = await MembershipService.getCreatorTiers(creatorId);

    // If user is authenticated, attach user's current tier
    let myTier: any = null;
    if (req.user?.userId) {
      myTier = await MembershipService.getUserTierMembership(req.user.userId, creatorId);
    }

    res.status(200).json({
      success: true,
      data: {
        creatorId,
        tiers,
        myTier: myTier || null,
      },
    });
  } catch (error: any) {
    console.error('[getTiersForCreator Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /creators/:id/tiers
 * Create a new membership tier (creator only)
 */
export const createTierForCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    // Check ownership
    const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!creator || (creator.userId !== req.user.userId && req.user.role !== 'ADMIN')) {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this creator space.' });
      return;
    }

    const tier = await MembershipService.createTier(creatorId, req.body);

    res.status(201).json({
      success: true,
      message: `Tier "${tier.name}" created successfully.`,
      data: tier,
    });
  } catch (error: any) {
    console.error('[createTierForCreator Error]:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * PUT /membership/tiers/:tierId
 * Update membership tier (creator only)
 */
export const updateTier = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const tierId = getParam(req.params.tierId);
    const existingTier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
      include: { creator: true },
    });

    if (!existingTier) {
      res.status(404).json({ success: false, error: 'Membership tier not found.' });
      return;
    }

    if (existingTier.creator.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this tier.' });
      return;
    }

    const updated = await MembershipService.updateTier(tierId, existingTier.creatorId, req.body);

    res.status(200).json({
      success: true,
      message: 'Membership tier updated.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[updateTier Error]:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /membership/tiers/:tierId
 * Deactivate / delete membership tier
 */
export const deleteTier = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const tierId = getParam(req.params.tierId);
    const existingTier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
      include: { creator: true },
    });

    if (!existingTier) {
      res.status(404).json({ success: false, error: 'Membership tier not found.' });
      return;
    }

    if (existingTier.creator.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this tier.' });
      return;
    }

    await MembershipService.deleteTier(tierId, existingTier.creatorId);

    res.status(200).json({
      success: true,
      message: 'Membership tier deactivated.',
    });
  } catch (error: any) {
    console.error('[deleteTier Error]:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * POST /creators/:id/membership/join
 * Join a creator community at a free tier or upgrade to paid tier
 */
export const joinCommunityTier = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const { tierId } = req.body || {};
    const result = await MembershipService.joinTier(req.user.userId, creatorId, tierId ? getParam(tierId) : undefined);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[joinCommunityTier Error]:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * GET /creators/:id/membership/my-tier
 * Get authenticated user's tier status for a creator
 */
export const getMyTierStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const status = await MembershipService.getUserTierMembership(req.user.userId, creatorId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('[getMyTierStatus Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /membership/my-memberships
 * Get all creator communities user has joined
 */
export const getMyMemberships = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const list = await MembershipService.getUserMemberships(req.user.userId);

    res.status(200).json({
      success: true,
      data: list,
      count: list.length,
    });
  } catch (error: any) {
    console.error('[getMyMemberships Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /creators/:id/members
 * Returns joined members directory for a creator space:
 * - Searchable by ?search= / ?q=, ?tierId=, ?level=, ?page=, ?limit=
 * - Visible to creator owner & admin (full profile, email, status)
 * - Visible to joined community members (privacy-respecting profile, anonymized if isProfilePrivate)
 * - Unauthorized non-members rejected with 403 Forbidden
 */
export const getCreatorMembersDirectory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    // Determine if viewer is creator owner or admin
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }],
      },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN';

    const search = getParam(req.query.search as string) || getParam(req.query.q as string);
    const tierId = getParam(req.query.tierId as string);
    const level = getParam(req.query.level as string);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const result = await MembershipService.getCreatorMembersDirectory(
      creatorId,
      req.user.userId,
      isCreatorOrAdmin,
      { search, tierId, level, page, limit }
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[getCreatorMembersDirectory Error]:', error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

/**
 * DELETE /creators/:id/members/:userId (or POST /creators/:id/members/:userId/remove)
 * Remove a member from the creator space (Creator owner & Admin only)
 */
export const removeMemberFromCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const targetUserId = getParam(req.params.userId);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }] },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN';

    if (!isCreatorOrAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Only the creator owner can remove members.' });
      return;
    }

    const result = await MembershipService.removeMember(creatorId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[removeMemberFromCreator Error]:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to remove member.' });
  }
};

/**
 * POST /creators/:id/members/:userId/ban
 * Ban a member from creator community & discussions
 */
export const banMemberFromCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const targetUserId = getParam(req.params.userId);
    const { reason } = req.body || {};
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }] },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN';

    if (!isCreatorOrAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Only the creator owner can ban members.' });
      return;
    }

    const result = await MembershipService.banMember(creatorId, targetUserId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[banMemberFromCreator Error]:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to ban member.' });
  }
};

/**
 * POST /creators/:id/members/:userId/unban
 * Unban a previously banned member
 */
export const unbanMemberFromCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const targetUserId = getParam(req.params.userId);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }] },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN';

    if (!isCreatorOrAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Only the creator owner can unban members.' });
      return;
    }

    const result = await MembershipService.unbanMember(creatorId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[unbanMemberFromCreator Error]:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to unban member.' });
  }
};

/**
 * GET /creators/:id/members/:userId/activity
 * Get member activity timeline, lesson completions, and points dossier
 */
export const getMemberActivityForCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const targetUserId = getParam(req.params.userId);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }] },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isSelf = targetUserId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN' || isSelf;

    if (!isCreatorOrAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Only the creator owner or the member can view activity history.' });
      return;
    }

    const result = await MembershipService.getMemberActivity(creatorId, targetUserId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[getMemberActivityForCreator Error]:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to fetch member activity.' });
  }
};

/**
 * GET /creators/:id/analytics/community
 * Telemetry beyond T1: Engagement rate, point distribution, top contributors
 */
export const getCreatorCommunityAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const identifier = getParam(req.params.id);
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: 'Creator not found.' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: creatorId }, { userId: creatorId }, { handle: creatorId }] },
      select: { id: true, userId: true },
    });

    const isCreatorOwner = creator?.userId === req.user.userId;
    const isCreatorOrAdmin = isCreatorOwner || req.user.role === 'ADMIN';

    if (!isCreatorOrAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Creator owner only.' });
      return;
    }

    const analytics = await MembershipService.getCreatorCommunityAnalytics(creatorId);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('[getCreatorCommunityAnalytics Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch community analytics.' });
  }
};


