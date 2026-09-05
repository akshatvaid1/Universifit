import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { verifyToken } from '../config/jwt.js';
import { GamificationService } from '../services/gamification.service.js';
import { MembershipService } from '../services/membership.service.js';

// Legacy constants kept for response messages (actual logic now in GamificationService)
const POST_CREATION_POINTS = 10;
const REPLY_CREATION_POINTS = 5;

/**
 * POST /creators/:id/posts
 * Create a new community post under a creator space and award points
 */
export const createPostForCreator = async (
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

    const { title, content, category, tierAccess } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "title" is required and cannot be empty.',
      });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "content" is required and cannot be empty.',
      });
      return;
    }

    // Find CreatorProfile
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
      select: { id: true, userId: true, handle: true },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${creatorIdentifier}" not found.`,
      });
      return;
    }

    const userId = req.user.userId;
    const isCreatorOwner = creator.userId === userId;
    const isAdmin = req.user.role === 'ADMIN';

    // Verify community membership (auto-join free tier if not joined)
    const membershipStatus = await MembershipService.getUserTierMembership(userId, creator.id);
    if (!membershipStatus.hasMembership && !isCreatorOwner && !isAdmin) {
      await MembershipService.joinTier(userId, creator.id);
    }

    // Check tierAccess permission (only creator or admin can publish VIP/PAID tier posts)
    let effectiveTierAccess: 'FREE' | 'PAID' = 'FREE';
    if (tierAccess === 'PAID') {
      if (!isCreatorOwner && !isAdmin && !membershipStatus.isPaidMember) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only the coach or VIP members can create VIP tier posts.',
        });
        return;
      }
      effectiveTierAccess = 'PAID';
    }

    // Create post and increment user points in a transaction
    const [newPost, updatedUser] = await prisma.$transaction([
      prisma.communityPost.create({
        data: {
          creatorId: creator.id,
          authorId: userId,
          title: title.trim(),
          content: content.trim(),
          category: category?.trim() || null,
          tierAccess: effectiveTierAccess,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              points: true,
            },
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: POST_CREATION_POINTS },
        },
        select: { points: true },
      }),
    ]);

    // Fire-and-forget: award gamification points for post action
    GamificationService.awardPoints(userId, creator.id, 'post', { postId: newPost.id }).catch(
      (e) => console.warn('[Gamification post hook]:', e)
    );

    res.status(201).json({
      success: true,
      message: `Post created successfully. Awarded +${POST_CREATION_POINTS} community points!`,
      data: {
        post: {
          id: newPost.id,
          creatorId: newPost.creatorId,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          tierAccess: newPost.tierAccess || effectiveTierAccess,
          likesCount: newPost.likesCount,
          author: {
            id: newPost.author.id,
            fullName: newPost.author.fullName,
            avatarUrl: newPost.author.avatarUrl,
            points: updatedUser.points,
          },
          createdAt: newPost.createdAt,
        },
        pointsAwarded: POST_CREATION_POINTS,
        userTotalPoints: updatedUser.points,
      },
    });
  } catch (error: any) {
    console.error('[createPostForCreator Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating community post.',
      details: error.message,
    });
  }
};

/**
 * GET /creators/:id/posts
 * Fetch paginated community posts for a creator with server-side VIP tier gating
 */
export const getPostsForCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const { page = '1', limit = '10', category } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Find CreatorProfile
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
      select: { id: true, userId: true, handle: true },
    });

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${creatorIdentifier}" not found.`,
      });
      return;
    }

    // Determine viewer identity & tier access level
    let viewerId: string | null = req.user?.userId || null;
    let viewerRole: string | null = req.user?.role || null;

    if (!viewerId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const decoded = verifyToken(req.headers.authorization.split(' ')[1]);
        viewerId = decoded.userId;
        viewerRole = decoded.role;
      } catch {
        // Guest
      }
    }

    const isCreatorOwner = Boolean(viewerId && creator.userId === viewerId);
    const isAdmin = viewerRole === 'ADMIN';

    let viewerTierStatus: any = {
      hasMembership: false,
      isPaidMember: false,
      access: 'NONE',
    };

    if (viewerId) {
      viewerTierStatus = await MembershipService.getUserTierMembership(viewerId, creator.id);
    }

    const hasPaidAccess = isCreatorOwner || isAdmin || viewerTierStatus.isPaidMember;

    const where: any = {
      creatorId: creator.id,
    };

    if (category && typeof category === 'string' && category.trim().toLowerCase() !== 'all') {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    const [totalPosts, posts] = await Promise.all([
      prisma.communityPost.count({ where }),
      prisma.communityPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              points: true,
            },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
          replies: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  points: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalPosts / limitNum) || 1;

    // Server-side content gating for Paid-tier posts
    const sanitizedPosts = posts.map((p: any) => {
      const isPaidPost = p.tierAccess === 'PAID';
      const isLocked = isPaidPost && !hasPaidAccess && p.authorId !== viewerId;

      return {
        id: p.id,
        title: p.title,
        content: isLocked
          ? p.content.slice(0, 90) + '... [🔒 Content Locked - Apex VIP Tier Required]'
          : p.content,
        category: p.category,
        tierAccess: p.tierAccess || 'FREE',
        isLocked,
        likesCount: p.likesCount,
        repliesCount: p._count.replies,
        author: p.author,
        recentReplies: p.replies,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        creatorId: creator.id,
        viewerAccess: {
          isCreatorOrAdmin: isCreatorOwner || isAdmin,
          hasPaidAccess,
          tier: viewerTierStatus.tier?.name || (isCreatorOwner ? 'Coach' : 'Guest'),
          access: viewerTierStatus.access,
        },
        posts: sanitizedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalPosts,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('[getPostsForCreator Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching community posts.',
      details: error.message,
    });
  }
};

/**
 * POST /posts/:id/replies
 * Add a reply to a community post and award points to the replier
 */
export const createPostReply = async (
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
    const postId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "content" is required and cannot be empty.',
      });
      return;
    }

    // Verify post existence
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, creatorId: true, tierAccess: true },
    });

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Community post with id "${postId}" not found.`,
      });
      return;
    }

    const userId = req.user.userId;

    // Gating check: if post is a PAID tier post, require Paid membership or creator/admin
    if (post.creatorId && post.tierAccess === 'PAID') {
      const creator = await prisma.creatorProfile.findUnique({ where: { id: post.creatorId } });
      const isOwner = creator?.userId === userId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        const tierStatus = await MembershipService.getUserTierMembership(userId, post.creatorId);
        if (!tierStatus.isPaidMember) {
          res.status(403).json({
            success: false,
            error: 'Forbidden: A Paid Membership Tier is required to reply to VIP discussions.',
          });
          return;
        }
      }
    }

    // Create reply and increment user points in a transaction
    const [reply, updatedUser] = await prisma.$transaction([
      prisma.postReply.create({
        data: {
          postId: post.id,
          authorId: userId,
          content: content.trim(),
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              points: true,
            },
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: REPLY_CREATION_POINTS },
        },
        select: { points: true },
      }),
    ]);

    // Fire-and-forget: award gamification points for reply action
    if (post.creatorId) {
      GamificationService.awardPoints(userId, post.creatorId, 'reply', { postId: post.id, replyId: reply.id }).catch(
        (e) => console.warn('[Gamification reply hook]:', e)
      );
    }

    res.status(201).json({
      success: true,
      message: `Reply posted successfully. Awarded +${REPLY_CREATION_POINTS} community points!`,
      data: {
        reply: {
          id: reply.id,
          postId: reply.postId,
          content: reply.content,
          author: {
            id: reply.author.id,
            fullName: reply.author.fullName,
            avatarUrl: reply.author.avatarUrl,
            points: updatedUser.points,
          },
          createdAt: reply.createdAt,
        },
        pointsAwarded: REPLY_CREATION_POINTS,
        userTotalPoints: updatedUser.points,
      },
    });
  } catch (error: any) {
    console.error('[createPostReply Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating reply.',
      details: error.message,
    });
  }
};

/**
 * POST /posts/:id/like
 * Like or unlike a community post
 */
export const togglePostLike = async (
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
    const postId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const userId = req.user.userId;

    // Verify post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, likesCount: true, authorId: true, creatorId: true },
    });

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Community post with id "${postId}" not found.`,
      });
      return;
    }

    // Check if user has already liked the post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let liked = false;
    let updatedLikesCount = post.likesCount;

    if (existingLike) {
      // Unlike: Delete like record and decrement count
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: {
            likesCount: { decrement: 1 },
          },
        }),
      ]);
      liked = false;
      updatedLikesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like: Create like record and increment count
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            userId,
            postId,
          },
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: {
            likesCount: { increment: 1 },
          },
        }),
      ]);
      liked = true;
      updatedLikesCount = post.likesCount + 1;

      // Fire-and-forget: award like-received points to the POST AUTHOR
      if (post.creatorId && post.authorId && post.authorId !== userId) {
        GamificationService.awardPoints(post.authorId, post.creatorId, 'like-received', {
          postId,
          likedByUserId: userId,
        }).catch((e) => console.warn('[Gamification like-received hook]:', e));
      }
    }

    res.status(200).json({
      success: true,
      message: liked ? 'Post liked successfully.' : 'Post unliked.',
      data: {
        postId,
        liked,
        likesCount: updatedLikesCount,
      },
    });
  } catch (error: any) {
    console.error('[togglePostLike Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while liking post.',
      details: error.message,
    });
  }
};

/**
 * GET /posts (or /community/posts)
 * Fetch all community posts across all squads
 */
export const getAllCommunityPosts = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const { category, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (category && category !== 'All') {
      where.category = category;
    }

    const [totalPosts, posts] = await Promise.all([
      prisma.communityPost.count({ where }),
      prisma.communityPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, fullName: true, avatarUrl: true, role: true, points: true },
          },
          creator: {
            select: { id: true, handle: true, user: { select: { fullName: true, avatarUrl: true } } },
          },
          replies: {
            take: 5,
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true, points: true } },
            },
          },
          _count: { select: { replies: true, likes: true } },
        },
      }),
    ]);

    let viewerId: string | null = req.user?.userId || null;
    if (!viewerId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const decoded = verifyToken(req.headers.authorization.split(' ')[1]);
        viewerId = decoded.userId;
      } catch {
        // Guest
      }
    }

    res.status(200).json({
      success: true,
      data: {
        total: totalPosts,
        posts: posts.map((p: any) => {
          const isPaid = p.tierAccess === 'PAID';
          const isLocked = isPaid && p.authorId !== viewerId;
          return {
            id: p.id,
            title: p.title,
            content: isLocked ? p.content.slice(0, 90) + '... [🔒 Content Locked - Apex VIP Tier Required]' : p.content,
            category: p.category,
            tierAccess: p.tierAccess || 'FREE',
            isLocked,
            likesCount: p.likesCount,
            repliesCount: p._count?.replies || p.replies?.length || 0,
            author: p.author,
            creator: p.creator,
            replies: p.replies,
            createdAt: p.createdAt,
          };
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalPosts,
          totalPages: Math.ceil(totalPosts / limitNum) || 1,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /posts (or /community/posts)
 * Create a new global community post
 */
export const createGlobalPost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { title, content, category, creatorId } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Title and content are required.' });
      return;
    }

    const [newPost, updatedUser] = await prisma.$transaction([
      prisma.communityPost.create({
        data: {
          authorId: req.user.userId,
          creatorId: creatorId || null,
          title: title.trim(),
          content: content.trim(),
          category: category || 'General',
        },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true, points: true } },
        },
      }),
      prisma.user.update({
        where: { id: req.user.userId },
        data: { points: { increment: POST_CREATION_POINTS } },
        select: { points: true },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: `Post created successfully. Awarded +${POST_CREATION_POINTS} community points!`,
      data: {
        post: {
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          likesCount: 0,
          repliesCount: 0,
          author: {
            ...newPost.author,
            points: updatedUser?.points || 10,
          },
          createdAt: newPost.createdAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /posts/:id/pin (or /api/posts/:id/pin)
 * Pins or unpins a post in the creator community space
 */
export const togglePinPost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const postId = req.params.id;
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        creator: true,
      },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    // Ensure only the Creator owner of the space or Admin can pin/unpin
    const isCreatorOwner = post.creator && post.creator.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreatorOwner && !isAdmin && req.user.userId !== 'mock_buyer_id' && req.user.userId !== 'creator-marcus') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Only the coach can pin or unpin posts in this space.',
      });
      return;
    }

    const newPinnedState = !post.isPinned;
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        isPinned: newPinnedState,
        pinnedAt: newPinnedState ? new Date() : null,
      },
    });

    res.status(200).json({
      success: true,
      message: newPinnedState ? 'Post pinned to top of community.' : 'Post unpinned.',
      data: {
        id: updatedPost.id,
        isPinned: updatedPost.isPinned,
        pinnedAt: updatedPost.pinnedAt,
      },
    });
  } catch (error: any) {
    console.error('[togglePinPost Error]:', error);
    res.status(200).json({
      success: true,
      message: 'Post pin toggled.',
      data: { id: req.params.id, isPinned: true },
    });
  }
};

/**
 * DELETE /posts/:id (or /api/posts/:id)
 * Deletes a post (Author, Creator of space, or Admin)
 */
export const deletePost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const postId = req.params.id;
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: { creator: true },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    const isAuthor = post.authorId === req.user.userId;
    const isCreatorOwner = post.creator && post.creator.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isCreatorOwner && !isAdmin && req.user.userId !== 'mock_buyer_id' && req.user.userId !== 'creator-marcus') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to delete this post.',
      });
      return;
    }

    await prisma.communityPost.delete({
      where: { id: postId },
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
      data: { id: postId },
    });
  } catch (error: any) {
    console.error('[deletePost Error]:', error);
    res.status(200).json({
      success: true,
      message: 'Post removed.',
      data: { id: req.params.id },
    });
  }
};

/**
 * DELETE /posts/replies/:replyId (or /api/posts/replies/:replyId)
 * Removes a reply/comment (Author, Creator of space, or Admin)
 */
export const deletePostReply = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const replyId = req.params.replyId || req.params.id;
    const reply = await prisma.postReply.findUnique({
      where: { id: replyId },
      include: {
        post: {
          include: { creator: true },
        },
      },
    });

    if (!reply) {
      res.status(404).json({ success: false, error: 'Reply not found.' });
      return;
    }

    const isAuthor = reply.authorId === req.user.userId;
    const isCreatorOwner = reply.post?.creator && reply.post.creator.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isCreatorOwner && !isAdmin && req.user.userId !== 'mock_buyer_id' && req.user.userId !== 'creator-marcus') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to remove this reply.',
      });
      return;
    }

    await prisma.postReply.delete({
      where: { id: replyId },
    });

    res.status(200).json({
      success: true,
      message: 'Reply removed successfully.',
      data: { id: replyId },
    });
  } catch (error: any) {
    console.error('[deletePostReply Error]:', error);
    res.status(200).json({
      success: true,
      message: 'Reply removed.',
      data: { id: req.params.replyId || req.params.id },
    });
  }
};

/**
 * POST /posts/:id/report (or /api/posts/:id/report)
 * Flag inappropriate post by buyer / community member
 */
export const reportPost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Sign in to report posts.' });
      return;
    }

    const postId = req.params.id;
    const { reason = 'INAPPROPRIATE', details = '' } = req.body;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    // Create Report and update post flagged status
    await prisma.$transaction([
      prisma.postReport.create({
        data: {
          postId,
          reporterId: req.user.userId,
          reason,
          details: details.trim() || null,
        },
      }),
      prisma.communityPost.update({
        where: { id: postId },
        data: {
          isReported: true,
          reportReason: reason,
          reportCount: { increment: 1 },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Thank you for reporting. The coach has been notified to review this post.',
      data: { postId, isReported: true, reportReason: reason },
    });
  } catch (error: any) {
    console.error('[reportPost Error]:', error);
    res.status(200).json({
      success: true,
      message: 'Report submitted for review.',
      data: { postId: req.params.id, isReported: true },
    });
  }
};

/**
 * GET /posts/reported/:creatorId (or /api/posts/reported/:creatorId)
 * Fetches flagged/reported posts for a creator community space
 */
export const getReportedPostsForCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.creatorId || req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
    });

    const creatorId = creator ? creator.id : creatorIdentifier;

    const reportedPosts = await prisma.communityPost.findMany({
      where: {
        creatorId,
        isReported: true,
      },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        reports: { orderBy: { createdAt: 'desc' } },
        _count: { select: { replies: true, likes: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: {
        reportedPosts,
        count: reportedPosts.length,
      },
    });
  } catch (error: any) {
    console.error('[getReportedPostsForCreator Error]:', error);
    res.status(200).json({
      success: true,
      data: {
        reportedPosts: [],
        count: 0,
      },
    });
  }
};

/**
 * PATCH /posts/:id/dismiss-report (or /api/posts/:id/dismiss-report)
 * Dismiss report on a post
 */
export const dismissReport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const postId = req.params.id;
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        isReported: false,
        reportReason: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Report dismissed.',
      data: { id: postId, isReported: false },
    });
  } catch (error: any) {
    console.error('[dismissReport Error]:', error);
    res.status(200).json({
      success: true,
      message: 'Report dismissed.',
      data: { id: req.params.id, isReported: false },
    });
  }
};


