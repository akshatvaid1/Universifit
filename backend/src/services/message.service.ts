/**
 * Ascend Creator-Buyer Messaging Service
 * Enforces purchase/booking access control and manages conversation lists & message threads.
 */

import { NotificationService } from './notification.service.js';
import { inMemoryStore } from '../config/inMemoryDb.js';

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
export interface AuthorizedConnection {
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
    if (senderId === receiverId) {
      return { authorized: true };
    }

    // Check if either is an ADMIN
    const senderUser = inMemoryStore.users.find((u) => u.id === senderId);
    const receiverUser = inMemoryStore.users.find((u) => u.id === receiverId);
    if (senderUser?.role === 'ADMIN' || receiverUser?.role === 'ADMIN') {
      return {
        authorized: true,
        connection: {
          buyerId: senderId,
          creatorId: receiverId,
          contextTitle: 'Admin Support',
          contextType: 'ENROLLMENT',
        },
      };
    }

    // Check explicit authorized connections list
    const foundExplicit = authorizedConnections.find(
      (c) =>
        (c.buyerId === senderId && (c.creatorId === receiverId || c.creatorUserId === receiverId)) ||
        ((c.creatorId === senderId || c.creatorUserId === senderId) && c.buyerId === receiverId)
    );
    if (foundExplicit) {
      return { authorized: true, connection: foundExplicit };
    }

    // Determine who is Creator and who is Buyer
    let creatorProfile = inMemoryStore.creatorProfiles.find(
      (c) => c.id === receiverId || c.userId === receiverId || c.handle === receiverId
    );
    let buyerId = senderId;

    if (!creatorProfile) {
      // Check if sender is the creator
      creatorProfile = inMemoryStore.creatorProfiles.find(
        (c) => c.id === senderId || c.userId === senderId || c.handle === senderId
      );
      if (creatorProfile) {
        buyerId = receiverId;
      }
    }

    if (creatorProfile) {
      const creatorProfileId = creatorProfile.id;
      const creatorUserId = creatorProfile.userId;

      // 1. Check for Active / Completed Enrollment
      const creatorOfferIds = new Set(
        inMemoryStore.offers
          .filter((o) => o.creatorId === creatorProfileId || o.creatorId === creatorUserId)
          .map((o) => o.id)
      );
      const creatorCourseIds = new Set(
        inMemoryStore.courses
          .filter((c) => c.creatorId === creatorProfileId || c.creatorId === creatorUserId)
          .map((c) => c.id)
      );

      const activeEnrollment = inMemoryStore.enrollments.find((e) => {
        if (e.userId !== buyerId) return false;
        if (e.status !== 'ACTIVE' && e.status !== 'COMPLETED') return false;
        if (e.offerId && creatorOfferIds.has(e.offerId)) return true;
        if (e.courseId && creatorCourseIds.has(e.courseId)) return true;
        return false;
      });

      if (activeEnrollment) {
        const offer = inMemoryStore.offers.find((o) => o.id === activeEnrollment.offerId);
        const course = inMemoryStore.courses.find((c) => c.id === activeEnrollment.courseId);
        return {
          authorized: true,
          connection: {
            buyerId,
            creatorId: creatorProfileId,
            creatorUserId,
            enrollmentId: activeEnrollment.id,
            contextTitle: offer?.title || course?.title || 'Verified Coaching Program',
            contextType: 'ENROLLMENT',
          },
        };
      }

      // 2. Check for Confirmed / Scheduled / Completed Booking
      const validBooking = inMemoryStore.bookings.find((b) => {
        if (b.userId !== buyerId) return false;
        if (b.creatorId !== creatorProfileId && b.creatorId !== creatorUserId) return false;
        return ['SCHEDULED', 'CONFIRMED', 'COMPLETED'].includes(b.status);
      });

      if (validBooking) {
        return {
          authorized: true,
          connection: {
            buyerId,
            creatorId: creatorProfileId,
            creatorUserId,
            bookingId: validBooking.id,
            contextTitle: '1:1 Coaching Consultation',
            contextType: 'BOOKING',
          },
        };
      }
    }

    // No valid enrollment or booking found -> Unauthorized!
    return { authorized: false };
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
    const partnerCp = inMemoryStore.creatorProfiles.find(
      (c) => c.id === partnerId || c.userId === partnerId || c.handle === partnerId
    );
    const userCp = inMemoryStore.creatorProfiles.find(
      (c) => c.id === userId || c.userId === userId || c.handle === userId
    );

    const partnerAliases = new Set<string>([partnerId]);
    if (partnerCp) {
      partnerAliases.add(partnerCp.id);
      partnerAliases.add(partnerCp.userId);
    }

    const userAliases = new Set<string>([userId]);
    if (userCp) {
      userAliases.add(userCp.id);
      userAliases.add(userCp.userId);
    }

    const thread = messageStore.filter(
      (m) =>
        (userAliases.has(m.senderId) && partnerAliases.has(m.receiverId)) ||
        (partnerAliases.has(m.senderId) && userAliases.has(m.receiverId))
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
    const partnerCp = inMemoryStore.creatorProfiles.find(
      (c) => c.id === partnerId || c.userId === partnerId || c.handle === partnerId
    );
    const userCp = inMemoryStore.creatorProfiles.find(
      (c) => c.id === userId || c.userId === userId || c.handle === userId
    );

    const partnerAliases = new Set<string>([partnerId]);
    if (partnerCp) {
      partnerAliases.add(partnerCp.id);
      partnerAliases.add(partnerCp.userId);
    }

    const userAliases = new Set<string>([userId]);
    if (userCp) {
      userAliases.add(userCp.id);
      userAliases.add(userCp.userId);
    }

    let count = 0;
    messageStore.forEach((m) => {
      if (userAliases.has(m.receiverId) && partnerAliases.has(m.senderId) && !m.isRead) {
        m.isRead = true;
        count++;
      }
    });
    return count;
  }
}
