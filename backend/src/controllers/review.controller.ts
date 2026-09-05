import { Response } from 'express';
import { ReviewService } from '../services/review.service.js';

/**
 * GET /api/creators/:creatorId/reviews
 * Fetch public reviews and star breakdown for creator storefront
 */
export const getCreatorReviews = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const creatorId = req.params.creatorId || req.params.id;
    if (!creatorId) {
      res.status(400).json({ success: false, error: 'Creator ID parameter is required.' });
      return;
    }

    const summary = ReviewService.getCreatorReviews(creatorId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[getCreatorReviews Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch creator reviews.',
      details: error.message,
    });
  }
};

/**
 * POST /api/reviews
 * Submit a review for a completed course enrollment or session booking
 */
export const submitReview = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const buyerId = req.user?.userId || 'mock_buyer_id';
    const buyerName = req.user?.fullName || 'Akshat Sharma';
    const buyerAvatar = req.user?.avatarUrl;

    const { creatorId, rating, reviewText, programTitle, enrollmentId, bookingId } = req.body;

    const result = ReviewService.submitReview({
      buyerId,
      buyerName,
      buyerAvatar,
      creatorId,
      rating: Number(rating),
      reviewText,
      programTitle,
      enrollmentId,
      bookingId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to submit review.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Review published successfully! ⭐',
      data: result.review,
    });
  } catch (error: any) {
    console.error('[submitReview Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save review.',
      details: error.message,
    });
  }
};

/**
 * PUT /api/reviews/:id
 * Update an existing review (Author only)
 */
export const updateReview = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const buyerId = req.user?.userId || 'mock_buyer_id';
    const reviewId = req.params.id;
    const { rating, reviewText } = req.body;

    const result = ReviewService.updateReview(reviewId, buyerId, {
      rating: rating !== undefined ? Number(rating) : undefined,
      reviewText,
    });

    if (!result.success) {
      res.status(403).json({
        success: false,
        error: result.error || 'Failed to update review.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully! ⭐',
      data: result.review,
    });
  } catch (error: any) {
    console.error('[updateReview Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review.',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete a review (Author only)
 */
export const deleteReview = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const buyerId = req.user?.userId || 'mock_buyer_id';
    const reviewId = req.params.id;

    const result = ReviewService.deleteReview(reviewId, buyerId);

    if (!result.success) {
      res.status(403).json({
        success: false,
        error: result.error || 'Failed to delete review.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error: any) {
    console.error('[deleteReview Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review.',
      details: error.message,
    });
  }
};

/**
 * GET /api/reviews/eligible
 * Fetch programs eligible for review by the authenticated buyer
 */
export const getEligibleReviews = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const buyerId = req.user?.userId || 'mock_buyer_id';
    const eligible = ReviewService.getEligibleReviewsForBuyer(buyerId);

    res.status(200).json({
      success: true,
      data: eligible,
    });
  } catch (error: any) {
    console.error('[getEligibleReviews Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible review programs.',
      details: error.message,
    });
  }
};
