import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
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
    console.warn('[getCreatorAvailability] DB fallback to in-memory store:', error.message);
    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const creator = inMemoryStore.creatorProfiles.find(
      (cp) => cp.id === creatorIdentifier || cp.userId === creatorIdentifier || cp.handle === creatorIdentifier
    );

    if (creator) {
      const u = inMemoryStore.users.find((user) => user.id === creator.userId);
      const explicitSlots = inMemoryStore.availabilities
        .filter((a) => a.creatorId === creator.id && !a.isBooked && new Date(a.startTime) >= new Date())
        .map((s) => ({
          availabilityId: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          durationMinutes: Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000),
          isBooked: false,
        }));

      let allSlots = [...explicitSlots];
      if (allSlots.length === 0) {
        const generated = AvailabilityScheduleService.generateAvailableSlots(creator.id, 30);
        allSlots = generated.map((s) => ({
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
            fullName: u?.fullName || 'Coach',
            avatarUrl: u?.avatarUrl,
            handle: creator.handle,
          },
          totalAvailableSlots: allSlots.length,
          slots: allSlots,
        },
      });
      return;
    }

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
    console.warn('[createAvailabilitySlots] DB fallback to in-memory store:', error.message);
    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const creator = inMemoryStore.creatorProfiles.find(
      (cp) => cp.id === creatorIdentifier || cp.userId === creatorIdentifier || cp.handle === creatorIdentifier
    );
    const { slots }: { slots: Array<{ startTime: string; endTime: string }> } = req.body || {};

    if (creator && Array.isArray(slots)) {
      const createdSlots = slots.map((slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const existing = inMemoryStore.availabilities.find(
          (a) => a.creatorId === creator.id && Math.abs(new Date(a.startTime).getTime() - start.getTime()) < 1000
        );
        if (existing) {
          existing.endTime = end;
          existing.isBooked = false;
          return existing;
        }
        const newSlot = {
          id: `avail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          creatorId: creator.id,
          startTime: start,
          endTime: end,
          isBooked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.availabilities.push(newSlot);
        return newSlot;
      });

      res.status(201).json({
        success: true,
        message: `Created ${createdSlots.length} availability slot(s).`,
        data: createdSlots,
      });
      return;
    }

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

    console.warn('[createBooking] DB fallback to in-memory store:', error.message);
    const userId = req.user?.userId;
    const {
      creatorId,
      availabilityId,
      scheduledAt,
      offerId,
      notes,
      durationMinutes = 45,
    } = req.body || {};

    if (userId) {
      let targetCreatorId = creatorId;
      let targetScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      let targetAvailabilityId: string | null = availabilityId || null;

      if (availabilityId) {
        const slot = inMemoryStore.availabilities.find((a) => a.id === availabilityId);
        if (slot) {
          if (slot.isBooked) {
            res.status(409).json({
              success: false,
              error: 'Conflict: This coach slot is already booked by another user. Double-booking prevented by system constraints.',
            });
            return;
          }
          targetCreatorId = slot.creatorId;
          targetScheduledAt = slot.startTime;
        }
      }

      if (!targetCreatorId) {
        const cp = inMemoryStore.creatorProfiles[0];
        targetCreatorId = cp?.id || 'creator-chadtag';
      }

      if (targetScheduledAt) {
        // DOUBLE-BOOK PREVENTION CHECK AT IN-MEMORY LEVEL
        const isDoubleBooked = inMemoryStore.bookings.some(
          (b) =>
            b.creatorId === targetCreatorId &&
            b.status !== 'CANCELLED' &&
            Math.abs(new Date(b.scheduledAt).getTime() - targetScheduledAt.getTime()) < 60000
        );

        if (isDoubleBooked) {
          res.status(409).json({
            success: false,
            error: 'Conflict: This coach slot is already booked by another user. Double-booking prevented by system constraints.',
          });
          return;
        }

        // AUTO-GENERATE GOOGLE MEET LINK
        const bookingId = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const meetResult = await GoogleMeetService.createMeetingLink({
          bookingId,
          startTime: targetScheduledAt,
          durationMinutes: Number(durationMinutes) || 45,
          notes: notes?.trim(),
        });
        const meetingUrl = meetResult.meetingUrl;

        const newBooking = {
          id: bookingId,
          userId,
          creatorId: targetCreatorId,
          offerId: offerId || undefined,
          availabilityId: targetAvailabilityId || undefined,
          scheduledAt: targetScheduledAt,
          durationMinutes: Number(durationMinutes) || 45,
          status: 'SCHEDULED' as const,
          meetingUrl,
          notes: notes?.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.bookings.push(newBooking);

        if (targetAvailabilityId) {
          const slot = inMemoryStore.availabilities.find((a) => a.id === targetAvailabilityId);
          if (slot) slot.isBooked = true;
        }

        const buyerUser = inMemoryStore.users.find((u) => u.id === userId);
        const creator = inMemoryStore.creatorProfiles.find((cp) => cp.id === targetCreatorId);
        const creatorUser = creator ? inMemoryStore.users.find((u) => u.id === creator.userId) : null;
        const offer = offerId ? inMemoryStore.offers.find((o) => o.id === offerId) : null;

        GamificationService.awardPoints(userId, targetCreatorId, 'event-attend', {
          bookingId: newBooking.id,
          scheduledAt: newBooking.scheduledAt,
        }).catch((e) => console.warn('[Gamification event-attend hook]:', e));

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
              id: userId,
              fullName: buyerUser?.fullName || 'Athlete',
              email: buyerUser?.email || '',
            },
            creator: {
              id: targetCreatorId,
              fullName: creatorUser?.fullName || 'Coach',
              handle: creator?.handle || 'coach',
              avatarUrl: creatorUser?.avatarUrl,
            },
            offer: offer
              ? {
                  id: offer.id,
                  title: offer.title,
                  price: Number(offer.price),
                  currency: offer.currency,
                }
              : null,
            createdAt: newBooking.createdAt,
          },
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while processing booking.',
      details: error.message,
    });
  }
};

/**
 * GET /bookings (or /bookings/my-bookings)
 * Fetch bookings for the authenticated user (buyer or creator)
 */
export const getUserBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const userId = req.user.userId;

    try {
      const creator = await prisma.creatorProfile.findUnique({ where: { userId } });

      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { userId },
            ...(creator ? [{ creatorId: creator.id }] : []),
          ],
        },
        orderBy: { scheduledAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, handle: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
          offer: { select: { id: true, title: true, price: true, currency: true } },
        },
      });

      res.status(200).json({
        success: true,
        data: { bookings },
      });
      return;
    } catch (dbErr) {
      console.warn('[getUserBookings] DB fallback:', dbErr);
    }

    // In-memory fallback
    const creator = inMemoryStore.creatorProfiles.find((cp) => cp.userId === userId);
    const memBookings = inMemoryStore.bookings
      .filter((b) => b.userId === userId || (creator && b.creatorId === creator.id))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .map((b) => {
        const u = inMemoryStore.users.find((user) => user.id === b.userId);
        const c = inMemoryStore.creatorProfiles.find((cp) => cp.id === b.creatorId);
        const cu = c ? inMemoryStore.users.find((user) => user.id === c.userId) : null;
        const o = b.offerId ? inMemoryStore.offers.find((off) => off.id === b.offerId) : null;

        return {
          id: b.id,
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes,
          status: b.status,
          meetingUrl: b.meetingUrl,
          notes: b.notes,
          user: { id: b.userId, fullName: u?.fullName || 'Athlete', email: u?.email, avatarUrl: u?.avatarUrl },
          creator: { id: b.creatorId, handle: c?.handle || 'coach', user: { fullName: cu?.fullName || 'Coach', email: cu?.email, avatarUrl: cu?.avatarUrl } },
          offer: o ? { id: o.id, title: o.title, price: Number(o.price), currency: o.currency } : null,
          createdAt: b.createdAt,
        };
      });

    res.status(200).json({
      success: true,
      data: { bookings: memBookings },
    });
  } catch (error: any) {
    console.error('[getUserBookings Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /bookings/:id
 * Fetch single booking details with meetingUrl
 */
export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawId = req.params.id;
    const bookingId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const userId = req.user.userId;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, userId: true, handle: true, user: { select: { fullName: true, email: true, avatarUrl: true } } } },
          offer: { select: { id: true, title: true, price: true, currency: true } },
        },
      });

      if (booking) {
        const isBuyer = booking.userId === userId;
        const isCoach = booking.creator.userId === userId;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isBuyer && !isCoach && !isAdmin) {
          res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this booking.' });
          return;
        }

        res.status(200).json({ success: true, data: { booking } });
        return;
      }
    } catch (dbErr) {
      console.warn('[getBookingById] DB fallback:', dbErr);
    }

    const b = inMemoryStore.bookings.find((item) => item.id === bookingId);
    if (!b) {
      res.status(404).json({ success: false, error: `Booking with id "${bookingId}" not found.` });
      return;
    }

    const c = inMemoryStore.creatorProfiles.find((cp) => cp.id === b.creatorId);
    const isBuyer = b.userId === userId;
    const isCoach = c?.userId === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isCoach && !isAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this booking.' });
      return;
    }

    const u = inMemoryStore.users.find((user) => user.id === b.userId);
    const cu = c ? inMemoryStore.users.find((user) => user.id === c.userId) : null;
    const o = b.offerId ? inMemoryStore.offers.find((off) => off.id === b.offerId) : null;

    res.status(200).json({
      success: true,
      data: {
        booking: {
          id: b.id,
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes,
          status: b.status,
          meetingUrl: b.meetingUrl,
          notes: b.notes,
          user: { id: b.userId, fullName: u?.fullName || 'Athlete', email: u?.email, avatarUrl: u?.avatarUrl },
          creator: { id: b.creatorId, handle: c?.handle || 'coach', user: { fullName: cu?.fullName || 'Coach', email: cu?.email, avatarUrl: cu?.avatarUrl } },
          offer: o ? { id: o.id, title: o.title, price: Number(o.price), currency: o.currency } : null,
          createdAt: b.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('[getBookingById Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /bookings/:id/cancel
 * Cancel booking and release availability slot
 */
export const cancelBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawId = req.params.id;
    const bookingId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const userId = req.user.userId;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { creator: true },
      });

      if (!booking) {
        res.status(404).json({ success: false, error: `Booking with id "${bookingId}" not found.` });
        return;
      }

      const isBuyer = booking.userId === userId;
      const isCoach = booking.creator.userId === userId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isBuyer && !isCoach && !isAdmin) {
        res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to cancel this booking.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });

        if (booking.availabilityId) {
          await tx.availability.update({
            where: { id: booking.availabilityId },
            data: { isBooked: false },
          });
        }
      });

      res.status(200).json({
        success: true,
        message: 'Booking cancelled and slot released successfully.',
        data: { id: bookingId, status: 'CANCELLED' },
      });
      return;
    } catch (dbErr) {
      console.warn('[cancelBooking] DB fallback:', dbErr);
    }

    const b = inMemoryStore.bookings.find((item) => item.id === bookingId);
    if (!b) {
      res.status(404).json({ success: false, error: `Booking with id "${bookingId}" not found.` });
      return;
    }

    b.status = 'CANCELLED';
    if (b.availabilityId) {
      const slot = inMemoryStore.availabilities.find((a) => a.id === b.availabilityId);
      if (slot) slot.isBooked = false;
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and slot released successfully.',
      data: { id: bookingId, status: 'CANCELLED' },
    });
  } catch (error: any) {
    console.error('[cancelBooking Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
