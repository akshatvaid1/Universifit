import { Router } from 'express';
import { logStorefrontVisit, getCreatorAnalytics, trackEvent } from '../controllers/analytics.controller.js';
import { authenticateJWT, requireRole, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Ingest analytics telemetry events (Public / optional auth)
router.post('/events', optionalAuth as any, trackEvent as any);
router.post('/event', optionalAuth as any, trackEvent as any);

// Log storefront visit (Public / debounced)
router.post('/storefront/:creatorId/visit', logStorefrontVisit as any);
router.post('/:creatorId/visit', logStorefrontVisit as any);

// Creator analytics telemetry (Creator/Admin only)
router.get('/creator/me', authenticateJWT as any, requireRole('CREATOR', 'ADMIN'), getCreatorAnalytics as any);
router.get('/creator/:creatorId', authenticateJWT as any, requireRole('CREATOR', 'ADMIN'), getCreatorAnalytics as any);
router.get('/:creatorId', authenticateJWT as any, requireRole('CREATOR', 'ADMIN'), getCreatorAnalytics as any);

export default router;
