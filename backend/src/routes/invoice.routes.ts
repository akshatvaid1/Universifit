import { Router } from 'express';
import {
  downloadInvoicePdf,
  getMyInvoices,
  getCreatorInvoices,
} from '../controllers/invoice.controller.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Token-authenticated PDF download stream
router.get('/:invoiceNumber/download', downloadInvoicePdf);

// Buyer Invoices
router.get('/user/me', optionalAuth, getMyInvoices);

// Creator Invoices
router.get('/creator/me', optionalAuth, getCreatorInvoices);

export default router;
