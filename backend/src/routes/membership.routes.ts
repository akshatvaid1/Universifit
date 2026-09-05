import { Router } from 'express';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/auth.middleware.js';
import {
  getTiersForCreator,
  createTierForCreator,
  updateTier,
  deleteTier,
  joinCommunityTier,
  getMyTierStatus,
  getMyMemberships,
  getCreatorMembersDirectory,
  removeMemberFromCreator,
  banMemberFromCreator,
  unbanMemberFromCreator,
  getMemberActivityForCreator,
  getCreatorCommunityAnalytics,
} from '../controllers/membership.controller.js';

const router = Router({ mergeParams: true });

// Creator tier endpoints
router.get('/:id/tiers', optionalAuthenticateJWT, getTiersForCreator);
router.post('/:id/tiers', authenticateJWT, createTierForCreator);
router.put('/tiers/:tierId', authenticateJWT, updateTier);
router.delete('/tiers/:tierId', authenticateJWT, deleteTier);

// Member directory & management
router.get('/:id/members', authenticateJWT, getCreatorMembersDirectory);
router.delete('/:id/members/:userId', authenticateJWT, removeMemberFromCreator);
router.post('/:id/members/:userId/remove', authenticateJWT, removeMemberFromCreator);
router.post('/:id/members/:userId/ban', authenticateJWT, banMemberFromCreator);
router.post('/:id/members/:userId/unban', authenticateJWT, unbanMemberFromCreator);
router.get('/:id/members/:userId/activity', authenticateJWT, getMemberActivityForCreator);
router.get('/:id/analytics/community', authenticateJWT, getCreatorCommunityAnalytics);

// Buyer join and tier status
router.post('/:id/membership/join', authenticateJWT, joinCommunityTier);
router.get('/:id/membership/my-tier', authenticateJWT, getMyTierStatus);
router.get('/:id/membership/status', authenticateJWT, getMyTierStatus);
router.get('/my-memberships', authenticateJWT, getMyMemberships);

export default router;
