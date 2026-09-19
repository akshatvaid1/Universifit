import { Router } from 'express';
import {
  getUserProgress,
  getMySpaceData,
  getUserPurchases,
  requestAccountDeletion,
  exportUserData,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// GET /users/my-space - Fetch complete member space
router.get('/my-space', authenticateJWT, getMySpaceData);

// GET /users/purchases - Fetch member purchase history
router.get('/purchases', authenticateJWT, getUserPurchases);

// GET /users/me/progress - Fetch user learning journey & course progress
router.get('/me/progress', authenticateJWT, getUserProgress);

// POST /users/delete-account - Account & personal data deletion request (DPDP Act 2023 / GDPR Art. 17)
router.post('/delete-account', authenticateJWT, requestAccountDeletion);

// GET /users/data-export - Personal data export archive (DPDP Act 2023 Right to Access)
router.get('/data-export', authenticateJWT, exportUserData);

export default router;

