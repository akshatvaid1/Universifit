/**
 * Utilities for Google Meet & 1:1 Coaching Session Time Windows
 */

export interface MeetingTimeStatus {
  isActive: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'EXPIRED';
  label: string;
  badgeText: string;
  tooltip: string;
  startsInText: string;
  timeWindowRangeText: string;
  minutesUntilStart: number;
}

/**
 * Calculates whether a booking is within the active call window.
 * Default Window:
 * - Starts: 15 minutes before scheduled slot
 * - Ends: 60 minutes after scheduled end time (scheduledAt + durationMinutes)
 */
export function getMeetingTimeStatus(
  scheduledAt: string | Date,
  durationMinutes: number = 45,
  windowBeforeMinutes: number = 15,
  windowAfterMinutes: number = 60
): MeetingTimeStatus {
  // Parse date - handle relative date strings gracefully if needed
  let startMs = 0;
  const now = Date.now();

  if (typeof scheduledAt === 'string') {
    const parsed = Date.parse(scheduledAt);
    if (!isNaN(parsed)) {
      startMs = parsed;
    } else {
      // Handle mock human string like "Tomorrow, 4:30 PM - 5:15 PM IST" or "Today at 2:00 PM"
      const lower = scheduledAt.toLowerCase();
      if (lower.includes('today') || lower.includes('live') || lower.includes('now')) {
        startMs = now - 5 * 60 * 1000; // pretend it started 5 mins ago for demo
      } else if (lower.includes('tomorrow')) {
        startMs = now + 24 * 60 * 60 * 1000;
      } else {
        startMs = now + 2 * 60 * 60 * 1000; // default 2 hours ahead
      }
    }
  } else if (scheduledAt instanceof Date) {
    startMs = scheduledAt.getTime();
  }

  const durationMs = durationMinutes * 60 * 1000;
  const endMs = startMs + durationMs;
  const windowStartMs = startMs - windowBeforeMinutes * 60 * 1000;
  const windowEndMs = endMs + windowAfterMinutes * 60 * 1000;

  const diffMs = startMs - now;
  const minutesUntilStart = Math.round(diffMs / (60 * 1000));

  // Time window range text
  const startObj = new Date(startMs);
  const startTimeStr = !isNaN(startObj.getTime())
    ? startObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : 'Slot Time';

  const windowStartObj = new Date(windowStartMs);
  const windowStartStr = !isNaN(windowStartObj.getTime())
    ? windowStartObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : `${windowBeforeMinutes}m before`;

  const timeWindowRangeText = `Active from ${windowStartStr} (15m before)`;

  if (now < windowStartMs) {
    const hours = Math.floor(minutesUntilStart / 60);
    const mins = minutesUntilStart % 60;
    const timeRemainingStr =
      hours > 24
        ? `in ${Math.floor(hours / 24)}d ${hours % 24}h`
        : hours > 0
        ? `in ${hours}h ${mins}m`
        : `in ${mins}m`;

    return {
      isActive: false,
      status: 'UPCOMING',
      label: `Join Call (${timeRemainingStr})`,
      badgeText: `Opens 15m prior`,
      tooltip: `The Google Meet room opens 15 minutes before your scheduled start time (${startTimeStr}).`,
      startsInText: timeRemainingStr,
      timeWindowRangeText,
      minutesUntilStart,
    };
  }

  if (now >= windowStartMs && now <= windowEndMs) {
    return {
      isActive: true,
      status: 'ACTIVE',
      label: 'Join Google Meet',
      badgeText: 'Call is Live Now',
      tooltip: 'Room is active! Tap to join your private 1-on-1 coaching video room.',
      startsInText: 'Now',
      timeWindowRangeText: 'Call in progress',
      minutesUntilStart: 0,
    };
  }

  return {
    isActive: false,
    status: 'EXPIRED',
    label: 'Session Ended',
    badgeText: 'Call Completed',
    tooltip: 'This 1:1 session slot window has concluded.',
    startsInText: 'Ended',
    timeWindowRangeText: 'Session concluded',
    minutesUntilStart: -1,
  };
}

/**
 * Creates a direct Google Calendar Web Link with pre-filled event details & Meet link
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  startTime?: string | Date;
  durationMinutes?: number;
  meetLink: string;
  coachName?: string;
  studentName?: string;
}): string {
  const { title, startTime, durationMinutes = 45, meetLink, coachName, studentName } = params;

  let start = new Date();
  if (startTime) {
    const parsed = typeof startTime === 'string' ? Date.parse(startTime) : startTime.getTime();
    if (!isNaN(parsed)) start = new Date(parsed);
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const datesParam = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
  const eventTitle = `Ascend 1:1 Session: ${title} (${coachName || 'Coach'})`;
  const eventDetails = `Ascend 1-on-1 Coaching Consultation\n\nCoach: ${coachName || 'Verified Coach'}\nStudent: ${
    studentName || 'Athlete'
  }\n\nGoogle Meet Link:\n${meetLink}\n\nPlease join 3 minutes prior with camera and microphone enabled.`;

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', eventTitle);
  url.searchParams.set('dates', datesParam);
  url.searchParams.set('details', eventDetails);
  url.searchParams.set('location', meetLink);

  return url.toString();
}

/**
 * Generates an .ics calendar file download
 */
export function downloadIcsFile(params: {
  id: string;
  title: string;
  startTime?: string | Date;
  durationMinutes?: number;
  meetLink: string;
  coachName?: string;
}) {
  const { id, title, meetLink, coachName } = params;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ascend Coaching Platforms//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ascend-${id}-${Date.now()}@ascend.fit`,
    `SUMMARY:Ascend 1:1: ${title} with ${coachName || 'Coach'}`,
    `DESCRIPTION:Ascend 1-on-1 Coaching Video Consultation\\nGoogle Meet: ${meetLink}`,
    `LOCATION:${meetLink}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ascend-session-${id || 'slot'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
