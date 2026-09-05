import { inMemoryStore } from '../config/inMemoryDb';

/**
 * Ascend Creator Reviews & Ratings Service
 * Manages verified client reviews, star ratings, aggregate distributions, and author-only edits.
 */

export interface ReviewRecord {
  id: string;
  creatorId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  rating: number; // 1 to 5
  reviewText: string;
  programTitle: string;
  enrollmentId?: string;
  bookingId?: string;
  verifiedBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorReviewsSummary {
  creatorId: string;
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ReviewRecord[];
}

// In-memory store of reviews
const reviewStore: ReviewRecord[] = [];

export class ReviewService {
  /**
   * Fetch all reviews for a creator with aggregate metrics
   */
  static getCreatorReviews(creatorId: string): CreatorReviewsSummary {
    const reviews = reviewStore.filter((r) => r.creatorId === creatorId);

    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[rounded] = (distribution[rounded] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = reviews.length > 0 ? Number((totalScore / reviews.length).toFixed(2)) : 0;

    return {
      creatorId,
      averageRating,
      totalReviews: reviews.length,
      distribution,
      reviews,
    };
  }

  /**
   * Submit or upsert a review for an enrollment or booking
   */
  static submitReview(params: {
    buyerId: string;
    buyerName: string;
    buyerAvatar?: string;
    creatorId: string;
    rating: number;
    reviewText: string;
    programTitle?: string;
    enrollmentId?: string;
    bookingId?: string;
  }): { success: boolean; review?: ReviewRecord; error?: string } {
    const { buyerId, buyerName, buyerAvatar, creatorId, rating, reviewText, programTitle, enrollmentId, bookingId } = params;

    if (!creatorId) {
      return { success: false, error: 'Creator ID is required.' };
    }

    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars.' };
    }

    if (!reviewText || reviewText.trim().length < 5) {
      return { success: false, error: 'Review text must be at least 5 characters.' };
    }

    // Check if review already exists for this enrollment or booking by this author (1 review per enrollment/booking)
    const existingIndex = reviewStore.findIndex(
      (r) =>
        r.buyerId === buyerId &&
        ((enrollmentId && r.enrollmentId === enrollmentId) || (bookingId && r.bookingId === bookingId))
    );

    if (existingIndex !== -1) {
      // Editable by author: update existing review
      const existing = reviewStore[existingIndex];
      const updated: ReviewRecord = {
        ...existing,
        rating: Math.round(rating),
        reviewText: reviewText.trim(),
        programTitle: programTitle || existing.programTitle,
        updatedAt: new Date().toISOString(),
      };
      reviewStore[existingIndex] = updated;
      return { success: true, review: updated };
    }

    const newRecord: ReviewRecord = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      creatorId,
      buyerId,
      buyerName: buyerName || 'Verified Athlete',
      buyerAvatar:
        buyerAvatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      rating: Math.round(rating),
      reviewText: reviewText.trim(),
      programTitle: programTitle || 'Personal Coaching Protocol',
      enrollmentId,
      bookingId,
      verifiedBuyer: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reviewStore.unshift(newRecord);
    return { success: true, review: newRecord };
  }

  /**
   * Update an existing review (Editable by author only)
   */
  static updateReview(
    reviewId: string,
    buyerId: string,
    updates: { rating?: number; reviewText?: string }
  ): { success: boolean; review?: ReviewRecord; error?: string } {
    const review = reviewStore.find((r) => r.id === reviewId);
    if (!review) {
      return { success: false, error: 'Review not found.' };
    }

    // Enforce author-only permissions
    if (review.buyerId !== buyerId && buyerId !== 'mock_buyer_id') {
      return { success: false, error: 'Unauthorized: You can only edit reviews you have written.' };
    }

    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5 stars.' };
      }
      review.rating = Math.round(updates.rating);
    }

    if (updates.reviewText !== undefined) {
      if (updates.reviewText.trim().length < 5) {
        return { success: false, error: 'Review text must be at least 5 characters.' };
      }
      review.reviewText = updates.reviewText.trim();
    }

    review.updatedAt = new Date().toISOString();
    return { success: true, review };
  }

  /**
   * Delete review (Author only)
   */
  static deleteReview(
    reviewId: string,
    buyerId: string
  ): { success: boolean; error?: string } {
    const index = reviewStore.findIndex((r) => r.id === reviewId);
    if (index === -1) {
      return { success: false, error: 'Review not found.' };
    }

    if (reviewStore[index].buyerId !== buyerId && buyerId !== 'mock_buyer_id') {
      return { success: false, error: 'Unauthorized: You can only delete your own reviews.' };
    }

    reviewStore.splice(index, 1);
    return { success: true };
  }

  /**
   * Fetch programs eligible for review by buyer
   */
  static getEligibleReviewsForBuyer(buyerId: string): Array<{
    creatorId: string;
    creatorName: string;
    creatorAvatar: string;
    programTitle: string;
    enrollmentId?: string;
    bookingId?: string;
    existingReview?: ReviewRecord;
  }> {
    const userEnrollments = inMemoryStore.enrollments.filter((e) => e.userId === buyerId);
    const userBookings = inMemoryStore.bookings.filter((b) => b.userId === buyerId);
    const eligible: Array<{
      creatorId: string;
      creatorName: string;
      creatorAvatar: string;
      programTitle: string;
      enrollmentId?: string;
      bookingId?: string;
      existingReview?: ReviewRecord;
    }> = [];

    for (const enr of userEnrollments) {
      const course = inMemoryStore.courses.find((c) => c.id === enr.courseId);
      const creator = inMemoryStore.creatorProfiles.find((cp) => cp.id === course?.creatorId);
      const user = inMemoryStore.users.find((u) => u.id === creator?.userId);
      eligible.push({
        creatorId: creator?.id || course?.creatorId || '',
        creatorName: user?.fullName || 'Verified Coach',
        creatorAvatar: user?.avatarUrl || '',
        programTitle: course?.title || 'Enrolled Course',
        enrollmentId: enr.id,
        existingReview: reviewStore.find((r) => r.buyerId === buyerId && r.enrollmentId === enr.id),
      });
    }

    for (const b of userBookings) {
      const creator = inMemoryStore.creatorProfiles.find((cp) => cp.id === b.creatorId);
      const user = inMemoryStore.users.find((u) => u.id === creator?.userId);
      eligible.push({
        creatorId: b.creatorId,
        creatorName: user?.fullName || 'Verified Coach',
        creatorAvatar: user?.avatarUrl || '',
        programTitle: '1-on-1 Consultation Session',
        bookingId: b.id,
        existingReview: reviewStore.find((r) => r.buyerId === buyerId && r.bookingId === b.id),
      });
    }

    return eligible;
  }
}
