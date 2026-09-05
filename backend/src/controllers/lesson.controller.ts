import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { calculateLessonDripStatus } from '../utils/drip.util.js';
import { CertificateService } from '../services/certificate.service.js';
import { GamificationService } from '../services/gamification.service.js';
import { MembershipService } from '../services/membership.service.js';

/**
 * POST /lessons/:id/complete
 * Marks a lesson as completed for the authenticated user while strictly enforcing drip lock
 */
export const markLessonComplete = async (
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
    const lessonId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    if (!lessonId) {
      res.status(400).json({
        success: false,
        error: 'Lesson ID parameter is required.',
      });
      return;
    }

    const userId = req.user.userId;

    // 1. Fetch Lesson, Course and its Creator
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            creator: {
              select: { id: true, userId: true },
            },
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, order: true, title: true, dripDays: true, dripDate: true, isPreview: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: `Lesson with id "${lessonId}" not found.`,
      });
      return;
    }

    const course = lesson.course;
    const isCreatorOrAdmin =
      course.creator.userId === userId || req.user.role === 'ADMIN';

    // 2. Check Enrollment or Paid Tier Membership (if not creator or admin)
    let enrollment: { id: string; enrolledAt: Date; progressPercent: number } | null = null;

    if (!isCreatorOrAdmin) {
      const userEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          OR: [{ courseId: course.id }, ...(course.offerId ? [{ offerId: course.offerId }] : [])],
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
        select: {
          id: true,
          enrolledAt: true,
          progressPercent: true,
        },
      });

      if (userEnrollment) {
        enrollment = userEnrollment;
      } else {
        const tierStatus = await MembershipService.getUserTierMembership(userId, course.creator.id);
        if (
          tierStatus.isPaidMember &&
          (!course.offerId ||
            tierStatus.unlockedOfferIds.length === 0 ||
            tierStatus.unlockedOfferIds.includes(course.offerId))
        ) {
          enrollment = {
            id: `tier-${tierStatus.tier?.id}-${userId}`,
            enrolledAt: tierStatus.joinedAt || new Date(),
            progressPercent: 0,
          };
        }
      }

      if (!enrollment) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You are not enrolled or do not have a Paid Membership Tier covering this course.',
        });
        return;
      }
    }

    // 3. SERVER-SIDE DRIP LOCK ENFORCEMENT
    const dripCheck = calculateLessonDripStatus(
      lesson,
      enrollment?.enrolledAt || null,
      isCreatorOrAdmin
    );

    if (dripCheck.isLocked) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot complete lesson because it is currently locked on a drip schedule.',
        details: {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          unlockDate: dripCheck.unlockDate,
          daysRemaining: dripCheck.daysRemaining,
          reason: dripCheck.reason,
        },
      });
      return;
    }

    // 4. Record Lesson Progress (Upsert)
    const now = new Date();
    const progressRecord = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lesson.id,
        },
      },
      update: {
        isCompleted: true,
        completedAt: now,
      },
      create: {
        userId,
        lessonId: lesson.id,
        isCompleted: true,
        completedAt: now,
      },
    });

    // 5. Recalculate Course Progress
    const allCourseLessonIds = course.lessons.map((l) => l.id);
    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: allCourseLessonIds },
        isCompleted: true,
      },
    });

    const totalLessons = allCourseLessonIds.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;
    const isAllCompleted = progressPercent >= 100;

    // Fire-and-forget: award gamification points for lesson-complete
    // Scoped to the course creator's community; first-time dedup handled inside GamificationService
    GamificationService.awardPoints(
      userId,
      course.creator.id, // creatorProfile.id as community scope
      'lesson-complete',
      { lessonId: lesson.id, courseId: course.id }
    ).catch((e) => console.warn('[Gamification lesson-complete hook]:', e));

    // 6. Update Enrollment record if exists
    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercent,
          status: isAllCompleted ? 'COMPLETED' : 'ACTIVE',
        },
      });
    }

    // 7. Determine Next Unlocked Lesson
    const nextLesson = course.lessons.find(
      (l) => l.order > lesson.order
    );

    let nextLessonDrip: any = null;
    if (nextLesson) {
      const nextDripCheck = calculateLessonDripStatus(
        nextLesson,
        enrollment?.enrolledAt || null,
        isCreatorOrAdmin
      );
      nextLessonDrip = {
        id: nextLesson.id,
        title: nextLesson.title,
        order: nextLesson.order,
        isLocked: nextDripCheck.isLocked,
        unlockDate: nextDripCheck.unlockDate,
      };
    }

    // 8. Auto-generate Certificate if 100% completed
    let certificate: any = null;
    if (isAllCompleted) {
      try {
        certificate = await CertificateService.getOrCreateCertificate(userId, course.id);
      } catch (certErr) {
        console.warn('[markLessonComplete] Certificate auto-generation failed:', certErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Lesson "${lesson.title}" marked as completed.`,
      data: {
        lessonId: lesson.id,
        isCompleted: progressRecord.isCompleted,
        completedAt: progressRecord.completedAt,
        courseProgress: {
          courseId: course.id,
          courseTitle: course.title,
          completedLessons: completedCount,
          totalLessons,
          progressPercent,
          isCourseCompleted: isAllCompleted,
        },
        nextLesson: nextLessonDrip,
        certificate,
      },
    });
  } catch (error: any) {
    console.error('[markLessonComplete Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while marking lesson complete.',
      details: error.message,
    });
  }
};

/**
 * POST /lessons/:id/progress
 * Update lesson video watch time and completion status
 */
export const updateLessonProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const lessonId = req.params.id;
    const { isCompleted, lastWatchedSeconds } = req.body;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: { creator: { select: { id: true, userId: true } } },
        },
      },
    });

    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lesson not found.' });
      return;
    }

    const userId = req.user.userId;
    const isOwnerOrAdmin = lesson.course.creator.userId === userId || req.user.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      const hasAccess = await MembershipService.hasAccessToOffer(userId, lesson.course.creator.id, lesson.course.offerId);
      if (!hasAccess && !lesson.isPreview) {
        res.status(403).json({ success: false, error: 'Forbidden: Course enrollment or Paid Tier required.' });
        return;
      }
    }

    const progressRecord = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: req.user.userId,
          lessonId,
        },
      },
      create: {
        userId: req.user.userId,
        lessonId,
        isCompleted: Boolean(isCompleted),
        completedAt: isCompleted ? new Date() : null,
        lastWatchedSeconds: lastWatchedSeconds || 0,
      },
      update: {
        ...(isCompleted !== undefined ? { isCompleted: Boolean(isCompleted), completedAt: isCompleted ? new Date() : null } : {}),
        ...(lastWatchedSeconds !== undefined ? { lastWatchedSeconds } : {}),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        lessonId,
        isCompleted: progressRecord.isCompleted,
        lastWatchedSeconds: progressRecord.lastWatchedSeconds,
        completedAt: progressRecord.completedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

