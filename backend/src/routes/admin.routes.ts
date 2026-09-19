import { Router, Request, Response } from 'express';
import { adminVerifyCreator, adminGetCreators } from '../controllers/verification.controller.js';
import {
  getAdminSupportTickets,
  updateAdminSupportTicket,
  resolveAdminSupportTicket,
} from '../controllers/support.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';
import { CronService } from '../services/cron.service.js';
import { AlertService } from '../services/alert.service.js';

const router = Router();

// Require Admin authorization for all /admin routes
router.use(authenticateJWT, requireRole('ADMIN'));

// Support Ticket Administrative Queues & Resolutions
router.get('/tickets', getAdminSupportTickets);
router.patch('/tickets/:id', updateAdminSupportTicket);
router.patch('/tickets/:id/resolve', resolveAdminSupportTicket);

// GET /admin/creators?status=pending - Fetch creators list filtered by verification status
router.get('/creators', adminGetCreators as any);

// PATCH /admin/creators/:id/verify - Approve or reject creator application
router.patch('/creators/:id/verify', adminVerifyCreator);

// POST & PATCH /admin/creators/:id/approve - Approve creator credentials
router.post('/creators/:id/approve', (req, res) => {
  req.body = { ...req.body, status: 'VERIFIED' };
  return adminVerifyCreator(req, res);
});
router.patch('/creators/:id/approve', (req, res) => {
  req.body = { ...req.body, status: 'VERIFIED' };
  return adminVerifyCreator(req, res);
});

// POST & PATCH /admin/creators/:id/reject - Reject creator application with audit reason
router.post('/creators/:id/reject', (req, res) => {
  req.body = { ...req.body, status: 'REJECTED' };
  return adminVerifyCreator(req, res);
});
router.patch('/creators/:id/reject', (req, res) => {
  req.body = { ...req.body, status: 'REJECTED' };
  return adminVerifyCreator(req, res);
});

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

// GET /admin/alerts - Telemetry and critical failure alerts log
router.get('/alerts', (_req: Request, res: Response) => {
  const alerts = AlertService.getRecentAlerts();
  res.json({
    success: true,
    total: alerts.length,
    alerts,
  });
});

export default router;

