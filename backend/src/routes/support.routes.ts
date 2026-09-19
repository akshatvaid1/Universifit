import { Router } from 'express';
import {
  createSupportTicket,
  getUserSupportTickets,
  getAdminSupportTickets,
  updateAdminSupportTicket,
  resolveAdminSupportTicket,
} from '../controllers/support.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Raise a support ticket (Buyer / Creator)
router.post('/', authenticateJWT, createSupportTicket);
router.post('/tickets', authenticateJWT, createSupportTicket);

// User's ticket history
router.get('/', authenticateJWT, getUserSupportTickets);
router.get('/my', authenticateJWT, getUserSupportTickets);
router.get('/my-tickets', authenticateJWT, getUserSupportTickets);
router.get('/tickets/my', authenticateJWT, getUserSupportTickets);

// Admin ticket queue
router.get('/admin', authenticateJWT, requireRole('ADMIN'), getAdminSupportTickets);
router.get('/tickets/admin', authenticateJWT, requireRole('ADMIN'), getAdminSupportTickets);

// Admin respond and update status
router.patch('/admin/:id', authenticateJWT, requireRole('ADMIN'), updateAdminSupportTicket);
router.patch('/tickets/admin/:id', authenticateJWT, requireRole('ADMIN'), updateAdminSupportTicket);

// Admin resolve ticket
router.patch('/admin/:id/resolve', authenticateJWT, requireRole('ADMIN'), resolveAdminSupportTicket);
router.patch('/tickets/admin/:id/resolve', authenticateJWT, requireRole('ADMIN'), resolveAdminSupportTicket);

export default router;

