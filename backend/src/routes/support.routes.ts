import { Router } from 'express';
import {
  createSupportTicket,
  getUserSupportTickets,
  getAdminSupportTickets,
  updateAdminSupportTicket,
} from '../controllers/support.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/support/tickets - Raise a support ticket (Buyer / Creator)
router.post('/tickets', authenticateJWT, createSupportTicket);

// GET /api/support/tickets/my - User's ticket history
router.get('/tickets/my', authenticateJWT, getUserSupportTickets);

// GET /api/support/tickets/admin - Admin ticket queue
router.get('/tickets/admin', authenticateJWT, requireRole('ADMIN'), getAdminSupportTickets);

// PATCH /api/support/tickets/admin/:id - Admin respond and update status
router.patch('/tickets/admin/:id', authenticateJWT, requireRole('ADMIN'), updateAdminSupportTicket);

export default router;
