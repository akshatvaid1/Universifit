import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import { GamificationService } from '../services/gamification.service.js';
import { MembershipService } from '../services/membership.service.js';

const DISCUSSION_POST_POINTS = 10;
const DISCUSSION_REPLY_POINTS = 5;

interface AccessResult {
  allowed: boolean;
  isInstructor: boolean;
  course?: any;
  error?: string;
  statusCode?: number;
}

/**
 * Server-side enrollment enforcement helper.
 * Strictly verifies whether the user is enrolled in the course, or is the instructor/admin.
 */
async function verifyCourseEnrollmentAccess(
  userId: string,
  userRole: string,
  courseId: string
): Promise<AccessResult> {
  // 1. Fetch Course with Creator details
  let course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: {
        select: { id: true, userId: true },
      },
    },
  }).catch(() => null);

  if (!course) {
    const memCourse = inMemoryStore.courses.find((c) => c.id === courseId);
    if (!memCourse) {
      return { allowed: false, isInstructor: false, error: `Course with id "${courseId}" not found.`, statusCode: 404 };
    }
    const memCreator = inMemoryStore.creatorProfiles.find((cp) => cp.id === memCourse.creatorId);
    course = {
      ...memCourse,
      creator: memCreator ? { id: memCreator.id, userId: memCreator.userId } : { id: memCourse.creatorId, userId: '' },
    } as any;
  }

  const isInstructor = (course as any).creator.userId === userId || userRole === 'ADMIN';
  if (isInstructor) {
    return { allowed: true, isInstructor: true, course };
  }

  // 2. Check active Enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      OR: [{ courseId: course.id }, ...(course.offerId ? [{ offerId: course.offerId }] : [])],
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
  }).catch(() => null);

  if (enrollment) {
    return { allowed: true, isInstructor: false, course };
  }

  // Fallback to in-memory enrollments
  const memEnrollment = inMemoryStore.enrollments.find(
    (e) =>
      e.userId === userId &&
      (e.courseId === course.id || (course.offerId && e.offerId === course.offerId)) &&
      (e.status === 'ACTIVE' || e.status === 'COMPLETED')
  );
  if (memEnrollment) {
    return { allowed: true, isInstructor: false, course };
  }

  // 3. Check Creator Paid Tier Membership covering this course
  try {
    const tierStatus = await MembershipService.getUserTierMembership(userId, (course as any).creator.id);
    if (
      tierStatus.isPaidMember &&
      (!course.offerId ||
        tierStatus.unlockedOfferIds.length === 0 ||
        tierStatus.unlockedOfferIds.includes(course.offerId))
    ) {
      return { allowed: true, isInstructor: false, course };
    }
  } catch (err) {
    console.warn('[verifyCourseEnrollmentAccess] MembershipService error:', err);
  }

  return {
    allowed: false,
    isInstructor: false,
    course,
    error: 'Forbidden: Course discussions are strictly scoped to enrolled students and instructors. Please enroll in the course to participate.',
    statusCode: 403,
  };
}

/**
 * GET /courses/:courseId/discussions
 * Fetch discussion posts scoped to enrolled students only
 */
export const getCourseDiscussions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId || req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Server-enforced enrollment verification
    const access = await verifyCourseEnrollmentAccess(userId, userRole, courseId);
    if (!access.allowed) {
      res.status(access.statusCode || 403).json({ success: false, error: access.error });
      return;
    }

    const { lessonId, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { courseId };
    if (lessonId && typeof lessonId === 'string' && lessonId !== 'all') {
      where.lessonId = lessonId;
    }

    try {
      const [total, posts] = await Promise.all([
        prisma.courseDiscussionPost.count({ where }),
        prisma.courseDiscussionPost.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          include: {
            author: {
              select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
            },
            lesson: {
              select: { id: true, title: true, order: true },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
            _count: {
              select: { replies: true, likes: true },
            },
          },
        }),
      ]);

      const formatted = posts.map((p: any) => ({
        id: p.id,
        courseId: p.courseId,
        lessonId: p.lessonId,
        lesson: p.lesson,
        title: p.title,
        content: p.content,
        isPinned: p.isPinned,
        likesCount: p.likesCount,
        hasLiked: p.likes.length > 0,
        repliesCount: p._count.replies,
        isInstructorPost: p.author.role === 'CREATOR' || p.author.role === 'ADMIN',
        author: p.author,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      res.status(200).json({
        success: true,
        data: {
          discussions: formatted,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalItems: total,
            totalPages: Math.ceil(total / limitNum) || 1,
          },
        },
      });
      return;
    } catch (dbErr) {
      console.warn('[getCourseDiscussions] DB fallback to in-memory:', dbErr);
    }

    // In-memory fallback
    const memPosts = inMemoryStore.courseDiscussionPosts
      .filter((p) => p.courseId === courseId && (!lessonId || lessonId === 'all' || p.lessonId === lessonId))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.createdAt.getTime() - a.createdAt.getTime());

    const paginated = memPosts.slice(skip, skip + limitNum);
    const formatted = paginated.map((p) => {
      const author = inMemoryStore.users.find((u) => u.id === p.authorId);
      const lesson = p.lessonId ? inMemoryStore.lessons.find((l) => l.id === p.lessonId) : null;
      const hasLiked = inMemoryStore.courseDiscussionLikes.some((l) => l.discussionId === p.id && l.userId === userId);
      const repliesCount = inMemoryStore.courseDiscussionReplies.filter((r) => r.discussionId === p.id).length;

      return {
        id: p.id,
        courseId: p.courseId,
        lessonId: p.lessonId,
        lesson: lesson ? { id: lesson.id, title: lesson.title, order: lesson.order } : null,
        title: p.title,
        content: p.content,
        isPinned: p.isPinned,
        likesCount: p.likesCount,
        hasLiked,
        repliesCount,
        isInstructorPost: author?.role === 'CREATOR' || author?.role === 'ADMIN',
        author: {
          id: author?.id || p.authorId,
          fullName: author?.fullName || 'Student',
          avatarUrl: author?.avatarUrl,
          role: author?.role || 'BUYER',
          points: author?.points || 0,
        },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        discussions: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: memPosts.length,
          totalPages: Math.ceil(memPosts.length / limitNum) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('[getCourseDiscussions Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /courses/:courseId/discussions
 * Create a new discussion thread in an enrolled course space (Awards +10 points)
 */
export const createCourseDiscussion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId || req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Server-enforced enrollment verification
    const access = await verifyCourseEnrollmentAccess(userId, userRole, courseId);
    if (!access.allowed) {
      res.status(access.statusCode || 403).json({ success: false, error: access.error });
      return;
    }

    const { title, content, lessonId } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Validation Error: "title" is required.' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Validation Error: "content" is required.' });
      return;
    }

    const creatorId = access.course.creator.id;

    try {
      const [newDiscussion, updatedUser] = await prisma.$transaction([
        prisma.courseDiscussionPost.create({
          data: {
            courseId,
            lessonId: lessonId || null,
            authorId: userId,
            title: title.trim(),
            content: content.trim(),
          },
          include: {
            author: {
              select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
            },
            lesson: {
              select: { id: true, title: true, order: true },
            },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { points: { increment: DISCUSSION_POST_POINTS } },
          select: { points: true },
        }),
      ]);

      // Server-side points hook
      if (creatorId) {
        GamificationService.awardPoints(userId, creatorId, 'post', {
          courseId,
          discussionId: newDiscussion.id,
        }).catch((e) => console.warn('[Gamification course discussion hook]:', e));
      }

      res.status(201).json({
        success: true,
        message: `Discussion thread created. Awarded +${DISCUSSION_POST_POINTS} points!`,
        data: {
          discussion: {
            ...newDiscussion,
            likesCount: 0,
            hasLiked: false,
            repliesCount: 0,
            isInstructorPost: access.isInstructor,
            author: {
              ...newDiscussion.author,
              points: updatedUser.points,
            },
          },
          pointsAwarded: DISCUSSION_POST_POINTS,
          userTotalPoints: updatedUser.points,
        },
      });
      return;
    } catch (dbErr) {
      console.warn('[createCourseDiscussion] DB fallback to in-memory:', dbErr);
    }

    // In-memory fallback
    const id = `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const memDiscussion = {
      id,
      courseId,
      lessonId: lessonId || undefined,
      authorId: userId,
      title: title.trim(),
      content: content.trim(),
      likesCount: 0,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.courseDiscussionPosts.push(memDiscussion);

    const user = inMemoryStore.users.find((u) => u.id === userId);
    if (user) {
      user.points += DISCUSSION_POST_POINTS;
    }

    if (creatorId) {
      GamificationService.awardPoints(userId, creatorId, 'post', {
        courseId,
        discussionId: id,
      }).catch((e) => console.warn('[Gamification course discussion hook]:', e));
    }

    res.status(201).json({
      success: true,
      message: `Discussion thread created. Awarded +${DISCUSSION_POST_POINTS} points!`,
      data: {
        discussion: {
          ...memDiscussion,
          likesCount: 0,
          hasLiked: false,
          repliesCount: 0,
          isInstructorPost: access.isInstructor,
          author: {
            id: user?.id || userId,
            fullName: user?.fullName || 'Student',
            avatarUrl: user?.avatarUrl,
            role: user?.role || 'BUYER',
            points: user?.points || DISCUSSION_POST_POINTS,
          },
        },
        pointsAwarded: DISCUSSION_POST_POINTS,
        userTotalPoints: user?.points || DISCUSSION_POST_POINTS,
      },
    });
  } catch (error: any) {
    console.error('[createCourseDiscussion Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /courses/:courseId/discussions/:discussionId
 * Fetch full discussion thread with replies (Enrolled students & instructors only)
 */
export const getCourseDiscussionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId || req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const rawDiscussionId = req.params.discussionId;
    const discussionId = Array.isArray(rawDiscussionId) ? rawDiscussionId[0] : (rawDiscussionId as string);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Server-enforced enrollment verification
    const access = await verifyCourseEnrollmentAccess(userId, userRole, courseId);
    if (!access.allowed) {
      res.status(access.statusCode || 403).json({ success: false, error: access.error });
      return;
    }

    try {
      const discussion = await prisma.courseDiscussionPost.findUnique({
        where: { id: discussionId },
        include: {
          author: {
            select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
          },
          lesson: {
            select: { id: true, title: true, order: true },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
              },
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      if (!discussion || discussion.courseId !== courseId) {
        res.status(404).json({ success: false, error: `Discussion with id "${discussionId}" not found in this course.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          discussion: {
            id: discussion.id,
            courseId: discussion.courseId,
            lessonId: discussion.lessonId,
            lesson: discussion.lesson,
            title: discussion.title,
            content: discussion.content,
            isPinned: discussion.isPinned,
            likesCount: discussion.likesCount,
            hasLiked: discussion.likes.length > 0,
            isInstructorPost: discussion.author.role === 'CREATOR' || discussion.author.role === 'ADMIN',
            author: discussion.author,
            replies: discussion.replies.map((r: any) => ({
              id: r.id,
              content: r.content,
              isInstructorReply: r.author.role === 'CREATOR' || r.author.role === 'ADMIN',
              author: r.author,
              createdAt: r.createdAt,
            })),
            createdAt: discussion.createdAt,
            updatedAt: discussion.updatedAt,
          },
        },
      });
      return;
    } catch (dbErr) {
      console.warn('[getCourseDiscussionById] DB fallback to in-memory:', dbErr);
    }

    // In-memory fallback
    const memPost = inMemoryStore.courseDiscussionPosts.find((p) => p.id === discussionId && p.courseId === courseId);
    if (!memPost) {
      res.status(404).json({ success: false, error: `Discussion with id "${discussionId}" not found.` });
      return;
    }

    const author = inMemoryStore.users.find((u) => u.id === memPost.authorId);
    const lesson = memPost.lessonId ? inMemoryStore.lessons.find((l) => l.id === memPost.lessonId) : null;
    const hasLiked = inMemoryStore.courseDiscussionLikes.some((l) => l.discussionId === memPost.id && l.userId === userId);
    const replies = inMemoryStore.courseDiscussionReplies
      .filter((r) => r.discussionId === memPost.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) => {
        const rAuthor = inMemoryStore.users.find((u) => u.id === r.authorId);
        return {
          id: r.id,
          content: r.content,
          isInstructorReply: rAuthor?.role === 'CREATOR' || rAuthor?.role === 'ADMIN',
          author: {
            id: rAuthor?.id || r.authorId,
            fullName: rAuthor?.fullName || 'Student',
            avatarUrl: rAuthor?.avatarUrl,
            role: rAuthor?.role || 'BUYER',
            points: rAuthor?.points || 0,
          },
          createdAt: r.createdAt,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        discussion: {
          id: memPost.id,
          courseId: memPost.courseId,
          lessonId: memPost.lessonId,
          lesson: lesson ? { id: lesson.id, title: lesson.title, order: lesson.order } : null,
          title: memPost.title,
          content: memPost.content,
          isPinned: memPost.isPinned,
          likesCount: memPost.likesCount,
          hasLiked,
          isInstructorPost: author?.role === 'CREATOR' || author?.role === 'ADMIN',
          author: {
            id: author?.id || memPost.authorId,
            fullName: author?.fullName || 'Student',
            avatarUrl: author?.avatarUrl,
            role: author?.role || 'BUYER',
            points: author?.points || 0,
          },
          replies,
          createdAt: memPost.createdAt,
          updatedAt: memPost.updatedAt,
        },
      },
    });
  } catch (error: any) {
    console.error('[getCourseDiscussionById Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /courses/:courseId/discussions/:discussionId/replies
 * Add a reply to a course discussion thread (Awards +5 points)
 */
export const createCourseDiscussionReply = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId || req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const rawDiscussionId = req.params.discussionId;
    const discussionId = Array.isArray(rawDiscussionId) ? rawDiscussionId[0] : (rawDiscussionId as string);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Server-enforced enrollment verification
    const access = await verifyCourseEnrollmentAccess(userId, userRole, courseId);
    if (!access.allowed) {
      res.status(access.statusCode || 403).json({ success: false, error: access.error });
      return;
    }

    const { content } = req.body || {};
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Validation Error: "content" is required.' });
      return;
    }

    const creatorId = access.course.creator.id;

    try {
      const discussion = await prisma.courseDiscussionPost.findUnique({
        where: { id: discussionId },
        select: { id: true, courseId: true, authorId: true },
      });

      if (!discussion || discussion.courseId !== courseId) {
        res.status(404).json({ success: false, error: 'Discussion thread not found.' });
        return;
      }

      const [reply, updatedUser] = await prisma.$transaction([
        prisma.courseDiscussionReply.create({
          data: {
            discussionId,
            authorId: userId,
            content: content.trim(),
          },
          include: {
            author: {
              select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
            },
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { points: { increment: DISCUSSION_REPLY_POINTS } },
          select: { points: true },
        }),
      ]);

      if (creatorId) {
        GamificationService.awardPoints(userId, creatorId, 'reply', {
          courseId,
          discussionId,
          replyId: reply.id,
        }).catch((e) => console.warn('[Gamification reply hook]:', e));
      }

      res.status(201).json({
        success: true,
        message: `Reply posted successfully. Awarded +${DISCUSSION_REPLY_POINTS} points!`,
        data: {
          reply: {
            ...reply,
            isInstructorReply: access.isInstructor,
            author: {
              ...reply.author,
              points: updatedUser.points,
            },
          },
          pointsAwarded: DISCUSSION_REPLY_POINTS,
          userTotalPoints: updatedUser.points,
        },
      });
      return;
    } catch (dbErr) {
      console.warn('[createCourseDiscussionReply] DB fallback to in-memory:', dbErr);
    }

    // In-memory fallback
    const memPost = inMemoryStore.courseDiscussionPosts.find((p) => p.id === discussionId && p.courseId === courseId);
    if (!memPost) {
      res.status(404).json({ success: false, error: 'Discussion thread not found.' });
      return;
    }

    const id = `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const memReply = {
      id,
      discussionId,
      authorId: userId,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.courseDiscussionReplies.push(memReply);

    const user = inMemoryStore.users.find((u) => u.id === userId);
    if (user) {
      user.points += DISCUSSION_REPLY_POINTS;
    }

    if (creatorId) {
      GamificationService.awardPoints(userId, creatorId, 'reply', {
        courseId,
        discussionId,
        replyId: id,
      }).catch((e) => console.warn('[Gamification reply hook]:', e));
    }

    res.status(201).json({
      success: true,
      message: `Reply posted successfully. Awarded +${DISCUSSION_REPLY_POINTS} points!`,
      data: {
        reply: {
          ...memReply,
          isInstructorReply: access.isInstructor,
          author: {
            id: user?.id || userId,
            fullName: user?.fullName || 'Student',
            avatarUrl: user?.avatarUrl,
            role: user?.role || 'BUYER',
            points: user?.points || DISCUSSION_REPLY_POINTS,
          },
        },
        pointsAwarded: DISCUSSION_REPLY_POINTS,
        userTotalPoints: user?.points || DISCUSSION_REPLY_POINTS,
      },
    });
  } catch (error: any) {
    console.error('[createCourseDiscussionReply Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /courses/:courseId/discussions/:discussionId/like
 * Like or unlike a course discussion post (Awards points to the discussion author)
 */
export const toggleCourseDiscussionLike = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId || req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const rawDiscussionId = req.params.discussionId;
    const discussionId = Array.isArray(rawDiscussionId) ? rawDiscussionId[0] : (rawDiscussionId as string);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Server-enforced enrollment verification
    const access = await verifyCourseEnrollmentAccess(userId, userRole, courseId);
    if (!access.allowed) {
      res.status(access.statusCode || 403).json({ success: false, error: access.error });
      return;
    }

    const creatorId = access.course.creator.id;

    try {
      const discussion = await prisma.courseDiscussionPost.findUnique({
        where: { id: discussionId },
        select: { id: true, courseId: true, authorId: true, likesCount: true },
      });

      if (!discussion || discussion.courseId !== courseId) {
        res.status(404).json({ success: false, error: 'Discussion not found.' });
        return;
      }

      const existingLike = await prisma.courseDiscussionLike.findUnique({
        where: {
          userId_discussionId: {
            userId,
            discussionId,
          },
        },
      });

      let liked = false;
      let newLikesCount = discussion.likesCount;

      if (existingLike) {
        await prisma.$transaction([
          prisma.courseDiscussionLike.delete({ where: { id: existingLike.id } }),
          prisma.courseDiscussionPost.update({
            where: { id: discussionId },
            data: { likesCount: { decrement: 1 } },
          }),
        ]);
        liked = false;
        newLikesCount = Math.max(0, discussion.likesCount - 1);
      } else {
        await prisma.$transaction([
          prisma.courseDiscussionLike.create({
            data: { userId, discussionId },
          }),
          prisma.courseDiscussionPost.update({
            where: { id: discussionId },
            data: { likesCount: { increment: 1 } },
          }),
        ]);
        liked = true;
        newLikesCount = discussion.likesCount + 1;

        // Server-side points hook: award 'like-received' to discussion author
        if (creatorId && discussion.authorId && discussion.authorId !== userId) {
          GamificationService.awardPoints(discussion.authorId, creatorId, 'like-received', {
            courseId,
            discussionId,
            likedByUserId: userId,
          }).catch((e) => console.warn('[Gamification discussion like hook]:', e));
        }
      }

      res.status(200).json({
        success: true,
        message: liked ? 'Discussion liked.' : 'Discussion unliked.',
        data: {
          discussionId,
          liked,
          likesCount: newLikesCount,
        },
      });
      return;
    } catch (dbErr) {
      console.warn('[toggleCourseDiscussionLike] DB fallback to in-memory:', dbErr);
    }

    // In-memory fallback
    const memPost = inMemoryStore.courseDiscussionPosts.find((p) => p.id === discussionId && p.courseId === courseId);
    if (!memPost) {
      res.status(404).json({ success: false, error: 'Discussion not found.' });
      return;
    }

    const likeIdx = inMemoryStore.courseDiscussionLikes.findIndex(
      (l) => l.discussionId === discussionId && l.userId === userId
    );

    let liked = false;
    if (likeIdx >= 0) {
      inMemoryStore.courseDiscussionLikes.splice(likeIdx, 1);
      memPost.likesCount = Math.max(0, memPost.likesCount - 1);
      liked = false;
    } else {
      inMemoryStore.courseDiscussionLikes.push({
        id: `like-${Date.now()}`,
        discussionId,
        userId,
        createdAt: new Date(),
      });
      memPost.likesCount += 1;
      liked = true;

      if (creatorId && memPost.authorId && memPost.authorId !== userId) {
        GamificationService.awardPoints(memPost.authorId, creatorId, 'like-received', {
          courseId,
          discussionId,
          likedByUserId: userId,
        }).catch((e) => console.warn('[Gamification discussion like hook]:', e));
      }
    }

    res.status(200).json({
      success: true,
      message: liked ? 'Discussion liked.' : 'Discussion unliked.',
      data: {
        discussionId,
        liked,
        likesCount: memPost.likesCount,
      },
    });
  } catch (error: any) {
    console.error('[toggleCourseDiscussionLike Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
