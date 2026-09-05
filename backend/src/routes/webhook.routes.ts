import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// POST /webhooks/razorpay - Razorpay payment.captured event handler
router.post('/razorpay', handleRazorpayWebhook);

export default router;
