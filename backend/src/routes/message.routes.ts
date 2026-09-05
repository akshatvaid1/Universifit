import { Router } from 'express';
import {
  getConversations,
  getThread,
  sendMessage,
  markThreadAsRead,
} from '../controllers/message.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/messages/conversations - List conversations
router.get('/conversations', authenticateJWT, getConversations);

// GET /api/messages/thread/:partnerId - Chronological thread
router.get('/thread/:partnerId', authenticateJWT, getThread);

// POST /api/messages - Send message (purchase-gated)
router.post('/', authenticateJWT, sendMessage);

// PUT /api/messages/read/:partnerId - Mark messages as read
router.put('/read/:partnerId', authenticateJWT, markThreadAsRead);

export default router;
