/**
 * EventService — Business logic for creator-hosted group sessions.
 * Operates on inMemoryStore as primary source, Prisma as secondary.
 */
import { inMemoryStore, MemoryEvent, MemoryEventRSVP, EventStatus, RSVPStatus } from '../config/inMemoryDb.js';
import { GoogleMeetService } from './google-meet.service.js';
import { GamificationService } from './gamification.service.js';
import { MembershipService } from './membership.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateEventDto {
  title: string;
  description?: string;
  scheduledAt: Date | string;
  durationMinutes?: number;
  capacity?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: EventStatus;
}

export interface EventWithMeta extends MemoryEvent {
  rsvpCount: number;
  attendeeCount: number;
  spotsLeft: number | null;  // null = unlimited
  rsvps?: MemoryEventRSVP[];
}

export interface CalendarEventEntry extends EventWithMeta {
  myRSVP?: {
    id: string;
    status: RSVPStatus;
    hasAttended: boolean;
    joinToken: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enrichEvent(event: MemoryEvent, requestingUserId?: string): CalendarEventEntry {
  const rsvps = inMemoryStore.eventRsvps.filter((r) => r.eventId === event.id);
  const goingRsvps = rsvps.filter((r) => r.status === 'GOING');
  const rsvpCount = goingRsvps.length;
  const attendeeCount = rsvps.filter((r) => r.hasAttended).length;
  const spotsLeft =
    event.capacity != null ? Math.max(0, event.capacity - rsvpCount) : null;

  const myRSVP = requestingUserId
    ? rsvps.find((r) => r.userId === requestingUserId) ?? null
    : null;

  return {
    ...event,
    rsvpCount,
    attendeeCount,
    spotsLeft,
    myRSVP: myRSVP
      ? {
          id: myRSVP.id,
          status: myRSVP.status,
          hasAttended: myRSVP.hasAttended,
          joinToken: myRSVP.joinToken,
        }
      : null,
  };
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateJoinToken() {
  // UUID-like token
  return 'jt-' + Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 8)
  ).join('-');
}

// ---------------------------------------------------------------------------
// EventService
// ---------------------------------------------------------------------------

export const EventService = {

  // ── CREATE ────────────────────────────────────────────────────────────────

  async createEvent(creatorId: string, dto: CreateEventDto): Promise<EventWithMeta> {
    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) throw new Error('Invalid scheduledAt date.');
    if (scheduledAt < new Date()) throw new Error('Cannot schedule an event in the past.');

    // Generate Google Meet link
    const meetResult = await GoogleMeetService.createMeetingLink({
      bookingId: `evt-${Date.now()}`,
      title: dto.title,
      startTime: scheduledAt,
      durationMinutes: dto.durationMinutes ?? 60,
    });

    const now = new Date();
    const newEvent: MemoryEvent = {
      id: generateId('evt'),
      creatorId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      scheduledAt,
      durationMinutes: dto.durationMinutes ?? 60,
      capacity: dto.capacity ?? undefined,
      isRecurring: dto.isRecurring ?? false,
      recurrenceRule: dto.recurrenceRule,
      meetingUrl: meetResult.meetingUrl,
      meetingCode: meetResult.meetingCode,
      conferenceId: meetResult.conferenceId,
      calendarEventId: meetResult.calendarEventId,
      status: 'SCHEDULED',
      createdAt: now,
      updatedAt: now,
    };

    inMemoryStore.events.push(newEvent);
    console.log(`[EventService] Created event "${newEvent.title}" (${newEvent.id}) for creator:${creatorId}`);
    return enrichEvent(newEvent);
  },

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async updateEvent(eventId: string, creatorId: string, dto: UpdateEventDto): Promise<EventWithMeta> {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.creatorId !== creatorId) throw new Error('Forbidden: You do not own this event.');
    if (event.status === 'CANCELLED') throw new Error('Cannot update a cancelled event.');

    if (dto.scheduledAt) {
      const d = new Date(dto.scheduledAt);
      if (isNaN(d.getTime())) throw new Error('Invalid scheduledAt date.');
      event.scheduledAt = d;
    }
    if (dto.title !== undefined) event.title = dto.title.trim();
    if (dto.description !== undefined) event.description = dto.description?.trim();
    if (dto.durationMinutes !== undefined) event.durationMinutes = dto.durationMinutes;
    if (dto.capacity !== undefined) event.capacity = dto.capacity;
    if (dto.isRecurring !== undefined) event.isRecurring = dto.isRecurring;
    if (dto.recurrenceRule !== undefined) event.recurrenceRule = dto.recurrenceRule;
    if (dto.status !== undefined) event.status = dto.status;
    event.updatedAt = new Date();

    return enrichEvent(event);
  },

  // ── CANCEL ────────────────────────────────────────────────────────────────

  async cancelEvent(eventId: string, creatorId: string): Promise<MemoryEvent> {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.creatorId !== creatorId) throw new Error('Forbidden: You do not own this event.');
    event.status = 'CANCELLED';
    event.updatedAt = new Date();
    return event;
  },

  // ── GET SINGLE ────────────────────────────────────────────────────────────

  getEvent(eventId: string, requestingUserId?: string): CalendarEventEntry | null {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    return event ? enrichEvent(event, requestingUserId) : null;
  },

  // ── CALENDAR ──────────────────────────────────────────────────────────────

  getCalendar(
    creatorId: string,
    from?: Date,
    to?: Date,
    requestingUserId?: string
  ): CalendarEventEntry[] {
    const start = from ?? new Date(0);
    const end = to ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return inMemoryStore.events
      .filter(
        (e) =>
          e.creatorId === creatorId &&
          e.scheduledAt >= start &&
          e.scheduledAt <= end
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .map((e) => enrichEvent(e, requestingUserId));
  },

  // ── RSVP ──────────────────────────────────────────────────────────────────

  async rsvpEvent(eventId: string, userId: string): Promise<MemoryEventRSVP> {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.status === 'CANCELLED') throw new Error('Cannot RSVP to a cancelled event.');
    if (event.status === 'COMPLETED') throw new Error('Cannot RSVP to a completed event.');

    // Creator / Admin check
    const creator = inMemoryStore.creatorProfiles.find((c) => c.id === event.creatorId);
    const isHost = creator?.userId === userId;

    if (!isHost) {
      // 1. Verify community membership
      const tierStatus = await MembershipService.getUserTierMembership(userId, event.creatorId);
      if (!tierStatus.hasMembership) {
        throw new Error('Community membership required: You must join this creator\'s community before RSVPing to live events.');
      }

      // 2. Paid tier gating for live workshops / events (or specific event offer access)
      if (event.eventOfferId) {
        const hasOfferAccess = await MembershipService.hasAccessToOffer(userId, event.creatorId, event.eventOfferId);
        if (!hasOfferAccess) {
          throw new Error('Tier check failed: This event requires a Paid Membership Tier or event pass.');
        }
      } else if (!tierStatus.isPaidMember) {
        // Free tier allows community, but paid tier grants full live event RSVP access
        throw new Error('Tier check failed: Full event RSVP access is reserved for Paid Membership Tier members. Upgrade to RSVP.');
      }
    }

    const existing = inMemoryStore.eventRsvps.find(
      (r) => r.eventId === eventId && r.userId === userId
    );
    if (existing && existing.status === 'GOING') {
      throw new Error('You have already RSVP\'d to this event.');
    }

    // Capacity enforcement
    const goingCount = inMemoryStore.eventRsvps.filter(
      (r) => r.eventId === eventId && r.status === 'GOING'
    ).length;

    const rsvpStatus: RSVPStatus =
      event.capacity != null && goingCount >= event.capacity ? 'WAITLISTED' : 'GOING';

    // Update existing or create new
    if (existing) {
      existing.status = rsvpStatus;
      existing.updatedAt = new Date();
      return existing;
    }

    const now = new Date();
    const rsvp: MemoryEventRSVP = {
      id: generateId('rsvp'),
      eventId,
      userId,
      status: rsvpStatus,
      hasAttended: false,
      joinToken: generateJoinToken(),
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.eventRsvps.push(rsvp);
    console.log(`[EventService] RSVP created: user:${userId} → event:${eventId} (${rsvpStatus})`);
    return rsvp;
  },

  // ── CANCEL RSVP ───────────────────────────────────────────────────────────

  cancelRSVP(eventId: string, userId: string): void {
    const idx = inMemoryStore.eventRsvps.findIndex(
      (r) => r.eventId === eventId && r.userId === userId
    );
    if (idx === -1) throw new Error('No RSVP found to cancel.');
    inMemoryStore.eventRsvps[idx].status = 'NOT_GOING';
    inMemoryStore.eventRsvps[idx].updatedAt = new Date();

    // If someone on waitlist, promote them
    const waitlisted = inMemoryStore.eventRsvps.find(
      (r) => r.eventId === eventId && r.status === 'WAITLISTED'
    );
    if (waitlisted) {
      waitlisted.status = 'GOING';
      waitlisted.updatedAt = new Date();
      console.log(`[EventService] Promoted user:${waitlisted.userId} from WAITLIST to GOING for event:${eventId}`);
    }
  },

  // ── MARK ATTENDED (manual creator toggle or internal) ─────────────────────

  async markAttended(eventId: string, userId: string, creatorId: string): Promise<MemoryEventRSVP> {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.creatorId !== creatorId) throw new Error('Forbidden: Only the event creator can mark attendance.');

    const rsvp = inMemoryStore.eventRsvps.find(
      (r) => r.eventId === eventId && r.userId === userId
    );
    if (!rsvp) throw new Error(`No RSVP found for user "${userId}" on event "${eventId}".`);

    if (!rsvp.hasAttended) {
      rsvp.hasAttended = true;
      rsvp.attendedAt = new Date();
      rsvp.updatedAt = new Date();

      // Award gamification points (dedup handled inside GamificationService)
      GamificationService.awardPoints(userId, creatorId, 'event-attend', {
        eventId,
        joinMethod: 'manual',
      }).catch((e) => console.warn('[EventService] Gamification award error:', e));
    }

    return rsvp;
  },

  // ── BULK MARK ATTENDED (creator marks multiple at once) ───────────────────

  async bulkMarkAttended(
    eventId: string,
    userIds: string[],
    creatorId: string
  ): Promise<{ marked: string[]; skipped: string[] }> {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.creatorId !== creatorId) throw new Error('Forbidden: Only the event creator can mark attendance.');

    const marked: string[] = [];
    const skipped: string[] = [];

    for (const userId of userIds) {
      const rsvp = inMemoryStore.eventRsvps.find(
        (r) => r.eventId === eventId && r.userId === userId
      );
      if (!rsvp || rsvp.hasAttended) {
        skipped.push(userId);
        continue;
      }
      rsvp.hasAttended = true;
      rsvp.attendedAt = new Date();
      rsvp.updatedAt = new Date();
      marked.push(userId);

      GamificationService.awardPoints(userId, creatorId, 'event-attend', {
        eventId,
        joinMethod: 'bulk-manual',
      }).catch((e) => console.warn('[EventService] Gamification bulk error:', e));
    }

    return { marked, skipped };
  },

  // ── AUTO ATTENDANCE VIA JOIN TOKEN ────────────────────────────────────────

  async joinViaToken(joinToken: string): Promise<{
    rsvp: MemoryEventRSVP;
    event: MemoryEvent;
    meetingUrl: string;
  }> {
    const rsvp = inMemoryStore.eventRsvps.find((r) => r.joinToken === joinToken);
    if (!rsvp) throw new Error('Invalid or expired join token.');

    const event = inMemoryStore.events.find((e) => e.id === rsvp.eventId);
    if (!event) throw new Error('Associated event not found.');
    if (event.status === 'CANCELLED') throw new Error('This event has been cancelled.');

    if (!rsvp.hasAttended) {
      rsvp.hasAttended = true;
      rsvp.attendedAt = new Date();
      rsvp.updatedAt = new Date();

      GamificationService.awardPoints(rsvp.userId, event.creatorId, 'event-attend', {
        eventId: event.id,
        joinMethod: 'join-link',
      }).catch((e) => console.warn('[EventService] Gamification join-link error:', e));

      console.log(`[EventService] Auto-attended: user:${rsvp.userId} → event:${event.id} via join token`);
    }

    return { rsvp, event, meetingUrl: event.meetingUrl ?? '' };
  },

  // ── GET ATTENDEES (creator view) ──────────────────────────────────────────

  getAttendees(eventId: string, creatorId: string): (MemoryEventRSVP & { user?: { fullName: string; avatarUrl?: string } })[] {
    const event = inMemoryStore.events.find((e) => e.id === eventId);
    if (!event) throw new Error(`Event "${eventId}" not found.`);
    if (event.creatorId !== creatorId) throw new Error('Forbidden.');

    const rsvps = inMemoryStore.eventRsvps.filter((r) => r.eventId === eventId);
    return rsvps.map((r) => {
      const user = inMemoryStore.users.find((u) => u.id === r.userId);
      return {
        ...r,
        user: user ? { fullName: user.fullName, avatarUrl: user.avatarUrl } : undefined,
      };
    });
  },
};
