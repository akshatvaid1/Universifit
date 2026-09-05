import { Router } from 'express';
import {
  getCreatorReviews,
  submitReview,
  updateReview,
  deleteReview,
  getEligibleReviews,
} from '../controllers/review.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Public: GET reviews for a creator
router.get('/creator/:creatorId', getCreatorReviews);

// Authenticated: GET eligible programs to review
router.get('/eligible', authenticateJWT, getEligibleReviews);

// Authenticated: POST submit new review
router.post('/', authenticateJWT, submitReview);

// Authenticated: PUT update review (author only)
router.put('/:id', authenticateJWT, updateReview);

// Authenticated: DELETE review (author only)
router.delete('/:id', authenticateJWT, deleteReview);

export default router;
