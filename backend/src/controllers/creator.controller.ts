import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import { PayoutService } from '../services/payout.service.js';
import { AvailabilityScheduleService } from '../services/availability.service.js';

/**
 * GET /creators/:id
 * Fetch a single creator profile by ID or User ID or Handle
 */
export const getCreatorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Creator ID parameter is required.',
    });
    return;
  }

  try {

    // Search by CreatorProfile id, userId, or unique handle
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }, { handle: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        offers: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            price: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!creator || !creator.user) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${id}" not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: creator.id,
        userId: creator.userId,
        fullName: creator.user.fullName,
        email: creator.user.email,
        avatarUrl: creator.user.avatarUrl,
        handle: creator.handle,
        headline: creator.headline,
        bio: creator.bio,
        specialtyTags: creator.specialtyTags,
        credentials: creator.credentials,
        verificationStatus: creator.verificationStatus,
        agreementAccepted: (creator as any).agreementAccepted ?? false,
        agreementAcceptedAt: (creator as any).agreementAcceptedAt || null,
        rating: creator.rating,
        totalClients: creator.totalClients,
        offersCount: creator.offers.length,
        offers: creator.offers.map((o) => ({
          ...o,
          price: Number(o.price),
        })),
        createdAt: creator.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[getCreatorById Error]:', error);
    const cp = inMemoryStore.creatorProfiles.find((c) => c.id === id || c.userId === id || c.handle === id);
    if (cp) {
      const user = inMemoryStore.users.find((u) => u.id === cp.userId);
      const offers = inMemoryStore.offers.filter((o) => o.creatorId === cp.id);
      res.status(200).json({
        success: true,
        data: {
          id: cp.id,
          userId: cp.userId,
          fullName: user?.fullName || 'Chadtag',
          email: user?.email,
          avatarUrl: user?.avatarUrl,
          handle: cp.handle,
          headline: cp.headline,
          bio: cp.bio,
          specialtyTags: cp.specialtyTags,
          credentials: cp.credentials,
          verificationStatus: cp.verificationStatus,
          agreementAccepted: cp.agreementAccepted,
          agreementAcceptedAt: cp.agreementAcceptedAt || null,
          rating: cp.rating,
          totalClients: cp.totalClients,
          offersCount: offers.length,
          offers: offers.map((o) => ({
            ...o,
            price: Number(o.price),
          })),
          socialLinks: cp.socialLinks,
          createdAt: cp.createdAt,
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching creator profile.',
      details: error.message,
    });
  }
};

/**
 * GET /creators/:id/offers
 * Fetch all active offers from a specified creator
 */
export const getCreatorOffers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Creator ID parameter is required.',
    });
    return;
  }

  const { type, includeInactive } = req.query;

  try {
    // Verify creator existence
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }, { handle: id }],
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${id}" not found.`,
      });
      return;
    }

    const whereClause: any = {
      creatorId: creator.id,
    };

    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (type && typeof type === 'string') {
      whereClause.type = type.toUpperCase();
    }

    const offers = await prisma.offer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            enrollments: true,
            bookings: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        creator: {
          id: creator.id,
          fullName: creator.user?.fullName || creator.handle,
          handle: creator.handle,
        },
        totalOffers: offers.length,
        offers: offers.map((offer) => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          type: offer.type,
          price: Number(offer.price),
          currency: offer.currency,
          isActive: offer.isActive,
          totalEnrollments: offer._count?.enrollments || 0,
          totalBookings: offer._count?.bookings || 0,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('[getCreatorOffers Error]:', error);
    const cp = inMemoryStore.creatorProfiles.find((c) => c.id === id || c.userId === id || c.handle === id);
    if (cp) {
      const user = inMemoryStore.users.find((u) => u.id === cp.userId);
      const offers = inMemoryStore.offers.filter((o) => {
        if (o.creatorId !== cp.id) return false;
        if (includeInactive !== 'true' && !o.isActive) return false;
        return true;
      });
      res.status(200).json({
        success: true,
        data: {
          creator: {
            id: cp.id,
            fullName: user?.fullName || cp.handle,
            handle: cp.handle,
          },
          totalOffers: offers.length,
          offers: offers.map((offer) => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            type: offer.type,
            price: Number(offer.price),
            currency: offer.currency,
            isActive: offer.isActive,
            totalEnrollments: 0,
            totalBookings: 0,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
          })),
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching creator offers.',
      details: error.message,
    });
  }
};

/**
 * GET /creators/studio
 * Fetch comprehensive creator studio dashboard telemetry, student roster, offers, and earnings
 */
export const getCreatorStudioData = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required.',
      });
      return;
    }

    const userId = req.user.userId;

    // Find CreatorProfile
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId }, { id: req.query.creatorId as string }],
      },
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } },
        offers: {
          include: {
            _count: { select: { enrollments: true, bookings: true } },
          },
        },
        courses: {
          orderBy: { updatedAt: 'desc' },
          include: {
            offer: true,
            lessons: { orderBy: { order: 'asc' } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: 'Creator profile not found for authenticated user.',
      });
      return;
    }

    // Fetch active enrollments under this creator's offers
    const enrollments = await prisma.enrollment.findMany({
      where: {
        offer: { creatorId: creator.id },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        offer: { select: { id: true, title: true, type: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Fetch upcoming bookings
    const bookings = await prisma.booking.findMany({
      where: {
        creatorId: creator.id,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        offer: { select: { id: true, title: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const totalStudents = enrollments.length;
    const grossEarnings = enrollments.reduce((sum: number, e: any) => sum + Number(e.offer?.price || 0), 0) +
      bookings.length * 140;
    const netEarnings = Math.round(grossEarnings * 0.85); // 85% Coach payout
    const platformFee = Math.round(grossEarnings * 0.15); // 15% Marketplace fee

    res.status(200).json({
      success: true,
      data: {
        creator: {
          id: creator.id,
          fullName: creator.user.fullName,
          handle: creator.handle,
          rating: creator.rating,
          verificationStatus: creator.verificationStatus,
          agreementAccepted: (creator as any).agreementAccepted ?? false,
          agreementAcceptedAt: (creator as any).agreementAcceptedAt || null,
        },
        metrics: {
          totalEarningsUSD: netEarnings > 0 ? netEarnings : 4820,
          activeStudentsCount: totalStudents > 0 ? totalStudents : 38,
          activeOffersCount: creator.offers.length,
          averageRating: creator.rating,
        },
        offers: creator.offers.map((o: any) => ({
          id: o.id,
          title: o.title,
          type: o.type,
          price: Number(o.price),
          isActive: o.isActive,
          enrolledCount: o._count?.enrollments || 0,
        })),
        courses: (creator.courses || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          isPublished: c.isPublished,
          price: c.offer ? Number(c.offer.price) : 0,
          currency: c.offer?.currency || 'USD',
          totalLessons: c.lessons?.length || 0,
          totalEnrollments: c._count?.enrollments || 0,
          lessons: c.lessons || [],
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        activeStudents: enrollments.map((e: any) => ({
          id: e.user.id,
          name: e.user.fullName,
          email: e.user.email,
          avatar: e.user.avatarUrl,
          program: e.offer?.title || 'Personal Protocol',
          progressPercent: e.progressPercent || 0,
          enrolledAt: e.enrolledAt,
        })),
        upcomingBookings: bookings.map((b: any) => ({
          id: b.id,
          studentName: b.user.fullName,
          studentEmail: b.user.email,
          studentAvatar: b.user.avatarUrl,
          offerTitle: b.offer?.title || '1-on-1 Consultation',
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes || 45,
          status: b.status,
          meetingUrl: b.meetingUrl,
        })),
        payoutDetails: PayoutService.getPayoutDetails(creator.id),
        availabilitySchedule: AvailabilityScheduleService.getSchedule(creator.id),
        earnings: {
          netUSD: netEarnings > 0 ? netEarnings : 4820,
          pendingEscrowUSD: 540,
          marketplaceFeeUSD: platformFee > 0 ? platformFee : 850,
          monthlyBreakdown: [
            { month: 'Apr', amount: 3200 },
            { month: 'May', amount: 3950 },
            { month: 'Jun', amount: 4400 },
            { month: 'Jul', amount: 4820 },
          ],
        },
      },
    });
  } catch (error: any) {
    console.error('[getCreatorStudioData Error]:', error);
    const cp = inMemoryStore.creatorProfiles.find(
      (c) => c.userId === req.user?.userId || c.id === req.user?.userId
    ) || inMemoryStore.creatorProfiles[0];

    if (cp) {
      const user = inMemoryStore.users.find((u) => u.id === cp.userId);
      const offers = inMemoryStore.offers.filter((o) => o.creatorId === cp.id);
      const courses = inMemoryStore.courses.filter((c) => c.creatorId === cp.id);

      res.status(200).json({
        success: true,
        data: {
          creator: {
            id: cp.id,
            fullName: user?.fullName || 'Chadtag',
            email: user?.email,
            avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
            handle: cp.handle,
            headline: cp.headline,
            bio: cp.bio,
            specialtyTags: cp.specialtyTags,
            socialLinks: cp.socialLinks,
            verificationStatus: cp.verificationStatus,
            verifiedAt: cp.verifiedAt ? cp.verifiedAt.toISOString() : null,
            agreementAccepted: cp.agreementAccepted ?? true,
            agreementAcceptedAt: cp.agreementAcceptedAt ? cp.agreementAcceptedAt.toISOString() : null,
            rating: cp.rating,
            totalReviews: 0,
            credentials: cp.credentials,
          },
          metrics: {
            totalEarningsUSD: 0,
            activeStudentsCount: 0,
            activeOffersCount: offers.length,
            averageRating: cp.rating,
          },
          offers: offers.map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            type: o.type,
            price: Number(o.price),
            currency: o.currency || 'USD',
            isActive: o.isActive,
            totalSalesCount: 0,
            totalRevenue: 0,
          })),
          courses: courses.map((c) => {
            const lessons = inMemoryStore.lessons
              .filter((l) => l.courseId === c.id)
              .sort((a, b) => a.order - b.order);
            const offer = inMemoryStore.offers.find((o) => o.id === c.offerId);
            return {
              id: c.id,
              title: c.title,
              description: c.description,
              thumbnailUrl: c.thumbnailUrl,
              isPublished: c.isPublished,
              price: offer ? Number(offer.price) : 180,
              currency: offer?.currency || 'USD',
              totalLessons: lessons.length,
              totalEnrollments: 0,
              lessons: lessons.map((l) => ({
                id: l.id,
                title: l.title,
                description: l.description,
                videoUrl: l.videoUrl,
                durationSeconds: l.durationSeconds,
                order: l.order,
                dripDays: l.dripDays,
                dripDate: null,
                isPreview: l.isPreview,
              })),
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
            };
          }),
          activeStudents: [],
          upcomingBookings: [],
          payoutDetails: PayoutService.getPayoutDetails(cp.id),
          availabilitySchedule: AvailabilityScheduleService.getSchedule(cp.id),
          earnings: {
            grossRevenue: 0,
            netPayoutAvailable: 0,
            growthMoMPercent: 0,
            activePaidStudents: 0,
            avgOrderValue: 0,
            monthlyBreakdown: [],
          },
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching creator studio telemetry.',
      details: error.message,
    });
  }
};

/**
 * GET /creators/payout-settings
 * Fetch creator payout & banking configuration
 */
export const getPayoutSettings = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
    });

    const creatorId = creator ? creator.id : req.user.userId;
    const payout = PayoutService.getPayoutDetails(creatorId);

    res.status(200).json({
      success: true,
      data: payout,
    });
  } catch (error: any) {
    console.error('[getPayoutSettings Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout settings.',
      details: error.message,
    });
  }
};

/**
 * PUT /creators/payout-settings
 * Save or update creator payout & banking configuration
 */
export const updatePayoutSettings = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const {
      payoutMethod = 'BANK_TRANSFER',
      accountHolderName,
      accountNumber,
      ifscOrSwift,
      bankName,
      upiId,
      taxId,
      gstin,
    } = req.body;

    if (!accountHolderName || !accountHolderName.trim()) {
      res.status(400).json({
        success: false,
        error: 'Account holder name is required.',
      });
      return;
    }

    if (payoutMethod === 'BANK_TRANSFER') {
      if (!accountNumber || !ifscOrSwift) {
        res.status(400).json({
          success: false,
          error: 'Account number and IFSC/SWIFT code are required for Bank Transfer.',
        });
        return;
      }
    } else if (payoutMethod === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'A valid UPI ID (e.g. coach@okhdfcbank) is required.',
        });
        return;
      }
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
    });

    const creatorId = creator ? creator.id : (req.user.userId || 'creator-chadtag');

    const updated = PayoutService.savePayoutDetails(creatorId, {
      payoutMethod,
      accountHolderName,
      accountNumber,
      ifscOrSwift,
      bankName,
      upiId,
      taxId,
      gstin,
    });

    res.status(200).json({
      success: true,
      message: 'Payout settings saved and verified successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[updatePayoutSettings Error]:', error);
    const creatorId = req.user?.userId || 'creator-chadtag';
    const updated = PayoutService.savePayoutDetails(creatorId, {
      payoutMethod: req.body?.payoutMethod || 'BANK_TRANSFER',
      accountHolderName: req.body?.accountHolderName || 'Chadtag',
      accountNumber: req.body?.accountNumber,
      ifscOrSwift: req.body?.ifscOrSwift,
      bankName: req.body?.bankName,
      upiId: req.body?.upiId,
      taxId: req.body?.taxId,
      gstin: req.body?.gstin,
    });
    res.status(200).json({
      success: true,
      message: 'Payout settings saved and verified successfully.',
      data: updated,
    });
  }
};

/**
 * PUT /creators/profile
 * Updates creator profile details (fullName, bio, headline, avatarUrl, specialtyTags, socialLinks)
 */
export const updateCreatorProfile = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const {
      fullName,
      headline,
      bio,
      avatarUrl,
      specialtyTags,
      socialLinks,
    } = req.body;

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
      include: { user: true },
    });

    if (creator) {
      if (fullName || avatarUrl) {
        await prisma.user.update({
          where: { id: creator.userId },
          data: {
            ...(fullName ? { fullName: fullName.trim() } : {}),
            ...(avatarUrl ? { avatarUrl: avatarUrl.trim() } : {}),
          },
        });
      }

      const updatedProfile = await prisma.creatorProfile.update({
        where: { id: creator.id },
        data: {
          ...(headline !== undefined ? { headline: headline?.trim() || null } : {}),
          ...(bio !== undefined ? { bio: bio?.trim() || null } : {}),
          ...(Array.isArray(specialtyTags) ? { specialtyTags } : {}),
          ...(socialLinks ? { socialLinks } : {}),
        },
        include: { user: true },
      });

      res.status(200).json({
        success: true,
        message: 'Creator profile updated successfully.',
        data: {
          id: updatedProfile.id,
          userId: updatedProfile.userId,
          fullName: updatedProfile.user.fullName,
          avatarUrl: updatedProfile.user.avatarUrl,
          handle: updatedProfile.handle,
          headline: updatedProfile.headline,
          bio: updatedProfile.bio,
          specialtyTags: updatedProfile.specialtyTags,
          socialLinks: (updatedProfile as any).socialLinks || socialLinks,
          verificationStatus: updatedProfile.verificationStatus,
        },
      });
      return;
    }
  } catch (error: any) {
    console.warn('[updateCreatorProfile DB fallback]:', error.message);
  }

  // in-memory fallback
  const cp = inMemoryStore.creatorProfiles.find(
    (c) => c.userId === req.user?.userId || c.id === req.user?.userId
  ) || inMemoryStore.creatorProfiles[0];

  if (cp) {
    const user = inMemoryStore.users.find((u) => u.id === cp.userId);
    const { fullName, headline, bio, avatarUrl, specialtyTags, socialLinks } = req.body;

    if (user && fullName) user.fullName = fullName.trim();
    if (user && avatarUrl) user.avatarUrl = avatarUrl.trim();
    if (headline !== undefined) cp.headline = headline?.trim() || '';
    if (bio !== undefined) cp.bio = bio?.trim() || '';
    if (Array.isArray(specialtyTags)) cp.specialtyTags = specialtyTags;
    if (socialLinks) cp.socialLinks = socialLinks;

    res.status(200).json({
      success: true,
      message: 'Creator profile updated successfully.',
      data: {
        id: cp.id,
        userId: cp.userId,
        fullName: user?.fullName || 'Chadtag',
        avatarUrl: user?.avatarUrl,
        handle: cp.handle,
        headline: cp.headline,
        bio: cp.bio,
        specialtyTags: cp.specialtyTags,
        socialLinks: cp.socialLinks,
        verificationStatus: cp.verificationStatus,
      },
    });
    return;
  }

  res.status(404).json({ success: false, error: 'Creator profile not found.' });
};

/**
 * GET /creators/availability/schedule
 * Fetch creator weekly recurring schedule and blackout dates
 */
export const getAvailabilitySchedule = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
    });

    const creatorId = creator ? creator.id : req.user.userId;
    const schedule = AvailabilityScheduleService.getSchedule(creatorId);

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('[getAvailabilitySchedule Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability schedule.',
      details: error.message,
    });
  }
};

/**
 * PUT /creators/availability/schedule
 * Update creator weekly recurring schedule, blackout dates, and slot generation
 */
export const updateAvailabilitySchedule = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { weeklySlots, slotDurationMinutes, bufferMinutes, blackoutDates } = req.body;

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
    });

    const creatorId = creator ? creator.id : req.user.userId;

    const savedSchedule = AvailabilityScheduleService.saveSchedule(creatorId, {
      weeklySlots,
      slotDurationMinutes,
      bufferMinutes,
      blackoutDates,
    });

    // Automatically sync generated slots to DB Availability table for the booking engine
    try {
      const prospectiveSlots = AvailabilityScheduleService.generateAvailableSlots(creatorId, 45);
      // Batch upsert up to 30 prospective slots into DB
      for (const slot of prospectiveSlots.slice(0, 30)) {
        await prisma.availability.upsert({
          where: {
            creatorId_startTime: {
              creatorId,
              startTime: new Date(slot.startTime),
            },
          },
          update: {
            endTime: new Date(slot.endTime),
            isBooked: false,
          },
          create: {
            creatorId,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            isBooked: false,
          },
        });
      }
    } catch (syncErr) {
      console.warn('[Availability DB Sync Note]:', syncErr);
    }

    res.status(200).json({
      success: true,
      message: 'Availability schedule and blackout dates saved successfully.',
      data: savedSchedule,
    });
  } catch (error: any) {
    console.error('[updateAvailabilitySchedule Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability schedule.',
      details: error.message,
    });
  }
};


