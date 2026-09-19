import { Router } from 'express';
import {
  getCreatorReferrals,
  updateReferralCode,
  validateReferralCode,
  claimReferral,
} from '../controllers/referral.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public referral validation
router.get('/validate/:code', validateReferralCode);

// Creator referral dashboard & code customization (Creator/Admin only)
router.get('/creator/me', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorReferrals);
router.get('/creator/:creatorId?', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorReferrals);
router.patch('/code', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updateReferralCode);

// User claim referral
router.post('/claim', authenticateJWT, claimReferral);

export default router;
