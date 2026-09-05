import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification,
} from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(authenticateJWT);

// GET /api/notifications
router.get('/', getNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

// POST /api/notifications/test
router.post('/test', createTestNotification);

export default router;
