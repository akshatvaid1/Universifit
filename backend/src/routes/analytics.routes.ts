import { Router } from 'express';
import { logStorefrontVisit, getCreatorAnalytics } from '../controllers/analytics.controller.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Log storefront visit (Public / debounced)
router.post('/storefront/:creatorId/visit', logStorefrontVisit as any);
router.post('/:creatorId/visit', logStorefrontVisit as any);

// Creator analytics telemetry (Authenticated creator / or by creatorId)
router.get('/creator/me', authenticateJWT as any, getCreatorAnalytics as any);
router.get('/creator/:creatorId', optionalAuth as any, getCreatorAnalytics as any);
router.get('/:creatorId', optionalAuth as any, getCreatorAnalytics as any);

export default router;
