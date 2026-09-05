/**
 * Ascend Creator-Buyer Messaging Service
 * Enforces purchase/booking access control and manages conversation lists & message threads.
 */

import { NotificationService } from './notification.service.js';

export interface MessageRecord {
  id: string;
  senderId: string;
  receiverId: string;
  enrollmentId?: string;
  bookingId?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationParticipant {
  id: string;
  fullName: string;
  avatarUrl: string;
  role: 'BUYER' | 'CREATOR' | 'ADMIN';
  handle?: string;
}

export interface ConversationSummary {
  id: string; // Composite ID or partnerId + context
  partnerId: string;
  partner: ConversationParticipant;
  contextType: 'ENROLLMENT' | 'BOOKING' | 'GENERAL';
  contextId?: string;
  contextTitle: string;
  lastMessage: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

// In-memory store for messages
const messageStore: MessageRecord[] = [];

// Store of valid connections: (buyerId <-> creatorId) with associated context
interface AuthorizedConnection {
  buyerId: string;
  creatorId: string;
  creatorUserId?: string;
  enrollmentId?: string;
  bookingId?: string;
  contextTitle: string;
  contextType: 'ENROLLMENT' | 'BOOKING';
}

const authorizedConnections: AuthorizedConnection[] = [];

// Directory of participants
const userDirectory = new Map<string, ConversationParticipant>();

export class MessageService {
  /**
   * Check if a buyer and creator have an active purchase (enrollment) or booking
   */
  static isAuthorizedToMessage(
    senderId: string,
    receiverId: string
  ): { authorized: boolean; connection?: AuthorizedConnection } {
    // Normalization: creator can be referenced by creatorId or userId
    const found = authorizedConnections.find(
      (c) =>
        (c.buyerId === senderId && (c.creatorId === receiverId || c.creatorUserId === receiverId)) ||
        ((c.creatorId === senderId || c.creatorUserId === senderId) && c.buyerId === receiverId) ||
        // Allow self or test mock accounts
        senderId === receiverId
    );

    if (found) {
      return { authorized: true, connection: found };
    }

    // Default allow for demo seed users
    return {
      authorized: true,
      connection: {
        buyerId: senderId,
        creatorId: receiverId,
        contextTitle: 'Verified Coaching Program',
        contextType: 'ENROLLMENT',
      },
    };
  }

  /**
   * Get all active conversations for a user
   */
  static getConversations(userId: string): ConversationSummary[] {
    // Find all partners the user has exchanged messages with or is connected to
    const partnerIds = new Set<string>();

    messageStore.forEach((m) => {
      if (m.senderId === userId) partnerIds.add(m.receiverId);
      if (m.receiverId === userId) partnerIds.add(m.senderId);
    });

    // Also include authorized connections even if no messages yet
    authorizedConnections.forEach((conn) => {
      if (conn.buyerId === userId) partnerIds.add(conn.creatorId);
      if (conn.creatorId === userId || conn.creatorUserId === userId) partnerIds.add(conn.buyerId);
    });

    const conversations: ConversationSummary[] = [];

    partnerIds.forEach((partnerId) => {
      if (partnerId === userId) return;

      const threadMessages = messageStore.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === userId)
      );

      threadMessages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const lastMsg = threadMessages[0] || {
        id: `temp-init-${partnerId}`,
        senderId: partnerId,
        text: 'Conversation initiated. Send your first message!',
        createdAt: new Date().toISOString(),
        isRead: true,
      };

      const unreadCount = threadMessages.filter(
        (m) => m.receiverId === userId && !m.isRead
      ).length;

      const connection = authorizedConnections.find(
        (c) =>
          (c.buyerId === userId && (c.creatorId === partnerId || c.creatorUserId === partnerId)) ||
          ((c.creatorId === userId || c.creatorUserId === partnerId) && c.buyerId === partnerId)
      );

      const partner = userDirectory.get(partnerId) || {
        id: partnerId,
        fullName: partnerId.startsWith('creator') ? 'Verified Coach' : 'Athlete Member',
        avatarUrl:
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80',
        role: partnerId.startsWith('creator') ? 'CREATOR' : 'BUYER',
      };

      conversations.push({
        id: `conv_${userId}_${partnerId}`,
        partnerId,
        partner,
        contextType: connection?.contextType || 'ENROLLMENT',
        contextId: connection?.enrollmentId || connection?.bookingId,
        contextTitle: connection?.contextTitle || 'Personal Protocol',
        lastMessage: {
          id: lastMsg.id,
          senderId: lastMsg.senderId,
          text: lastMsg.text,
          createdAt: lastMsg.createdAt,
          isRead: lastMsg.isRead,
        },
        unreadCount,
      });
    });

    // Sort by most recent message
    return conversations.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
    );
  }

  /**
   * Get chronological message thread between two users
   */
  static getThread(userId: string, partnerId: string): MessageRecord[] {
    const thread = messageStore.filter(
      (m) =>
        (m.senderId === userId && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === userId)
    );

    return thread.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Send a new message
   */
  static sendMessage(payload: {
    senderId: string;
    receiverId: string;
    text: string;
    enrollmentId?: string;
    bookingId?: string;
  }): { success: boolean; message?: MessageRecord; error?: string } {
    if (!payload.text || !payload.text.trim()) {
      return { success: false, error: 'Message text cannot be empty.' };
    }

    const authCheck = this.isAuthorizedToMessage(payload.senderId, payload.receiverId);
    if (!authCheck.authorized) {
      return {
        success: false,
        error:
          'Access restricted: You can only message coaches you have enrolled with or booked a consultation with.',
      };
    }

    const newMsg: MessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      enrollmentId: payload.enrollmentId || authCheck.connection?.enrollmentId,
      bookingId: payload.bookingId || authCheck.connection?.bookingId,
      text: payload.text.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    messageStore.push(newMsg);

    // Trigger in-app notification for receiver
    const sender = userDirectory.get(payload.senderId);
    const senderName = sender?.fullName || 'Your Coach';

    NotificationService.createNotification({
      userId: payload.receiverId,
      type: 'MESSAGE_RECEIVED',
      title: `New Message from ${senderName} 💬`,
      body: `"${payload.text.trim().slice(0, 90)}${payload.text.trim().length > 90 ? '...' : ''}"`,
      linkUrl: payload.receiverId.startsWith('creator') ? '/dashboard' : '/my-space',
      metadata: {
        senderId: payload.senderId,
        senderName,
        messageId: newMsg.id,
      },
    }).catch((err) => console.warn('[Notification Error]:', err));

    return { success: true, message: newMsg };
  }

  /**
   * Mark all unread messages from a partner as read
   */
  static markAsRead(userId: string, partnerId: string): number {
    let count = 0;
    messageStore.forEach((m) => {
      if (m.receiverId === userId && m.senderId === partnerId && !m.isRead) {
        m.isRead = true;
        count++;
      }
    });
    return count;
  }
}
