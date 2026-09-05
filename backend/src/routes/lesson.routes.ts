import { Router } from 'express';
import { markLessonComplete, updateLessonProgress } from '../controllers/lesson.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// POST /lessons/:id/complete - Complete lesson with strict server-side drip enforcement
router.post('/:id/complete', authenticateJWT, markLessonComplete);

// POST & PUT /lessons/:id/progress - Update progress & watch position
router.post('/:id/progress', authenticateJWT, updateLessonProgress);
router.put('/:id/progress', authenticateJWT, updateLessonProgress);

export default router;

