import { Router } from 'express';
import {
  getCreatorReferrals,
  updateReferralCode,
  validateReferralCode,
  claimReferral,
} from '../controllers/referral.controller.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public referral validation
router.get('/validate/:code', validateReferralCode);

// Creator referral dashboard & code customization
router.get('/creator/me', optionalAuth, getCreatorReferrals);
router.get('/creator/:creatorId?', optionalAuth, getCreatorReferrals);
router.patch('/code', authenticateJWT, updateReferralCode);

// User claim referral
router.post('/claim', authenticateJWT, claimReferral);

export default router;
