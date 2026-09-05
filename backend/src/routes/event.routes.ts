import { Router } from 'express';
import {
  createEvent,
  updateEvent,
  cancelEvent,
  getEvent,
  rsvpEvent,
  cancelRSVP,
  markAttended,
  bulkMarkAttended,
  joinViaToken,
  getAttendees,
} from '../controllers/event.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────

// GET /events/join/:token — Auto-attendance + 302 redirect to Google Meet (public)
// Must be BEFORE /:id to avoid collision
router.get('/join/:token', joinViaToken);

// GET /events/:id — Fetch single event (optionally annotate with caller's RSVP)
router.get('/:id', authenticateJWT, getEvent as any);

// ─── Creator / Admin ───────────────────────────────────────────────────────

// POST /events — Create a new group session event
router.post('/', authenticateJWT, requireRole('CREATOR', 'ADMIN'), createEvent);

// PUT /events/:id — Edit event details
router.put('/:id', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updateEvent);

// DELETE /events/:id — Cancel event
router.delete('/:id', authenticateJWT, requireRole('CREATOR', 'ADMIN'), cancelEvent);

// GET /events/:id/attendees — View RSVP + attendance roster
router.get('/:id/attendees', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getAttendees as any);

// POST /events/:id/attendance/bulk — Bulk-mark attendance
// Must be BEFORE /:id/attendance/:userId to avoid "bulk" being parsed as userId
router.post('/:id/attendance/bulk', authenticateJWT, requireRole('CREATOR', 'ADMIN'), bulkMarkAttended);

// POST /events/:id/attendance/:userId — Manual single attendance mark
router.post('/:id/attendance/:userId', authenticateJWT, requireRole('CREATOR', 'ADMIN'), markAttended);

// ─── Authenticated Buyers ──────────────────────────────────────────────────

// POST /events/:id/rsvp — RSVP to an event
router.post('/:id/rsvp', authenticateJWT, rsvpEvent as any);

// DELETE /events/:id/rsvp — Cancel RSVP
router.delete('/:id/rsvp', authenticateJWT, cancelRSVP as any);

export default router;
