import { Router } from 'express';
import {
  getCertificateForCourse,
  downloadCertificate,
  downloadCourseCertificate,
  getUserCertificates,
} from '../controllers/certificate.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Public download by Certificate ID or Certificate Number (e.g. for sharing or direct links)
router.get('/:id/download', downloadCertificate);

// Protected endpoints
router.get('/', authenticateJWT, getUserCertificates);
router.get('/course/:courseId', authenticateJWT, getCertificateForCourse);
router.get('/course/:courseId/download', authenticateJWT, downloadCourseCertificate);

export default router;
