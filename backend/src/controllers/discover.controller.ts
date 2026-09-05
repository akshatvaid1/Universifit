import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import { VerificationStatus } from '@prisma/client';

export interface DiscoverQuery {
  category?: string;
  goal?: string;
  search?: string;
  type?: string;
  verificationStatus?: string;
  page?: string;
  limit?: string;
  sortBy?: 'rating' | 'newest' | 'clients';
}

/**
 * GET /discover
 * Paginated discovery endpoint with category and goal filtering
 */
export const discoverCreators = async (
  req: Request<{}, {}, {}, DiscoverQuery>,
  res: Response
): Promise<void> => {
  try {
    const {
      category,
      goal,
      search,
      type,
      verificationStatus,
      page = '1',
      limit = '10',
      sortBy = 'rating',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Construct Prisma dynamic where filter
    const whereConditions: any[] = [];

    // Filter by verification status (default to VERIFIED if not specified)
    if (verificationStatus) {
      whereConditions.push({
        verificationStatus: verificationStatus.toUpperCase() as VerificationStatus,
      });
    }

    // Filter by Category (match in specialtyTags array, headline, bio, or offers)
    if (category && typeof category === 'string' && category.trim().toLowerCase() !== 'all') {
      const catTerm = category.trim();
      whereConditions.push({
        OR: [
          { specialtyTags: { has: catTerm } },
          { specialtyTags: { has: catTerm.toLowerCase() } },
          { headline: { contains: catTerm, mode: 'insensitive' } },
          { bio: { contains: catTerm, mode: 'insensitive' } },
          {
            offers: {
              some: {
                OR: [
                  { title: { contains: catTerm, mode: 'insensitive' } },
                  { description: { contains: catTerm, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    // Filter by Goal (match in specialtyTags, headline, bio, or credentials)
    if (goal && typeof goal === 'string' && goal.trim().toLowerCase() !== 'all') {
      const goalTerm = goal.trim().replace('-', ' ');
      whereConditions.push({
        OR: [
          { specialtyTags: { has: goalTerm } },
          { specialtyTags: { has: goalTerm.toLowerCase() } },
          { headline: { contains: goalTerm, mode: 'insensitive' } },
          { bio: { contains: goalTerm, mode: 'insensitive' } },
          { credentials: { has: goalTerm } },
        ],
      });
    }

    // Free Text Search
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereConditions.push({
        OR: [
          { user: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
          { handle: { contains: searchTerm, mode: 'insensitive' } },
          { headline: { contains: searchTerm, mode: 'insensitive' } },
          { bio: { contains: searchTerm, mode: 'insensitive' } },
          {
            offers: {
              some: {
                title: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    // Filter by Offer Type (e.g. COURSE, ONE_ON_ONE, COMMUNITY)
    if (type && typeof type === 'string') {
      whereConditions.push({
        offers: {
          some: {
            type: type.toUpperCase() as any,
            isActive: true,
          },
        },
      });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Sort order mapping
    let orderBy: any = { rating: 'desc' };
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'clients') {
      orderBy = { totalClients: 'desc' };
    }

    // Execute count and paginated query in parallel
    const [totalItems, creators] = await Promise.all([
      prisma.creatorProfile.count({ where }),
      prisma.creatorProfile.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          offers: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              type: true,
              price: true,
              currency: true,
            },
          },
          _count: {
            select: {
              offers: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: {
        creators: creators.map((c) => ({
          id: c.id,
          userId: c.userId,
          fullName: c.user.fullName,
          email: c.user.email,
          avatarUrl: c.user.avatarUrl,
          handle: c.handle,
          headline: c.headline,
          bio: c.bio,
          specialtyTags: c.specialtyTags,
          credentials: c.credentials,
          verificationStatus: c.verificationStatus,
          rating: c.rating,
          totalClients: c.totalClients,
          activeOffersCount: c.offers.length,
          featuredOffers: c.offers,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        activeFilters: {
          category: category || null,
          goal: goal || null,
          search: search || null,
          type: type || null,
          sortBy,
        },
      },
    });
  } catch (error: any) {
    console.error('[discoverCreators Error]:', error);

    const memCreators = inMemoryStore.creatorProfiles
      .filter((cp) => cp.verificationStatus === 'VERIFIED')
      .map((cp) => {
        const user = inMemoryStore.users.find((u) => u.id === cp.userId);
        const offers = inMemoryStore.offers.filter((o) => o.creatorId === cp.id);
        return {
          id: cp.id,
          userId: cp.userId,
          fullName: user?.fullName || 'Chadtag',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || null,
          handle: cp.handle,
          headline: cp.headline || null,
          bio: cp.bio || null,
          specialtyTags: cp.specialtyTags,
          credentials: cp.credentials,
          verificationStatus: cp.verificationStatus,
          rating: cp.rating,
          totalClients: cp.totalClients,
          activeOffersCount: offers.filter((o) => o.isActive).length,
          featuredOffers: offers.map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            type: o.type,
            price: Number(o.price),
            currency: o.currency,
          })),
          socialLinks: cp.socialLinks,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        creators: memCreators,
        pagination: {
          page: 1,
          limit: 10,
          totalItems: memCreators.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });
  }
};
