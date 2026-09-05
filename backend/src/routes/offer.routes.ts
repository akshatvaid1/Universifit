import { Router } from 'express';
import { createOffer, toggleOfferStatus } from '../controllers/offer.controller.js';
import { authenticateJWT, requireRole, requireVerifiedCreator } from '../middleware/auth.middleware.js';

const router = Router();

// POST /offers - Creator-only endpoint to create an offer
router.post(
  '/',
  authenticateJWT,
  requireRole('CREATOR', 'ADMIN'),
  requireVerifiedCreator,
  createOffer
);

// PATCH /offers/:id/status - Toggle draft/publish status with payout gating
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('CREATOR', 'ADMIN'),
  toggleOfferStatus
);

export default router;
