import { Router } from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
} from '../controllers/booking.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// GET /bookings & /bookings/my-bookings - Fetch authenticated user bookings (buyer or creator)
router.get('/', authenticateJWT, getUserBookings);
router.get('/my-bookings', authenticateJWT, getUserBookings);

// GET /bookings/:id - Fetch single booking details
router.get('/:id', authenticateJWT, getBookingById);

// POST /bookings - Lock slot and create booking (prevents double-booking via DB constraint)
router.post('/', authenticateJWT, createBooking);

// PATCH /bookings/:id/cancel - Cancel booking & release slot
router.patch('/:id/cancel', authenticateJWT, cancelBooking);

export default router;
