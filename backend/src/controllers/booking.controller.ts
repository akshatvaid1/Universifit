import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { AvailabilityScheduleService } from '../services/availability.service.js';
import { GoogleMeetService } from '../services/google-meet.service.js';
import { NotificationService } from '../services/notification.service.js';
import { GamificationService } from '../services/gamification.service.js';

/**
 * GET /creators/:id/availability
 * Fetch creator-defined available slots that have not been booked yet
 */
export const getCreatorAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const { from, to } = req.query;

    // Verify creator existence
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
      select: {
        id: true,
        handle: true,
        user: { select: { fullName: true, avatarUrl: true } },
      },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${creatorIdentifier}" not found.`,
      });
      return;
    }

    const now = new Date();
    const where: any = {
      creatorId: creator.id,
      isBooked: false,
      startTime: { gte: from ? new Date(from as string) : now },
    };

    if (to) {
      where.endTime = { lte: new Date(to as string) };
    }

    const availableSlots = await prisma.availability.findMany({
      where,
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        creatorId: true,
        startTime: true,
        endTime: true,
        isBooked: true,
      },
    });

    let formattedSlots = availableSlots.map((slot: any) => {
      const durationMinutes = Math.round(
        (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60)
      );
      return {
        availabilityId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 45,
        isBooked: slot.isBooked,
      };
    });

    // If no individual slots pre-seeded, dynamically generate from weekly recurring schedule & blackout dates
    if (formattedSlots.length === 0) {
      const generated = AvailabilityScheduleService.generateAvailableSlots(creator.id, 30);
      formattedSlots = generated.map((s) => ({
        availabilityId: s.id,
        startTime: s.startTime as any,
        endTime: s.endTime as any,
        durationMinutes: s.durationMinutes,
        isBooked: s.isBooked,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        creator: {
          id: creator.id,
          fullName: creator.user.fullName,
          avatarUrl: creator.user.avatarUrl,
          handle: creator.handle,
        },
        totalAvailableSlots: formattedSlots.length,
        slots: formattedSlots,
      },
    });
  } catch (error: any) {
    console.error('[getCreatorAvailability Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching creator availability.',
      details: error.message,
    });
  }
};

/**
 * POST /creators/:id/availability (Creator-only)
 * Create creator-defined available booking slots
 */
export const createAvailabilitySlots = async (
  req: AuthenticatedRequest,
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

    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    // Verify creator profile ownership
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: 'Creator profile not found.',
      });
      return;
    }

    if (creator.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: You can only define availability for your own creator profile.',
      });
      return;
    }

    const { slots }: { slots: Array<{ startTime: string; endTime: string }> } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "slots" must be a non-empty array of { startTime, endTime } objects.',
      });
      return;
    }

    const createdSlots = await Promise.all(
      slots.map(async (slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        return prisma.availability.upsert({
          where: {
            creatorId_startTime: {
              creatorId: creator.id,
              startTime: start,
            },
          },
          update: { endTime: end, isBooked: false },
          create: {
            creatorId: creator.id,
            startTime: start,
            endTime: end,
            isBooked: false,
          },
        });
      })
    );

    res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} availability slot(s).`,
      data: createdSlots,
    });
  } catch (error: any) {
    console.error('[createAvailabilitySlots Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while defining availability slots.',
      details: error.message,
    });
  }
};

/**
 * POST /bookings
 * Locks the availability slot and creates booking with DB constraints preventing double-booking
 */
export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required to book a session.',
      });
      return;
    }

    const userId = req.user.userId;
    const {
      creatorId,
      availabilityId,
      scheduledAt,
      offerId,
      notes,
      durationMinutes = 45,
    } = req.body;

    if (!creatorId && !availabilityId) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "creatorId" or "availabilityId" is required.',
      });
      return;
    }

    let targetCreatorId = creatorId;
    let targetScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    let targetAvailabilityId: string | null = availabilityId || null;

    // If availabilityId is provided, fetch slot details
    if (availabilityId) {
      const slot = await prisma.availability.findUnique({
        where: { id: availabilityId },
        include: { creator: true },
      });

      if (!slot) {
        res.status(404).json({
          success: false,
          error: `Availability slot with id "${availabilityId}" not found.`,
        });
        return;
      }

      if (slot.isBooked) {
        res.status(409).json({
          success: false,
          error: 'Conflict: This availability slot has already been booked. Please choose another time.',
        });
        return;
      }

      targetCreatorId = slot.creatorId;
      targetScheduledAt = slot.startTime;
    }

    if (!targetScheduledAt || isNaN(targetScheduledAt.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: Invalid or missing "scheduledAt" timestamp.',
      });
      return;
    }

    if (targetScheduledAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: Cannot book a session in the past.',
      });
      return;
    }

    // Pre-generate unique Google Meet conference link
    const bookingTempId = `bk-${Date.now().toString(36)}`;
    const meetResult = await GoogleMeetService.createMeetingLink({
      bookingId: bookingTempId,
      startTime: targetScheduledAt,
      durationMinutes: Number(durationMinutes) || 45,
      notes: notes?.trim(),
    });
    const meetingUrl = meetResult.meetingUrl;

    // Execute atomic transaction: lock slot and create booking
    // Prisma unique constraints [creatorId, scheduledAt] and [availabilityId] prevent any double-booking race condition!
    const newBooking = await prisma.$transaction(async (tx) => {
      // 1. If availability slot exists, verify and lock it
      if (targetAvailabilityId) {
        const lockedSlot = await tx.availability.update({
          where: {
            id: targetAvailabilityId,
            isBooked: false, // ensures concurrency check
          },
          data: {
            isBooked: true,
          },
        });

        if (!lockedSlot) {
          throw new Error('SLOT_ALREADY_BOOKED');
        }
      }

      // 2. Create the Booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          creatorId: targetCreatorId,
          offerId: offerId || null,
          availabilityId: targetAvailabilityId,
          scheduledAt: targetScheduledAt,
          durationMinutes: Number(durationMinutes) || 45,
          status: 'SCHEDULED',
          meetingUrl,
          notes: notes?.trim() || null,
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              id: true,
              handle: true,
              user: { select: { fullName: true, email: true, avatarUrl: true } },
            },
          },
          offer: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
            },
          },
        },
      });

      return booking;
    });

    const sessionDateFormatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(newBooking.scheduledAt));

    const sessionTimeFormatted = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(newBooking.scheduledAt));

    // Dispatch in-app notification & transactional email to Buyer with Google Meet link
    NotificationService.createNotification({
      userId: newBooking.userId,
      type: 'BOOKING_CONFIRMED',
      title: '1-on-1 Consultation Confirmed 🗓️',
      body: `Your session with Coach ${newBooking.creator.user.fullName} is scheduled for ${sessionDateFormatted} at ${sessionTimeFormatted}. Join via Google Meet.`,
      linkUrl: '/my-space',
      sendEmail: true,
      recipientEmail: newBooking.user.email,
      emailData: {
        clientName: newBooking.user.fullName,
        creatorName: newBooking.creator.user.fullName,
        offerTitle: newBooking.offer?.title || '1-on-1 Consultation',
        sessionDate: sessionDateFormatted,
        sessionTime: sessionTimeFormatted,
        meetLink: newBooking.meetingUrl || meetingUrl,
      },
      metadata: {
        bookingId: newBooking.id,
        meetLink: newBooking.meetingUrl || meetingUrl,
        scheduledAt: newBooking.scheduledAt,
      },
    }).catch((err) => console.warn('[Booking Confirmation Notification Error]:', err));

    // Dispatch in-app notification to Creator
    NotificationService.createNotification({
      userId: newBooking.creator.id,
      type: 'BOOKING_NEW',
      title: 'New 1:1 Session Booked 🗓️',
      body: `${newBooking.user.fullName} booked a 1-on-1 consultation for ${sessionDateFormatted} at ${sessionTimeFormatted}. Google Meet is ready.`,
      linkUrl: '/dashboard',
      sendEmail: true,
      recipientEmail: newBooking.creator.user.email,
      emailData: {
        clientName: newBooking.creator.user.fullName,
        creatorName: newBooking.user.fullName,
        offerTitle: `Session with ${newBooking.user.fullName}`,
        sessionDate: sessionDateFormatted,
        sessionTime: sessionTimeFormatted,
        meetLink: newBooking.meetingUrl || meetingUrl,
      },
      metadata: {
        bookingId: newBooking.id,
        meetLink: newBooking.meetingUrl || meetingUrl,
        studentName: newBooking.user.fullName,
      },
    }).catch((err) => console.warn('[Creator Booking Notification Error]:', err));

    // Fire-and-forget: award event-attend points to the buyer
    // Scoped to the creator's community (targetCreatorId is the creator profile id)
    GamificationService.awardPoints(
      userId,
      targetCreatorId,
      'event-attend',
      { bookingId: newBooking.id, scheduledAt: newBooking.scheduledAt }
    ).catch((e) => console.warn('[Gamification event-attend hook]:', e));

    res.status(201).json({
      success: true,
      message: 'Booking confirmed and slot locked successfully.',
      data: {
        id: newBooking.id,
        scheduledAt: newBooking.scheduledAt,
        durationMinutes: newBooking.durationMinutes,
        status: newBooking.status,
        meetingUrl: newBooking.meetingUrl,
        notes: newBooking.notes,
        buyer: {
          id: newBooking.userId,
          fullName: newBooking.user.fullName,
          email: newBooking.user.email,
        },
        creator: {
          id: newBooking.creator.id,
          fullName: newBooking.creator.user.fullName,
          handle: newBooking.creator.handle,
          avatarUrl: newBooking.creator.user.avatarUrl,
        },
        offer: newBooking.offer
          ? {
              id: newBooking.offer.id,
              title: newBooking.offer.title,
              price: Number(newBooking.offer.price),
              currency: newBooking.offer.currency,
            }
          : null,
        calendarSyncStatus: 'PENDING_INTEGRATION', // TODO: External calendar sync
        createdAt: newBooking.createdAt,
      },
    });
  } catch (error: any) {
    // Handle Prisma unique constraint violation (code P2002) or in-memory double-booking prevention
    if (
      error.code === 'P2002' ||
      error.message === 'SLOT_ALREADY_BOOKED' ||
      (error.message && error.message.includes('already booked'))
    ) {
      res.status(409).json({
        success: false,
        error: 'Conflict: This coach slot is already booked by another user. Double-booking prevented by system constraints.',
      });
      return;
    }

    console.error('[createBooking Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing booking.',
      details: error.message,
    });
  }
};
