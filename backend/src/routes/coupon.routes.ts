import { Router } from 'express';
import {
  createCoupon,
  getCreatorCoupons,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Public validation endpoint (for checkout)
router.post('/validate', validateCoupon);

// Creator coupon management endpoints
router.post('/', authenticateJWT, createCoupon);
router.get('/creator/:creatorId?', authenticateJWT, getCreatorCoupons);
router.patch('/:id/toggle', authenticateJWT, toggleCouponStatus);
router.delete('/:id', authenticateJWT, deleteCoupon);

export default router;
