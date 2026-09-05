import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { calculateLessonDripStatus } from '../utils/drip.util.js';

/**
 * GET /users/me/progress
 * Fetches the authenticated user's complete learning and course progression
 */
export const getUserProgress = async (
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

    const userId = req.user.userId;

    // Fetch user with active and completed enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            creator: {
              select: {
                id: true,
                handle: true,
                user: { select: { fullName: true, avatarUrl: true } },
              },
            },
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                durationSeconds: true,
                dripDays: true,
                dripDate: true,
                isPreview: true,
              },
            },
          },
        },
        offer: {
          include: {
            course: {
              include: {
                creator: {
                  select: {
                    id: true,
                    handle: true,
                    user: { select: { fullName: true, avatarUrl: true } },
                  },
                },
                lessons: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    order: true,
                    durationSeconds: true,
                    dripDays: true,
                    dripDate: true,
                    isPreview: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Fetch all user's lesson progress
    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        isCompleted: true,
        completedAt: true,
      },
    });

    const completedLessonIds = new Set(
      progressRecords.filter((p) => p.isCompleted).map((p) => p.lessonId)
    );

    // Process each enrolled course
    const courseProgressList: any[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.course || enrollment.offer?.course;
      if (!course) continue;

      const lessons = course.lessons || [];
      const totalLessons = lessons.length;
      let completedLessonsCount = 0;
      let currentLesson: any = null;
      let nextLockedDripLesson: any = null;

      const lessonsDetail = lessons.map((lesson) => {
        const isCompleted = completedLessonIds.has(lesson.id);
        if (isCompleted) completedLessonsCount++;

        const dripStatus = calculateLessonDripStatus(
          lesson,
          enrollment.enrolledAt,
          false
        );

        const lessonObj = {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          durationSeconds: lesson.durationSeconds,
          isCompleted,
          isLocked: dripStatus.isLocked,
          unlockDate: dripStatus.unlockDate,
          daysRemaining: dripStatus.daysRemaining || 0,
        };

        // First uncompleted and unlocked lesson becomes currentLesson
        if (!currentLesson && !isCompleted && !dripStatus.isLocked) {
          currentLesson = lessonObj;
        }

        // Earliest upcoming drip lock
        if (!nextLockedDripLesson && dripStatus.isLocked && dripStatus.unlockDate) {
          nextLockedDripLesson = lessonObj;
        }

        return lessonObj;
      });

      const computedPercent =
        totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

      courseProgressList.push({
        enrollmentId: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        course: {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          creatorName: course.creator.user.fullName,
          creatorHandle: course.creator.handle,
          creatorAvatar: course.creator.user.avatarUrl,
        },
        progress: {
          progressPercent: computedPercent,
          completedLessonsCount,
          totalLessons,
          isCompleted: computedPercent >= 100,
        },
        currentLesson: currentLesson || (computedPercent >= 100 ? null : lessonsDetail[0] || null),
        nextDripUnlock: nextLockedDripLesson
          ? {
              lessonId: nextLockedDripLesson.id,
              lessonTitle: nextLockedDripLesson.title,
              unlockDate: nextLockedDripLesson.unlockDate,
              daysRemaining: nextLockedDripLesson.daysRemaining,
            }
          : null,
      });
    }

    const totalCourses = courseProgressList.length;
    const completedCourses = courseProgressList.filter((c) => c.progress.isCompleted).length;
    const overallCompletionPercent =
      totalCourses > 0
        ? Math.round(
            courseProgressList.reduce((sum, c) => sum + c.progress.progressPercent, 0) /
              totalCourses
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEnrolledCourses: totalCourses,
          completedCourses,
          inProgressCourses: totalCourses - completedCourses,
          overallCompletionPercent,
        },
        courses: courseProgressList,
      },
    });
  } catch (error: any) {
    console.error('[getUserProgress Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching user progress.',
      details: error.message,
    });
  }
};

/**
 * GET /users/my-space
 * Fetches user's full member space: active enrollments, upcoming consultations, progress telemetry
 */
export const getMySpaceData = async (
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

    const userId = req.user.userId;

    const [enrollments, bookings, progressRecords] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          offer: {
            include: {
              creator: {
                select: { id: true, handle: true, user: { select: { fullName: true, avatarUrl: true } } },
              },
            },
          },
          course: {
            include: {
              creator: {
                select: { id: true, handle: true, user: { select: { fullName: true, avatarUrl: true } } },
              },
              lessons: { select: { id: true, title: true, order: true } },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: { userId, status: 'SCHEDULED' },
        include: {
          creator: { select: { id: true, handle: true, user: { select: { fullName: true, avatarUrl: true } } } },
          offer: { select: { id: true, title: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.lessonProgress.findMany({
        where: { userId },
      }),
    ]);

    const completedLessons = progressRecords.filter((p: any) => p.isCompleted).length;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
          fullName: req.user.fullName,
          email: req.user.email,
        },
        metrics: {
          activeEnrollmentsCount: enrollments.length,
          upcomingBookingsCount: bookings.length,
          completedLessonsCount: completedLessons,
        },
        enrollments: enrollments.map((e: any) => ({
          id: e.id,
          offerId: e.offerId,
          courseId: e.courseId,
          title: e.course?.title || e.offer?.title || 'Enrolled Coaching Program',
          creatorName: e.course?.creator?.user?.fullName || e.offer?.creator?.user?.fullName || 'Verified Coach',
          creatorHandle: e.course?.creator?.handle || e.offer?.creator?.handle || 'coach',
          creatorAvatar: e.course?.creator?.user?.avatarUrl || e.offer?.creator?.user?.avatarUrl,
          progressPercent: e.progressPercent || 0,
          status: e.status,
          enrolledAt: e.enrolledAt,
        })),
        activeBookings: bookings.map((b: any) => ({
          id: b.id,
          creatorId: b.creator.id,
          creatorName: b.creator.user.fullName,
          creatorHandle: b.creator.handle,
          creatorAvatar: b.creator.user.avatarUrl,
          offerTitle: b.offer?.title || '1-on-1 Consultation',
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes || 45,
          status: b.status,
          meetingUrl: b.meetingUrl,
          notes: b.notes,
        })),
      },
    });
  } catch (error: any) {
    console.error('[getMySpaceData Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching My Space data.',
      details: error.message,
    });
  }
};

/**
 * GET /users/purchases
 * Fetches user's purchase history and receipts
 */
export const getUserPurchases = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        purchases: payments.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          date: p.createdAt,
          paymentId: p.razorpayPaymentId || p.id,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

