import { Router } from 'express';
import {
  getUserSubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} from '../controllers/subscription.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// All subscription operations are protected by authentication
router.use(authenticateJWT);

router.get('/me', getUserSubscriptions);
router.post('/:enrollmentId/cancel', cancelSubscription);
router.post('/:enrollmentId/pause', pauseSubscription);
router.post('/:enrollmentId/resume', resumeSubscription);

export default router;
