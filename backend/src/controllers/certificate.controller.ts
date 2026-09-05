import { Response } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { CertificateService } from '../services/certificate.service.js';

/**
 * GET /certificates/course/:courseId
 * Retrieves or generates certificate for a 100% completed course
 */
export const getCertificateForCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const rawCourseId = req.params.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const userId = req.user.userId;

    if (!courseId) {
      res.status(400).json({ success: false, error: 'Course ID parameter is required.' });
      return;
    }

    // 1. Fetch Course and lessons to verify progress
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: { include: { user: true } },
        lessons: true,
      },
    });

    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    const isCreatorOrAdmin =
      course.creator?.userId === userId || req.user.role === 'ADMIN';

    // 2. Check enrollment and lesson progress
    const allLessonIds = course.lessons.map((l) => l.id);
    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        isCompleted: true,
      },
    });

    const totalLessons = allLessonIds.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;

    // Check enrollment status
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        OR: [{ courseId: course.id }, ...(course.offerId ? [{ offerId: course.offerId }] : [])],
      },
    });

    const isCompleted = progressPercent >= 100 || enrollment?.status === 'COMPLETED' || isCreatorOrAdmin;

    if (!isCompleted) {
      res.status(400).json({
        success: false,
        error: 'Curriculum is not yet 100% completed.',
        progress: {
          completedLessons: completedCount,
          totalLessons,
          progressPercent,
        },
      });
      return;
    }

    // 3. Generate or retrieve certificate
    const cert = await CertificateService.getOrCreateCertificate(userId, course.id);

    res.status(200).json({
      success: true,
      data: cert,
      message: 'Certificate of completion retrieved successfully.',
    });
  } catch (error: any) {
    console.error('[getCertificateForCourse Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve course certificate.',
      details: error.message,
    });
  }
};

/**
 * GET /certificates/:id/download
 * Streams/downloads the certificate PDF by ID or Certificate Number
 */
export const downloadCertificate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const idOrNumber = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    if (!idOrNumber) {
      res.status(400).json({ success: false, error: 'Certificate ID is required.' });
      return;
    }

    let cert = await CertificateService.findCertificateByIdOrNumber(idOrNumber);

    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found.' });
      return;
    }

    // Ensure PDF file exists on disk, else re-generate
    if (!cert.pdfPath || !fs.existsSync(cert.pdfPath)) {
      const { filePath } = await CertificateService.generateCertificatePdf({
        certificateNumber: cert.certificateNumber,
        buyerName: cert.buyerName,
        courseTitle: cert.courseTitle,
        creatorName: cert.creatorName,
        completionDate: cert.completionDate,
        userId: cert.userId,
        courseId: cert.courseId,
        enrollmentId: cert.enrollmentId || undefined,
      });
      cert.pdfPath = filePath;
    }

    const filename = `Ascend-Certificate-${cert.certificateNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const filestream = fs.createReadStream(cert.pdfPath);
    filestream.pipe(res);
  } catch (error: any) {
    console.error('[downloadCertificate Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download certificate PDF.',
      details: error.message,
    });
  }
};

/**
 * GET /certificates/course/:courseId/download
 * Direct download endpoint using course ID
 */
export const downloadCourseCertificate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const rawCourseId = req.params.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : (rawCourseId as string);
    const userId = req.user.userId;

    if (!courseId) {
      res.status(400).json({ success: false, error: 'Course ID is required.' });
      return;
    }

    const cert = await CertificateService.getOrCreateCertificate(userId, courseId);

    if (!cert.pdfPath || !fs.existsSync(cert.pdfPath)) {
      const { filePath } = await CertificateService.generateCertificatePdf({
        certificateNumber: cert.certificateNumber,
        buyerName: cert.buyerName,
        courseTitle: cert.courseTitle,
        creatorName: cert.creatorName,
        completionDate: cert.completionDate,
        userId: cert.userId,
        courseId: cert.courseId,
        enrollmentId: cert.enrollmentId || undefined,
      });
      cert.pdfPath = filePath;
    }

    const filename = `Ascend-Certificate-${cert.certificateNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const filestream = fs.createReadStream(cert.pdfPath);
    filestream.pipe(res);
  } catch (error: any) {
    console.error('[downloadCourseCertificate Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download certificate PDF for course.',
      details: error.message,
    });
  }
};

/**
 * GET /certificates
 * Lists all certificates earned by the authenticated user
 */
export const getUserCertificates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const userId = req.user.userId;
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: true,
      },
    });

    const enriched = certificates.map((c) => ({
      ...c,
      downloadUrl: `/api/certificates/${c.id}/download`,
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      count: enriched.length,
    });
  } catch (error: any) {
    console.error('[getUserCertificates Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user certificates.',
      details: error.message,
    });
  }
};
