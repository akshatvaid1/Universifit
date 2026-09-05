import { Router } from 'express';
import { getUserProgress, getMySpaceData, getUserPurchases } from '../controllers/user.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// GET /users/my-space - Fetch complete member space
router.get('/my-space', authenticateJWT, getMySpaceData);

// GET /users/purchases - Fetch member purchase history
router.get('/purchases', authenticateJWT, getUserPurchases);

// GET /users/me/progress - Fetch user learning journey & course progress
router.get('/me/progress', authenticateJWT, getUserProgress);

export default router;

