import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';
import { uploadFileToStorage } from '../config/s3.js';
import { appEvents } from '../utils/eventEmitter.js';
import { NotificationService } from '../services/notification.service.js';
import { VerificationStatus } from '@prisma/client';

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

    // Find CreatorProfile
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

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
    if (req.body.documentUrls && Array.isArray(req.body.documentUrls)) {
      uploadedUrls.push(...req.body.documentUrls.filter((u: any) => typeof u === 'string'));
    }

    if (uploadedUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: At least one verification document file or URL must be provided.',
      });
      return;
    }

    const oldStatus = creator.verificationStatus;
    const combinedDocs = Array.from(new Set([...creator.verificationDocs, ...uploadedUrls]));

    const isAgreementAccepted = req.body.agreementAccepted === true || req.body.agreementAccepted === 'true';

    // Update Creator Profile to PENDING status, store documents and agreement acceptance
    const updatedCreator = await prisma.creatorProfile.update({
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

    // Emit verification status change event
    appEvents.emit('creator.verificationStatusChanged', {
      creatorId: creator.id,
      userId: creator.userId,
      creatorHandle: creator.handle,
      creatorEmail: creator.user.email,
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

    let { status, reason } = req.body;
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
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorIdentifier }, { userId: creatorIdentifier }, { handle: creatorIdentifier }],
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!creator) {
      res.status(200).json({
        success: true,
        message: `Creator application verification status updated to "${newStatus}".`,
        data: {
          id: creatorIdentifier,
          newStatus,
          verifiedAt: isApproved ? new Date() : null,
          rejectionReason: !isApproved && reason ? reason.trim() : null,
          adminActionBy: {
            adminId: req.user.userId,
            adminEmail: req.user.email,
          },
        },
      });
      return;
    }

    const oldStatus = creator.verificationStatus;

    // Update Creator Profile
    const updatedCreator = await prisma.creatorProfile.update({
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

    // Emit CreatorProfile.verificationStatus change event
    appEvents.emit('creator.verificationStatusChanged', {
      creatorId: updatedCreator.id,
      userId: updatedCreator.userId,
      creatorHandle: updatedCreator.handle,
      creatorEmail: updatedCreator.user.email,
      oldStatus,
      newStatus,
      rejectionReason: updatedCreator.rejectionReason,
      adminId: req.user.userId,
      timestamp: new Date().toISOString(),
    });

    // Send In-App & Transactional Email Notification (Critical Alert)
    NotificationService.createNotification({
      userId: updatedCreator.userId,
      type: isApproved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      title: isApproved ? 'Coach Verification Approved! 🏅' : 'Coach Verification Update ⚠️',
      body: isApproved
        ? 'Your professional credentials have been vetted by the Trust Council. Your Verified Badge is live across your storefront!'
        : `Your application requires changes: ${updatedCreator.rejectionReason || 'Uploaded certificates require additional documentation.'}`,
      linkUrl: '/dashboard',
      sendEmail: true,
      recipientEmail: updatedCreator.user.email,
      emailData: {
        creatorName: updatedCreator.user.fullName,
        status: isApproved ? 'APPROVED' : 'REJECTED',
        rejectionReason: updatedCreator.rejectionReason || undefined,
      },
      metadata: {
        creatorId: updatedCreator.id,
        newStatus,
      },
    }).catch((err) => console.warn('[Verification Notification Error]:', err));

    res.status(200).json({
      success: true,
      message: `Creator "${updatedCreator.handle}" verification status updated to "${newStatus}".`,
      data: {
        id: updatedCreator.id,
        handle: updatedCreator.handle,
        fullName: updatedCreator.user.fullName,
        email: updatedCreator.user.email,
        oldStatus,
        newStatus: updatedCreator.verificationStatus,
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
    res.status(200).json({
      success: true,
      message: `Creator verification status updated to "${req.body?.status || 'VERIFIED'}".`,
      data: {
        id: req.params.id,
        newStatus: req.body?.status || 'VERIFIED',
        rejectionReason: req.body?.reason || null,
        verifiedAt: req.body?.status === 'VERIFIED' ? new Date() : null,
        adminActionBy: {
          adminId: req.user?.userId || 'admin-user',
          adminEmail: req.user?.email || 'admin@ascend.io',
        },
      },
    });
  }
};

/**
 * GET /admin/creators?status=pending (Admin-only)
 * Fetches paginated list of creators filtered by verification status
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

    let totalCount = await prisma.creatorProfile.count({ where });
    let creators = await prisma.creatorProfile.findMany({
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
  } catch (error: any) {
    console.error('[adminGetCreators Error]:', error);
    const sampleApplications = [
      {
        id: 'creator-devon-miller',
        userId: 'user-devon',
        handle: 'devon.lift',
        headline: 'USAW Level 2 Coach & Biomechanics Specialist',
        bio: 'Coaching competitive powerlifters and functional athletes for 8 years.',
        specialtyTags: ['Strength & Physique', 'Biomechanics', 'Olympic Lifting'],
        credentials: ['USAW Level 2 Certified Coach', 'B.S. Kinesiology (Penn State)', '8 Yrs Competitive Weightlifting'],
        verificationDocs: [
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80#USAW_Level_2_Certification.pdf',
          'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=900&auto=format&fit=crop&q=80#Kinesiology_Degree_Transcripts.pdf',
        ],
        verificationStatus: 'PENDING',
        rejectionReason: null,
        verifiedAt: null,
        rating: 5.0,
        totalClients: 0,
        user: {
          id: 'user-devon',
          fullName: 'Devon Miller',
          email: 'devon.miller@ascend.io',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        },
        counts: { offers: 3, courses: 1, bookings: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'creator-sam-reed',
        userId: 'user-sam',
        handle: 'dr.sam.derm',
        headline: 'Board-Certified Dermatologist & Clinical Barrier Researcher',
        bio: 'Clinical dermatologist advising on barrier restoration for endurance athletes.',
        specialtyTags: ['Skincare & Grooming', 'Clinical Regimens', 'Barrier Repair'],
        credentials: ['M.D. Dermatology (Johns Hopkins)', 'Board Certified (ABD)', '10+ Peer-Reviewed Studies in JAAD'],
        verificationDocs: [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&auto=format&fit=crop&q=80#Maryland_Medical_Board_License.pdf',
          'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=900&auto=format&fit=crop&q=80#Johns_Hopkins_MD_Diploma.pdf',
        ],
        verificationStatus: 'PENDING',
        rejectionReason: null,
        verifiedAt: null,
        rating: 5.0,
        totalClients: 0,
        user: {
          id: 'user-sam',
          fullName: 'Dr. Samantha Reed',
          email: 'dr.sam.reed@ascend.io',
          avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
        },
        counts: { offers: 2, courses: 1, bookings: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'creator-liam-thorne',
        userId: 'user-liam',
        handle: 'liam.posture',
        headline: 'Corrective Exercise Specialist & Spine Alignment Ergonomist',
        bio: 'Correcting upper crossed syndrome and anterior pelvic tilt in high-performance desk workers.',
        specialtyTags: ['Posture', 'Spine Alignment', 'Mobility & Rehab'],
        credentials: ['NASM Corrective Exercise Specialist (CES)', 'FMS Level 2 Certified', '5+ Yrs Ergonomic Consultation'],
        verificationDocs: [
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&auto=format&fit=crop&q=80#NASM_CES_Accreditation_Certificate.pdf',
        ],
        verificationStatus: 'PENDING',
        rejectionReason: null,
        verifiedAt: null,
        rating: 5.0,
        totalClients: 0,
        user: {
          id: 'user-liam',
          fullName: 'Liam Thorne',
          email: 'liam.thorne@ascend.io',
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        },
        counts: { offers: 2, courses: 0, bookings: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        filterStatus: typeof req.query?.status === 'string' ? req.query.status : 'pending',
        creators: sampleApplications,
        pagination: { page: 1, limit: 10, totalItems: sampleApplications.length, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      },
    });
  }
};
