import { Response } from 'express';
import { NotificationService } from '../services/notification.service.js';

/**
 * GET /api/notifications
 * Fetch all notifications for the authenticated user
 */
export const getNotifications = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const result = NotificationService.getNotifications(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[getNotifications Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications.',
      details: error.message,
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
export const markAsRead = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const notificationId = req.params.id;

    const success = NotificationService.markAsRead(notificationId, userId);
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Notification not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error: any) {
    console.error('[markAsRead Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification.',
      details: error.message,
    });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const count = NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read.`,
      data: { count },
    });
  } catch (error: any) {
    console.error('[markAllAsRead Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read.',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const notificationId = req.params.id;

    const success = NotificationService.deleteNotification(notificationId, userId);
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Notification not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification removed.',
    });
  } catch (error: any) {
    console.error('[deleteNotification Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification.',
      details: error.message,
    });
  }
};

/**
 * POST /api/notifications/test
 * Create a test notification / trigger simulated event
 */
export const createTestNotification = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || 'mock_buyer_id';
    const { type, title, body, linkUrl, sendEmail, recipientEmail, emailData } = req.body;

    const notif = await NotificationService.createNotification({
      userId,
      type: type || 'BOOKING_CONFIRMED',
      title: title || 'Test Notification',
      body: body || 'This is a test notification generated from Ascend.',
      linkUrl: linkUrl || '/my-space',
      sendEmail: !!sendEmail,
      recipientEmail: recipientEmail || req.user?.email || 'akshat@ascend.fit',
      emailData,
    });

    res.status(201).json({
      success: true,
      message: 'Notification created.',
      data: notif,
    });
  } catch (error: any) {
    console.error('[createTestNotification Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test notification.',
      details: error.message,
    });
  }
};
