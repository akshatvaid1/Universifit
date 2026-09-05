import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {}

export const appEvents = new AppEventEmitter();

export interface VerificationStatusChangeEvent {
  creatorId: string;
  userId: string;
  creatorHandle: string;
  creatorEmail: string;
  oldStatus: string;
  newStatus: string;
  rejectionReason?: string | null;
  adminId: string;
  timestamp: string;
}

// Log and handle verification status changes
appEvents.on('creator.verificationStatusChanged', (event: VerificationStatusChangeEvent) => {
  console.log(`📢 [EVENT: creator.verificationStatusChanged]: Creator "${event.creatorHandle}" (${event.creatorId}) status changed from "${event.oldStatus}" -> "${event.newStatus}" by Admin "${event.adminId}".`);
  
  // TODO: Trigger email notification / push alert to the coach
  // Example: sendCoachVerificationEmail({ to: event.creatorEmail, status: event.newStatus, reason: event.rejectionReason });
});
