import { Router } from 'express';
import { createCheckoutOrder, verifyCheckoutPayment } from '../controllers/checkout.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { checkoutRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Rate limiting on checkout & order operations to prevent card testing/order flood
router.use(checkoutRateLimiter);

// POST /checkout/create-order - Create Razorpay order
router.post('/create-order', authenticateJWT, createCheckoutOrder);

// POST /checkout/verify - Verify Razorpay payment signature and grant access
router.post('/verify', authenticateJWT, verifyCheckoutPayment);

export default router;
