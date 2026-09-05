import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { EventService } from '../services/event.service.js';
import { inMemoryStore } from '../config/inMemoryDb.js';

// ---------------------------------------------------------------------------
// Helper: resolve creatorId from param (id | handle | userId)
// ---------------------------------------------------------------------------
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

function resolveCreatorId(identifier: string): string | null {
  const mem = inMemoryStore.creatorProfiles.find(
    (p) => p.id === identifier || p.handle === identifier || p.userId === identifier
  );
  return mem?.id ?? null;
}

function resolveCreatorIdByUserId(userId: string): string | null {
  const mem = inMemoryStore.creatorProfiles.find((p) => p.userId === userId);
  return mem?.id ?? null;
}

// ---------------------------------------------------------------------------
// POST /events — Create event (creator only)
// ---------------------------------------------------------------------------
export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const creatorId = resolveCreatorIdByUserId(req.user.userId);
    if (!creatorId && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only creators can host events.' });
      return;
    }

    const { title, description, scheduledAt, durationMinutes, capacity, isRecurring, recurrenceRule } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ success: false, error: 'title and scheduledAt are required.' });
      return;
    }

    const targetCreatorId = creatorId ?? req.body.creatorId;
    const event = await EventService.createEvent(targetCreatorId, {
      title,
      description,
      scheduledAt,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      isRecurring: Boolean(isRecurring),
      recurrenceRule,
    });

    res.status(201).json({
      success: true,
      message: `Event "${event.title}" created with Google Meet link.`,
      data: event,
    });
  } catch (error: any) {
    console.error('[createEvent Error]:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// PUT /events/:id — Update event (creator only)
// ---------------------------------------------------------------------------
export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const creatorId = resolveCreatorIdByUserId(req.user.userId) ?? req.user.userId;
    const event = await EventService.updateEvent(getParam(req.params.id), creatorId, req.body);

    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    const statusCode = error.message.startsWith('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /events/:id — Cancel event (creator only)
// ---------------------------------------------------------------------------
export const cancelEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const creatorId = resolveCreatorIdByUserId(req.user.userId) ?? req.user.userId;
    const event = await EventService.cancelEvent(getParam(req.params.id), creatorId);

    res.status(200).json({ success: true, message: 'Event cancelled.', data: event });
  } catch (error: any) {
    const statusCode = error.message.startsWith('Forbidden') ? 403 : 404;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /events/:id — Get single event
// ---------------------------------------------------------------------------
export const getEvent = (req: AuthenticatedRequest, res: Response): void => {
  const eventId = getParam(req.params.id);
  const event = EventService.getEvent(eventId, req.user?.userId);
  if (!event) {
    res.status(404).json({ success: false, error: `Event "${eventId}" not found.` });
    return;
  }
  res.status(200).json({ success: true, data: event });
};

// ---------------------------------------------------------------------------
// GET /creators/:id/calendar?from=&to=  — Public calendar view
// ---------------------------------------------------------------------------
export const getCreatorCalendar = (req: AuthenticatedRequest, res: Response): void => {
  const identifier = getParam(req.params.id);
  const creatorId = resolveCreatorId(identifier);

  if (!creatorId) {
    res.status(404).json({ success: false, error: `Creator "${identifier}" not found.` });
    return;
  }

  const { from, to } = req.query as { from?: string; to?: string };
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const events = EventService.getCalendar(creatorId, fromDate, toDate, req.user?.userId);

  res.status(200).json({
    success: true,
    data: {
      creatorId,
      from: fromDate?.toISOString() ?? 'all',
      to: toDate?.toISOString() ?? 'all',
      totalEvents: events.length,
      events,
    },
  });
};

// ---------------------------------------------------------------------------
// POST /events/:id/rsvp — RSVP (authenticated buyer)
// ---------------------------------------------------------------------------
export const rsvpEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const eventId = getParam(req.params.id);
    const rsvp = await EventService.rsvpEvent(eventId, req.user.userId);
    const event = EventService.getEvent(eventId);

    const msg = rsvp.status === 'WAITLISTED'
      ? 'Added to waitlist — event is at capacity.'
      : 'RSVP confirmed! Your personal join link is ready.';

    res.status(201).json({
      success: true,
      message: msg,
      data: {
        rsvp,
        event: event ? {
          id: event.id,
          title: event.title,
          scheduledAt: event.scheduledAt,
          meetingUrl: event.meetingUrl,
          rsvpCount: event.rsvpCount,
          spotsLeft: event.spotsLeft,
        } : null,
        joinUrl: `/events/join/${rsvp.joinToken}`,
      },
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Tier check failed') || error.message.includes('Community membership required') ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /events/:id/rsvp — Cancel RSVP
// ---------------------------------------------------------------------------
export const cancelRSVP = (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    EventService.cancelRSVP(getParam(req.params.id), req.user.userId);
    res.status(200).json({ success: true, message: 'RSVP cancelled.' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /events/:id/attendance/:userId — Manual attendance mark (creator only)
// ---------------------------------------------------------------------------
export const markAttended = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const creatorId = resolveCreatorIdByUserId(req.user.userId) ?? req.user.userId;
    const rsvp = await EventService.markAttended(getParam(req.params.id), getParam(req.params.userId), creatorId);

    res.status(200).json({
      success: true,
      message: 'Attendance marked. Gamification points awarded.',
      data: rsvp,
    });
  } catch (error: any) {
    const statusCode = error.message.startsWith('Forbidden') ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /events/:id/attendance/bulk — Bulk attendance (creator only)
// Body: { userIds: string[] }
// ---------------------------------------------------------------------------
export const bulkMarkAttended = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ success: false, error: 'userIds must be a non-empty array.' });
      return;
    }

    const creatorId = resolveCreatorIdByUserId(req.user.userId) ?? req.user.userId;
    const result = await EventService.bulkMarkAttended(getParam(req.params.id), userIds, creatorId);

    res.status(200).json({
      success: true,
      message: `Marked ${result.marked.length} attendee(s). Skipped ${result.skipped.length}.`,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.startsWith('Forbidden') ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /events/join/:token — Auto-attendance + redirect to Meet
// ---------------------------------------------------------------------------
export const joinViaToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getParam(req.params.token);
    const { rsvp, meetingUrl } = await EventService.joinViaToken(token);

    if (!meetingUrl) {
      res.status(400).json({ success: false, error: 'No meeting URL associated with this event.' });
      return;
    }

    // 302 redirect to Google Meet — attendance has already been marked
    console.log(`[EventController] Join token used: rsvp:${rsvp.id} → ${meetingUrl}`);
    res.redirect(302, meetingUrl);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /events/:id/attendees — Attendee list (creator only)
// ---------------------------------------------------------------------------
export const getAttendees = (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) { res.status(401).json({ success: false, error: 'Unauthorized.' }); return; }

    const creatorId = resolveCreatorIdByUserId(req.user.userId) ?? req.user.userId;
    const eventId = getParam(req.params.id);
    const attendees = EventService.getAttendees(eventId, creatorId);

    res.status(200).json({
      success: true,
      data: {
        eventId,
        totalRSVPs: attendees.length,
        attended: attendees.filter((a) => a.hasAttended).length,
        attendees,
      },
    });
  } catch (error: any) {
    const statusCode = error.message.startsWith('Forbidden') ? 403 : 404;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};
