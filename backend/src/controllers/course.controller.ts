import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import { verifyToken } from '../config/jwt.js';
import { calculateLessonDripStatus } from '../utils/drip.util.js';
import { VideoHostingService } from '../services/video.service.js';
import { PayoutService } from '../services/payout.service.js';
import { MembershipService } from '../services/membership.service.js';

/**
 * GET /courses/:id
 * Fetches course details, creator info, and lessons with server-side drip-lock calculation
 */
export const getCourseById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const courseId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  if (!courseId) {
    res.status(400).json({
      success: false,
      error: 'Course ID parameter is required.',
    });
    return;
  }

  try {

    // Extract user from JWT if provided in headers (optional auth)
    let currentUserId: string | null = req.user?.userId || null;
    let currentUserRole: string | null = req.user?.role || null;

    if (!currentUserId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        currentUserId = decoded.userId;
        currentUserRole = decoded.role;
      } catch {
        // Continue as guest
      }
    }

    // Fetch Course with Creator and ordered Lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            id: true,
            userId: true,
            handle: true,
            headline: true,
            verificationStatus: true,
            rating: true,
            user: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        offer: {
          select: {
            id: true,
            price: true,
            currency: true,
            type: true,
            isActive: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            durationSeconds: true,
            order: true,
            dripDays: true,
            dripDate: true,
            isPreview: true,
            createdAt: true,
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        error: `Course with id "${courseId}" not found.`,
      });
      return;
    }

    // Check if current user is enrolled or is course creator / admin
    const isCreatorOrAdmin =
      Boolean(currentUserId && course.creator.userId === currentUserId) ||
      currentUserRole === 'ADMIN';

    // If not published and user is not the creator or admin, return 404/403
    if (!course.isPublished && !isCreatorOrAdmin) {
      res.status(404).json({
        success: false,
        error: 'This course is currently in draft mode and not available publicly.',
      });
      return;
    }

    let enrollment: { enrolledAt: Date; progressPercent: number } | null = null;
    let userProgressMap: Map<string, { isCompleted: boolean; completedAt: Date | null }> =
      new Map();
    let hasTierAccess = false;
    let userTierMembership: any = null;

    if (currentUserId && !isCreatorOrAdmin) {
      // 1. Find direct active enrollment
      const userEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: currentUserId,
          OR: [{ courseId: course.id }, ...(course.offerId ? [{ offerId: course.offerId }] : [])],
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
        select: {
          enrolledAt: true,
          progressPercent: true,
        },
      });

      // 2. Check Paid Tier Membership for the course creator
      userTierMembership = await MembershipService.getUserTierMembership(currentUserId, course.creator.id);
      if (userTierMembership.isPaidMember) {
        if (!course.offerId || userTierMembership.unlockedOfferIds.length === 0 || userTierMembership.unlockedOfferIds.includes(course.offerId)) {
          hasTierAccess = true;
        }
      }

      if (userEnrollment) {
        enrollment = userEnrollment;
      } else if (hasTierAccess) {
        enrollment = {
          enrolledAt: userTierMembership.joinedAt || new Date(),
          progressPercent: 0,
        };
      }

      if (userEnrollment || hasTierAccess) {
        // Fetch completed lesson progress records
        const progressRecords = await prisma.lessonProgress.findMany({
          where: {
            userId: currentUserId,
            lesson: { courseId: course.id },
          },
          select: {
            lessonId: true,
            isCompleted: true,
            completedAt: true,
          },
        });

        progressRecords.forEach((p: any) => {
          userProgressMap.set(p.lessonId, {
            isCompleted: p.isCompleted,
            completedAt: p.completedAt,
          });
        });
      }
    }

    const hasFullAccess = Boolean(isCreatorOrAdmin || enrollment || hasTierAccess);

    // Process and sanitize each lesson with server-side drip status
    const sanitizedLessons = course.lessons.map((lesson: any) => {
      let isLocked = false;
      let lockReason: string | null = null;
      let unlockDate: Date | string | null = null;
      let daysRemaining = 0;

      if (!hasFullAccess) {
        if (!lesson.isPreview) {
          isLocked = true;
          lockReason = 'Requires Course Purchase or Paid Membership Tier';
        }
      } else {
        const dripStatus = calculateLessonDripStatus(
          lesson,
          enrollment?.enrolledAt || null,
          isCreatorOrAdmin
        );
        isLocked = dripStatus.isLocked;
        lockReason = dripStatus.reason || null;
        unlockDate = dripStatus.unlockDate || null;
        daysRemaining = dripStatus.daysRemaining || 0;
      }

      const progress = userProgressMap.get(lesson.id);

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        durationSeconds: lesson.durationSeconds,
        isPreview: lesson.isPreview,
        dripDays: lesson.dripDays,
        dripDate: lesson.dripDate,
        // Drip & Access properties
        isLocked,
        unlockDate,
        daysRemaining,
        lockReason,
        // Strip video URL if locked (unless creator/admin)
        videoUrl: (isLocked && !isCreatorOrAdmin) ? null : lesson.videoUrl,
        // User completion status
        isCompleted: progress ? progress.isCompleted : false,
        completedAt: progress ? progress.completedAt : null,
      };
    });

    const completedLessonsCount = sanitizedLessons.filter((l: any) => l.isCompleted).length;
    const totalLessons = sanitizedLessons.length;
    const computedProgress =
      totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        isPublished: course.isPublished,
        creator: {
          id: course.creator.id,
          fullName: course.creator.user.fullName,
          avatarUrl: course.creator.user.avatarUrl,
          handle: course.creator.handle,
          headline: course.creator.headline,
          rating: course.creator.rating,
        },
        pricing: course.offer
          ? {
              offerId: course.offer.id,
              price: Number(course.offer.price),
              currency: course.offer.currency,
              isActive: course.offer.isActive,
            }
          : null,
        userAccess: {
          isEnrolled: Boolean(enrollment),
          isCreatorOrAdmin,
          enrolledAt: enrollment?.enrolledAt || null,
          progressPercent: isCreatorOrAdmin ? 100 : computedProgress,
          completedLessons: completedLessonsCount,
          totalLessons,
        },
        lessons: sanitizedLessons,
      },
    });
  } catch (error: any) {
    console.error('[getCourseById Error]:', error);
    const c = inMemoryStore.courses.find((course) => course.id === courseId);
    if (c) {
      const cp = inMemoryStore.creatorProfiles.find((creator) => creator.id === c.creatorId);
      const u = inMemoryStore.users.find((user) => user.id === cp?.userId);
      const lessons = inMemoryStore.lessons
        .filter((l) => l.courseId === c.id)
        .sort((a, b) => a.order - b.order);
      res.status(200).json({
        success: true,
        data: {
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          isPublished: c.isPublished,
          creator: {
            id: cp?.id || c.creatorId,
            fullName: u?.fullName || 'Chadtag',
            avatarUrl: u?.avatarUrl,
            handle: cp?.handle || 'chadtag',
            headline: cp?.headline,
            rating: cp?.rating || 5.0,
          },
          lessons: lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            durationSeconds: l.durationSeconds,
            order: l.order,
            isLocked: false,
            videoUrl: l.videoUrl,
            isCompleted: false,
          })),
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching course details.',
      details: error.message,
    });
  }
};

/**
 * POST /courses/video-upload-url
 * Generates direct video upload URL with Mux or Cloudflare Stream
 */
export const generateVideoUploadUrl = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { fileName, fileType, maxDurationSeconds } = req.body || {};

    const uploadResult = await VideoHostingService.createDirectUploadUrl({
      fileName,
      fileType,
      maxDurationSeconds,
    });

    res.status(200).json({
      success: true,
      data: uploadResult,
    });
  } catch (error: any) {
    console.error('[generateVideoUploadUrl Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate direct video upload URL.',
      details: error.message,
    });
  }
};

/**
 * POST /courses
 * Creates a complete course, linked offer, and initial lessons in Course Studio
 */
export const createCourseStudio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const {
      title,
      description,
      thumbnailUrl,
      price = 0,
      currency = 'USD',
      isPublished = true,
      lessons = [],
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, error: 'Course title is required.' });
      return;
    }

    // Find or verify CreatorProfile
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: req.user.userId }, { id: req.user.userId }],
      },
    });

    if (!creator && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'User does not have a Creator profile.' });
      return;
    }

    const creatorId = creator ? creator.id : req.user.userId;

    // Gating Check: If publishing a paid course, require completed payout setup
    if (Boolean(isPublished) && Number(price) > 0) {
      const hasPayoutSetup = PayoutService.isPayoutSetupCompleted(creatorId);
      if (!hasPayoutSetup) {
        res.status(400).json({
          success: false,
          code: 'PAYOUT_SETUP_REQUIRED',
          error: 'Payout Setup Required: You must configure your bank account or UPI ID before publishing paid courses.',
        });
        return;
      }
    }

    // Create Course within transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Offer
      const offer = await tx.offer.create({
        data: {
          creatorId,
          title: title.trim(),
          description: description?.trim() || null,
          type: 'COURSE',
          price: Number(price) || 0,
          currency: currency || 'USD',
          isActive: Boolean(isPublished),
        },
      });

      // 2. Create Course
      const course = await tx.course.create({
        data: {
          creatorId,
          offerId: offer.id,
          title: title.trim(),
          description: description?.trim() || null,
          thumbnailUrl: thumbnailUrl?.trim() || null,
          isPublished: Boolean(isPublished),
        },
      });

      // 3. Create Lessons if provided
      if (Array.isArray(lessons) && lessons.length > 0) {
        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          await tx.lesson.create({
            data: {
              courseId: course.id,
              title: l.title?.trim() || `Lesson ${i + 1}`,
              description: l.description?.trim() || null,
              videoUrl: l.videoUrl?.trim() || null,
              durationSeconds: Number(l.durationSeconds) || 0,
              order: l.order !== undefined ? Number(l.order) : i + 1,
              dripDays: Number(l.dripDays) || 0,
              dripDate: l.dripDate ? new Date(l.dripDate) : null,
              isPreview: Boolean(l.isPreview),
            },
          });
        }
      }

      return { course, offer };
    });

    // Re-fetch complete course with lessons
    const completeCourse = await prisma.course.findUnique({
      where: { id: result.course.id },
      include: {
        offer: true,
        lessons: { orderBy: { order: 'asc' } },
      },
    });

    res.status(201).json({
      success: true,
      message: `Course "${title}" created successfully ${isPublished ? 'and published.' : 'as draft.'}`,
      data: completeCourse,
    });
  } catch (error: any) {
    console.error('[createCourseStudio Error]:', error);
    // In-memory fallback
    const creatorId = inMemoryStore.creatorProfiles[0]?.id || req.user?.userId || 'creator-chadtag';
    const newCourseId = `course-${Date.now()}`;
    const newOfferId = `offer-${Date.now()}`;

    const newOffer = {
      id: newOfferId,
      creatorId,
      title: req.body.title?.trim() || 'Untitled Course',
      description: req.body.description?.trim() || null,
      type: 'COURSE',
      price: Number(req.body.price) || 0,
      currency: req.body.currency || 'USD',
      isActive: Boolean(req.body.isPublished),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.offers.push(newOffer as any);

    const newCourse = {
      id: newCourseId,
      creatorId,
      offerId: newOfferId,
      title: req.body.title?.trim() || 'Untitled Course',
      description: req.body.description?.trim() || null,
      thumbnailUrl: req.body.thumbnailUrl?.trim() || null,
      isPublished: Boolean(req.body.isPublished),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.courses.push(newCourse as any);

    if (Array.isArray(req.body.lessons)) {
      req.body.lessons.forEach((l: any, idx: number) => {
        inMemoryStore.lessons.push({
          id: l.id || `lesson-${newCourseId}-${idx + 1}`,
          courseId: newCourseId,
          title: l.title || `Module ${idx + 1}`,
          description: l.description || '',
          videoUrl: l.videoUrl || '',
          durationSeconds: l.durationSeconds || 0,
          order: l.order || idx + 1,
          dripDays: l.dripDays || 0,
          isPreview: Boolean(l.isPreview),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    }

    res.status(201).json({
      success: true,
      message: `Course "${newCourse.title}" created successfully (in-memory store) ${newCourse.isPublished ? 'and published.' : 'as draft.'}`,
      data: {
        ...newCourse,
        offer: newOffer,
        lessons: inMemoryStore.lessons.filter((l) => l.courseId === newCourseId).sort((a, b) => a.order - b.order),
      },
    });
  }
};

/**
 * PUT /courses/:id
 * Updates course metadata, lessons list (add/edit/delete/reorder), and draft/publish state
 */
export const updateCourseStudio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const courseId = req.params.id;
    const {
      title,
      description,
      thumbnailUrl,
      price,
      currency,
      isPublished,
      lessons,
    } = req.body;

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: true,
        offer: true,
        lessons: true,
      },
    });

    if (!existingCourse) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    // Verify ownership
    const isOwner =
      existingCourse.creator.userId === req.user.userId ||
      existingCourse.creatorId === req.user.userId ||
      req.user.role === 'ADMIN';

    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this course.' });
      return;
    }

    // Gating Check: If updating course to published and price > 0, require payout setup
    const effectiveIsPublished = isPublished !== undefined ? Boolean(isPublished) : existingCourse.isPublished;
    const effectivePrice = price !== undefined ? Number(price) : (existingCourse.offer ? Number(existingCourse.offer.price) : 0);

    if (effectiveIsPublished && effectivePrice > 0) {
      const hasPayoutSetup = PayoutService.isPayoutSetupCompleted(existingCourse.creatorId);
      if (!hasPayoutSetup) {
        res.status(400).json({
          success: false,
          code: 'PAYOUT_SETUP_REQUIRED',
          error: 'Payout Setup Required: You must configure your bank account or UPI ID before publishing paid courses.',
        });
        return;
      }
    }

    // Execute atomic update
    await prisma.$transaction(async (tx: any) => {
      // 1. Update Course
      await tx.course.update({
        where: { id: courseId },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(thumbnailUrl !== undefined ? { thumbnailUrl: thumbnailUrl?.trim() || null } : {}),
          ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        },
      });

      // 2. Update linked Offer if price/title/isPublished changed
      if (existingCourse.offerId) {
        await tx.offer.update({
          where: { id: existingCourse.offerId },
          data: {
            ...(title !== undefined ? { title: title.trim() } : {}),
            ...(description !== undefined ? { description: description?.trim() || null } : {}),
            ...(price !== undefined ? { price: Number(price) } : {}),
            ...(currency !== undefined ? { currency: currency } : {}),
            ...(isPublished !== undefined ? { isActive: Boolean(isPublished) } : {}),
          },
        });
      }

      // 3. Synchronize Lessons if array provided
      if (Array.isArray(lessons)) {
        const incomingLessonIds = lessons.filter((l: any) => l.id && !l.id.startsWith('temp_')).map((l: any) => l.id);
        const existingLessonIds = existingCourse.lessons.map((l: any) => l.id);

        // Delete removed lessons
        const idsToDelete = existingLessonIds.filter((id: any) => !incomingLessonIds.includes(id));
        if (idsToDelete.length > 0) {
          await tx.lesson.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Upsert incoming lessons with updated order
        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          const order = l.order !== undefined ? Number(l.order) : i + 1;
          const lessonData = {
            title: l.title?.trim() || `Lesson ${i + 1}`,
            description: l.description?.trim() || null,
            videoUrl: l.videoUrl?.trim() || null,
            durationSeconds: Number(l.durationSeconds) || 0,
            order,
            dripDays: Number(l.dripDays) || 0,
            dripDate: l.dripDate ? new Date(l.dripDate) : null,
            isPreview: Boolean(l.isPreview),
          };

          if (l.id && !l.id.startsWith('temp_') && existingLessonIds.includes(l.id)) {
            // Update existing lesson
            await tx.lesson.update({
              where: { id: l.id },
              data: lessonData,
            });
          } else {
            // Create new lesson
            await tx.lesson.create({
              data: {
                courseId,
                ...lessonData,
              },
            });
          }
        }
      }
    });

    // Re-fetch updated course
    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        offer: true,
        lessons: { orderBy: { order: 'asc' } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Course studio updates saved successfully.',
      data: updatedCourse,
    });
  } catch (error: any) {
    console.error('[updateCourseStudio Error]:', error);
    const courseId = req.params.id;
    const c = inMemoryStore.courses.find((course) => course.id === courseId);
    if (c) {
      const { title, description, thumbnailUrl, isPublished, lessons } = req.body;
      if (title !== undefined) c.title = title.trim();
      if (description !== undefined) c.description = description?.trim() || null;
      if (thumbnailUrl !== undefined) c.thumbnailUrl = thumbnailUrl?.trim() || null;
      if (isPublished !== undefined) c.isPublished = Boolean(isPublished);
      c.updatedAt = new Date();

      if (Array.isArray(lessons)) {
        inMemoryStore.lessons = inMemoryStore.lessons.filter((l) => l.courseId !== c.id);
        lessons.forEach((l: any, idx: number) => {
          inMemoryStore.lessons.push({
            id: l.id || `lesson-${c.id}-${idx + 1}`,
            courseId: c.id,
            title: l.title || `Module ${idx + 1}`,
            description: l.description || '',
            videoUrl: l.videoUrl || '',
            durationSeconds: l.durationSeconds || 0,
            order: l.order || idx + 1,
            dripDays: l.dripDays || 0,
            isPreview: Boolean(l.isPreview),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      }

      res.status(200).json({
        success: true,
        message: 'Course studio updates saved successfully.',
        data: {
          ...c,
          lessons: inMemoryStore.lessons.filter((l) => l.courseId === c.id).sort((a, b) => a.order - b.order),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update course in studio.',
      details: error.message,
    });
  }
};

/**
 * GET /courses/studio/my-courses
 * Fetches all courses (published and drafts) for the authenticated creator
 */
export const getCreatorStudioCourses = async (
  req: AuthenticatedRequest,
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

    const courses = await prisma.course.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' },
      include: {
        offer: true,
        lessons: { orderBy: { order: 'asc' } },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses: courses.length,
        courses: courses.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          isPublished: c.isPublished,
          offerId: c.offerId,
          price: c.offer ? Number(c.offer.price) : 0,
          currency: c.offer?.currency || 'USD',
          totalLessons: c.lessons.length,
          totalEnrollments: c._count.enrollments,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          lessons: c.lessons,
        })),
      },
    });
  } catch (error: any) {
    console.error('[getCreatorStudioCourses Error]:', error);
    const cp = inMemoryStore.creatorProfiles.find(
      (c) => c.userId === req.user?.userId || c.id === req.user?.userId
    ) || inMemoryStore.creatorProfiles[0];

    if (cp) {
      const courses = inMemoryStore.courses.filter((c) => c.creatorId === cp.id);
      res.status(200).json({
        success: true,
        data: {
          totalCourses: courses.length,
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
              offerId: c.offerId,
              price: offer ? Number(offer.price) : 180,
              currency: offer?.currency || 'USD',
              totalLessons: lessons.length,
              totalEnrollments: 0,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
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
            };
          }),
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch creator courses.',
      details: error.message,
    });
  }
};

/**
 * DELETE /courses/:id
 * Deletes course, linked offer, and associated lessons
 */
export const deleteCourseStudio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const courseId = req.params.id;

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: { creator: true },
    });

    if (!existingCourse) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    const isOwner =
      existingCourse.creator.userId === req.user.userId ||
      existingCourse.creatorId === req.user.userId ||
      req.user.role === 'ADMIN';

    if (!isOwner) {
      res.status(403).json({ success: false, error: 'Forbidden: You do not own this course.' });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.course.delete({ where: { id: courseId } });
      if (existingCourse.offerId) {
        await tx.offer.delete({ where: { id: existingCourse.offerId } });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully.',
    });
  } catch (error: any) {
    console.error('[deleteCourseStudio Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course.',
      details: error.message,
    });
  }
};
