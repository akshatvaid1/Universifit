import { Router } from 'express';
import {
  getCreatorById,
  getCreatorOffers,
  getCreatorStudioData,
  getPayoutSettings,
  updatePayoutSettings,
  updateCreatorProfile,
  getAvailabilitySchedule,
  updateAvailabilitySchedule,
} from '../controllers/creator.controller.js';
import { createPostForCreator, getPostsForCreator } from '../controllers/community.controller.js';
import { getCreatorReviews } from '../controllers/review.controller.js';
import { getCreatorAvailability, createAvailabilitySlots } from '../controllers/booking.controller.js';
import { uploadVerificationDocs } from '../controllers/verification.controller.js';
import {
  getLeaderboard,
  getPointsRules,
  upsertPointsRules,
  getMyGamificationStats,
} from '../controllers/gamification.controller.js';
import { getCreatorCalendar } from '../controllers/event.controller.js';
import {
  getTiersForCreator,
  createTierForCreator,
  joinCommunityTier,
  getMyTierStatus,
  getCreatorMembersDirectory,
  removeMemberFromCreator,
  banMemberFromCreator,
  unbanMemberFromCreator,
  getMemberActivityForCreator,
  getCreatorCommunityAnalytics,
} from '../controllers/membership.controller.js';
import { authenticateJWT, optionalAuthenticateJWT, requireRole } from '../middleware/auth.middleware.js';
import { uploadMemory } from '../config/s3.js';

const router = Router();

// PUT /creators/profile - Update creator profile details (Creator & Admin only)
router.put('/profile', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updateCreatorProfile);

// GET /creators/studio - Fetch studio metrics (Creator & Admin only)
router.get('/studio', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorStudioData);
router.get('/me/dashboard', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorStudioData);

// GET /creators/payout-settings - Fetch creator payout configuration
router.get('/payout-settings', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getPayoutSettings);

// PUT /creators/payout-settings - Save/update payout configuration
router.put('/payout-settings', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updatePayoutSettings);

// GET /creators/availability/schedule - Fetch weekly recurring schedule & blackout dates
router.get('/availability/schedule', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getAvailabilitySchedule);

// PUT /creators/availability/schedule - Update weekly recurring schedule & blackout dates
router.put('/availability/schedule', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updateAvailabilitySchedule);

// ------------------------------------------------------------------
// Gamification routes (MUST come before the /:id wildcard)
// ------------------------------------------------------------------

// GET /creators/:id/leaderboard?window=7d|30d|all
router.get('/:id/leaderboard', getLeaderboard);

// GET /creators/:id/gamification/rules
router.get('/:id/gamification/rules', getPointsRules);

// PUT /creators/:id/gamification/rules - Creator/Admin only
router.put('/:id/gamification/rules', authenticateJWT, requireRole('CREATOR', 'ADMIN'), upsertPointsRules);

// GET /creators/:id/gamification/me - Authenticated user personal stats
router.get('/:id/gamification/me', authenticateJWT, getMyGamificationStats);

// GET /creators/:id/calendar?from=&to= - Creator event calendar (public with optional auth)
router.get('/:id/calendar', getCreatorCalendar as any);

// ------------------------------------------------------------------
router.get('/:id', getCreatorById);

// GET /creators/:id/offers - Fetch offers for a creator
router.get('/:id/offers', getCreatorOffers);

// GET /creators/:id/reviews - Fetch verified reviews for a creator
router.get('/:id/reviews', getCreatorReviews);

// GET /creators/:id/availability - Fetch creator-defined available slots
router.get('/:id/availability', getCreatorAvailability);

// POST /creators/:id/availability - Define available slots (Creator-only)
router.post('/:id/availability', authenticateJWT, requireRole('CREATOR', 'ADMIN'), createAvailabilitySlots);

// POST /creators/:id/verification-docs - Upload verification credentials/documents to S3/R2
router.post(
  '/:id/verification-docs',
  authenticateJWT,
  uploadMemory.array('documents', 5),
  uploadVerificationDocs
);

// POST /creators/:id/posts - Create community post for creator space
router.post('/:id/posts', authenticateJWT, createPostForCreator);

// GET /creators/:id/posts - Fetch community posts for creator space
router.get('/:id/posts', getPostsForCreator as any);

// Membership Tier routes
router.get('/:id/tiers', optionalAuthenticateJWT, getTiersForCreator as any);
router.post('/:id/tiers', authenticateJWT, requireRole('CREATOR', 'ADMIN'), createTierForCreator);
router.post('/:id/membership/join', authenticateJWT, joinCommunityTier);
router.get('/:id/membership/my-tier', authenticateJWT, getMyTierStatus);
router.get('/:id/membership/status', authenticateJWT, getMyTierStatus);
router.get('/:id/members', authenticateJWT, getCreatorMembersDirectory);
router.delete('/:id/members/:userId', authenticateJWT, removeMemberFromCreator);
router.post('/:id/members/:userId/remove', authenticateJWT, removeMemberFromCreator);
router.post('/:id/members/:userId/ban', authenticateJWT, banMemberFromCreator);
router.post('/:id/members/:userId/unban', authenticateJWT, unbanMemberFromCreator);
router.get('/:id/members/:userId/activity', authenticateJWT, getMemberActivityForCreator);
router.get('/:id/analytics/community', authenticateJWT, getCreatorCommunityAnalytics);

export default router;
