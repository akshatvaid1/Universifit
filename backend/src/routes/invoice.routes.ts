import { Router } from 'express';
import {
  downloadInvoicePdf,
  getMyInvoices,
  getCreatorInvoices,
} from '../controllers/invoice.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Token-authenticated PDF download stream
router.get('/:invoiceNumber/download', downloadInvoicePdf);
router.get('/:invoiceNumber', downloadInvoicePdf);

// Buyer Invoices (Authenticated buyer only)
router.get('/user/me', authenticateJWT, getMyInvoices);

// Creator Invoices (Authenticated creator/admin only)
router.get('/creator/me', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorInvoices);

export default router;
