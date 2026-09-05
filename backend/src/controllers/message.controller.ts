import { Response } from 'express';
import { MessageService } from '../services/message.service.js';

/**
 * GET /api/messages/conversations
 * Fetch conversation list for current authenticated user
 */
export const getConversations = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const conversations = MessageService.getConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error('[getConversations Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations.',
      details: error.message,
    });
  }
};

/**
 * GET /api/messages/thread/:partnerId
 * Fetch chronological message history between user and partner
 */
export const getThread = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const partnerId = req.params.partnerId;

    if (!partnerId) {
      res.status(400).json({
        success: false,
        error: 'Partner ID parameter is required.',
      });
      return;
    }

    const messages = MessageService.getThread(userId, partnerId);

    // Auto mark partner's messages as read when opening thread
    MessageService.markAsRead(userId, partnerId);

    res.status(200).json({
      success: true,
      data: {
        partnerId,
        messages,
      },
    });
  } catch (error: any) {
    console.error('[getThread Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message thread.',
      details: error.message,
    });
  }
};

/**
 * POST /api/messages
 * Send a new message (gated by enrollment or booking)
 */
export const sendMessage = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user?.userId || 'mock_buyer_id';
    const { receiverId, text, enrollmentId, bookingId } = req.body;

    if (!receiverId) {
      res.status(400).json({
        success: false,
        error: 'Receiver ID is required.',
      });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({
        success: false,
        error: 'Message content cannot be empty.',
      });
      return;
    }

    const result = MessageService.sendMessage({
      senderId,
      receiverId,
      text,
      enrollmentId,
      bookingId,
    });

    if (!result.success) {
      res.status(403).json({
        success: false,
        error: result.error || 'Failed to send message.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.message,
    });
  } catch (error: any) {
    console.error('[sendMessage Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while dispatching message.',
      details: error.message,
    });
  }
};

/**
 * PUT /api/messages/read/:partnerId
 * Mark all incoming messages from partner as read
 */
export const markThreadAsRead = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const partnerId = req.params.partnerId;

    if (!partnerId) {
      res.status(400).json({
        success: false,
        error: 'Partner ID parameter is required.',
      });
      return;
    }

    const readCount = MessageService.markAsRead(userId, partnerId);

    res.status(200).json({
      success: true,
      message: `${readCount} messages marked as read.`,
      data: { readCount },
    });
  } catch (error: any) {
    console.error('[markThreadAsRead Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read.',
      details: error.message,
    });
  }
};
