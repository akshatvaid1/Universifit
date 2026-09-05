/**
 * Ascend Creator Availability Schedule Service
 * Manages weekly recurring availability slots (Mon-Sun), blackout dates, and slot generation for booking engine.
 */

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  isActive: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface AvailabilityScheduleConfig {
  weeklySlots: DaySchedule[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  blackoutDates: string[]; // "YYYY-MM-DD"
  updatedAt?: string;
}

// In-memory store for creator schedules
const creatorScheduleStore = new Map<string, AvailabilityScheduleConfig>();

export class AvailabilityScheduleService {
  /**
   * Get schedule configuration for creator
   */
  static getSchedule(creatorId: string): AvailabilityScheduleConfig {
    const existing = creatorScheduleStore.get(creatorId);
    if (existing) return existing;

    // Default template
    const defaultSchedule: AvailabilityScheduleConfig = {
      weeklySlots: [
        { dayOfWeek: 1, dayName: 'Monday', isActive: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, dayName: 'Tuesday', isActive: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, dayName: 'Wednesday', isActive: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, dayName: 'Thursday', isActive: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, dayName: 'Friday', isActive: true, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 6, dayName: 'Saturday', isActive: false, startTime: '10:00', endTime: '14:00' },
        { dayOfWeek: 0, dayName: 'Sunday', isActive: false, startTime: '10:00', endTime: '14:00' },
      ],
      slotDurationMinutes: 45,
      bufferMinutes: 15,
      blackoutDates: [],
      updatedAt: new Date().toISOString(),
    };
    creatorScheduleStore.set(creatorId, defaultSchedule);
    return defaultSchedule;
  }

  /**
   * Save recurring weekly slots and blackout dates
   */
  static saveSchedule(
    creatorId: string,
    config: Partial<AvailabilityScheduleConfig>
  ): AvailabilityScheduleConfig {
    const current = this.getSchedule(creatorId);
    const updated: AvailabilityScheduleConfig = {
      weeklySlots: config.weeklySlots || current.weeklySlots,
      slotDurationMinutes: config.slotDurationMinutes || current.slotDurationMinutes || 45,
      bufferMinutes: config.bufferMinutes ?? current.bufferMinutes ?? 15,
      blackoutDates: Array.isArray(config.blackoutDates) ? config.blackoutDates : current.blackoutDates,
      updatedAt: new Date().toISOString(),
    };

    creatorScheduleStore.set(creatorId, updated);
    return updated;
  }

  /**
   * Generates prospective available booking slots for the upcoming N days
   * based on weekly recurring schedule, excluding blackout dates and existing bookings.
   */
  static generateAvailableSlots(
    creatorId: string,
    daysAhead: number = 30,
    existingBookings: Array<{ scheduledAt: Date }> = []
  ): Array<{
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isBooked: boolean;
  }> {
    const schedule = this.getSchedule(creatorId);
    const bookedTimestamps = new Set(
      existingBookings.map((b) => new Date(b.scheduledAt).toISOString())
    );

    const generatedSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      isBooked: boolean;
    }> = [];

    const now = new Date();
    const blackoutSet = new Set(schedule.blackoutDates);

    for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + dayOffset);

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Skip blackout dates
      if (blackoutSet.has(dateString)) continue;

      const dayOfWeek = targetDate.getDay();
      const dayConfig = schedule.weeklySlots.find((d) => d.dayOfWeek === dayOfWeek);

      if (!dayConfig || !dayConfig.isActive) continue;

      // Parse start and end hours
      const [startHour, startMin] = dayConfig.startTime.split(':').map(Number);
      const [endHour, endMin] = dayConfig.endTime.split(':').map(Number);

      const slotDuration = schedule.slotDurationMinutes || 45;
      const buffer = schedule.bufferMinutes || 15;
      const stepMinutes = slotDuration + buffer;

      const slotStart = new Date(targetDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const dayEndTime = new Date(targetDate);
      dayEndTime.setHours(endHour, endMin, 0, 0);

      while (slotStart.getTime() + slotDuration * 60000 <= dayEndTime.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        const isoStart = slotStart.toISOString();

        if (!bookedTimestamps.has(isoStart)) {
          generatedSlots.push({
            id: `slot_${creatorId}_${slotStart.getTime()}`,
            startTime: isoStart,
            endTime: slotEnd.toISOString(),
            durationMinutes: slotDuration,
            isBooked: false,
          });
        }

        // Advance by stepMinutes
        slotStart.setTime(slotStart.getTime() + stepMinutes * 60000);
      }
    }

    return generatedSlots;
  }
}
