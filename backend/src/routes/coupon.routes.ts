import { Router } from 'express';
import {
  createCoupon,
  getCreatorCoupons,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public validation endpoint (for checkout)
router.post('/validate', validateCoupon);

// Creator coupon management endpoints (Creator/Admin only)
router.post('/', authenticateJWT, requireRole('CREATOR', 'ADMIN'), createCoupon);
router.get('/creator/:creatorId?', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorCoupons);
router.patch('/:id/toggle', authenticateJWT, requireRole('CREATOR', 'ADMIN'), toggleCouponStatus);
router.delete('/:id', authenticateJWT, requireRole('CREATOR', 'ADMIN'), deleteCoupon);

export default router;
