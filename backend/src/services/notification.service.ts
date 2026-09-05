/**
 * Ascend In-App & Transactional Notification Service
 * Manages in-app notifications, unread badges, and email notifications for critical events.
 */

import { EmailService } from './email.service.js';

export type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_CONFIRMED'
  | 'MESSAGE_RECEIVED'
  | 'COURSE_PUBLISHED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'PAYMENT_SUCCESS'
  | 'REVIEW_RECEIVED';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  emailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for notifications
const notificationStore: NotificationRecord[] = [];

export class NotificationService {
  /**
   * Fetch all notifications for a given user
   */
  static getNotifications(userId: string): {
    notifications: NotificationRecord[];
    unreadCount: number;
    totalCount: number;
  } {
    const list = notificationStore.filter(
      (n) => n.userId === userId || (userId === 'mock_buyer_id' && (n.userId === 'mock_buyer_id' || n.userId === 'buyer-1'))
    );

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.isRead).length;

    return {
      notifications: list,
      unreadCount,
      totalCount: list.length,
    };
  }

  /**
   * Create a new notification and optionally dispatch an email
   */
  static async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
    sendEmail?: boolean;
    recipientEmail?: string;
    emailData?: any;
  }): Promise<NotificationRecord> {
    const { userId, type, title, body, linkUrl, metadata, sendEmail, recipientEmail, emailData } = params;

    let emailSent = false;

    if (sendEmail && recipientEmail) {
      try {
        if (type === 'PAYMENT_SUCCESS' && emailData) {
          await EmailService.sendPaymentSuccessEmail(recipientEmail, emailData);
          emailSent = true;
        } else if (type === 'BOOKING_CONFIRMED' && emailData) {
          await EmailService.sendBookingConfirmedEmail(recipientEmail, emailData);
          emailSent = true;
        } else if ((type === 'VERIFICATION_APPROVED' || type === 'VERIFICATION_REJECTED') && emailData) {
          await EmailService.sendVerificationStatusEmail(recipientEmail, emailData);
          emailSent = true;
        } else {
          await EmailService.sendEmail({
            to: recipientEmail,
            subject: title,
            html: `<div style="font-family: sans-serif; padding: 20px; background: #121315; color: #fff;"><h2>${title}</h2><p>${body}</p></div>`,
            text: body,
          });
          emailSent = true;
        }
      } catch (err: any) {
        console.error(`[NotificationService] Error sending email for ${type}:`, err.message);
      }
    }

    const record: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type,
      title,
      body,
      linkUrl: linkUrl || '/my-space',
      isRead: false,
      emailSent,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notificationStore.unshift(record);
    return record;
  }

  /**
   * Mark a specific notification as read
   */
  static markAsRead(notificationId: string, userId: string): boolean {
    const notif = notificationStore.find(
      (n) => n.id === notificationId && (n.userId === userId || userId === 'mock_buyer_id')
    );

    if (notif) {
      notif.isRead = true;
      notif.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(userId: string): number {
    let count = 0;
    notificationStore.forEach((n) => {
      if ((n.userId === userId || userId === 'mock_buyer_id') && !n.isRead) {
        n.isRead = true;
        n.updatedAt = new Date().toISOString();
        count++;
      }
    });
    return count;
  }

  /**
   * Delete a notification
   */
  static deleteNotification(notificationId: string, userId: string): boolean {
    const index = notificationStore.findIndex(
      (n) => n.id === notificationId && (n.userId === userId || userId === 'mock_buyer_id')
    );

    if (index !== -1) {
      notificationStore.splice(index, 1);
      return true;
    }
    return false;
  }
}
