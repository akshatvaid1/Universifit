import { Router, Request, Response } from 'express';
import { adminVerifyCreator, adminGetCreators } from '../controllers/verification.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';
import { CronService } from '../services/cron.service.js';

const router = Router();

// Require Admin authorization for all /admin routes
router.use(authenticateJWT, requireRole('ADMIN'));

// GET /admin/creators?status=pending - Fetch creators list filtered by verification status
router.get('/creators', adminGetCreators as any);

// PATCH /admin/creators/:id/verify - Approve or reject creator application
router.patch('/creators/:id/verify', adminVerifyCreator);

// GET /admin/nudges/status - Telemetry for automated email schedules
router.get('/nudges/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: CronService.getStatus() });
});

// POST /admin/nudges/trigger - Manually trigger 24h incomplete creator profile scan
router.post('/nudges/trigger', async (req: Request, res: Response) => {
  const forceCheckAll = req.body?.forceCheckAll === true;
  const result = await CronService.checkIncompleteCreatorProfiles({ forceCheckAll });
  res.json({
    success: true,
    message: `Profile nudge scan executed: ${result.nudgedCount} creator nudges dispatched.`,
    data: result,
  });
});

export default router;

