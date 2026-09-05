import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { razorpay } from '../config/razorpay.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * GET /subscriptions/me
 * Retrieves all active, paused, and cancelled subscriptions for the authenticated buyer
 */
export const getUserSubscriptions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const userId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        isRecurring: true,
      },
      include: {
        offer: {
          include: {
            creator: {
              include: { user: true },
            },
            course: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: enrollments,
      count: enrollments.length,
    });
  } catch (error: any) {
    console.error('[getUserSubscriptions Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user subscriptions.',
      details: error.message,
    });
  }
};

/**
 * POST /subscriptions/:enrollmentId/cancel
 * Self-serve subscription cancellation by the buyer (Phase 0 blueprint)
 */
export const cancelSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const userId = req.user.userId;
    const rawId = req.params.enrollmentId;
    const enrollmentId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    if (!enrollmentId) {
      res.status(400).json({ success: false, error: 'Enrollment ID parameter is required.' });
      return;
    }

    // 1. Fetch enrollment and verify ownership
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        offer: {
          include: {
            creator: { include: { user: true } },
          },
        },
      },
    });

    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment / Subscription record not found.' });
      return;
    }

    if (enrollment.userId !== userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this subscription.' });
      return;
    }

    // 2. Cancel on Razorpay Subscriptions API if active
    if (enrollment.razorpaySubscriptionId) {
      try {
        if (razorpay.subscriptions && typeof razorpay.subscriptions.cancel === 'function') {
          await razorpay.subscriptions.cancel(enrollment.razorpaySubscriptionId, true);
        }
      } catch (rzpErr) {
        console.warn('[Razorpay Subscription Cancel Warning]:', rzpErr);
      }
    }

    // 3. Update Enrollment status in database
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'CANCELLED',
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
      include: {
        offer: {
          include: {
            creator: { include: { user: true } },
          },
        },
      },
    });

    // 4. Send notifications
    const programTitle = enrollment.offer?.title || 'Coaching Subscription';

    await NotificationService.createNotification({
      userId,
      title: 'Subscription Cancelled',
      body: `Your recurring membership for "${programTitle}" has been cancelled. You retain access until the end of the current billing cycle.`,
      type: 'BOOKING_CONFIRMED',
      linkUrl: '/my-space',
    });

    if (enrollment.offer?.creator?.userId) {
      await NotificationService.createNotification({
        userId: enrollment.offer.creator.userId,
        title: 'Athlete Cancelled Subscription',
        body: `${req.user.fullName || 'An athlete'} cancelled their recurring membership for "${programTitle}".`,
        type: 'BOOKING_CONFIRMED',
        linkUrl: '/dashboard',
      });
    }

    res.status(200).json({
      success: true,
      message: `Subscription for "${programTitle}" has been cancelled.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('[cancelSubscription Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription.',
      details: error.message,
    });
  }
};

/**
 * POST /subscriptions/:enrollmentId/pause
 * Pauses an active recurring subscription
 */
export const pauseSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const rawId = req.params.enrollmentId;
    const enrollmentId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { offer: true },
    });

    if (!enrollment || (enrollment.userId !== req.user.userId && req.user.role !== 'ADMIN')) {
      res.status(404).json({ success: false, error: 'Subscription not found or forbidden.' });
      return;
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'PAUSED',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription paused.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[pauseSubscription Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /subscriptions/:enrollmentId/resume
 * Resumes a paused subscription
 */
export const resumeSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const rawId = req.params.enrollmentId;
    const enrollmentId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { offer: true },
    });

    if (!enrollment || (enrollment.userId !== req.user.userId && req.user.role !== 'ADMIN')) {
      res.status(404).json({ success: false, error: 'Subscription not found or forbidden.' });
      return;
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'ACTIVE',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription resumed.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[resumeSubscription Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
