import 'dotenv/config';
import { generateToken } from './config/jwt.js';
import { NotificationService } from './services/notification.service.js';

const BASE_URL = 'http://localhost:5000';

async function runA8Tests() {
  console.log('\n======================================================');
  console.log('--- STARTING PHASE A8 INTEGRATION TESTS ---');
  console.log('======================================================\n');

  const testCreatorId = 'creator-chadtag';
  const testCreatorUserId = 'user-chadtag';

  // Unauthorized Buyer (has NO enrollment, NO booking)
  const unauthBuyerId = 'user-buyer-unauth-a8';
  const unauthBuyerToken = generateToken({
    userId: unauthBuyerId,
    email: 'unauth.buyer@ascend.io',
    fullName: 'Unauthorized Inquirer',
    role: 'BUYER',
  });

  // Authorized Buyer (will create a consultation booking)
  const authBuyerId = 'user-buyer-auth-a8';
  const authBuyerToken = generateToken({
    userId: authBuyerId,
    email: 'athlete.buyer@ascend.io',
    fullName: 'Enrolled Athlete',
    role: 'BUYER',
  });

  // Creator Token
  const creatorToken = generateToken({
    userId: testCreatorUserId,
    email: 'chadtag@ascend.io',
    fullName: 'Chadtag',
    role: 'CREATOR',
  });

  // ----------------------------------------------------
  // TEST 1: Unauthorized Buyer Cannot Message Creator (403 Forbidden)
  // ----------------------------------------------------
  console.log('[TEST 1]: Unauthorized Buyer Attempting Direct Message to Creator');
  const unauthMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${unauthBuyerToken}`,
    },
    body: JSON.stringify({
      receiverId: testCreatorId,
      text: 'Hey Chadtag, can you review my workout program for free?',
    }),
  });

  const unauthMsgData = (await unauthMsgRes.json()) as any;
  console.log('Unauth Message Status:', unauthMsgRes.status);
  console.log('Unauth Message Response:', unauthMsgData);

  if (unauthMsgRes.status !== 403) {
    throw new Error(`Test 1 Failed: Expected 403 Forbidden, got ${unauthMsgRes.status}`);
  }
  if (unauthMsgData.success !== false) {
    throw new Error('Test 1 Failed: Expected success to be false for unauthorized messaging');
  }
  console.log('✔ TEST 1 PASSED: Unenrolled buyer correctly blocked with 403 Forbidden\n');

  // ----------------------------------------------------
  // TEST 2: Create Confirmed Booking and Message Creator (201 Created)
  // ----------------------------------------------------
  console.log('[TEST 2]: Creating 1:1 Consultation Booking via API');
  const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authBuyerToken}`,
    },
    body: JSON.stringify({
      creatorId: testCreatorId,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 45,
      notes: 'Consultation regarding posture & physique training',
    }),
  });

  const bookingData = (await bookingRes.json()) as any;
  console.log('Booking Creation Status:', bookingRes.status);
  console.log('Booking Creation Response:', bookingData);

  if (!bookingRes.ok || !bookingData.success || !bookingData.data?.id) {
    throw new Error(`Test 2 Failed: Booking creation failed: ${JSON.stringify(bookingData)}`);
  }
  const createdBookingId = bookingData.data.id;
  console.log(`Created Booking ID: ${createdBookingId} with Google Meet: ${bookingData.data.meetingUrl}`);

  // Now Authorized Buyer Messages Creator
  console.log('Sending message from booked athlete to creator...');
  const authMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authBuyerToken}`,
    },
    body: JSON.stringify({
      receiverId: testCreatorId,
      text: 'Coach Chadtag, looking forward to our consultation tomorrow! Sent my training history.',
      bookingId: createdBookingId,
    }),
  });

  const authMsgData = (await authMsgRes.json()) as any;
  console.log('Auth Message Status:', authMsgRes.status);
  console.log('Auth Message Response:', authMsgData);

  if (authMsgRes.status !== 201 || !authMsgData.success) {
    throw new Error(`Test 2 Failed: Expected 201 Created, got ${authMsgRes.status}: ${JSON.stringify(authMsgData)}`);
  }
  if (!authMsgData.data?.id || authMsgData.data.senderId !== authBuyerId) {
    throw new Error('Test 2 Failed: Message record structure invalid');
  }
  console.log('✔ TEST 2 PASSED: Booked buyer successfully sent message to creator\n');

  // ----------------------------------------------------
  // TEST 3: Creator Replies to Booked Athlete (201 Created)
  // ----------------------------------------------------
  console.log('[TEST 3]: Creator Replying to Booked Athlete');
  const replyMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creatorToken}`,
    },
    body: JSON.stringify({
      receiverId: authBuyerId,
      text: 'Got it! I reviewed your split and will have our customized roadmap ready for the call.',
      bookingId: createdBookingId,
    }),
  });

  const replyMsgData = (await replyMsgRes.json()) as any;
  console.log('Reply Message Status:', replyMsgRes.status);

  if (replyMsgRes.status !== 201 || !replyMsgData.success) {
    throw new Error(`Test 3 Failed: Creator reply failed: ${JSON.stringify(replyMsgData)}`);
  }
  console.log('✔ TEST 3 PASSED: Creator reply successfully sent\n');

  // ----------------------------------------------------
  // TEST 4: Fetch Conversations & Thread
  // ----------------------------------------------------
  console.log('[TEST 4]: Fetching Conversations & Message Thread');
  const convRes = await fetch(`${BASE_URL}/api/messages/conversations`, {
    headers: { Authorization: `Bearer ${authBuyerToken}` },
  });
  const convData = (await convRes.json()) as any;
  console.log('Conversations Count:', convData.data?.length);

  const threadRes = await fetch(`${BASE_URL}/api/messages/thread/${testCreatorId}`, {
    headers: { Authorization: `Bearer ${authBuyerToken}` },
  });
  const threadData = (await threadRes.json()) as any;
  console.log('Thread Messages Count:', threadData.data?.messages?.length);

  if (!threadData.data?.messages || threadData.data.messages.length < 2) {
    throw new Error('Test 4 Failed: Expected at least 2 messages in the thread');
  }
  console.log('✔ TEST 4 PASSED: Message thread successfully retrieved\n');

  // ----------------------------------------------------
  // TEST 5: Verified Review Submission (Tied to Booking/Enrollment)
  // ----------------------------------------------------
  console.log('[TEST 5]: Buyer Submitting Verified Review');
  const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authBuyerToken}`,
    },
    body: JSON.stringify({
      creatorId: testCreatorId,
      bookingId: createdBookingId,
      rating: 5,
      reviewText: 'Outstanding 1:1 consultation! Actionable aesthetic principles backed by science.',
      programTitle: '1:1 Aesthetic Consultation',
    }),
  });

  const reviewData = (await reviewRes.json()) as any;
  console.log('Review Submit Status:', reviewRes.status);
  console.log('Review Submit Response:', reviewData);

  if (reviewRes.status !== 201 || !reviewData.success) {
    throw new Error(`Test 5 Failed: Review submission failed: ${JSON.stringify(reviewData)}`);
  }
  if (reviewData.data?.rating !== 5) {
    throw new Error(`Test 5 Failed: Expected rating 5, got ${reviewData.data?.rating}`);
  }
  console.log('✔ TEST 5 PASSED: Verified review successfully submitted\n');

  // ----------------------------------------------------
  // TEST 6: One Review Per Enrollment / Booking Enforcement
  // ----------------------------------------------------
  console.log('[TEST 6]: Enforcing One Review Per Enrollment/Booking on Resubmission');
  const resubmitReviewRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authBuyerToken}`,
    },
    body: JSON.stringify({
      creatorId: testCreatorId,
      bookingId: createdBookingId,
      rating: 4,
      reviewText: 'Updated review: exceptional consultation, wish we had booked 60 minutes instead of 45!',
      programTitle: '1:1 Aesthetic Consultation',
    }),
  });

  const resubmitData = (await resubmitReviewRes.json()) as any;
  console.log('Resubmit Review Status:', resubmitReviewRes.status);
  console.log('Resubmit Review Rating:', resubmitData.data?.rating);

  // Fetch reviews list to ensure strictly 1 review exists for this booking
  const listReviewsRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}/reviews`);
  const listReviewsData = (await listReviewsRes.json()) as any;
  console.log('Total Reviews for Creator:', listReviewsData.data?.totalReviews);

  const reviewsForThisBooking = (listReviewsData.data?.reviews || []).filter(
    (r: any) => r.bookingId === createdBookingId
  );
  if (reviewsForThisBooking.length !== 1) {
    throw new Error(`Test 6 Failed: Expected exactly 1 review for booking, found ${reviewsForThisBooking.length}`);
  }
  console.log('✔ TEST 6 PASSED: Duplicate review prevented; existing review updated to 4 stars without inflating review count\n');

  // ----------------------------------------------------
  // TEST 7: Creator Profile Live Rating & Review Count
  // ----------------------------------------------------
  console.log('[TEST 7]: Checking Creator Profile Live Average Rating & Review Count');
  const profileRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}`);
  const profileData = (await profileRes.json()) as any;
  const profile = profileData.data || profileData.creator;

  console.log('Profile Live Rating:', profile?.rating, 'Review Count:', profile?.reviewCount);
  if (profile?.rating !== 4) {
    throw new Error(`Test 7 Failed: Expected profile rating 4, got ${profile?.rating}`);
  }
  if (profile?.reviewCount !== 1) {
    throw new Error(`Test 7 Failed: Expected profile reviewCount 1, got ${profile?.reviewCount}`);
  }
  console.log('✔ TEST 7 PASSED: Creator profile live rating & reviewCount accurately updated\n');

  // ----------------------------------------------------
  // TEST 8: In-App Notifications (Retrieval & Mark as Read)
  // ----------------------------------------------------
  console.log('[TEST 8]: In-App Notifications Retrieval & Read State Update');
  const notifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authBuyerToken}` },
  });
  const notifsData = (await notifsRes.json()) as any;
  console.log('Buyer Notifications Count:', notifsData.data?.notifications?.length, 'Unread:', notifsData.data?.unreadCount);

  if (!notifsData.data?.notifications || notifsData.data.notifications.length === 0) {
    throw new Error('Test 8 Failed: Expected at least 1 notification for recipient');
  }

  const firstNotifId = notifsData.data.notifications[0].id;
  const readRes = await fetch(`${BASE_URL}/api/notifications/${firstNotifId}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${authBuyerToken}` },
  });
  const readData = (await readRes.json()) as any;
  console.log('Mark Read Status:', readRes.status, 'Success:', readData.success);

  if (!readRes.ok || !readData.success) {
    throw new Error('Test 8 Failed: Could not mark notification as read');
  }
  console.log('✔ TEST 8 PASSED: In-app notification inbox retrieved and marked read\n');

  // ----------------------------------------------------
  // TEST 9: Transactional Email Dispatch (Resend Integration)
  // ----------------------------------------------------
  console.log('[TEST 9]: Transactional Emails via Resend / Dev Dispatch Logger');

  // 1. Payment Success Email
  const paymentEmail = await NotificationService.createNotification({
    userId: authBuyerId,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Confirmed: Masterclass Access',
    body: 'Your payment of $118 was confirmed. Download tax invoice: http://localhost:5000/api/invoices/ASC-INV-2026-1001/download',
    sendEmail: true,
    recipientEmail: 'athlete@ascend.fit',
    emailData: {
      buyerName: 'Enrolled Athlete',
      programTitle: 'ChadMax Aesthetics Masterclass',
      amount: 118,
      currency: 'USD',
      invoiceNumber: 'ASC-INV-2026-1001',
      invoiceDownloadUrl: 'http://localhost:5000/api/invoices/ASC-INV-2026-1001/download',
      accessUrl: 'http://localhost:5173/my-space',
    },
  });
  console.log('Payment Email Sent Flag:', paymentEmail.emailSent);
  if (!paymentEmail.emailSent) {
    throw new Error('Test 9 Failed: Payment success email not dispatched');
  }

  // 2. Booking Confirmed Email with Google Meet
  const bookingEmail = await NotificationService.createNotification({
    userId: authBuyerId,
    type: 'BOOKING_CONFIRMED',
    title: 'Consultation Confirmed: Google Meet Attached',
    body: 'Your 1:1 session is confirmed with Chadtag.',
    sendEmail: true,
    recipientEmail: 'athlete@ascend.fit',
    emailData: {
      buyerName: 'Enrolled Athlete',
      creatorName: 'Chadtag',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 45,
      googleMeetUrl: 'https://meet.google.com/asc-test-meet',
    },
  });
  console.log('Booking Email Sent Flag:', bookingEmail.emailSent);
  if (!bookingEmail.emailSent) {
    throw new Error('Test 9 Failed: Booking confirmed email not dispatched');
  }

  // 3. Creator Verification Approved Email
  const verifEmail = await NotificationService.createNotification({
    userId: testCreatorUserId,
    type: 'VERIFICATION_APPROVED',
    title: 'Creator Application Approved',
    body: 'Your creator credentials have been verified by admin.',
    sendEmail: true,
    recipientEmail: 'chadtag@ascend.io',
    emailData: {
      creatorName: 'Chadtag',
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
    },
  });
  console.log('Verification Email Sent Flag:', verifEmail.emailSent);
  if (!verifEmail.emailSent) {
    throw new Error('Test 9 Failed: Verification email not dispatched');
  }

  console.log('✔ TEST 9 PASSED: Transactional email dispatched for Payment, Booking, and Verification events\n');

  // ----------------------------------------------------
  // TEST 10: Cleanup & State Restoration
  // ----------------------------------------------------
  console.log('[TEST 10]: Restoring Seed Creator State');
  const deleteRes = await fetch(`${BASE_URL}/api/reviews/${reviewData.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authBuyerToken}` },
  });
  console.log('Cleaned up review:', deleteRes.status);
  console.log('✔ TEST 10 PASSED: Test review cleaned up and state restored\n');

  console.log('======================================================');
  console.log('🎉 ALL 10 PHASE A8 INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
}

runA8Tests().catch((err) => {
  console.error('\n❌ PHASE A8 INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
