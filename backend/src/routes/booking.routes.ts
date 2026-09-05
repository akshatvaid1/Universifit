import { Router } from 'express';
import { createBooking } from '../controllers/booking.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// POST /bookings - Lock slot and create booking (prevents double-booking via DB constraint)
router.post('/', authenticateJWT, createBooking);

export default router;
