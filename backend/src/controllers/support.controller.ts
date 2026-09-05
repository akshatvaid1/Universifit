import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../config/db.js';

interface CreateTicketBody {
  category: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER';
  subject: string;
  description: string;
  enrollmentId?: string;
  bookingId?: string;
}

interface UpdateAdminTicketBody {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  adminResponse?: string;
}

/**
 * POST /api/support/tickets
 * Authenticated user creates a new support ticket
 */
export const createSupportTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required to raise a support ticket.',
      });
      return;
    }

    const { category, subject, description, enrollmentId, bookingId }: CreateTicketBody = req.body;

    if (!category || !['PAYMENT_ISSUE', 'ACCESS_ISSUE', 'OTHER'].includes(category)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "category" must be one of: [PAYMENT_ISSUE, ACCESS_ISSUE, OTHER].',
      });
      return;
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "subject" is required and cannot be empty.',
      });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error: "description" is required and cannot be empty.',
      });
      return;
    }

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7).replace('-', '');
    const ticketCount = await prisma.supportTicket.count();
    const sequenceStr = String(ticketCount + 1).padStart(5, '0');
    const ticketNumber = `TKT-${monthStr}-${sequenceStr}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: req.user.userId,
        category,
        subject: subject.trim(),
        description: description.trim(),
        enrollmentId: enrollmentId || null,
        bookingId: bookingId || null,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            offerId: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket raised successfully. Support team will review shortly.',
      data: newTicket,
    });
  } catch (error: any) {
    console.error('[createSupportTicket Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while creating support ticket.',
      details: error.message,
    });
  }
};

/**
 * GET /api/support/tickets/my
 * Fetches ticket history for current authenticated buyer or creator
 */
export const getUserSupportTickets = async (
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

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollment: {
          select: {
            id: true,
            offerId: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length,
    });
  } catch (error: any) {
    console.error('[getUserSupportTickets Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching user support tickets.',
      details: error.message,
    });
  }
};

/**
 * GET /api/support/tickets/admin
 * Admin-only: Lists all support tickets across the platform with optional filtering
 */
export const getAdminSupportTickets = async (
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

    const { status, category } = req.query;
    const whereClause: any = {};

    if (status && typeof status === 'string' && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status.toUpperCase())) {
      whereClause.status = status.toUpperCase();
    }

    if (category && typeof category === 'string' && ['PAYMENT_ISSUE', 'ACCESS_ISSUE', 'OTHER'].includes(category.toUpperCase())) {
      whereClause.category = category.toUpperCase();
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            offerId: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    });

    const counts = {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t: any) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t: any) => t.status === 'RESOLVED').length,
    };

    res.status(200).json({
      success: true,
      data: tickets,
      counts,
    });
  } catch (error: any) {
    console.error('[getAdminSupportTickets Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching admin support tickets.',
      details: error.message,
    });
  }
};

/**
 * PATCH /api/support/tickets/admin/:id
 * Admin-only: Updates ticket status and appends admin resolution note
 */
export const updateAdminSupportTicket = async (
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
    const ticketId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const { status, adminResponse }: UpdateAdminTicketBody = req.body;

    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      res.status(404).json({
        success: false,
        error: `Support ticket with identifier "${ticketId}" not found.`,
      });
      return;
    }

    const updateData: any = {};
    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status.toUpperCase())) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse.trim();
      updateData.respondedAt = new Date();
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        enrollment: true,
        booking: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully.',
      data: updatedTicket,
    });
  } catch (error: any) {
    console.error('[updateAdminSupportTicket Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating support ticket.',
      details: error.message,
    });
  }
};
