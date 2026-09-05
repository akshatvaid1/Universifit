import { Router } from 'express';
import {
  getCourseById,
  generateVideoUploadUrl,
  createCourseStudio,
  updateCourseStudio,
  getCreatorStudioCourses,
  deleteCourseStudio,
} from '../controllers/course.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// GET /courses/studio/my-courses - Get all courses (including drafts) for authenticated creator
router.get('/studio/my-courses', authenticateJWT, requireRole('CREATOR', 'ADMIN'), getCreatorStudioCourses as any);

// POST /courses/video-upload-url - Generate direct video upload URL for Mux / Cloudflare Stream
router.post('/video-upload-url', authenticateJWT, requireRole('CREATOR', 'ADMIN'), generateVideoUploadUrl as any);

// POST /courses - Create course and lessons in Course Studio
router.post('/', authenticateJWT, requireRole('CREATOR', 'ADMIN'), createCourseStudio as any);

// PUT /courses/:id - Update course, lessons, and draft/published state
router.put('/:id', authenticateJWT, requireRole('CREATOR', 'ADMIN'), updateCourseStudio as any);

// DELETE /courses/:id - Delete course
router.delete('/:id', authenticateJWT, requireRole('CREATOR', 'ADMIN'), deleteCourseStudio as any);

// GET /courses/:id - Fetch course with lessons and server-side drip checking (Public / Enrolled / Creator)
router.get('/:id', getCourseById as any);

export default router;
