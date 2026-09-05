export interface DripCheckResult {
  isLocked: boolean;
  unlockDate: Date | null;
  reason?: string;
  daysRemaining?: number;
}

/**
 * Calculates whether a lesson is drip-locked for a specific user enrollment.
 * Enforces drip schedule server-side.
 */
export function calculateLessonDripStatus(
  lesson: {
    dripDays: number;
    dripDate: Date | null;
    isPreview?: boolean;
  },
  enrolledAt?: Date | null,
  isCreatorOrAdmin: boolean = false
): DripCheckResult {
  // Creators and Admins always bypass drip lock
  if (isCreatorOrAdmin) {
    return { isLocked: false, unlockDate: null };
  }

  // Free preview lessons are always accessible
  if (lesson.isPreview) {
    return { isLocked: false, unlockDate: null };
  }

  // If user is not enrolled, lesson is locked
  if (!enrolledAt) {
    return {
      isLocked: true,
      unlockDate: null,
      reason: 'Enrollment required to access lesson.',
    };
  }

  const now = new Date();
  let unlockDate: Date | null = null;

  // Case 1: Specific Calendar Drip Date
  if (lesson.dripDate) {
    unlockDate = new Date(lesson.dripDate);
  }
  // Case 2: Relative Drip Days after enrollment
  else if (lesson.dripDays > 0) {
    unlockDate = new Date(
      new Date(enrolledAt).getTime() + lesson.dripDays * 24 * 60 * 60 * 1000
    );
  }

  // If there is an unlock date in the future, it is locked
  if (unlockDate && now < unlockDate) {
    const diffMs = unlockDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      isLocked: true,
      unlockDate,
      daysRemaining,
      reason: `Lesson is locked on a drip schedule until ${unlockDate.toISOString()}. Unlocks in ~${daysRemaining} day(s).`,
    };
  }

  // Lesson is unlocked
  return {
    isLocked: false,
    unlockDate,
  };
}
