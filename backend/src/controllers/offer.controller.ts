import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { PayoutService } from '../services/payout.service.js';
import { inMemoryStore } from '../config/inMemoryDb.js';

interface CreateOfferBody {
  title: string;
  description?: string;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
  price: number | string;
  currency?: string;
  isActive?: boolean;
}

/**
 * POST /offers
 * Creator-only endpoint to create a new course, 1-on-1 coaching, or community offer
 */
export const createOffer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication required.',
      });
      return;
    }

    const { title, description, type, price, currency = 'USD', isActive = true }: CreateOfferBody =
      req.body;

    // Validate Required Fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "title" is required and cannot be empty.',
      });
      return;
    }

    const validTypes = ['COURSE', 'ONE_ON_ONE', 'COMMUNITY'];
    if (!type || !validTypes.includes(type.toUpperCase())) {
      res.status(400).json({
        success: false,
        error: `Validation Error: "type" must be one of: [${validTypes.join(', ')}]. Received: "${type}".`,
      });
      return;
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "price" must be a positive number or zero.',
      });
      return;
    }

    // Find the CreatorProfile for the authenticated user
    let creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.userId },
    });

    // If user is ADMIN and specifies creatorId in query or body, allow delegation
    if (req.user.role === 'ADMIN' && req.body.creatorId) {
      creatorProfile = await prisma.creatorProfile.findUnique({
        where: { id: req.body.creatorId },
      });
    }

    if (!creatorProfile) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: No CreatorProfile found for current user. Please complete creator onboarding first.',
      });
      return;
    }

    // Gating Check 1: Must have accepted Creator Agreement before publishing any offer
    if (Boolean(isActive) && !(creatorProfile as any).agreementAccepted) {
      res.status(400).json({
        success: false,
        code: 'CREATOR_AGREEMENT_REQUIRED',
        error: 'Creator Agreement Required: You must review and accept the Ascend Creator Terms of Service (revenue share, refund liability, content ownership, conduct policy) before publishing any offer.',
      });
      return;
    }

    // Gating Check 2: If publishing a paid offer, require completed payout setup
    if (Boolean(isActive) && parsedPrice > 0) {
      const hasPayoutSetup = PayoutService.isPayoutSetupCompleted(creatorProfile.id);
      if (!hasPayoutSetup) {
        res.status(400).json({
          success: false,
          code: 'PAYOUT_SETUP_REQUIRED',
          error: 'Payout Setup Required: You must configure your bank account or UPI ID before publishing paid monetization offers.',
        });
        return;
      }
    }

    // Create the Offer in DB
    const newOffer = await prisma.offer.create({
      data: {
        creatorId: creatorProfile.id,
        title: title.trim(),
        description: description?.trim() || null,
        type: type.toUpperCase() as any,
        price: parsedPrice,
        currency: currency.toUpperCase(),
        isActive: Boolean(isActive),
      },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Offer created successfully.',
      data: {
        id: newOffer.id,
        creatorId: newOffer.creatorId,
        creatorName: newOffer.creator.user.fullName,
        creatorHandle: newOffer.creator.handle,
        title: newOffer.title,
        description: newOffer.description,
        type: newOffer.type,
        price: Number(newOffer.price),
        currency: newOffer.currency,
        isActive: newOffer.isActive,
        createdAt: newOffer.createdAt,
        updatedAt: newOffer.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[createOffer Error]:', error);
    // In-memory fallback
    const cp = inMemoryStore.creatorProfiles[0];
    const newOffer = {
      id: `offer-${Date.now()}`,
      creatorId: cp ? cp.id : (req.user?.userId || 'creator-chadtag'),
      title: req.body.title || 'Untitled Offer',
      description: req.body.description || null,
      type: req.body.type || 'ONE_ON_ONE',
      price: Number(req.body.price) || 0,
      currency: req.body.currency || 'USD',
      isActive: Boolean(req.body.isActive),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.offers.push(newOffer as any);
    res.status(201).json({
      success: true,
      message: 'Offer created successfully (in-memory store).',
      data: newOffer,
    });
  }
};

/**
 * PATCH /offers/:id/status
 * Toggle draft / published status for an offer with M2 payout gating
 */
export const toggleOfferStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const offerId = req.params.id;
    const { isActive } = req.body;
    const willBeActive = Boolean(isActive);

    const existingOffer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { creator: true },
    });

    if (existingOffer) {
      // Check ownership
      const isOwner =
        existingOffer.creator.userId === req.user.userId ||
        existingOffer.creatorId === req.user.userId ||
        req.user.role === 'ADMIN';

      if (!isOwner) {
        res.status(403).json({ success: false, error: 'Forbidden: You do not own this offer.' });
        return;
      }

      // M2 Gating: If publishing a paid offer, require payout setup
      if (willBeActive && Number(existingOffer.price) > 0) {
        const hasPayoutSetup = PayoutService.isPayoutSetupCompleted(existingOffer.creatorId);
        if (!hasPayoutSetup) {
          res.status(400).json({
            success: false,
            code: 'PAYOUT_SETUP_REQUIRED',
            error: 'Payout Setup Required: You must configure your bank account or UPI ID before publishing paid monetization offers.',
          });
          return;
        }
      }

      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: { isActive: willBeActive },
      });

      res.status(200).json({
        success: true,
        message: `Offer status updated to ${willBeActive ? 'published' : 'draft'}.`,
        data: updatedOffer,
      });
      return;
    }

    // In-memory fallback
    const memOffer = inMemoryStore.offers.find((o) => o.id === offerId);
    if (memOffer) {
      if (willBeActive && Number(memOffer.price) > 0) {
        const hasPayoutSetup = PayoutService.isPayoutSetupCompleted(memOffer.creatorId);
        if (!hasPayoutSetup) {
          res.status(400).json({
            success: false,
            code: 'PAYOUT_SETUP_REQUIRED',
            error: 'Payout Setup Required: You must configure your bank account or UPI ID before publishing paid monetization offers.',
          });
          return;
        }
      }
      memOffer.isActive = willBeActive;
      memOffer.updatedAt = new Date();
      res.status(200).json({
        success: true,
        message: `Offer status updated to ${willBeActive ? 'published' : 'draft'}.`,
        data: memOffer,
      });
      return;
    }

    res.status(404).json({ success: false, error: 'Offer not found.' });
  } catch (error: any) {
    console.error('[toggleOfferStatus Error]:', error);
    const offerId = req.params.id;
    const memOffer = inMemoryStore.offers.find((o) => o.id === offerId);
    if (memOffer) {
      memOffer.isActive = Boolean(req.body.isActive);
      res.status(200).json({
        success: true,
        message: `Offer status updated to ${memOffer.isActive ? 'published' : 'draft'}.`,
        data: memOffer,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update offer status.',
      details: error.message,
    });
  }
};
