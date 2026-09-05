import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';

/**
 * GET /api/wishlist
 * Get current user's saved wishlist items with offer & creator details
 */
export const getWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'user-akshat';

    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        offer: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('[getWishlist Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wishlist items.',
      details: error.message,
    });
  }
};

/**
 * POST /api/wishlist
 * Add an offer to user's saved wishlist
 */
export const addToWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'user-akshat';
    const { offerId } = req.body;

    if (!offerId || typeof offerId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Offer ID is required.',
      });
      return;
    }

    // Verify offer exists
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        creator: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found.',
      });
      return;
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        offerId,
      },
      include: {
        offer: {
          include: {
            creator: {
              include: {
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
            course: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `"${offer.title}" added to your saved wishlist. ❤️`,
      data: item,
    });
  } catch (error: any) {
    console.error('[addToWishlist Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save offer to wishlist.',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/wishlist/:offerId
 * Remove an offer from user's wishlist
 */
export const removeFromWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'user-akshat';
    const target = req.params.offerId;

    if (!target) {
      res.status(400).json({
        success: false,
        error: 'Offer ID or Wishlist Item ID is required.',
      });
      return;
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        offerId: target,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from your saved wishlist.',
    });
  } catch (error: any) {
    console.error('[removeFromWishlist Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from wishlist.',
      details: error.message,
    });
  }
};

/**
 * POST /api/wishlist/toggle
 * 1-click toggle between saved and unsaved state
 */
export const toggleWishlist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'user-akshat';
    const { offerId } = req.body;

    if (!offerId || typeof offerId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Offer ID is required.',
      });
      return;
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        offerId,
      },
    });

    if (existing) {
      await prisma.wishlistItem.deleteMany({
        where: {
          userId,
          offerId,
        },
      });

      res.status(200).json({
        success: true,
        saved: false,
        message: 'Removed from your saved wishlist.',
      });
      return;
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        offerId,
      },
      include: {
        offer: {
          include: {
            creator: {
              include: {
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
            course: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      saved: true,
      message: 'Saved to your wishlist! ❤️',
      data: item,
    });
  } catch (error: any) {
    console.error('[toggleWishlist Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle wishlist item.',
      details: error.message,
    });
  }
};
