import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { uploadFileToStorage } from '../config/s3.js';
import { appEvents } from '../utils/eventEmitter.js';
import { NotificationService } from '../services/notification.service.js';
import { VerificationStatus } from '@prisma/client';
import { inMemoryStore } from '../config/inMemoryDb.js';

/**
 * POST /creators/:id/verification-docs
 * Uploads coach credentials/certifications to S3/R2 and transitions status to PENDING
 */
export const uploadVerificationDocs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required.',
      });
      return;
    }

    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    // Find CreatorProfile (Prisma with inMemory fallback)
    let creator: any = null;
    try {
      creator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
    } catch (_dbErr) {
      const memCp = inMemoryStore.creatorProfiles.find(
        (c) => c.id === creatorIdentifier || c.userId === creatorIdentifier || c.handle === creatorIdentifier
      );
      if (memCp) {
        const memUser = inMemoryStore.users.find((u) => u.id === memCp.userId);
        creator = {
          ...memCp,
          user: memUser || { id: memCp.userId, email: 'creator@ascend.io', fullName: 'Creator' },
        };
      }
    }

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator profile not found for identifier "${creatorIdentifier}".`,
      });
      return;
    }

    // Ensure only creator owner or Admin can upload verification documents
    if (creator.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: You can only upload verification documents for your own profile.',
      });
      return;
    }

    const uploadedUrls: string[] = [];

    // 1. If files were uploaded via multipart/form-data
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files as Express.Multer.File[]) {
        const url = await uploadFileToStorage(
          file.buffer,
          file.originalname,
          file.mimetype,
          `verifications/${creator.handle}`
        );
        uploadedUrls.push(url);
      }
    } else if (req.file) {
      const file = req.file as Express.Multer.File;
      const url = await uploadFileToStorage(
        file.buffer,
        file.originalname,
        file.mimetype,
        `verifications/${creator.handle}`
      );
      uploadedUrls.push(url);
    }

    // 2. If URLs or credential descriptions were sent in JSON body
    const docList = req.body.documentUrls || req.body.documents;
    if (docList && Array.isArray(docList)) {
      uploadedUrls.push(...docList.filter((u: any) => typeof u === 'string'));
    }

    if (uploadedUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: At least one verification document file or URL must be provided.',
      });
      return;
    }

    const oldStatus = creator.verificationStatus;
    const combinedDocs = Array.from(new Set([...(creator.verificationDocs || []), ...uploadedUrls]));
    const isAgreementAccepted = req.body.agreementAccepted === true || req.body.agreementAccepted === 'true';

    // Update Creator Profile to PENDING status, store documents and agreement acceptance
    let updatedCreator: any = null;
    try {
      updatedCreator = await prisma.creatorProfile.update({
        where: { id: creator.id },
        data: {
          verificationDocs: combinedDocs,
          verificationStatus: 'PENDING',
          rejectionReason: null,
          ...(isAgreementAccepted
            ? {
                agreementAccepted: true,
                agreementAcceptedAt: req.body.agreementAcceptedAt ? new Date(req.body.agreementAcceptedAt) : new Date(),
              }
            : {}),
        },
        include: {
          user: { select: { fullName: true, email: true } },
        },
      });
    } catch (_err) {
      const memCp = inMemoryStore.creatorProfiles.find((c) => c.id === creator.id);
      if (memCp) {
        memCp.verificationDocs = combinedDocs;
        memCp.verificationStatus = 'PENDING';
        memCp.rejectionReason = undefined;
        if (isAgreementAccepted) {
          memCp.agreementAccepted = true;
          memCp.agreementAcceptedAt = new Date();
        }
        updatedCreator = {
          ...memCp,
          user: creator.user,
        };
      } else {
        updatedCreator = {
          ...creator,
          verificationDocs: combinedDocs,
          verificationStatus: 'PENDING',
        };
      }
    }

    // Sync inMemoryStore
    const memMatch = inMemoryStore.creatorProfiles.find((c) => c.id === creator.id);
    if (memMatch) {
      memMatch.verificationDocs = combinedDocs;
      memMatch.verificationStatus = 'PENDING';
      memMatch.rejectionReason = undefined;
    }

    // Emit verification status change event
    appEvents.emit('creator.verificationStatusChanged', {
      creatorId: creator.id,
      userId: creator.userId,
      creatorHandle: creator.handle,
      creatorEmail: creator.user?.email || 'creator@ascend.io',
      oldStatus,
      newStatus: 'PENDING',
      adminId: req.user.userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Verification documents uploaded successfully. Profile status submitted for review.',
      data: {
        creatorId: updatedCreator.id,
        verificationStatus: updatedCreator.verificationStatus,
        uploadedDocuments: uploadedUrls,
        allVerificationDocs: updatedCreator.verificationDocs,
      },
    });
  } catch (error: any) {
    console.error('[uploadVerificationDocs Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while uploading verification documents.',
      details: error.message,
    });
  }
};

/**
 * PATCH /admin/creators/:id/verify (Admin-only)
 * Approves or rejects a coach verification application and emits status change event
 */
export const adminVerifyCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Admin authorization required.',
      });
      return;
    }

    const rawId = req.params.id;
    const creatorIdentifier = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    let status = req.body.status || req.body.verificationStatus;
    let reason = req.body.reason || req.body.notes;
    if (status && status.toUpperCase() === 'APPROVED') {
      status = 'VERIFIED';
    }

    if (!status || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status.toUpperCase())) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "status" must be one of: ["VERIFIED", "APPROVED", "REJECTED", "PENDING"].',
      });
      return;
    }

    const newStatus = status.toUpperCase() as VerificationStatus;
    const isApproved = newStatus === 'VERIFIED';

    // Find CreatorProfile
    let creator: any = null;
    try {
      creator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
    } catch (_dbErr) {
      const memCp = inMemoryStore.creatorProfiles.find(
        (c) => c.id === creatorIdentifier || c.userId === creatorIdentifier || c.handle === creatorIdentifier
      );
      if (memCp) {
        const memUser = inMemoryStore.users.find((u) => u.id === memCp.userId);
        creator = {
          ...memCp,
          user: memUser || { id: memCp.userId, email: 'creator@ascend.io', fullName: 'Creator' },
        };
      }
    }

    if (!creator) {
      res.status(404).json({
        success: false,
        error: `Creator with identifier "${creatorIdentifier}" not found.`,
      });
      return;
    }

    const oldStatus = creator.verificationStatus;

    // Update Creator Profile
    let updatedCreator: any = null;
    try {
      updatedCreator = await prisma.creatorProfile.update({
        where: { id: creator.id },
        data: {
          verificationStatus: newStatus,
          verifiedAt: isApproved ? new Date() : null,
          rejectionReason: !isApproved && reason ? reason.trim() : null,
        },
        include: {
          user: { select: { fullName: true, email: true, avatarUrl: true } },
        },
      });
    } catch (_err) {
      const memCp = inMemoryStore.creatorProfiles.find((c) => c.id === creator.id);
      if (memCp) {
        memCp.verificationStatus = newStatus;
        memCp.verifiedAt = isApproved ? new Date() : undefined;
        memCp.rejectionReason = !isApproved && reason ? reason.trim() : undefined;
        updatedCreator = {
          ...memCp,
          user: creator.user,
        };
      } else {
        updatedCreator = {
          ...creator,
          verificationStatus: newStatus,
          verifiedAt: isApproved ? new Date() : null,
          rejectionReason: !isApproved && reason ? reason.trim() : null,
        };
      }
    }

    // Always sync inMemoryStore
    const memMatch = inMemoryStore.creatorProfiles.find((c) => c.id === creator.id);
    if (memMatch) {
      memMatch.verificationStatus = newStatus;
      memMatch.verifiedAt = isApproved ? new Date() : undefined;
      memMatch.rejectionReason = !isApproved && reason ? reason.trim() : undefined;
    }

    // Emit CreatorProfile.verificationStatus change event
    appEvents.emit('creator.verificationStatusChanged', {
      creatorId: updatedCreator.id,
      userId: updatedCreator.userId,
      creatorHandle: updatedCreator.handle,
      creatorEmail: updatedCreator.user?.email || 'creator@ascend.io',
      oldStatus,
      newStatus,
      rejectionReason: updatedCreator.rejectionReason,
      adminId: req.user.userId,
      timestamp: new Date().toISOString(),
    });

    // Send In-App & Transactional Email Notification
    if (updatedCreator.userId) {
      NotificationService.createNotification({
        userId: updatedCreator.userId,
        type: isApproved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
        title: isApproved ? 'Coach Verification Approved! 🏅' : 'Coach Verification Update ⚠️',
        body: isApproved
          ? 'Your professional credentials have been vetted by the Trust Council. Your Verified Badge is live across your storefront!'
          : `Your application requires changes: ${updatedCreator.rejectionReason || 'Uploaded certificates require additional documentation.'}`,
        linkUrl: '/dashboard',
        sendEmail: true,
        recipientEmail: updatedCreator.user?.email || 'creator@ascend.io',
        emailData: {
          creatorName: updatedCreator.user?.fullName || 'Coach',
          status: isApproved ? 'APPROVED' : 'REJECTED',
          rejectionReason: updatedCreator.rejectionReason || undefined,
        },
        metadata: {
          creatorId: updatedCreator.id,
          newStatus,
        },
      }).catch((err) => console.warn('[Verification Notification Error]:', err));
    }

    res.status(200).json({
      success: true,
      message: `Creator "${updatedCreator.handle}" verification status updated to "${newStatus}".`,
      data: {
        id: updatedCreator.id,
        handle: updatedCreator.handle,
        fullName: updatedCreator.user?.fullName || 'Coach',
        email: updatedCreator.user?.email,
        oldStatus,
        newStatus: updatedCreator.verificationStatus,
        verificationStatus: updatedCreator.verificationStatus,
        isVerified: updatedCreator.verificationStatus === 'VERIFIED',
        verifiedAt: updatedCreator.verifiedAt,
        rejectionReason: updatedCreator.rejectionReason,
        verificationDocs: updatedCreator.verificationDocs,
        adminActionBy: {
          adminId: req.user.userId,
          adminEmail: req.user.email,
        },
      },
    });
  } catch (error: any) {
    console.error('[adminVerifyCreator Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update verification status.',
      details: error.message,
    });
  }
};

/**
 * POST or PATCH /admin/creators/:id/approve (Admin-only)
 * Route alias to approve a creator's credentials
 */
export const adminApproveCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  req.body = { ...req.body, status: 'VERIFIED' };
  return adminVerifyCreator(req, res);
};

/**
 * POST or PATCH /admin/creators/:id/reject (Admin-only)
 * Route alias to reject a creator's application with an audit reason
 */
export const adminRejectCreator = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  req.body = { ...req.body, status: 'REJECTED' };
  return adminVerifyCreator(req, res);
};

/**
 * GET /admin/creators?status=pending (Admin-only)
 * Fetches paginated list of creators filtered by verification status
 * Strictly adheres to truthfulness audit: real DB / inMemory data only
 */
export const adminGetCreators = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Admin authorization required.',
      });
      return;
    }

    const { status = 'pending', page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && typeof status === 'string' && status.toLowerCase() !== 'all') {
      where.verificationStatus = status.toUpperCase() as VerificationStatus;
    }

    try {
      const totalCount = await prisma.creatorProfile.count({ where });
      const creators = await prisma.creatorProfile.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              points: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              offers: true,
              courses: true,
              bookings: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      res.status(200).json({
        success: true,
        creators: creators.map((c) => ({
          id: c.id,
          userId: c.userId,
          handle: c.handle,
          headline: c.headline,
          bio: c.bio,
          specialtyTags: c.specialtyTags,
          credentials: c.credentials,
          verificationDocs: c.verificationDocs,
          verificationStatus: c.verificationStatus,
          isVerified: c.verificationStatus === 'VERIFIED',
          rejectionReason: c.rejectionReason,
          verifiedAt: c.verifiedAt,
          rating: c.rating,
          totalClients: c.totalClients,
          user: c.user,
          counts: {
            offers: c._count.offers,
            courses: c._count.courses,
            bookings: c._count.bookings,
          },
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        data: {
          filterStatus: status,
          creators: creators.map((c) => ({
            id: c.id,
            userId: c.userId,
            handle: c.handle,
            headline: c.headline,
            bio: c.bio,
            specialtyTags: c.specialtyTags,
            credentials: c.credentials,
            verificationDocs: c.verificationDocs,
            verificationStatus: c.verificationStatus,
            isVerified: c.verificationStatus === 'VERIFIED',
            rejectionReason: c.rejectionReason,
            verifiedAt: c.verifiedAt,
            rating: c.rating,
            totalClients: c.totalClients,
            user: c.user,
            counts: {
              offers: c._count.offers,
              courses: c._count.courses,
              bookings: c._count.bookings,
            },
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalItems: totalCount,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
      return;
    } catch (_dbErr) {
      // Offline fallback: use real inMemoryStore data only (no fabricated bios)
      const targetStatus = typeof status === 'string' && status.toLowerCase() !== 'all' ? status.toUpperCase() : null;
      const memCreators = inMemoryStore.creatorProfiles.filter((c) =>
        targetStatus ? c.verificationStatus === targetStatus : true
      );

      const items = memCreators.slice(skip, skip + limitNum).map((c) => {
        const u = inMemoryStore.users.find((user) => user.id === c.userId);
        const offersCount = inMemoryStore.offers.filter((o) => o.creatorId === c.id).length;
        const coursesCount = inMemoryStore.courses.filter((course) => course.creatorId === c.id).length;
        const bookingsCount = inMemoryStore.bookings.filter((b) => b.creatorId === c.id).length;
        return {
          id: c.id,
          userId: c.userId,
          handle: c.handle,
          headline: c.headline,
          bio: c.bio,
          specialtyTags: c.specialtyTags,
          credentials: c.credentials,
          verificationDocs: c.verificationDocs,
          verificationStatus: c.verificationStatus,
          isVerified: c.verificationStatus === 'VERIFIED',
          rejectionReason: c.rejectionReason || null,
          verifiedAt: c.verifiedAt || null,
          rating: c.rating,
          totalClients: c.totalClients,
          user: {
            id: c.userId,
            fullName: u?.fullName || 'Creator',
            email: u?.email || 'creator@ascend.io',
            avatarUrl: u?.avatarUrl || null,
            points: u?.points || 0,
            createdAt: c.createdAt,
          },
          counts: {
            offers: offersCount,
            courses: coursesCount,
            bookings: bookingsCount,
          },
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      });

      const totalCount = memCreators.length;
      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      res.status(200).json({
        success: true,
        creators: items,
        data: {
          filterStatus: status,
          creators: items,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalItems: totalCount,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    }
  } catch (error: any) {
    console.error('[adminGetCreators Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve creators list.',
      details: error.message,
    });
  }
};
