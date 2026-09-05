import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';

export interface SearchQueryParams {
  q?: string;
  query?: string;
  type?: 'all' | 'creators' | 'courses' | 'offers';
  limit?: string;
  category?: string;
}

/**
 * GET /search or /api/search
 * Full-text and keyword search across creators, bio, specialty tags, and course titles.
 */
export const globalSearch = async (
  req: Request<{}, {}, {}, SearchQueryParams>,
  res: Response
): Promise<void> => {
  try {
    const rawQuery = req.query.q || req.query.query || '';
    const searchTerm = rawQuery.trim();
    const searchType = req.query.type || 'all';
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const categoryFilter = req.query.category?.trim();

    if (!searchTerm && !categoryFilter) {
      // Return top verified creators and popular courses if empty query
      res.status(200).json({
        success: true,
        query: '',
        results: {
          creators: [],
          courses: [],
          total: 0,
        },
      });
      return;
    }

    const termLower = searchTerm.toLowerCase();

    // 1. Search Creators (Name, Bio, Headline, Handle, Specialty Tags)
    let matchedCreators: any[] = [];
    if (searchType === 'all' || searchType === 'creators') {
      try {
        const creatorsFromDb = await prisma.creatorProfile.findMany({
          where: {
            OR: [
              { user: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
              { handle: { contains: searchTerm, mode: 'insensitive' } },
              { headline: { contains: searchTerm, mode: 'insensitive' } },
              { bio: { contains: searchTerm, mode: 'insensitive' } },
              { specialtyTags: { has: searchTerm } },
              { specialtyTags: { hasSome: [searchTerm, termLower] } },
            ],
          },
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
              take: 3,
            },
          },
          take: limitNum,
        });

        if (creatorsFromDb && creatorsFromDb.length > 0) {
          matchedCreators = creatorsFromDb.map((c: any) => ({
            id: c.id,
            userId: c.userId,
            fullName: c.user?.fullName || 'Coach',
            handle: c.handle,
            headline: c.headline,
            bio: c.bio,
            avatarUrl: c.user?.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900',
            specialtyTags: c.specialtyTags || [],
            credentials: c.credentials || [],
            verificationStatus: c.verificationStatus,
            rating: c.rating || 4.9,
            totalReviews: c.totalReviews || 0,
            offers: c.offers || [],
          }));
        }
      } catch (_err) {
        // Fallback to in-memory store
      }

      // If DB returned nothing or fallback needed, search in-memory store
      if (matchedCreators.length === 0 && inMemoryStore.creatorProfiles) {
        matchedCreators = inMemoryStore.creatorProfiles
          .filter((cp) => {
            const user = inMemoryStore.users.find((u) => u.id === cp.userId);
            const fullName = (user?.fullName || '').toLowerCase();
            const handle = (cp.handle || '').toLowerCase();
            const headline = (cp.headline || '').toLowerCase();
            const bio = (cp.bio || '').toLowerCase();
            const tags = (cp.specialtyTags || []).map((t) => t.toLowerCase());

            const matchesQuery =
              !searchTerm ||
              fullName.includes(termLower) ||
              handle.includes(termLower) ||
              headline.includes(termLower) ||
              bio.includes(termLower) ||
              tags.some((t) => t.includes(termLower));

            const matchesCategory =
              !categoryFilter ||
              categoryFilter.toLowerCase() === 'all' ||
              tags.some((t) => t.includes(categoryFilter.toLowerCase())) ||
              headline.includes(categoryFilter.toLowerCase());

            return matchesQuery && matchesCategory;
          })
          .slice(0, limitNum)
          .map((cp) => {
            const user = inMemoryStore.users.find((u) => u.id === cp.userId);
            const offers = inMemoryStore.offers.filter((o) => o.creatorId === cp.id);
            const reviewsCount = (inMemoryStore as any).reviews
              ? (inMemoryStore as any).reviews.filter((r: any) => r.creatorId === cp.id).length
              : 24;
            return {
              id: cp.id,
              userId: cp.userId,
              fullName: user?.fullName || 'Ascend Coach',
              handle: cp.handle,
              headline: cp.headline,
              bio: cp.bio,
              avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900',
              specialtyTags: cp.specialtyTags,
              credentials: cp.credentials,
              verificationStatus: cp.verificationStatus,
              rating: cp.rating,
              totalReviews: reviewsCount,
              offers,
            };
          });
      }
    }

    // 2. Search Courses (Title, Description, Category, Coach Name)
    let matchedCourses: any[] = [];
    if (searchType === 'all' || searchType === 'courses') {
      try {
        const coursesFromDb = await prisma.course.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            lessons: {
              select: {
                id: true,
                title: true,
                durationSeconds: true,
              },
            },
          },
          take: limitNum,
        });

        if (coursesFromDb && coursesFromDb.length > 0) {
          matchedCourses = coursesFromDb.map((crs: any) => ({
            id: crs.id,
            title: crs.title,
            description: crs.description,
            price: (crs as any).price || 80,
            category: (crs as any).category || crs.creator?.headline || 'Strength & Biomechanics',
            thumbnailUrl: crs.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
            creatorId: crs.creatorId,
            coachName: crs.creator?.user?.fullName || 'Ascend Master Coach',
            coachAvatar: crs.creator?.user?.avatarUrl,
            coachHeadline: crs.creator?.headline,
            lessonCount: crs.lessons?.length || 0,
          }));
        }
      } catch (_err) {
        // Fallback to in-memory store
      }

      if (matchedCourses.length === 0 && inMemoryStore.courses) {
        matchedCourses = inMemoryStore.courses
          .filter((crs) => {
            const title = (crs.title || '').toLowerCase();
            const desc = (crs.description || '').toLowerCase();
            const cp = inMemoryStore.creatorProfiles.find((c) => c.id === crs.creatorId);
            const user = cp ? inMemoryStore.users.find((u) => u.id === cp.userId) : null;
            const coachName = (user?.fullName || '').toLowerCase();

            const matchesQuery =
              !searchTerm ||
              title.includes(termLower) ||
              desc.includes(termLower) ||
              coachName.includes(termLower);

            const matchesCategory =
              !categoryFilter ||
              categoryFilter.toLowerCase() === 'all' ||
              (cp?.headline || '').toLowerCase().includes(categoryFilter.toLowerCase()) ||
              (cp?.specialtyTags || []).some((t) => t.toLowerCase().includes(categoryFilter.toLowerCase()));

            return matchesQuery && matchesCategory;
          })
          .slice(0, limitNum)
          .map((crs) => {
            const cp = inMemoryStore.creatorProfiles.find((c) => c.id === crs.creatorId);
            const user = cp ? inMemoryStore.users.find((u) => u.id === cp.userId) : null;
            const lessons = inMemoryStore.lessons.filter((l) => l.courseId === crs.id);
            const offer = inMemoryStore.offers.find((o) => o.id === crs.offerId);

            return {
              id: crs.id,
              title: crs.title,
              description: crs.description,
              price: offer ? Number(offer.price) : 80,
              category: cp?.specialtyTags[0] || 'Strength & Physique',
              thumbnailUrl: crs.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
              creatorId: crs.creatorId,
              coachName: user?.fullName || 'Verified Coach',
              coachAvatar: user?.avatarUrl,
              coachHeadline: cp?.headline,
              lessonCount: lessons.length,
            };
          });
      }
    }

    const total = matchedCreators.length + matchedCourses.length;

    res.status(200).json({
      success: true,
      query: searchTerm,
      category: categoryFilter || 'all',
      results: {
        creators: matchedCreators,
        courses: matchedCourses,
        total,
      },
    });
  } catch (error: any) {
    console.error('globalSearch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute global search across platform catalog',
      error: error.message,
    });
  }
};
